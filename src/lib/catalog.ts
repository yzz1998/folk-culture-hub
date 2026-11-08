import type {
  ChapterId,
  FolkItem,
  KnowledgeCard,
  LessonPlan,
  Material,
  PointUse,
  Subject,
  SubjectMeta,
} from '@/lib/types'
import { ALL_SUBJECTS, SUBJECT_META, SUBJECT_LABEL } from '@/lib/types'
import { ALL_POINTS, CURRICULUM, POINT_MAP, type PointWithContext } from '@/data/curriculum'
import { FOLK, FOLK_MAP } from '@/data/folk'
import { ALL_LESSONS } from '@/data/lessons'
import { MATERIALS } from '@/data/materials'
import { KNOWLEDGE_CARDS } from '@/data/knowledgeCards'
import { linksOfSubject, linksOfPoint, SUBJECT_POINTS } from '@/data/subjectPoints'

/* ═══════════════════════════════════════════════════════════════
   双索引层

   课程是主体，学科是迁移落点。这里算成两个索引：
   - 章节索引：课程本身的组织（章 → 单元 → 知识点 → 可用材料）
   - 学科索引：迁移视角（这门学科能承接哪些知识点）

   所有页面的数字都必须取自这里，不允许各页面自行 filter——
   否则「课程脉络说 12 份、资源库列出 9 份」这类不一致会重新长出来。

   归属规则：
   - 资源的章节归属一律派生：由它关联的知识点反推，不手写、不取第一个。
     这是课程主体的地基，错了整站的组织都会歪。
   - 资源的学科归属 = 它自己的 subject 字段（课例）、所属条目的 subjects（教学素材）
     或 subjectPoints（知识点卡）。学科归属只影响「教学应用」视角，不影响课程主体。
   - 「民俗条目」不再单列一类：它与图片、音频、文本一样是教学素材的一种形态（图文条目），
     统一走 material 这一 kind，靠 form 区分呈现方式。分类维度只有章节。
   ═══════════════════════════════════════════════════════════════ */

/* ── 基础反查表 ─────────────────────────────────────────── */

const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
  const list = m.get(k)
  if (list) list.push(v)
  else m.set(k, [v])
}

const FOLK_BY_POINT = new Map<string, FolkItem[]>()
for (const f of FOLK) for (const pid of f.pointIds) push(FOLK_BY_POINT, pid, f)

const MATERIALS_BY_POINT = new Map<string, Material[]>()
for (const m of MATERIALS) {
  const folk = FOLK.find((f) => f.id === m.folkId)
  if (!folk) continue
  for (const pid of folk.pointIds) push(MATERIALS_BY_POINT, pid, m)
}

const LESSONS_BY_POINT = new Map<string, LessonPlan[]>()
for (const l of ALL_LESSONS) for (const pid of l.pointIds) push(LESSONS_BY_POINT, pid, l)

const CARD_BY_POINT = new Map<string, KnowledgeCard>()
for (const c of KNOWLEDGE_CARDS) CARD_BY_POINT.set(c.pointId, c)

export function folkOfPoint(pointId: string): FolkItem[] {
  return FOLK_BY_POINT.get(pointId) ?? []
}
export function materialsOfPoint(pointId: string): Material[] {
  return MATERIALS_BY_POINT.get(pointId) ?? []
}
export function lessonsOfPoint(pointId: string): LessonPlan[] {
  return LESSONS_BY_POINT.get(pointId) ?? []
}
export function cardOfPoint(pointId: string): KnowledgeCard | undefined {
  return CARD_BY_POINT.get(pointId)
}

/** 由知识点反推章节：去重 + 按章的 order 排序。这是唯一允许的章节归属算法。 */
export function chapterIdsOfPoints(pointIds: string[]): ChapterId[] {
  const set = new Set<ChapterId>()
  for (const pid of pointIds) {
    const p = POINT_MAP.get(pid)
    if (p) set.add(p.chapterId)
  }
  return [...set].sort((a, b) => orderOf(a) - orderOf(b))
}

function orderOf(id: ChapterId): number {
  return CURRICULUM.find((c) => c.id === id)?.order ?? 99
}

/** 章 id → 章标题。资源卡上的「所属章节」统一走这里，避免各处自己拼。 */
export function chapterTitleOf(id: ChapterId | string): string {
  return CURRICULUM.find((c) => c.id === id)?.title ?? ''
}

/* ── 章节索引（课程主体）───────────────────────────────── */

