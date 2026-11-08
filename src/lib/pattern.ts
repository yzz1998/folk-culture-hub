import type { PaletteName, PatternSpec } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════
   剪纸纹样生成器

   用几何方式程序化生成剪纸风格插画，替代版权图片素材。
   语法对齐真实剪纸：单色平涂、中轴对称、以镂空表达细节。

   每种母题由「实心层 + 镂空层」两组形状构成，镂空层用纸色填充，
   视觉上就是剪掉的部分。缩略图尺寸下也要求可辨认。
   ═══════════════════════════════════════════════════════════════ */

interface Palette {
  ink: string
  paper: string
  accent: string
}

const PALETTES: Record<PaletteName, Palette> = {
  cinnabar: { ink: '#B4453A', paper: '#FBF1EE', accent: '#8E3329' },
  indigo: { ink: '#2C4A63', paper: '#EFF4F8', accent: '#1D3346' },
  ochre: { ink: '#A8763E', paper: '#FAF2E5', accent: '#7E5729' },
  bamboo: { ink: '#5C7A5E', paper: '#F0F4EF', accent: '#415C44' },
  ink: { ink: '#3A342C', paper: '#F4EEE4', accent: '#1B1712' },
}

const S = 240
const C = S / 2

const n1 = (v: number) => v.toFixed(1)

function rot(deg: number): string {
  return `rotate(${deg} ${C} ${C})`
}

/** 花瓣状外缘（向外鼓的弧线圆） */
function scallopPath(cx: number, cy: number, r: number, n: number, bulge = 0.14): string {
  const step = (Math.PI * 2) / n
  let d = ''
  for (let i = 0; i < n; i++) {
    const a0 = i * step
    const a1 = (i + 1) * step
    const x0 = cx + Math.cos(a0) * r
    const y0 = cy + Math.sin(a0) * r
    const x1 = cx + Math.cos(a1) * r
    const y1 = cy + Math.sin(a1) * r
    const am = (a0 + a1) / 2
    const rr = r * (1 + bulge * 2)
    const mx = cx + Math.cos(am) * rr
    const my = cy + Math.sin(am) * rr
    if (i === 0) d += `M${n1(x0)} ${n1(y0)}`
    d += ` Q${n1(mx)} ${n1(my)} ${n1(x1)} ${n1(y1)}`
  }
  return `${d} Z`
}

/** 螺旋线，用于云纹的卷曲镂空 */
function spiralPath(cx: number, cy: number, r0: number, turns: number, dir: 1 | -1): string {
  const steps = Math.ceil(turns * 24)
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const r = r0 * (1 - 0.74 * t)
    const a = dir * t * turns * Math.PI * 2 - Math.PI / 2
    pts.push(`${n1(cx + Math.cos(a) * r)} ${n1(cy + Math.sin(a) * r)}`)
  }
  return `M${pts.join(' L')}`
}

/* ═══ 团花：辐射对称的剪纸花 ═══ */
function flower(density: 1 | 2 | 3): { solid: string; holes: string } {
  const n = density === 1 ? 6 : density === 2 ? 8 : 12
  const petals: string[] = []
  const inner: string[] = []
  const R = 96

  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i
    petals.push(
      `<path d="M${C} ${C} C${C - 20} ${C - 24} ${C - 22} ${C - 62} ${C} ${C - R} C${C + 22} ${C - 62} ${C + 20} ${C - 24} ${C} ${C} Z" transform="${rot(a)}"/>`,
    )
    inner.push(
      `<path d="M${C} ${C - 32} C${C - 8} ${C - 44} ${C - 8} ${C - 60} ${C} ${C - 74} C${C + 8} ${C - 60} ${C + 8} ${C - 44} ${C} ${C - 32} Z" transform="${rot(a)}"/>`,
    )
    petals.push(
      `<path d="M${C} ${C - R - 6} L${C - 7} ${C - 80} L${C + 7} ${C - 80} Z" transform="${rot(a + 180 / n)}"/>`,
    )
  }

  const dots = Array.from({ length: n }, (_, i) => {
    const a = ((360 / n) * i + 180 / n) * (Math.PI / 180)
    const r = 58
    return `<circle cx="${n1(C + Math.cos(a) * r)}" cy="${n1(C + Math.sin(a) * r)}" r="${density === 3 ? 3.4 : 4.6}"/>`
  }).join('')

  return {
    solid:
      `<path d="${scallopPath(C, C, 102, n, 0.1)}"/>` +
      petals.join('') +
      `<circle cx="${C}" cy="${C}" r="8"/>`,
    holes:
      inner.join('') + `<circle cx="${C}" cy="${C}" r="19"/>` + `<circle cx="${C}" cy="${C}" r="13"/>` + dots,
  }
}

