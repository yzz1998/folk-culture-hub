/* ═══════════════════════════════════════════════════════════════
   一致性校验

   跑法：npm run verify
   它把「章节 → 知识点 → 资源」这条链在四个模块里的对应关系
   一次性对账，任何一处对不上就退出码 1。

   分两级：
   error —— 结构性问题，必须修，阻断 build
   warn  —— 内容密度问题，提示补料，不阻断
   ═══════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { ALL_POINTS, CURRICULUM, POINT_MAP } from '@/data/curriculum'
import { FOLK } from '@/data/folk'
import { ALL_LESSONS } from '@/data/lessons'
import { MATERIALS } from '@/data/materials'
import { KNOWLEDGE_CARDS } from '@/data/knowledgeCards'
import { SUBJECT_POINTS } from '@/data/subjectPoints'
import { SUBJECT_META, SUBJECTS } from '@/lib/types'
import { CHAPTER_INDEX, SUBJECT_INDEX, RESOURCES, RESOURCE_COUNTS } from '@/lib/catalog'

type Level = 'error' | 'warn'

const problems: { level: Level; msg: string }[] = []
const err = (msg: string) => problems.push({ level: 'error', msg })
const warn = (msg: string) => problems.push({ level: 'warn', msg })

/* ── 1. 图文条目 → 知识点：不得悬空 ───────────────────── */
let folkLinks = 0
for (const f of FOLK) {
  if (f.pointIds.length === 0) err(`图文条目「${f.name}」(${f.id}) 没有任何关联知识点`)
  for (const pid of f.pointIds) {
    if (!POINT_MAP.has(pid)) err(`图文条目「${f.name}」引用了不存在的知识点 ${pid}`)
    else folkLinks += 1
  }
}

/* ── 2. 学科 ↔ 知识点：引用合法 ───────────────────────── */
const seenPair = new Set<string>()
for (const link of SUBJECT_POINTS) {
  if (!SUBJECTS.includes(link.subject) && link.subject !== '人类社会') {
    err(`subjectPoints 出现未知学科 ${link.subject}`)
  }
  if (!POINT_MAP.has(link.pointId)) {
    err(`subjectPoints 引用了不存在的知识点 ${link.pointId}`)
  }
  const key = `${link.subject}|${link.pointId}`
  if (seenPair.has(key)) err(`subjectPoints 重复登记：${key}`)
  seenPair.add(key)
  if (!link.why || link.why.trim().length < 8) {
    err(`subjectPoints 的 why 过短（${key}）`)
  }
}

/* ── 3. 每个知识点至少被一个学科借用 ──────────────────── */
const covered = new Set(SUBJECT_POINTS.map((l) => l.pointId))
for (const p of ALL_POINTS) {
  if (!covered.has(p.id)) err(`知识点「${p.title}」(${p.id}) 没有被任何学科登记为可借用`)
}

/* ── 4. affinity 为 none 的学科只能作背景或对比 ────────── */
for (const link of SUBJECT_POINTS) {
  if (SUBJECT_META[link.subject].affinity === 'none' && !['context', 'contrast'].includes(link.use)) {
    err(
      `「${link.subject}」的 affinity 为 none，但 ${link.pointId} 登记为 ${link.use}，只允许 context / contrast`,
    )
  }
}

/* ── 5. 学科侧的疏漏提示 ──────────────────────────────────
   学科 → 知识点（subjectPoints）与素材 → 学科（material.subjects）是两条独立口径，
   不该互相推导。这里只查一种真问题：某学科明明有素材，却没登记任何可借用知识点。 */
for (const s of SUBJECT_INDEX) {
  if (s.counts.folk > 0 && s.counts.points === 0) {
    warn(`「${s.subject}」有 ${s.counts.folk} 条图文条目，但未登记任何可借用知识点`)
  }
  if (s.meta.affinity === 'strong' && s.counts.points > 0 && s.counts.points < 6) {
    warn(`「${s.subject}」亲和度为 strong，但只登记了 ${s.counts.points} 个可借用知识点`)
  }
}

/* ── 6. 知识点卡与知识点 1:1 ──────────────────────────── */
const cardByPoint = new Map<string, number>()
for (const c of KNOWLEDGE_CARDS) {
  if (c.id !== `kc-${c.pointId}`) err(`知识点卡 id 不符合 kc-<pointId>：${c.id}`)
  cardByPoint.set(c.pointId, (cardByPoint.get(c.pointId) ?? 0) + 1)
  if (!POINT_MAP.has(c.pointId)) err(`知识点卡 ${c.id} 指向不存在的知识点`)
  if (c.keyIdeas.length === 0) err(`知识点卡 ${c.id} 没有核心要点`)
  if (c.inquiries.length === 0) err(`知识点卡 ${c.id} 没有课堂追问`)
}
for (const p of ALL_POINTS) {
  const n = cardByPoint.get(p.id) ?? 0
  if (n === 0) err(`知识点「${p.title}」缺知识点卡`)
  if (n > 1) err(`知识点「${p.title}」有多张知识点卡`)
}