export interface ChapterIndex {
  chapter: (typeof CURRICULUM)[number]
  units: { unitId: string; unitTitle: string; points: PointWithContext[] }[]
  points: PointWithContext[]
  folks: FolkItem[]
  materials: Material[]
  lessons: LessonPlan[]
  cards: KnowledgeCard[]
  counts: {
    units: number
    points: number
    ready: number
    planned: number
    cards: number
    folk: number
    materials: number
    lessons: number
    resources: number
  }
}

const dedupeBy = <T,>(items: T[], key: (x: T) => string): T[] => {
  const seen = new Set<string>()
  const out: T[] = []
  for (const it of items) {
    const k = key(it)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(it)
  }
  return out
}

export const CHAPTER_INDEX: ChapterIndex[] = [...CURRICULUM]
  .sort((a, b) => a.order - b.order)
  .map((chapter) => {
    const points = ALL_POINTS.filter((p) => p.chapterId === chapter.id)
    const units = chapter.units.map((u) => ({
      unitId: u.id,
      unitTitle: u.title,
      points: points.filter((p) => p.unitId === u.id),
    }))
    const folks = dedupeBy(
      points.flatMap((p) => folkOfPoint(p.id)),
      (f) => f.id,
    )
    const materials = dedupeBy(
      points.flatMap((p) => materialsOfPoint(p.id)),
      (m) => m.id,
    )
    const lessons = ALL_LESSONS.filter((l) => l.chapterId === chapter.id)
    const cards = points.map((p) => cardOfPoint(p.id)).filter((c): c is KnowledgeCard => Boolean(c))
    const ready = points.filter((p) => p.status === 'ready').length
    return {
      chapter,
      units,
      points,
      folks,
      materials,
      lessons,
      cards,
      counts: {
        units: chapter.units.length,
        points: points.length,
        ready,
        planned: points.length - ready,
        cards: cards.length,
        folk: folks.length,
        materials: materials.length,
        lessons: lessons.length,
        resources: cards.length + folks.length + materials.length + lessons.length,
      },
    }
  })

export function chapterIndexOf(id: ChapterId | string): ChapterIndex | undefined {
  return CHAPTER_INDEX.find((c) => c.chapter.id === id)
}

/* ── 学科索引（迁移落点）───────────────────────────────── */

export interface SubjectPointEntry extends PointWithContext {
  use: PointUse
  why: string
}

export interface SubjectIndex {
  subject: Subject
  meta: SubjectMeta
  lessons: LessonPlan[]
  fusionLessons: LessonPlan[]
  standaloneLessons: LessonPlan[]
  folks: FolkItem[]
  materials: Material[]
  points: SubjectPointEntry[]
  pointsByUse: Record<PointUse, SubjectPointEntry[]>
  counts: {
    lessons: number
    fusion: number
    standalone: number
    folk: number
    materials: number
    points: number
  }
}

export const SUBJECT_INDEX: SubjectIndex[] = ALL_SUBJECTS.map((subject) => {
  const lessons = ALL_LESSONS.filter((l) => l.subject === subject)
  const standaloneLessons = lessons.filter((l) => l.folkIds.length === 0)
  const fusionLessons = lessons.filter((l) => l.folkIds.length > 0)
  const folks = FOLK.filter((f) => f.subjects.includes(subject))
  const materials = MATERIALS.filter((m) => folks.some((f) => f.id === m.folkId))
  const points: SubjectPointEntry[] = linksOfSubject(subject)
    .map((link) => {
      const p = POINT_MAP.get(link.pointId)
      return p ? { ...p, use: link.use, why: link.why } : undefined
    })
    .filter((p): p is SubjectPointEntry => Boolean(p))

  const pointsByUse: Record<PointUse, SubjectPointEntry[]> = {
    context: points.filter((p) => p.use === 'context'),
    material: points.filter((p) => p.use === 'material'),
    contrast: points.filter((p) => p.use === 'contrast'),
    extension: points.filter((p) => p.use === 'extension'),
  }

  return {
    subject,
    meta: SUBJECT_META[subject],
    lessons,
    fusionLessons,
    standaloneLessons,
    folks,
    materials,
    points,
    pointsByUse,
    counts: {
      lessons: lessons.length,
      fusion: fusionLessons.length,
      standalone: standaloneLessons.length,
      folk: folks.length,
      materials: materials.length,
      points: points.length,
    },
  }
})

export function subjectIndexOf(subject: Subject | string): SubjectIndex | undefined {
  return SUBJECT_INDEX.find((s) => s.subject === subject)
}

/** 小学阶段的 10 门国家课程：本课程知识点的迁移落点，不是平台主轴 */
export const PRIMARY_SUBJECT_INDEX = SUBJECT_INDEX.filter((s) => s.subject !== '人类社会')

