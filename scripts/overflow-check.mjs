/**
 * 375px 横向溢出实测：Chrome 无头 + CDP，零依赖。
 * 判定标准：document.documentElement.scrollWidth > clientWidth 即为溢出。
 * 元素清单仅作定位用——横向滚动容器（overflow-x-auto）里的子元素会正常超出，不算问题。
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 9333
const BASE = 'http://127.0.0.1:5178'

const ROUTES = [
  '/',
  '/curriculum',
  '/resources',
  '/resources?kind=card',
  '/resources?kind=material',
  '/resources?kind=material&form=entry',
  '/resources?chapter=ch7',
  '/resources/material/fangzhi',
  '/resources/material/av-01',
  '/resources/material/text-story-niulang',
  '/resources/card/kc-ch1-u1-p1',
  '/lessons',
  '/lessons/l-01',
  '/lessons/s-m01',
  '/apply',
  '/agent',
  '/workspace',
  '/settings',
]

const profile = mkdtempSync(path.join(tmpdir(), 'ovf-'))
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function waitPort() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (r.ok) return
    } catch {}
    await sleep(250)
  }
  throw new Error('Chrome 调试端口未就绪')
}

await waitPort()

const res = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE + '/')}`, {
  method: 'PUT',
})
const target = await res.json()
const ws = new WebSocket(target.webSocketDebuggerUrl)

let seq = 0
const pending = new Map()
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
})
await new Promise((r) => ws.addEventListener('open', r, { once: true }))

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
  return r.result.value
}

await send('Page.enable')
await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  mobile: true,
})

const PROBE = `(() => {
  const de = document.documentElement
  const vw = de.clientWidth
  const bad = []
  document.querySelectorAll('body *').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    if (r.right > vw + 1) {
      let scroller = false
      let p = el.parentElement
      while (p) {
        const ox = getComputedStyle(p).overflowX
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') { scroller = true; break }
        p = p.parentElement
      }
      bad.push({
        t: el.tagName.toLowerCase(),
        c: String(el.className || '').slice(0, 48),
        right: Math.round(r.right),
        scroller,
      })
    }
  })
  bad.sort((a, b) => b.right - a.right)
  return JSON.stringify({
    vw,
    sw: de.scrollWidth,
    hasRoot: (document.getElementById('root')?.childElementCount ?? 0) > 0,
    bad: bad.slice(0, 5),
    badFree: bad.filter((b) => !b.scroller).slice(0, 5),
  })
})()`

const rows = []
for (const [i, route] of ROUTES.entries()) {
  await send('Page.navigate', { url: `${BASE}/#${route}` })
  // 首次导航要等 vite 现编译，给足时间；之后是 hash 变更，短等即可
  await sleep(i === 0 ? 4500 : 1100)
  let out
  for (let k = 0; k < 10; k++) {
    out = JSON.parse(await evaluate(PROBE))
    if (out.hasRoot) break
    await sleep(400)
  }
  rows.push({ route, ...out })
}

for (const r of rows) {
  const overflow = r.sw - r.vw
  const flag = overflow > 1 ? '✗' : '✓'
  console.log(`${flag} ${String(overflow > 1 ? overflow : 0).padStart(3)}px  ${r.route}`)
  if (overflow > 1) {
    const list = r.badFree.length ? r.badFree : r.bad
    list.forEach((b) =>
      console.log(`      ${b.scroller ? '(滚动容器内)' : ''}${b.t}.${b.c} → right=${b.right}`),
    )
  }
}

const fails = rows.filter((r) => r.sw - r.vw > 1)
console.log(`\n${fails.length === 0 ? '✓ 375px 全部无横向溢出' : `✗ ${fails.length} 个页面溢出`}（共 ${rows.length} 个路由）`)

ws.close()
chrome.kill()
await sleep(300)
try {
  rmSync(profile, { recursive: true, force: true })
} catch {}
process.exit(fails.length === 0 ? 0 : 1)
