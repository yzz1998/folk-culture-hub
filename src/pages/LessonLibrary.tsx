import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { Bookmark, ChevronRight, Clock, FileText, Sparkles } from 'lucide-react'
import { ALL_LESSONS, folkLinkOf } from '@/data/lessons'
import { FOLK_MAP } from '@/data/folk'
import { POINT_MAP } from '@/data/curriculum'
import { CURRICULUM } from '@/data/curriculum'
import { chapterTitleOf } from '@/lib/catalog'
import type { FolkLink, GradeBand, Subject } from '@/lib/types'
import {
  ALL_SUBJECTS,
  GRADE_BANDS,
  GRADE_SHORT,
  HOST_SUBJECT,
  SUBJECTS,
  SUBJECT_LABEL,
  durationLabel,
} from '@/lib/types'
import { searchLessons } from '@/lib/search'
import { Button, Card, EmptyState, SearchInput, Segmented, Tag, CATEGORY_TONE } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { useApp, useToast } from '@/store/AppStore'

/* ═══════════════════════════════════════════════════════════════
   教案库

   学科是第一层，章节是第二层。38 份课例里 24 份借用课程知识点（含第 7 章民俗材料）、
   14 份是学科本体课例——后者在 v1 方案里被误判为「不挂章节所以移出」，
   但站在迁移落点的立场上，数学分数、英语 Colours、信息科技循环
   恰恰是这些学科自己的主线课例，必须留在主库。

   两者同列，只用徽标区分来路，不分主次。
   ═══════════════════════════════════════════════════════════════ */

const LINK_TONE = {
  core: 'cinnabar',
  support: 'ochre',
  none: 'neutral',
} as const

const LINK_LABEL: Record<FolkLink, string> = {
  core: '课程内容本体',
  support: '课程内容作情境',
  none: '学科本体',
}