/** 《人类与社会》课程本体：平台的主体内容，其余一切围绕它组织 */
export const COURSE_INDEX = subjectIndexOf('人类社会')

/* ── 统一资源视图 ──────────────────────────────────────── */

/**
 * 资源只有三类：知识点卡、教学素材、课例。
 * 原来的「民俗条目」并进教学素材——它本身就是一种素材，不该与素材平行成两类。
 */
export type ResourceKind = 'card' | 'material' | 'lesson'

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  card: '知识点卡',
  material: '教学素材',
  lesson: '课例',
}

/**
 * 教学素材的形态。分类维度不用它（分类维度是章节），它只用于标识
 * 「打开后是什么」：图文条目有自己的详情页，媒体素材按类型投屏。
 */
export type MaterialForm = 'entry' | 'image' | 'audio' | 'video' | 'text'

export const MATERIAL_FORM_LABEL: Record<MaterialForm, string> = {
  entry: '图文条目',
  image: '图片',
  audio: '音频',
  video: '视频',
  text: '文本资料',
}

interface ResourceBase {
  key: string
  id: string
  kind: ResourceKind
  title: string
  summary: string
  subjectIds: Subject[]
  chapterIds: ChapterId[]
  pointIds: string[]
  route: string
  searchText: string
}

export type ResourceItem = ResourceBase &
  (
    | { kind: 'card'; data: KnowledgeCard }
    | { kind: 'material'; form: 'entry'; data: FolkItem }
    | { kind: 'material'; form: Exclude<MaterialForm, 'entry'>; data: Material }
    | { kind: 'lesson'; data: LessonPlan }
  )

/**
 * 取一条素材所属的「图文条目」。
 * 图文条目返回自身；图片 / 音频 / 文本返回它挂靠的那条条目。
 * 类别、地域、主题这些字段只存在于条目上，筛选时统一从这里取，避免两套判断。
 */
export function folkOfMaterial(item: ResourceItem): FolkItem | undefined {
  if (item.kind !== 'material') return undefined
  return item.form === 'entry' ? item.data : FOLK_MAP.get(item.data.folkId)
}

const norm = (s: string) => s.toLowerCase()

function chapterNames(ids: ChapterId[]): string {
  return ids.map((id) => CURRICULUM.find((c) => c.id === id)?.title ?? '').join(' ')
}

function pointNames(ids: string[]): string {
  return ids.map((id) => POINT_MAP.get(id)?.title ?? '').join(' ')
}

const CARD_RESOURCES: ResourceItem[] = KNOWLEDGE_CARDS.map((c) => {
  const p = POINT_MAP.get(c.pointId)
  const chapterIds = chapterIdsOfPoints([c.pointId])
  const subjectIds = [...new Set(linksOfPoint(c.pointId).map((l) => l.subject))]
  const summary = c.keyIdeas[0] ?? p?.summary ?? ''
  return {
    key: `card:${c.id}`,
    id: c.id,
    kind: 'card',
    title: p?.title ?? c.pointId,
    summary,
    subjectIds,
    chapterIds,
    pointIds: [c.pointId],
    route: `/resources/card/${c.id}`,
    searchText: norm(
      [p?.title, p?.summary, summary, ...c.keyIdeas, ...c.concepts.map((x) => x.term), chapterNames(chapterIds), ...subjectIds].join(' '),
    ),
    data: c,
  }
})

/** 图文条目：原「民俗条目」，现在只是教学素材的一种形态 */
const ENTRY_RESOURCES: ResourceItem[] = FOLK.map((f) => {
  const chapterIds = chapterIdsOfPoints(f.pointIds)
  return {
    key: `material:${f.id}`,
    id: f.id,
    kind: 'material',
    form: 'entry' as const,
    title: f.name,
    summary: f.summary,
    subjectIds: f.subjects,
    chapterIds,
    pointIds: f.pointIds,
    route: `/resources/material/${f.id}`,
    searchText: norm(
      [f.name, f.summary, f.category, f.culturalMeaning, ...f.keywords, chapterNames(chapterIds), pointNames(f.pointIds)].join(' '),
    ),
    data: f,
  }
})

/** 媒体素材：图片 / 音频 / 视频 / 文本，章节归属由所属条目反推 */
/** 可直接投屏的媒体素材（图片/文本/音频/视频），不含图文条目 */
export const MEDIA_RESOURCES: ResourceItem[] = MATERIALS.map((m) => {
  const folk = FOLK_MAP.get(m.folkId)
  const pointIds = folk?.pointIds ?? []
  const chapterIds = chapterIdsOfPoints(pointIds)
  return {
    key: `material:${m.id}`,
    id: m.id,
    kind: 'material',
    form: m.type,
    title: m.title,
    summary: m.desc,
    subjectIds: folk?.subjects ?? [],
    chapterIds,
    pointIds,
    route: `/resources/material/${m.id}`,
    searchText: norm(
      [m.title, m.desc, m.usage ?? '', m.body ?? '', folk?.name ?? '', chapterNames(chapterIds), pointNames(pointIds)].join(' '),
    ),
    data: m,
  }
})