/* ── 7. 关联总数锁死 263，防止日后又只改一侧 ───────────── */
if (folkLinks !== 263) {
  err(`图文条目↔知识点关联总数为 ${folkLinks}，期望 263（改动请同步更新此断言并说明原因）`)
}

/* ── 8. 密度提示 ──────────────────────────────────────── */
for (const s of SUBJECT_INDEX) {
  if (s.lessons.length === 0) warn(`「${s.subject}」没有任何课例`)
}
for (const c of CHAPTER_INDEX) {
  if (c.counts.points === 0) err(`第 ${c.chapter.order} 章没有知识点`)
  if (c.counts.cards === 0) err(`第 ${c.chapter.order} 章没有知识点卡`)
  if (c.counts.lessons < 2) warn(`第 ${c.chapter.order} 章仅有 ${c.counts.lessons} 份课例，建议补料`)
  if (c.counts.resources < 10) warn(`第 ${c.chapter.order} 章资源仅 ${c.counts.resources} 条，偏薄`)
}

/* ── 9. 每条图文条目至少一个学科归属 ──────────────────── */
for (const f of FOLK) {
  if (f.subjects.length === 0) err(`图文条目「${f.name}」没有学科归属，会在学科视图里消失`)
}

/* ── 10. 已下线模块与旧字段不得残留 ─────────────────────
   注意：App.tsx 里保留的 /community 重定向是故意的，所以查的是模块引用而不是路径。 */
const BANNED = ['pages/Community', 'curriculumLinks', 'folkHooks']
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : []
  })
for (const file of walk('src')) {
  const text = readFileSync(file, 'utf8')
  for (const bad of BANNED) {
    if (text.includes(bad)) err(`${file} 仍残留「${bad}」`)
  }
}

/* ── 输出两张对账表 ───────────────────────────────────── */
const pad = (s: string | number, n: number) => String(s).padEnd(n, ' ')

console.log('\n【学科维】学科为主体，知识点为辅助\n')
console.log(
  pad('学科', 12) + pad('课例', 6) + pad('融合', 6) + pad('本体', 6) + pad('图文', 6) + pad('媒体', 6) + pad('可借知识点', 12),
)
console.log('-'.repeat(62))
for (const s of SUBJECT_INDEX) {
  console.log(
    pad(s.subject, 10) +
      pad(s.counts.lessons, 8) +
      pad(s.counts.fusion, 6) +
      pad(s.counts.standalone, 6) +
      pad(s.counts.folk, 8) +
      pad(s.counts.materials, 6) +
      pad(s.counts.points, 10),
  )
}

console.log('\n【章维】《人类与社会》知识点 · 辅助素材层\n')
console.log(
  pad('章', 6) + pad('单元', 6) + pad('知识点', 8) + pad('卡片', 6) + pad('图文', 6) + pad('媒体', 6) + pad('课例', 6) + pad('合计', 6),
)
console.log('-'.repeat(54))
for (const c of CHAPTER_INDEX) {
  console.log(
    pad(c.chapter.id, 8) +
      pad(c.counts.units, 6) +
      pad(c.counts.points, 8) +
      pad(c.counts.cards, 8) +
      pad(c.counts.folk, 6) +
      pad(c.counts.materials, 6) +
      pad(c.counts.lessons, 6) +
      pad(c.counts.resources, 6),
  )
}
console.log('-'.repeat(54))
console.log(
  pad('合计', 8) +
    pad(CURRICULUM.reduce((n, c) => n + c.units.length, 0), 6) +
    pad(ALL_POINTS.length, 8) +
    pad(KNOWLEDGE_CARDS.length, 8) +
    pad(FOLK.length, 6) +
    pad(MATERIALS.length, 6) +
    pad(ALL_LESSONS.length, 6) +
    pad(RESOURCES.length, 6),
)

console.log('\n【资源池】')
console.log(
  `  知识点卡 ${RESOURCE_COUNTS.card} · 教学素材 ${RESOURCE_COUNTS.material}（图文条目 ${FOLK.length} · 媒体素材 ${MATERIALS.length}） · 课例 ${RESOURCE_COUNTS.lesson} · 合计 ${RESOURCES.length}`,
)
console.log('  注：素材 / 课例可跨章，列内相加会大于末行；末行是去重后的全局量。')
console.log(`  图文条目↔知识点关联 ${folkLinks} 条 · 学科↔知识点 ${SUBJECT_POINTS.length} 条`)

/* ── 结论 ─────────────────────────────────────────────── */
const errors = problems.filter((p) => p.level === 'error')
const warnings = problems.filter((p) => p.level === 'warn')

if (warnings.length) {
  console.log(`\n⚠ 提示 ${warnings.length} 条：`)
  for (const w of warnings.slice(0, 30)) console.log(`  · ${w.msg}`)
  if (warnings.length > 30) console.log(`  …… 另有 ${warnings.length - 30} 条`)
}

if (errors.length) {
  console.log(`\n✗ 错误 ${errors.length} 条：`)
  for (const e of errors) console.log(`  · ${e.msg}`)
  process.exit(1)
}

console.log(`\n✓ 一致性校验通过（错误 0，提示 ${warnings.length}）`)
