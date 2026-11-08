import type { FolkItem, LessonPlan, GradeBand, Material, Subject, Theme, FolkCategory, Region } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════
   统一检索与多维筛选

   加权匹配：名称命中权重最高，其次关键词，再次概述与文化内涵。
   支持多关键词（空格分隔），全部命中才算匹配（AND 语义），
   符合教师「越搜越窄」的使用直觉。
   ═══════════════════════════════════════════════════════════════ */

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '')
}

export function tokenize(q: string): string[] {
  return q
    .trim()
    .split(/\s+/)
    .map(norm)
    .filter(Boolean)
}

/** 返回 0 表示不匹配；分数越高越相关 */
export function scoreFolk(item: FolkItem, tokens: string[]): number {
  if (tokens.length === 0) return 1
  const name = norm(item.name)
  const kw = item.keywords.map(norm)
  const summary = norm(item.summary)
  const meaning = norm(item.culturalMeaning)
  const cat = norm(item.category)
  const origin = norm(item.origin)

  let total = 0
  for (const t of tokens) {
    let s = 0
    if (name === t) s = 100
    else if (name.includes(t)) s = 60
    else if (kw.some((k) => k === t)) s = 50
    else if (kw.some((k) => k.includes(t))) s = 34
    else if (cat.includes(t)) s = 24
    else if (summary.includes(t)) s = 18
    else if (origin.includes(t)) s = 12
    else if (meaning.includes(t)) s = 8
    if (s === 0) return 0 // AND 语义：任一关键词未命中即排除
    total += s
  }
  return total
}

export function searchFolk(items: FolkItem[], q: string): FolkItem[] {
  const tokens = tokenize(q)
  if (tokens.length === 0) return items
  return items
    .map((item) => ({ item, s: scoreFolk(item, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.item)
}

export interface FolkFilter {
  categories: FolkCategory[]
  themes: Theme[]
  subjects: Subject[]
  grades: GradeBand[]
  regions: Region[]
}

export const EMPTY_FILTER: FolkFilter = {
  categories: [],
  themes: [],
  subjects: [],
  grades: [],
  regions: [],
}

export function applyFolkFilter(items: FolkItem[], f: FolkFilter): FolkItem[] {
  return items.filter((it) => {
    if (f.categories.length && !f.categories.includes(it.category)) return false
    if (f.regions.length && !f.regions.includes(it.region)) return false
    if (f.themes.length && !f.themes.some((t) => it.themes.includes(t))) return false
    if (f.subjects.length && !f.subjects.some((s) => it.subjects.includes(s))) return false
    if (f.grades.length && !f.grades.some((g) => it.grades.includes(g))) return false
    return true
  })
}

export function filterCount(f: FolkFilter): number {
  return (
    f.categories.length + f.themes.length + f.subjects.length + f.grades.length + f.regions.length
  )
}

/* ── 教案检索 ─────────────────────────────────── */
export function scoreLesson(item: LessonPlan, tokens: string[]): number {
  if (tokens.length === 0) return 1
  const title = norm(item.title)
  const obj = norm(
    [item.objectives.knowledge, item.objectives.ability, item.objectives.emotion].join(''),
  )
  const flow = norm(
    item.flow.map((s) => `${s.stage}${s.teacher}${s.student}${s.intent}`).join(''),
  )
  const prep = norm(item.preparation.join(''))
  const act = norm(item.activities.map((a) => `${a.name}${a.desc}`).join(''))
  const subj = norm(item.subject)

  let total = 0
  for (const t of tokens) {
    let s = 0
    if (title.includes(t)) s = 60
    else if (subj.includes(t)) s = 30
    else if (act.includes(t)) s = 22
    else if (obj.includes(t)) s = 18
    else if (prep.includes(t)) s = 12
    else if (flow.includes(t)) s = 8
    if (s === 0) return 0
    total += s
  }
  return total
}

export function searchLessons(items: LessonPlan[], q: string): LessonPlan[] {
  const tokens = tokenize(q)
  if (tokens.length === 0) return items
  return items
    .map((item) => ({ item, s: scoreLesson(item, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.item)
}

/* ── 素材检索 ─────────────────────────────────── */
export function searchMaterials(items: Material[], q: string): Material[] {
  const tokens = tokenize(q)
  if (tokens.length === 0) return items
  return items.filter((m) => {
    const hay = norm(`${m.title}${m.desc}${m.usage ?? ''}${m.body ?? ''}`)
    return tokens.every((t) => hay.includes(t))
  })
}

/* ── 统一资源检索 ──────────────────────────────────
   RESOURCES 已经把四类资源的可搜字段预拼成 searchText，
   这里不再关心它到底是知识卡还是课例，只做 AND 语义的关键词匹配。 */
export function queryResources<T extends { searchText: string; title: string }>(
  items: T[],
  q: string,
): T[] {
  const tokens = tokenize(q)
  if (tokens.length === 0) return items
  return items
    .map((item) => {
      const title = norm(item.title)
      // 标题命中优先，其余按 searchText 是否含全部词
      const hit = tokens.every((t) => item.searchText.includes(t))
      if (!hit) return null
      const titleScore = tokens.reduce((n, t) => (title.includes(t) ? n + 10 : n), 0)
      return { item, score: titleScore }
    })
    .filter((x): x is { item: T; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)
}

/* ── 高亮 ─────────────────────────────────────── */
export function highlight(text: string, q: string): { text: string; hit: boolean }[] {
  const tokens = tokenize(q)
  if (tokens.length === 0) return [{ text, hit: false }]
  const lower = text.toLowerCase()
  const ranges: [number, number][] = []
  for (const t of tokens) {
    let idx = lower.indexOf(t)
    while (idx !== -1) {
      ranges.push([idx, idx + t.length])
      idx = lower.indexOf(t, idx + 1)
    }
  }
  if (ranges.length === 0) return [{ text, hit: false }]
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([...r])
  }
  const out: { text: string; hit: boolean }[] = []
  let cursor = 0
  for (const [s, e] of merged) {
    if (s > cursor) out.push({ text: text.slice(cursor, s), hit: false })
    out.push({ text: text.slice(s, e), hit: true })
    cursor = e
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), hit: false })
  return out
}