export default function LessonLibrary() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [grade, setGrade] = useState<GradeBand | 'all'>('all')
  const [link, setLink] = useState<FolkLink | 'all'>('all')
  const subject: Subject | 'all' = ALL_SUBJECTS.includes(params.get('subject') as Subject)
    ? (params.get('subject') as Subject)
    : 'all'
  const chapter = params.get('chapter') ?? 'all'
  const { isFavorite, toggleFavorite } = useApp()
  const { toast } = useToast()

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    let list = searchLessons(ALL_LESSONS, q)
    if (subject !== 'all') list = list.filter((l) => l.subject === subject)
    if (grade !== 'all') list = list.filter((l) => l.gradeBand === grade)
    if (link !== 'all') list = list.filter((l) => folkLinkOf(l) === link)
    if (chapter !== 'all') list = list.filter((l) => l.chapterId === chapter)
    return list
  }, [q, grade, subject, link, chapter])

  const fusionCount = ALL_LESSONS.filter((l) => folkLinkOf(l) !== 'none').length
  const standaloneCount = ALL_LESSONS.length - fusionCount

  /** 按学科分组：学科是落点，分组顺序与「教学应用」一致 */
  const groups = useMemo(() => {
    return [...SUBJECTS, HOST_SUBJECT]
      .map((s) => ({ subject: s, items: results.filter((l) => l.subject === s) }))
      .filter((g) => g.items.length > 0)
  }, [results])

  const chapterCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of ALL_LESSONS) {
      if (!l.chapterId) continue
      m.set(l.chapterId, (m.get(l.chapterId) ?? 0) + 1)
    }
    return m
  }, [])

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="教案库"
        title={`${ALL_LESSONS.length} 份课例，看别人怎么迁移`}
        desc={`其中 ${fusionCount} 份借用了《人类与社会》的知识点，${standaloneCount} 份完全按学科自身主线编写。两类同列，只用徽标区分来路——学科本体课例同样是本科的主线课例，不会因为不挂课程知识点而被降级。`}
        right={
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="搜标题、活动、目标…"
            className="w-full sm:w-60"
          />
        }
      />

      {/* ① 学科主筛 */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-baseline gap-1.5">
          <span className="text-[11px] font-medium tracking-wide text-ink-3">按学科</span>
          <span className="text-[10px] text-ink-4">主轴</span>
        </div>
        <Segmented
          size="sm"
          wrap
          value={subject}
          onChange={(v) => setParam('subject', v)}
          options={[
            { value: 'all' as const, label: '全部学科', count: ALL_LESSONS.length },
            ...[...SUBJECTS, HOST_SUBJECT].map((s) => ({
              value: s,
              label: SUBJECT_LABEL[s],
              count: ALL_LESSONS.filter((l) => l.subject === s).length,
            })),
          ]}
        />
      </div>

      {/* ② 章节与来路 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="no-scrollbar -mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1">
          <ChapterChip active={chapter === 'all'} onClick={() => setParam('chapter', 'all')} label="全部章节" />
          {CURRICULUM.filter((ch) => (chapterCounts.get(ch.id) ?? 0) > 0).map((ch) => (
            <ChapterChip
              key={ch.id}
              active={chapter === ch.id}
              onClick={() => setParam('chapter', ch.id)}
              label={`${String(ch.order).padStart(2, '0')} ${ch.title}`}
            />
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented
          size="sm"
          value={link}
          onChange={setLink}
          options={[
            { value: 'all' as const, label: '全部来路' },
            { value: 'core' as const, label: '素材本体' },
            { value: 'support' as const, label: '素材作情境' },
            { value: 'none' as const, label: '学科本体', count: standaloneCount },
          ]}
        />
        <Segmented
          size="sm"
          value={grade}
          onChange={setGrade}
          options={[
            { value: 'all' as const, label: '全部年级' },
            ...GRADE_BANDS.map((g) => ({ value: g, label: GRADE_SHORT[g] })),
          ]}
        />
        <span className="ml-auto text-[11.5px] text-ink-3">
          共 <span className="tnum font-medium text-ink">{results.length}</span> 份
        </span>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title={
            subject !== 'all' ? `「${SUBJECT_LABEL[subject]}」暂无匹配课例` : '没有匹配的教案'
          }
          desc={
            subject !== 'all'
              ? '本科的现成课例可能不覆盖这个年级或章节。可以直接用本科主线生成一份，不必绕着辅助素材找。'
              : '换个关键词，或者放宽年级与学科。也可以直接去智能工坊现做一份。'
          }
          action={
            <Link to={subject !== 'all' ? `/agent?subject=${encodeURIComponent(subject)}` : '/agent'}>
              <Button variant="primary">
                <Sparkles size={14} />
                {subject !== 'all' ? `用${SUBJECT_LABEL[subject]}生成` : '去智能工坊生成'}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.subject}>
              <div className="mb-2 flex flex-wrap items-baseline gap-2 border-b border-line-2 pb-1.5">
                <h2 className="font-serif text-[13.5px] font-semibold tracking-tight text-ink">
                  {SUBJECT_LABEL[g.subject]}
                </h2>
                <span className="text-[10.5px] text-ink-4">
                  {g.items.filter((l) => folkLinkOf(l) === 'none').length} 份学科本体 ·{' '}
                  {g.items.filter((l) => folkLinkOf(l) !== 'none').length} 份借用素材
                </span>
                <span className="tnum ml-auto text-[10.5px] text-ink-4">{g.items.length}</span>
              </div>

              <div className="space-y-2.5">
                {g.items.map((l, i) => {
                  const folk = l.folkIds.map((id) => FOLK_MAP.get(id)).filter(Boolean)
                  const points = l.pointIds
                    .map((id) => POINT_MAP.get(id))
                    .filter((p): p is NonNullable<typeof p> => Boolean(p))
                  const fav = isFavorite('lesson', l.id)
                  const fl = folkLinkOf(l)
                  return (
                    <div
                      key={l.id}
                      className="animate-rise"
                      style={{ animationDelay: `${Math.min(i, 8) * 22}ms` }}
                    >
                      <Card hover className="group relative p-4">
                        <div className="flex items-start gap-3.5">
                          <div className="mt-0.5 hidden shrink-0 sm:block">
                            <div className="grid h-10 w-10 place-items-center rounded-sm border border-line-2 bg-paper-2">
                              <FileText size={16} className="text-ink-3" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <Link to={`/lessons/${l.id}`} className="block">
                              <h3 className="font-serif text-[15px] font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-cinnabar-h">
                                {l.title}
                              </h3>
                            </Link>

                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink-3">
                              <span className="tnum">{GRADE_SHORT[l.gradeBand]}</span>
                              <span className="text-line">·</span>
                              <span>{SUBJECT_LABEL[l.subject]}</span>
                              <span className="text-line">·</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock size={11} />
                                {durationLabel(l.duration)}
                              </span>
                              {l.chapterId && (
                                <>
                                  <span className="text-line">·</span>
                                  <Link
                                    to={`/lessons?chapter=${l.chapterId}`}
                                    className="text-ink-4 hover:text-cinnabar"
                                  >
                                    {chapterTitleOf(l.chapterId)}
                                  </Link>
                                </>
                              )}
                            </div>

                            <p className="mt-2 clamp-2 text-[12.5px] leading-[1.75] text-ink-2">
                              {l.objectives.knowledge}
                            </p>

                            <div className="mt-2.5 flex flex-wrap gap-1">
                              <Tag tone={LINK_TONE[fl]} size="sm">
                                {LINK_LABEL[fl]}
                              </Tag>
                              {folk.map((f) => (
                                <Tag key={f!.id} tone={CATEGORY_TONE[f!.category]} size="sm">
                                  {f!.name}
                                </Tag>
                              ))}
                              {points.slice(0, 2).map((p) => (
                                <Link key={p.id} to={`/resources/card/kc-${p.id}`}>
                                  <Tag tone="indigo" size="sm">
                                    辅助 · {p.title}
                                  </Tag>
                                </Link>
                              ))}
                              {points.length > 2 && (
                                <span className="self-center text-[10.5px] text-ink-4">
                                  +{points.length - 2}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              toggleFavorite('lesson', l.id)
                              toast(fav ? '已取消收藏' : '已收藏教案')
                            }}
                            aria-label={fav ? '取消收藏' : '收藏'}
                            className={
                              'shrink-0 rounded-sm border p-1.5 transition-colors ' +
                              (fav
                                ? 'border-cinnabar bg-cinnabar text-white'
                                : 'border-line text-ink-4 hover:border-ink-4 hover:text-cinnabar')
                            }
                          >
                            <Bookmark size={13} fill={fav ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line-2 bg-paper-2/50 p-3.5">
        <ChevronRight size={13} className="mt-0.5 shrink-0 text-ink-4" />
        <p className="text-[11px] leading-[1.75] text-ink-3">
          <span className="font-medium text-ink-2">关于「学科本体」：</span>
          这类课例不借用《人类与社会》的任何知识点，按本科教材顺序编写。它们不是"未完成融合"的半成品，
          而是各学科自己的主线课例——数学的分数、英语的 Colours、信息科技的循环结构都在这一列。
        </p>
      </div>
    </div>
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