/* ═══ 窗格：双线边梃、棂条格心与方胜 ═══
   实心层只画一块整板，所有形态都由镂空「切」出来——
   砌格子必须切在板子上，否则棂条会被整片镂空抹掉。 */
function window(density: 1 | 2 | 3): { solid: string; holes: string } {
  const pad = 18
  const side = S - pad * 2
  const cells = density === 3 ? 5 : 3
  const bar = density === 1 ? 8 : density === 2 ? 6.5 : 5
  const rings = density === 3 ? 1 : 2
  const parts: string[] = []
  const holes: string[] = []

  // 整板：镂空后留下的就是边梃与棂条
  parts.push(`<rect x="${pad}" y="${pad}" width="${side}" height="${side}" rx="2"/>`)

  // 双线边梃：切两圈细纸色方环
  let inset = rings === 2 ? 9 : 10
  for (let r = 0; r < rings; r++) {
    const outer = side - inset * 2
    const inn = inset + 4
    const inner = side - inn * 2
    holes.push(
      `<path fill-rule="evenodd" d="M${n1(pad + inset)} ${n1(pad + inset)} H${n1(pad + inset + outer)} V${n1(pad + inset + outer)} H${n1(pad + inset)} Z ` +
        `M${n1(pad + inn)} ${n1(pad + inn)} H${n1(pad + inn + inner)} V${n1(pad + inn + inner)} H${n1(pad + inn)} Z"/>`,
    )
    inset += 10
  }

  // 格心：逐格开洞，格与格之间自然留下棂条
  const a0 = inset + 3
  const area = side - a0 * 2
  const step = area / cells
  const mid = Math.floor(cells / 2)
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      if (i === mid && j === mid) continue // 中心留给方胜
      holes.push(
        `<rect x="${n1(pad + a0 + i * step + bar / 2)}" y="${n1(pad + a0 + j * step + bar / 2)}" width="${n1(step - bar)}" height="${n1(step - bar)}" rx="1.5"/>`,
      )
    }
  }

  // 中心方胜：方框内切出一圈纸色菱环，留下实心菱心
  const m = step * 0.36
  const dia = (r: number) =>
    `M${n1(C - r)} ${C} L${C} ${n1(C - r)} L${n1(C + r)} ${C} L${C} ${n1(C + r)} Z`
  holes.push(`<path fill-rule="evenodd" d="${dia(m)} ${dia(m * 0.5)}"/>`)

  return { solid: parts.join(''), holes: holes.join('') }
}

/* ═══ 鱼：谐音「余」 ═══ */
function fish(): { solid: string; holes: string } {
  const body = `<path d="M66 122 C76 86 116 70 152 80 C182 88 200 104 206 122 C200 140 182 156 152 164 C116 174 76 158 66 122 Z"/>`
  const tail = `<path d="M66 122 L26 92 L36 122 L26 152 Z"/>`
  const finTop = `<path d="M112 80 C120 58 140 48 156 52 C146 66 132 76 120 82 Z"/>`
  const finBottom = `<path d="M112 164 C120 186 140 196 156 192 C146 178 132 168 120 162 Z"/>`
  const eye = `<circle cx="174" cy="112" r="6.5"/>`
  const scales = [96, 118, 140]
    .map(
      (x) =>
        `<path d="M${x} 98 A 15 15 0 0 1 ${x} 146" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>`,
    )
    .join('')
  const gill = `<path d="M166 96 A 24 24 0 0 1 172 132" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`
  return { solid: body + tail + finTop + finBottom, holes: eye + scales + gill }
}

