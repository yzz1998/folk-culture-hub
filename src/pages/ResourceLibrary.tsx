import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { ChevronRight, Layers, SlidersHorizontal, X } from 'lucide-react'
import type { FolkCategory, GradeBand, Region, Subject, Theme } from '@/lib/types'
import {
  ALL_SUBJECTS,
  FOLK_CATEGORIES,
  GRADE_BANDS,
  GRADE_SHORT,
  HOST_SUBJECT,
  SUBJECT_LABEL,
  THEMES,
} from '@/lib/types'
import {
  CHAPTER_INDEX,
  MATERIAL_FORM_LABEL,
  PRIMARY_SUBJECT_INDEX,
  RESOURCES,
  RESOURCE_COUNTS,
  RESOURCE_KIND_LABEL,
  folkOfMaterial,
  subjectIndexOf,
} from '@/lib/catalog'
import type { MaterialForm, ResourceItem, ResourceKind } from '@/lib/catalog'
import { queryResources } from '@/lib/search'
import { Button, Drawer, EmptyState, SearchInput, Segmented, Tag, CATEGORY_TONE } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { ResourceCard } from '@/components/resource/ResourceCard'
import { useApp, useToast } from '@/store/AppStore'

/* ═══════════════════════════════════════════════════════════════
   资源库

   分类维度只有一个：**章节**。章节之下再按知识点分堆，因为教师找材料时
   想的是「这一章这个点，有什么能用的」，而不是「这是民俗还是素材」。

   原来的「民俗条目」不再单独成类，它和图片、音频、文本一样是教学素材，
   靠形态标签区分呈现方式（图文条目 / 图片 / 音频 / 视频 / 文本资料）。
   「落到哪门课」留作二级筛选，用于缩到你要教的那一门。

   章节 chip 只筛「挂了这一章知识点的资源」。跨章素材在两章下都会出现，
   这是真实的归属关系，不是重复计数——顶部因此写明总量按条目去重。
   ═══════════════════════════════════════════════════════════════ */

type KindFilter = 'all' | ResourceKind
type FormFilter = 'all' | MaterialForm
type GroupMode = 'chapter' | 'subject' | 'none'

const KIND_OPTIONS: { value: KindFilter; label: string; count: number }[] = [
  { value: 'all', label: '全部', count: RESOURCES.length },
  { value: 'card', label: RESOURCE_KIND_LABEL.card, count: RESOURCE_COUNTS.card },
  { value: 'material', label: RESOURCE_KIND_LABEL.material, count: RESOURCE_COUNTS.material },
  { value: 'lesson', label: RESOURCE_KIND_LABEL.lesson, count: RESOURCE_COUNTS.lesson },
]

const FORM_OPTIONS: { value: FormFilter; label: string }[] = [
  { value: 'all', label: '全部形态' },
  { value: 'entry', label: MATERIAL_FORM_LABEL.entry },
  { value: 'image', label: MATERIAL_FORM_LABEL.image },
  { value: 'text', label: MATERIAL_FORM_LABEL.text },
  { value: 'audio', label: MATERIAL_FORM_LABEL.audio },
  { value: 'video', label: MATERIAL_FORM_LABEL.video },
]

interface Facets {
  categories: FolkCategory[]
  grades: GradeBand[]
  themes: Theme[]
  regions: Region[]
}

const EMPTY_FACETS: Facets = { categories: [], grades: [], themes: [], regions: [] }