const LESSON_RESOURCES: ResourceItem[] = ALL_LESSONS.map((l) => {
  const chapterIds: ChapterId[] = l.chapterId ? [l.chapterId] : []
  return {
    key: `lesson:${l.id}`,
    id: l.id,
    kind: 'lesson',
    title: l.title,
    summary: `${SUBJECT_LABEL[l.subject]} · ${l.activities.length} 个活动`,
    subjectIds: [l.subject],
    chapterIds,
    pointIds: l.pointIds,
    route: `/lessons/${l.id}`,
    searchText: norm([l.title, SUBJECT_LABEL[l.subject], chapterNames(chapterIds), pointNames(l.pointIds)].join(' ')),
    data: l,
  }
})

export const RESOURCES: ResourceItem[] = [
  ...CARD_RESOURCES,
  ...ENTRY_RESOURCES,
  ...MEDIA_RESOURCES,
  ...LESSON_RESOURCES,
]

export const RESOURCE_MAP = new Map<string, ResourceItem>(RESOURCES.map((r) => [r.key, r]))

/** 三类资源的全局计数，全站唯一口径 */
export const RESOURCE_COUNTS: Record<ResourceKind, number> = {
  card: CARD_RESOURCES.length,
  material: ENTRY_RESOURCES.length + MEDIA_RESOURCES.length,
  lesson: LESSON_RESOURCES.length,
}

/**
 * 某个知识点下的全部教学素材（图文条目 + 媒体素材）。
 * 备课工坊的「已选材料」用这一份，不再单独列民俗。
 */
export function materialResourcesOfPoint(pointId: string): ResourceItem[] {
  return [...ENTRY_RESOURCES, ...MEDIA_RESOURCES].filter((r) => r.pointIds.includes(pointId))
}

/** 按 id 取一条素材资源（图文条目与媒体素材共用 material: 前缀） */
export function materialResourceOf(id: string): ResourceItem | undefined {
  return RESOURCE_MAP.get(`material:${id}`)
}

export const RESOURCE_TOTAL = RESOURCES.length

/** 教学素材按形态的条数：只在说明文案里用，不作为分类维度 */
export const MATERIAL_FORM_COUNTS: Record<MaterialForm, number> = {
  entry: ENTRY_RESOURCES.length,
  image: MEDIA_RESOURCES.filter((r) => r.kind === 'material' && r.form === 'image').length,
  audio: MEDIA_RESOURCES.filter((r) => r.kind === 'material' && r.form === 'audio').length,
  video: MEDIA_RESOURCES.filter((r) => r.kind === 'material' && r.form === 'video').length,
  text: MEDIA_RESOURCES.filter((r) => r.kind === 'material' && r.form === 'text').length,
}

/** 某章某类资源（章节页与资源库共用同一算法） */
export function resourcesOfChapter(id: ChapterId, kind?: ResourceKind): ResourceItem[] {
  return RESOURCES.filter(
    (r) => r.chapterIds.includes(id) && (kind ? r.kind === kind : true),
  )
}

/** 某学科某类资源 */
export function resourcesOfSubject(subject: Subject, kind?: ResourceKind): ResourceItem[] {
  return RESOURCES.filter(
    (r) => r.subjectIds.includes(subject) && (kind ? r.kind === kind : true),
  )
}

/**
 * 课程规模：首页、课程脉络与各类说明文案的唯一数字来源。
 * 口径是「这门课有多大」，不是「辅助素材有多少」。
 */
export const COURSE_SCALE = {
  chapters: CURRICULUM.length,
  units: CURRICULUM.reduce((n, c) => n + c.units.length, 0),
  points: ALL_POINTS.length,
  cards: KNOWLEDGE_CARDS.length,
  readyCards: KNOWLEDGE_CARDS.filter((c) => c.status === 'ready').length,
  /** 教学应用映射条数：一个知识点落到一门学科算一条 */
  applies: SUBJECT_POINTS.length,
  /** 可落到的学科数（不含课程本体） */
  subjects: ALL_SUBJECTS.filter((s) => s !== '人类社会').length,
  /** 民俗条目：只是第 7 章里的一类内容，不是全站规模 */
  folk: FOLK.length,
  materials: MATERIALS.length,
  lessons: ALL_LESSONS.length,
}