/* ═══ 鸟：侧身展翅 ═══ */
function bird(): { solid: string; holes: string } {
  const tail = `<path d="M72 132 C38 120 18 100 8 84 C30 90 54 102 72 116 Z"/>
  <path d="M68 142 C34 140 12 130 0 120 C24 118 50 122 68 130 Z"/>
  <path d="M72 152 C46 162 26 164 12 160 C30 152 52 148 70 146 Z"/>`
  const body = `<ellipse cx="118" cy="126" rx="54" ry="40" transform="rotate(-14 118 126)"/>`
  const head = `<circle cx="170" cy="98" r="25"/>`
  const crest = `<path d="M160 74 C164 60 176 52 190 54 C184 64 176 72 168 76 Z"/>`
  const beak = `<path d="M193 92 L220 100 L193 111 Z"/>`
  const wing = `<path d="M92 112 C112 92 148 90 162 106 C144 132 110 142 88 132 Z"/>`
  const wingCut = `<path d="M106 114 C120 104 138 102 150 108 C138 120 118 124 108 120 Z"/>`
  const eye = `<circle cx="175" cy="94" r="6"/>`
  return { solid: tail + body + head + crest + beak + wing, holes: wingCut + eye }
}

/* ═══ 龙：锥形长身、背鳍、角冠、须与爪 ═══
   用「中线 + 逐点变宽」生成锥形条带，而不是等宽描边——
   等宽描边配环形镂空会读成一串珠子。 */