export default function ResourceLibrary() {
  const [params, setParams] = useSearchParams()
  const { isFavorite, toggleFavorite } = useApp()
  const { toast } = useToast()

  const kind = ((): KindFilter => {
    const k = params.get('kind')
    // 旧链 ?kind=folk：民俗条目已并入教学素材
    if (k === 'folk') return 'material'
    return k === 'card' || k === 'material' || k === 'lesson' ? k : 'all'
  })()
  const form = ((): FormFilter => {
    const f = params.get('form')
    return f === 'entry' || f === 'image' || f === 'audio' || f === 'video' || f === 'text'
      ? f
      : 'all'
  })()
  const subjectParam = params.get('subject')
  const subject: Subject | 'all' = ALL_SUBJECTS.includes(subjectParam as Subject)
    ? (subjectParam as Subject)
    : 'all'
  const chapter = params.get('chapter') ?? 'all'

  const [q, setQ] = useState('')
  const [group, setGroup] = useState<GroupMode>('chapter')
  const [facets, setFacets] = useState<Facets>(() => {
    const region = params.get('region') as Region | null
    const grade = params.get('grade') as GradeBand | null
    return {
      ...EMPTY_FACETS,
      regions: region ? [region] : [],
      grades: grade ? [grade] : [],
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    // 换类别时清掉形态条件，避免「课例 + 图片形态」这类空组合
    if (key === 'kind' && value !== 'material') next.delete('form')
    setParams(next, { replace: true })
  }

  /* ── 筛选 ─────────────────────────────────────── */
  /* 类型 / 形态是「看哪一类资源」的开关，先把底表收窄；
     学科 chip 上的数字按这张底表算，否则切到教学素材后芯片还写着 247，与右上「共 136 条」对不上。 */
  const baseList = useMemo(() => {
    let out: ResourceItem[] = RESOURCES
    if (kind !== 'all') out = out.filter((r) => r.kind === kind)
    if (kind === 'material' && form !== 'all') {
      out = out.filter((r) => r.kind === 'material' && r.form === form)
    }
    return out
  }, [kind, form])

  const list = useMemo(() => {
    let out: ResourceItem[] = baseList
    if (subject !== 'all') out = out.filter((r) => r.subjectIds.includes(subject))
    if (chapter !== 'all') out = out.filter((r) => (r.chapterIds as string[]).includes(chapter))
    if (q.trim()) out = queryResources(out, q)

    // 类别 / 主题 / 地域来自素材所属的图文条目；知识卡与课例没有这些字段，
    // 强行套用会让它们整批消失，所以只在素材上判断。
    if (facets.categories.length || facets.themes.length || facets.regions.length) {
      out = out.filter((r) => {
        const entry = folkOfMaterial(r)
        if (!entry) return true
        if (facets.categories.length && !facets.categories.includes(entry.category)) return false
        if (facets.regions.length && !facets.regions.includes(entry.region)) return false
        if (facets.themes.length && !facets.themes.some((t) => entry.themes.includes(t))) return false
        return true
      })
    }
    if (facets.grades.length) {
      out = out.filter((r) => {
        if (r.kind === 'material') {
          if (r.form === 'entry') return facets.grades.some((g) => r.data.grades.includes(g))
          const bands = r.data.gradeBands
          return bands ? facets.grades.some((g) => bands.includes(g)) : true
        }
        if (r.kind === 'lesson') return facets.grades.includes(r.data.gradeBand)
        return true
      })
    }
    return out
  }, [baseList, subject, chapter, q, facets])

  const facetCount =
    facets.categories.length + facets.grades.length + facets.themes.length + facets.regions.length

  /** 各学科在「当前类型 / 形态」下的条目数，与右侧列表同源 */
  const subjectCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of baseList) {
      for (const s of r.subjectIds) m.set(s, (m.get(s) ?? 0) + 1)
    }
    return m
  }, [baseList])

  function toggleFacet<K extends keyof Facets>(key: K, value: Facets[K][number]) {
    setFacets((f) => {
      const arr = f[key] as unknown as string[]
      const has = arr.includes(value as string)
      return {
        ...f,
        [key]: has ? arr.filter((x) => x !== value) : [...arr, value],
      } as Facets
    })
  }

  function resetAll() {
    setFacets(EMPTY_FACETS)
    setQ('')
    setParams({}, { replace: true })
  }

  /* ── 分组：章节 → 知识点 ───────────────────────── */
  const chapterSections = useMemo(() => {
    if (group !== 'chapter') return []
    return CHAPTER_INDEX.map(({ chapter: ch, points }) => {
      const items = list.filter((r) => r.chapterIds.includes(ch.id))
      if (items.length === 0) return null
      type PointGroup = { key: string; title: string; sub: string; items: ResourceItem[] }
      const byPoint: PointGroup[] = points
        .map((p) => ({
          key: p.id as string,
          title: p.title,
          sub: p.unitTitle,
          items: items.filter((r) => r.pointIds.includes(p.id)),
        }))
        .filter((g) => g.items.length > 0)
      const claimed = new Set(byPoint.flatMap((g) => g.items.map((r) => r.key)))
      const rest = items.filter((r) => !claimed.has(r.key))
      if (rest.length > 0) {
        byPoint.push({
          key: `${ch.id}-free`,
          title: '本章综合',
          sub: '未挂到具体知识点',
          items: rest,
        })
      }
      return { chapter: ch, items, byPoint }
    }).filter((x): x is NonNullable<typeof x> => Boolean(x))
  }, [list, group])

  const flatGroups = useMemo<{ key: string; title: string; sub: string; items: ResourceItem[] }[]>(() => {
    if (group === 'none') return [{ key: 'all', title: '', sub: '', items: list }]
    if (group !== 'subject') return []

    return [...PRIMARY_SUBJECT_INDEX.map((s) => s.subject), HOST_SUBJECT]
      .map((s) => {
        const items = list.filter((r) => r.subjectIds.includes(s))
        const idx = subjectIndexOf(s)
        return {
          key: s,
          title: SUBJECT_LABEL[s],
          sub: s === HOST_SUBJECT ? '课程本体' : (idx ? idx.meta.ownCore.split('；')[0] : ''),
          items,
        }
      })
      .filter((g) => g.items.length > 0)
  }, [list, group])

  const filterPanel = (
    <div className="space-y-4">
      <FilterGroup
        label="类别"
        options={FOLK_CATEGORIES.map((c) => ({ value: c, label: c, tone: CATEGORY_TONE[c] }))}
        selected={facets.categories}
        onToggle={(v) => toggleFacet('categories', v as FolkCategory)}
      />
      <FilterGroup
        label="年级"
        options={GRADE_BANDS.map((g) => ({ value: g, label: GRADE_SHORT[g] }))}
        selected={facets.grades}
        onToggle={(v) => toggleFacet('grades', v as GradeBand)}
      />
      <FilterGroup
        label="主题"
        options={THEMES.map((t) => ({ value: t, label: t }))}
        selected={facets.themes}
        onToggle={(v) => toggleFacet('themes', v as Theme)}
      />
      <FilterGroup
        label="地域"
        options={[
          { value: '全国', label: '全国通行' },
          { value: '闽东', label: '闽东本地' },
        ]}
        selected={facets.regions}
        onToggle={(v) => toggleFacet('regions', v as Region)}
      />
      <p className="rounded-sm border border-line-2 bg-paper-2/50 px-2 py-1.5 text-[10.5px] leading-[1.7] text-ink-4">
        类别、主题、地域只作用于教学素材（含图文条目）；知识卡与课例不受这三项影响。
      </p>
    </div>
  )

  const favoriteProps = (r: ResourceItem) => {
    if (r.kind === 'card') {
      return {
        favorited: isFavorite('card', r.id),
        onToggleFavorite: () => {
          const was = isFavorite('card', r.id)
          toggleFavorite('card', r.id)
          toast(was ? '已取消收藏' : `已收藏「${r.title}」`)
        },
      }
    }
    if (r.kind === 'lesson') {
      return {
        favorited: isFavorite('lesson', r.id),
        onToggleFavorite: () => {
          const was = isFavorite('lesson', r.id)
          toggleFavorite('lesson', r.id)
          toast(was ? '已取消收藏' : `已收藏「${r.title}」`)
        },
      }
    }
    // 图文条目可收藏（沿用原民俗收藏键，旧收藏不丢）；媒体素材不单独收藏
    if (r.form === 'entry') {
      return {
        favorited: isFavorite('folk', r.id),
        onToggleFavorite: () => {
          const was = isFavorite('folk', r.id)
          toggleFavorite('folk', r.id)
          toast(was ? '已取消收藏' : `已收藏「${r.title}」`)
        },
      }
    }
    return {}
  }

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="资源库"
        title="三类资源，按章节归位"
        desc={`知识点卡 ${RESOURCE_COUNTS.card} 张、教学素材 ${RESOURCE_COUNTS.material} 条（图文条目与图片、音频、文本素材统一归入这一类）、课例 ${RESOURCE_COUNTS.lesson} 份。章怎么分，材料就怎么归；章内再按知识点分堆。`}
        right={
          <div className="flex items-center gap-2">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="搜剪纸、城市、节气…"
              className="w-full sm:w-56"
            />
            <Button
              variant="outline"
              onClick={() => setDrawerOpen(true)}
              className="relative shrink-0 lg:hidden"
            >
              <SlidersHorizontal size={14} />
              筛选
              {facetCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-cinnabar px-1 text-[10px] font-semibold text-white">
                  {facetCount}
                </span>
              )}
            </Button>
          </div>
        }
      />

      {/* ① 类型 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented
          size="sm"
          value={kind}
          onChange={(v) => setParam('kind', v)}
          options={KIND_OPTIONS}
        />
        <span className="ml-auto text-[11.5px] text-ink-3">
          共 <span className="tnum font-medium text-ink">{list.length}</span> 条
          {group !== 'none' && list.length !== new Set(list.map((r) => r.key)).size && (
            <span className="text-ink-4">（跨章条目会在多组出现）</span>
          )}
        </span>
      </div>

      {/* ② 素材形态：只在素材视图出现 */}
      {kind === 'material' && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[11px] text-ink-4">形态</span>
          {FORM_OPTIONS.map((o) => {
            const on = form === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setParam('form', o.value)}
                className={clsx(
                  'rounded-sm border px-2 py-[3px] text-[10.5px] transition-colors',
                  on
                    ? 'border-ink bg-ink text-white'
                    : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
                )}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}

      {/* ③ 章节主筛：唯一分类维度 */}
      <div className="mb-2.5">
        <div className="mb-1.5 flex items-baseline gap-1.5">
          <span className="text-[11px] font-medium tracking-wide text-ink-3">按章节</span>
          <span className="text-[10px] text-ink-4">分类维度</span>
          <Link
            to="/curriculum"
            className="ml-auto inline-flex items-center gap-0.5 text-[10.5px] text-ink-4 hover:text-cinnabar"
          >
            课程脉络 <ChevronRight size={10} />
          </Link>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <ChapterChip
            active={chapter === 'all'}
            onClick={() => setParam('chapter', 'all')}
            label="全部"
          />
          {CHAPTER_INDEX.map(({ chapter: ch }) => (
            <ChapterChip
              key={ch.id}
              active={chapter === ch.id}
              onClick={() => setParam('chapter', ch.id)}
              label={`${String(ch.order).padStart(2, '0')} ${ch.title}`}
            />
          ))}
        </div>
      </div>

      {/* ④ 学科二级：落到哪门课 */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-baseline gap-1.5">
          <span className="text-[11px] font-medium tracking-wide text-ink-3">落到哪门课</span>
          <span className="text-[10px] text-ink-4">可选 · 只筛与这门课相关的材料</span>
        </div>
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <SubjectChip
            active={subject === 'all'}
            onClick={() => setParam('subject', 'all')}
            label="全部学科"
            count={baseList.length}
          />
          {PRIMARY_SUBJECT_INDEX.map((s) => (
            <SubjectChip
              key={s.subject}
              active={subject === s.subject}
              onClick={() => setParam('subject', s.subject)}
              label={SUBJECT_LABEL[s.subject]}
              count={subjectCount.get(s.subject) ?? 0}
            />
          ))}
          <span className="mx-0.5 my-auto h-4 w-px shrink-0 bg-line" />
          <SubjectChip
            assist
            active={subject === HOST_SUBJECT}
            onClick={() => setParam('subject', HOST_SUBJECT)}
            label="课程本体（人类社会）"
            count={subjectCount.get(HOST_SUBJECT) ?? 0}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[196px_1fr]">
        {/* 桌面筛选栏 */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4 rounded-lg border border-line bg-card p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink-2">细项筛选</span>
              {(facetCount > 0 || q) && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-[11px] text-cinnabar hover:text-cinnabar-h"
                >
                  清空 {facetCount + (q ? 1 : 0)}
                </button>
              )}
            </div>
            {filterPanel}
          </div>
        </aside>

        {/* min-w-0 不可省：grid 子项默认 min-width:auto，
            内容里的长串（学科名 + 计数）会把整列撑出视口，375px 下横向溢出 51px */}
        <div className="min-w-0">
          {/* 分组方式 */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-ink-4">分组</span>
            <Segmented
              size="sm"
              value={group}
              onChange={setGroup}
              options={[
                { value: 'chapter' as const, label: '按章节 · 知识点' },
                { value: 'subject' as const, label: '按学科' },
                { value: 'none' as const, label: '不分组' },
              ]}
            />
            {(facetCount > 0 || q) && (
              <div className="flex flex-wrap items-center gap-1.5">
                {q && (
                  <Tag tone="cinnabar" size="sm">
                    「{q}」
                    <button type="button" onClick={() => setQ('')} aria-label="移除搜索">
                      <X size={10} />
                    </button>
                  </Tag>
                )}
                {facets.categories.map((v) => (
                  <Tag key={`c-${v}`} size="sm">
                    {v}
                    <button type="button" onClick={() => toggleFacet('categories', v)} aria-label="移除">
                      <X size={10} />
                    </button>
                  </Tag>
                ))}
                {facets.grades.map((v) => (
                  <Tag key={`g-${v}`} size="sm">
                    {GRADE_SHORT[v]}
                    <button type="button" onClick={() => toggleFacet('grades', v)} aria-label="移除">
                      <X size={10} />
                    </button>
                  </Tag>
                ))}
                {facets.themes.map((v) => (
                  <Tag key={`t-${v}`} size="sm">
                    {v}
                    <button type="button" onClick={() => toggleFacet('themes', v)} aria-label="移除">
                      <X size={10} />
                    </button>
                  </Tag>
                ))}
                {facets.regions.map((v) => (
                  <Tag key={`r-${v}`} size="sm">
                    {v}
                    <button type="button" onClick={() => toggleFacet('regions', v)} aria-label="移除">
                      <X size={10} />
                    </button>
                  </Tag>
                ))}
              </div>
            )}
          </div>

          {list.length === 0 ? (
            <EmptyState
              title="没有匹配的资源"
              desc={
                subject !== 'all' && kind === 'card'
                  ? `「${SUBJECT_LABEL[subject]}」没有可迁移的知识点卡。这可能是真实情况——这门课按自己的主线备课即可。`
                  : '试试减少筛选条件，或换一个更宽泛的关键词。'
              }
              action={
                <Button variant="outline" onClick={resetAll}>
                  清空所有条件
                </Button>
              }
            />
          ) : group === 'chapter' ? (
            <div className="space-y-7">
              {chapterSections.map((sec) => (
                <section key={sec.chapter.id}>
                  <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-line-2 pb-1.5">
                    <span className="tnum font-serif text-[15px] font-semibold text-ink">
                      {String(sec.chapter.order).padStart(2, '0')}
                    </span>
                    <h2 className="font-serif text-[14px] font-semibold tracking-tight text-ink">
                      {sec.chapter.title}
                    </h2>
                    <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-4">
                      {sec.chapter.brief}
                    </span>
                    <span className="tnum shrink-0 text-[10.5px] text-ink-4">{sec.items.length}</span>
                  </div>

                  <div className="space-y-4">
                    {sec.byPoint.map((g) => (
                      <div key={g.key}>
                        <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="h-2.5 w-[2px] shrink-0 rounded-xs bg-indigo/50" />
                          <h3 className="text-[12px] font-medium text-ink-2">{g.title}</h3>
                          <span className="min-w-0 flex-1 truncate text-[10px] text-ink-4">{g.sub}</span>
                          <span className="tnum shrink-0 text-[10px] text-ink-4">{g.items.length}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                          {g.items.map((r, i) => (
                            <div
                              key={`${g.key}-${r.key}`}
                              className="animate-rise"
                              style={{ animationDelay: `${Math.min(i, 8) * 22}ms` }}
                            >
                              <ResourceCard item={r} {...favoriteProps(r)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {flatGroups.map((g) => (
                <section key={g.key}>
                  {g.title && (
                    <div className="mb-2 flex flex-wrap items-baseline gap-2 border-b border-line-2 pb-1.5">
                      <h2 className="font-serif text-[13.5px] font-semibold tracking-tight text-ink">
                        {g.title}
                      </h2>
                      {g.sub && (
                        <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-4">
                          {g.sub}
                        </span>
                      )}
                      <span className="tnum shrink-0 text-[10.5px] text-ink-4">{g.items.length}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {g.items.map((r, i) => (
                      <div
                        key={`${g.key}-${r.key}`}
                        className="animate-rise"
                        style={{ animationDelay: `${Math.min(i, 8) * 22}ms` }}
                      >
                        <ResourceCard item={r} {...favoriteProps(r)} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="细项筛选"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" block onClick={resetAll}>
              清空
            </Button>
            <Button variant="primary" block onClick={() => setDrawerOpen(false)}>
              看 {list.length} 条结果
            </Button>
          </div>
        }
      >
        <div className="p-4">{filterPanel}</div>
      </Drawer>

      {/* 口径说明 */}
      <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line-2 bg-paper-2/50 p-3.5">
        <Layers size={13} className="mt-0.5 shrink-0 text-ink-4" />
        <p className="text-[11px] leading-[1.75] text-ink-3">
          <span className="font-medium text-ink-2">关于分类：</span>
          资源只有三类——知识点卡、教学素材、课例；教学素材内部不再分「民俗条目」与「素材」，
          只用形态标签说明打开后是什么。章节归属由知识点反推，不手工标注；
          一条素材若挂了两章的知识点（如同时服务第 7 章与第 10 章），会在两章下都出现，
          顶部总数按条目去重，与各章条目数之和不相等，这是正常的。
        </p>
      </div>
    </div>
  )
}

/* ── 小组件 ───────────────────────────────────── */

function SubjectChip({
  active,
  onClick,
  label,
  count,
  assist,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  assist?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex shrink-0 items-center gap-1 rounded-sm border px-2.5 py-1.5 text-[11.5px] transition-colors',
        active
          ? assist
            ? 'border-indigo bg-indigo text-white'
            : 'border-cinnabar bg-cinnabar text-white'
          : assist
            ? 'border-dashed border-indigo-l bg-indigo-p/40 text-indigo hover:border-indigo/50'
            : 'border-line bg-card text-ink-2 hover:border-ink-4/60',
      )}
    >
      {label}
      <span className={clsx('tnum text-[10px]', active ? 'text-white/75' : 'text-ink-4')}>{count}</span>
    </button>
  )
}

function ChapterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'shrink-0 whitespace-nowrap rounded-sm border px-2 py-1 text-[11px] transition-colors',
        active
          ? 'border-ink bg-ink text-white'
          : 'border-line bg-card text-ink-2 hover:border-ink-4/60',
      )}
    >
      {label}
    </button>
  )
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { value: string; label: string; tone?: string }[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium tracking-wide text-ink-3">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.includes(o.value)
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onToggle(o.value)}
              className={clsx(
                'h-6.5 rounded-sm border px-2 text-[11.5px] transition-colors',
                active
                  ? 'border-cinnabar bg-cinnabar text-white'
                  : 'border-line bg-card text-ink-2 hover:border-ink-4',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