function dragon(density: 1 | 2 | 3): { solid: string; holes: string } {
  const N = density === 1 ? 18 : density === 2 ? 26 : 34
  // 三次贝塞尔中线：自左下起势，向右上盘升
  const P0: [number, number] = [30, 190]
  const P1: [number, number] = [40, 70]
  const P2: [number, number] = [180, 190]
  const P3: [number, number] = [186, 84]
  const bez = (t: number): [number, number] => {
    const u = 1 - t
    const a = u * u * u
    const b = 3 * u * u * t
    const c = 3 * u * t * t
    const d = t * t * t
    return [
      a * P0[0] + b * P1[0] + c * P2[0] + d * P3[0],
      a * P0[1] + b * P1[1] + c * P2[1] + d * P3[1],
    ]
  }
  const der = (t: number): [number, number] => {
    const u = 1 - t
    return [
      3 * u * u * (P1[0] - P0[0]) + 6 * u * t * (P2[0] - P1[0]) + 3 * t * t * (P3[0] - P2[0]),
      3 * u * u * (P1[1] - P0[1]) + 6 * u * t * (P2[1] - P1[1]) + 3 * t * t * (P3[1] - P2[1]),
    ]
  }

  interface Node {
    x: number
    y: number
    tx: number
    ty: number
    nx: number
    ny: number
    w: number
  }
  const pts: Node[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const [x, y] = bez(t)
    const [dx, dy] = der(t)
    const L = Math.hypot(dx, dy) || 1
    const tx = dx / L
    const ty = dy / L
    let nx = -ty
    let ny = tx
    if (ny > 0) {
      nx = -nx
      ny = -ny // 法线恒指向上方（脊侧）
    }
    // 尾细颈粗
    pts.push({ x, y, tx, ty, nx, ny, w: 8 + 23 * Math.pow(t, 0.55) })
  }

  const S_ = (v: number) => n1(v)
  const at = (p: Node, dn: number, dt: number): [number, number] => [
    p.x + p.nx * dn + p.tx * dt,
    p.y + p.ny * dn + p.ty * dt,
  ]

  // 锥形条带
  const ridge = pts.map((p) => at(p, p.w / 2, 0))
  const belly = pts.map((p) => at(p, -p.w / 2, 0))
  const body =
    `M${ridge.map((q) => `${S_(q[0])} ${S_(q[1])}`).join(' L')}` +
    ` L${belly.slice().reverse().map((q) => `${S_(q[0])} ${S_(q[1])}`).join(' L')} Z`

  // 背鳍：脊侧三角，附着在体表
  const step = density === 3 ? 2 : 3
  const spikes: string[] = []
  for (let i = 2; i < N - 1; i += step) {
    const p = pts[i]
    const a = at(p, p.w / 2, -p.w * 0.26)
    const b = at(p, p.w / 2, p.w * 0.26)
    const tip = at(p, p.w / 2 + 9 + p.w * 0.42, 0)
    spikes.push(
      `<path d="M${S_(a[0])} ${S_(a[1])} L${S_(tip[0])} ${S_(tip[1])} L${S_(b[0])} ${S_(b[1])} Z"/>`,
    )
  }

  // 尾鳍：三片火焰状扇形
  const t0 = pts[0]
  const tail = [-1, 0, 1]
    .map((k) => {
      const a = at(t0, k * 15, -3)
      const b = at(t0, k * 26, -34)
      const c = at(t0, k * 3, -6)
      return `<path d="M${S_(a[0])} ${S_(a[1])} Q${S_(b[0])} ${S_(b[1])} ${S_(c[0])} ${S_(c[1])} Z"/>`
    })
    .join('')

  // 腹甲：横向短弧，只做质感、不切断轮廓
  const scales: string[] = []
  for (let i = 4; i < N - 3; i += density === 3 ? 3 : 4) {
    const p = pts[i]
    const a = at(p, -p.w * 0.16, -p.w * 0.30)
    const b = at(p, -p.w * 0.16, p.w * 0.30)
    const m = at(p, -p.w * 0.50, 0)
    scales.push(
      `<path d="M${S_(a[0])} ${S_(a[1])} Q${S_(m[0])} ${S_(m[1])} ${S_(b[0])} ${S_(b[1])}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`,
    )
  }

  // 两爪
  const legs = [0.30, 0.63]
    .map((t) => {
      const p = pts[Math.round(N * t)]
      const hip = at(p, -p.w * 0.42, 0)
      const ankle = at(p, -p.w * 0.42 - 24, 9)
      const toe = at(p, -p.w * 0.42 - 30, 24)
      const claws = [-0.5, 0, 0.5]
        .map((k) => {
          const c = [
            toe[0] + Math.cos(k) * 11 + 4,
            toe[1] + Math.sin(k) * 9 + 3,
          ]
          return `<path d="M${S_(toe[0])} ${S_(toe[1])} L${S_(c[0])} ${S_(c[1])}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`
        })
        .join('')
      return (
        `<path d="M${S_(hip[0])} ${S_(hip[1])} Q${S_((hip[0] + ankle[0]) / 2 - 8)} ${S_((hip[1] + ankle[1]) / 2)} ${S_(ankle[0])} ${S_(ankle[1])}" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M${S_(ankle[0])} ${S_(ankle[1])} L${S_(toe[0])} ${S_(toe[1])}" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>` +
        claws
      )
    })
    .join('')

  // 头：局部坐标（吻朝 +x），按颈端切向旋转
  const hEnd = pts[N]
  const angRaw = (Math.atan2(hEnd.ty, hEnd.tx) * 180) / Math.PI
  const ang = angRaw * 0.55 // 衰减，让头颅微昂而非垂直上冲
  const hc = at(hEnd, 0, hEnd.w * 0.42)
  const T = `translate(${S_(hc[0])} ${S_(hc[1])}) rotate(${n1(ang)})`

  const skull = `<path d="M-26 -10 C-24 -29 -2 -35 14 -28 C28 -22 39 -13 45 -7 C41 3 30 10 15 12 C-1 14 -24 10 -26 -2 Z"/>`
  const horn1 = `<path d="M-4 -25 L-17 -47 L8 -29 Z"/>`
  const horn2 = `<path d="M9 -28 L12 -50 L22 -31 Z"/>`
  const ear = `<path d="M-12 -9 L-32 -18 L-17 4 Z"/>`
  const whisker = `<path d="M45 -6 C57 -3 60 6 54 13" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>`
  const beard = `<path d="M-12 9 C-23 15 -29 23 -27 30" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>`
  const jawHole = `<path d="M43 -6 L17 -1 L42 6 Z"/>`
  const eyeHole = `<circle cx="20" cy="-13" r="5"/>`
  const nostril = `<circle cx="37" cy="-9" r="2.2"/>`

  return {
    solid:
      tail +
      spikes.join('') +
      `<path d="${body}"/>` +
      legs +
      `<g transform="${T}">${skull}${horn1}${horn2}${ear}${whisker}${beard}</g>`,
    holes:
      scales.join('') +
      `<g transform="${T}">${jawHole}${eyeHole}${nostril}</g>`,
  }
}

/* ═══ 云纹：如意云头，卷曲处镂空 ═══ */
function cloudUnit(x: number, y: number, k: number): string {
  const P = (dx: number, dy: number) => `${n1(x + dx * k)} ${n1(y + dy * k)}`
  return `M${P(-44, 16)} C${P(-49, 1)} ${P(-36, -11)} ${P(-22, -6)} C${P(-16, -25)} ${P(6, -31)} ${P(17, -14)} C${P(31, -23)} ${P(45, -12)} ${P(43, 5)} C${P(51, 12)} ${P(44, 23)} ${P(29, 21)} L${P(-31, 21)} Z`
}

function cloud(density: 1 | 2 | 3): { solid: string; holes: string } {
  const parts: string[] = []
  const holes: string[] = []

  const unit = (x: number, y: number, k: number) => {
    parts.push(`<path d="${cloudUnit(x, y, k)}"/>`)
    const sw = n1(4.4 * k + 1.2)
    holes.push(
      `<path d="${spiralPath(x - 21 * k, y + 3 * k, 17 * k, 1.1, 1)}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round"/>`,
      `<path d="${spiralPath(x + 19 * k, y + 3 * k, 17 * k, 1.1, -1)}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round"/>`,
      `<rect x="${n1(x - 21 * k)}" y="${n1(y + 15 * k)}" width="${n1(8 * k)}" height="${n1(4.4 * k)}" rx="${n1(2.2 * k)}"/>`,
      `<rect x="${n1(x + 12 * k)}" y="${n1(y + 15 * k)}" width="${n1(8 * k)}" height="${n1(4.4 * k)}" rx="${n1(2.2 * k)}"/>`,
    )
  }

  // 主云居中，辅云成排托底——单靠满铺小云头在缩略图下会糊成一片
  unit(C, 110, 1.0)
  if (density === 1) {
    unit(64, 176, 0.58)
    unit(176, 176, 0.58)
  } else {
    unit(48, 170, 0.56)
    unit(C, 170, 0.56)
    unit(192, 170, 0.56)
    if (density === 3) {
      unit(58, 54, 0.5)
      unit(182, 54, 0.5)
    }
  }

  return { solid: parts.join(''), holes: holes.join('') }
}

/* ═══ 水波：浪纹与卷花 ═══ */
function wave(density: 1 | 2 | 3): { solid: string; holes: string } {
  const rows = density === 1 ? 3 : density === 2 ? 4 : 5
  const parts: string[] = []
  const holes: string[] = []
  const gap = (S - 26) / rows

  for (let i = 0; i < rows; i++) {
    const y = 24 + i * gap
    const amp = 11 + (i % 2) * 4
    let d = `M8 ${n1(y)}`
    for (let x = 8; x < S - 20; x += 40) {
      d += ` q10 ${n1(-amp)} 20 0 q10 ${n1(amp)} 20 0`
    }
    parts.push(
      `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${n1(7 - i * 0.55)}" stroke-linecap="round"/>`,
    )
  }

  // 浪花卷
  parts.push(
    `<path d="M150 96 C146 72 162 54 184 56 C202 58 212 74 205 88 C200 78 188 72 178 76 C170 79 168 90 175 94 C168 98 156 100 150 96 Z"/>`,
  )
  holes.push(
    `<path d="${spiralPath(182, 72, 14, 1.0, 1)}" fill="none" stroke="currentColor" stroke-width="4.4" stroke-linecap="round"/>`,
  )

  return { solid: parts.join(''), holes: holes.join('') }
}

/* ═══ 山形：层叠山脊与月 ═══ */
function mountain(density: 1 | 2 | 3): { solid: string; holes: string } {
  const layers = density === 1 ? 2 : density === 2 ? 3 : 4
  const parts: string[] = []
  const holes: string[] = []

  for (let i = 0; i < layers; i++) {
    const baseY = 208 - i * 22
    const top = 98 + i * 16
    const peaks = 3 + i
    const span = 216
    const x0 = 12
    const stepX = span / peaks

    let d = `M${x0} ${baseY}`
    for (let k = 0; k < peaks; k++) {
      const px = x0 + stepX * (k + 0.5)
      const py = top + ((k + i) % 2 === 0 ? 0 : 13)
      const nx = x0 + stepX * (k + 1)
      d += ` L${n1(px)} ${n1(py)} L${n1(px + stepX * 0.24)} ${n1(py + 26)} L${n1(nx)} ${n1(baseY - 6)}`
    }
    d += ` L${S - 12} ${baseY} Z`
    parts.push(`<path d="${d}"/>`)

    if (i < layers - 1) {
      holes.push(
        `<path d="M${x0 - 6} ${n1(baseY - 1.5)} L${S - 6} ${n1(baseY - 1.5)}" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>`,
      )
    }
  }

  // 月
  parts.push(`<circle cx="188" cy="50" r="20"/>`)
  holes.push(`<circle cx="188" cy="50" r="11"/>`)

  return { solid: parts.join(''), holes: holes.join('') }
}

/* ═══ 灯笼：节庆母题 ═══ */
function lantern(density: 1 | 2 | 3): { solid: string; holes: string } {
  const ribs = density === 1 ? 3 : density === 2 ? 4 : 6
  const parts: string[] = []
  const holes: string[] = []

  parts.push(`<path d="M120 20 L120 40" stroke="currentColor" stroke-width="4" fill="none"/>`)
  parts.push(`<rect x="90" y="36" width="60" height="15" rx="3"/>`)
  parts.push(`<ellipse cx="120" cy="112" rx="63" ry="58"/>`)
  parts.push(`<rect x="90" y="165" width="60" height="15" rx="3"/>`)
  parts.push(
    `<path d="M120 180 L120 208" stroke="currentColor" stroke-width="4" fill="none"/>`,
    `<path d="M120 208 L109 228 M120 208 L120 230 M120 208 L131 228" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  )

  for (let i = 1; i <= ribs; i++) {
    const x = 120 - 63 + (126 / (ribs + 1)) * i
    holes.push(`<rect x="${n1(x - 1.7)}" y="58" width="3.4" height="108" rx="1.7"/>`)
  }
  // 灯腹开光
  holes.push(`<ellipse cx="120" cy="112" rx="25" ry="23"/>`)
  parts.push(`<circle cx="120" cy="112" r="11"/>`)

  return { solid: parts.join(''), holes: holes.join('') }
}

/* ═══ 回纹：回字边带与方胜心 ═══ */
function fret(density: 1 | 2 | 3): { solid: string; holes: string } {
  const parts: string[] = []
  const holes: string[] = []
  const w = 5.6 - density * 0.4
  const unit = density === 1 ? 34 : density === 2 ? 27 : 22

  const unitPath = (x: number, y: number, flipV: boolean) => {
    const s = unit
    const k = s * 0.27
    const sy = flipV ? -1 : 1
    const P = (dx: number, dy: number) => `${n1(x + dx)} ${n1(y + sy * dy)}`
    return `M${P(0, s)} L${P(0, 0)} L${P(s, 0)} L${P(s, s)} L${P(k, s)} L${P(k, k)} L${P(s - k, k)} L${P(s - k, s - k)}`
  }

  const count = Math.max(2, Math.floor((S - 24) / unit))
  const bandW = count * unit
  const x0 = (S - bandW) / 2

  for (let i = 0; i < count; i++) {
    const x = x0 + i * unit
    parts.push(
      `<path d="${unitPath(x, 14, false)}" fill="none" stroke="currentColor" stroke-width="${n1(w)}" stroke-linejoin="miter"/>`,
      `<path d="${unitPath(x, S - 14 - unit, true)}" fill="none" stroke="currentColor" stroke-width="${n1(w)}" stroke-linejoin="miter"/>`,
    )
  }

  // 竖向边带
  const vcount = Math.max(1, Math.floor((S - 28 - unit * 2) / unit))
  for (let i = 0; i < vcount; i++) {
    const y = 14 + unit + i * unit
    parts.push(
      `<g transform="rotate(90 14 ${n1(y)})"><path d="${unitPath(14, y, false)}" fill="none" stroke="currentColor" stroke-width="${n1(w)}" stroke-linejoin="miter"/></g>`,
      `<g transform="rotate(-90 ${S - 14} ${n1(y + unit)})"><path d="${unitPath(S - 14, y + unit, false)}" fill="none" stroke="currentColor" stroke-width="${n1(w)}" stroke-linejoin="miter"/></g>`,
    )
  }

  // 中心方胜
  parts.push(`<rect x="${C - 27}" y="${C - 27}" width="54" height="54" transform="${rot(45)}"/>`)
  holes.push(`<rect x="${C - 15}" y="${C - 15}" width="30" height="30" transform="${rot(45)}"/>`)
  holes.push(`<circle cx="${C}" cy="${C}" r="20"/>`)
  parts.push(`<circle cx="${C}" cy="${C}" r="8.5"/>`)

  return { solid: parts.join(''), holes: holes.join('') }
}

const BUILDERS: Record<PatternSpec['motif'], (d: 1 | 2 | 3) => { solid: string; holes: string }> = {
  flower,
  window,
  fish: () => fish(),
  bird: () => bird(),
  dragon,
  cloud,
  wave,
  mountain,
  lantern,
  fret,
}

/**
 * 生成完整的剪纸纹样 SVG 字符串。
 * @param spec 母题、配色、密度
 * @param size 输出尺寸，可为数字（px）或 CSS 长度（如 '100%'）
 */
export function patternSvg(spec: PatternSpec, size: number | string = 240): string {
  const p = PALETTES[spec.palette]
  const { solid, holes } = BUILDERS[spec.motif](spec.density)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="剪纸纹样">
  <rect width="${S}" height="${S}" fill="${p.paper}"/>
  <circle cx="${C}" cy="${C}" r="112" fill="none" stroke="${p.accent}" stroke-opacity="0.07" stroke-width="1"/>
  <g fill="${p.ink}" color="${p.ink}">${solid}</g>
  <g fill="${p.paper}" color="${p.paper}">${holes}</g>
</svg>`
}

/** 供 CSS background-image 使用的 data URI */
export function patternDataUri(spec: PatternSpec): string {
  return `url("data:image/svg+xml,${encodeURIComponent(patternSvg(spec))}")`
}

export const PALETTE_LIST = Object.keys(PALETTES) as PaletteName[]
