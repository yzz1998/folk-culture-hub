import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Compass, Info, Sparkles, Wand2 } from 'lucide-react'
import clsx from 'clsx'
import type { ChapterId, GradeBand, Subject } from '@/lib/types'
import { GRADE_SHORT, SUBJECT_LABEL } from '@/lib/types'
import { CHAPTER_INDEX, COURSE_INDEX, COURSE_SCALE, PRIMARY_SUBJECT_INDEX } from '@/lib/catalog'
import { ALL_POINTS } from '@/data/curriculum'
import { linksOfPoint } from '@/data/subjectPoints'
import { aiConfigured, AiError } from '@/lib/agent/llm'
import { analyzePoint } from '@/lib/agent/analyze'
import { Card, Segmented, SearchInput, Tag } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { PointApplyCard, analysisKey, type AnalysisState } from '@/components/apply/PointApplyCard'
import { useApp } from '@/store/AppStore'

/* ═══════════════════════════════════════════════════════════════
   教学应用

   主体是课程：按《人类与社会》的章节列出知识点，一张卡一个知识点。
   每张卡上半是事实（这个点已登记能落到哪些课堂），
   下半按需展开 AI 分析（它具体怎么进我的课堂）。

   为什么不再以学科卡为主：教师来这里的问题不是「这门学科要什么」，
   而是「我学的这个点，能怎么用」。所以章节在前，学科是筛选与定向条件。
   ═══════════════════════════════════════════════════════════════ */

const GRADES: GradeBand[] = ['1-2', '3-4', '5-6']

export default function Apply() {
  const { settings } = useApp()
  const [params, setParams] = useSearchParams()

  const subjectParam = params.get('subject')
  const mySubject: Subject | null = PRIMARY_SUBJECT_INDEX.some((s) => s.subject === subjectParam)
    ? (subjectParam as Subject)
    : null
  const chapterParam = params.get('chapter')
  const chapter: ChapterId | 'all' = CHAPTER_INDEX.some((c) => c.chapter.id === chapterParam)
    ? (chapterParam as ChapterId)
    : 'all'

  const [q, setQ] = useState('')
  /** 默认关闭：选定学科只影响「分析对象」，不把没登记落点的知识点藏起来 */
  const [onlyLinked, setOnlyLinked] = useState(false)
  const [grade, setGrade] = useState<GradeBand>('3-4')
  const [analyses, setAnalyses] = useState<Record<string, AnalysisState>>({})
  const inflight = useRef(new Set<string>())
  const ready = aiConfigured(settings)

  /* 学段变了，旧的分析结果就不再对应当前课堂，整体作废；
     学科变了不清缓存——每张卡自己选定分析对象，切回来还能直接看上次结果 */
  useEffect(() => {
    setAnalyses({})
    inflight.current.clear()
  }, [grade])

  function setParam(k: 'subject' | 'chapter', v: string) {
    const next = new URLSearchParams(params)
    if (v === 'all') next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  const linkedCount = useMemo(() => {
    if (!mySubject) return ALL_POINTS.length
    return ALL_POINTS.filter((p) => linksOfPoint(p.id).some((l) => l.subject === mySubject)).length
  }, [mySubject])

  const points = useMemo(() => {
    const t = q.trim().toLowerCase()
    return ALL_POINTS.filter((p) => {
      if (chapter !== 'all' && p.chapterId !== chapter) return false
      if (onlyLinked) {
        const ls = linksOfPoint(p.id)
        if (mySubject) {
          if (!ls.some((l) => l.subject === mySubject)) return false
        } else if (ls.length === 0) return false
      }
      if (!t) return true
      return (
        p.title.toLowerCase().includes(t) ||
        p.summary.toLowerCase().includes(t) ||
        p.chapterTitle.toLowerCase().includes(t) ||
        linksOfPoint(p.id).some((l) => l.why.toLowerCase().includes(t))
      )
    })
  }, [q, chapter, mySubject, onlyLinked])

  const groups = useMemo(() => {
    return CHAPTER_INDEX.map((c) => ({
      chapter: c.chapter,
      points: points.filter((p) => p.chapterId === c.chapter.id),
    })).filter((g) => g.points.length > 0)
  }, [points])

  /**
   * 跑一次单点分析。
   * subject 是这张卡自己选的分析对象（null = 不限学科），与页面筛选无关。
   * 同一「知识点 × 学科」已有结果时直接复用，force 才重取。
   */
  async function runAnalysis(pointId: string, subject: Subject | null, force = false) {
    const key = analysisKey(pointId, subject)
    if (inflight.current.has(key)) return
    const cached = analyses[key]
    if (!force && cached && cached.status !== 'error') return

    if (!ready) {
      setAnalyses((s) => ({
        ...s,
        [key]: {
          status: 'error',
          hint: 'config',
          message: '尚未配置 AI 服务，暂时无法分析。',
          at: Date.now(),
        },
      }))
      return
    }

    inflight.current.add(key)
    setAnalyses((s) => ({ ...s, [key]: { status: 'loading' } }))
    try {
      const data = await analyzePoint(pointId, settings, { subject, gradeBand: grade })
      setAnalyses((s) => ({ ...s, [key]: { status: 'done', data, at: Date.now() } }))
    } catch (e) {
      const kind = e instanceof AiError ? e.kind : 'other'
      setAnalyses((s) => ({
        ...s,
        [key]: {
          status: 'error',
          hint: kind === 'config' ? 'config' : 'other',
          message: e instanceof Error ? e.message : '分析失败，请重试',
          at: Date.now(),
        },
      }))
    } finally {
      inflight.current.delete(key)
    }
  }

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="教学应用"
        title="课程里的知识点，怎么进你的课堂"
        desc="按章节列出《人类与社会》的全部知识点。每张卡先告诉你它已登记能落到哪些课堂，再让 AI 写出具体怎么用——分析对象每张卡自己选，不限于已登记的那几门。"
      />

      {/* ══ 使用说明 + 我的课堂 ══ */}
      <Card className="mb-4 overflow-hidden">
        <div className="grid gap-px bg-line-2 lg:grid-cols-[1fr_300px]">
          <div className="bg-card px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
              <Info size={13} className="text-cinnabar" />
              这一页怎么用
            </div>
            <ol className="mt-1.5 space-y-1 text-[11.5px] leading-[1.75] text-ink-2">
              <li>
                <span className="font-medium text-ink">① 先找知识点</span>
                ——按章节翻，或直接搜“村落”“节气”“工匠”。
              </li>
              <li>
                <span className="font-medium text-ink">② 看已有落点</span>
                ——卡片上那几枚标签是平台已登记的事实，不是 AI 猜的。
              </li>
              <li>
                <span className="font-medium text-ink">③ 选分析对象，点「AI 分析」</span>
                ——先挑学科、再点按钮才开始；换学科不会自动重跑。展开后写清能落到哪个教学内容、
                分几步做、哪里容易上歪。
              </li>
            </ol>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-ink-4">
              <span>
                全书 {COURSE_SCALE.chapters} 章 / {COURSE_SCALE.units} 单元 /{' '}
                <span className="tnum font-medium text-ink-2">{COURSE_SCALE.points}</span> 个知识点
              </span>
              <span className="text-line">·</span>
              <span>
                已登记落点 <span className="tnum font-medium text-ink-2">{COURSE_SCALE.applies}</span> 条
              </span>
              <Link
                to="/curriculum"
                className="inline-flex items-center gap-0.5 text-cinnabar hover:text-cinnabar-h"
              >
                课程脉络 <ArrowRight size={10} />
              </Link>
            </div>
          </div>

          <div className="bg-card px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
              <Wand2 size={13} className="text-indigo" />
              我的课堂
              <span className="text-[10px] font-normal text-ink-4">筛选 + 默认分析对象</span>
            </div>

            <div className="mt-2">
              <div className="mb-1 text-[10px] tracking-wide text-ink-4">我教的学科</div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setParam('subject', 'all')}
                  className={clsx(
                    'shrink-0 rounded-sm border px-2 py-1 text-[11px] transition-colors',
                    !mySubject
                      ? 'border-ink-4/60 bg-paper-3 text-ink'
                      : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
                  )}
                >
                  不限
                </button>
                {PRIMARY_SUBJECT_INDEX.map((s) => {
                  const on = mySubject === s.subject
                  return (
                    <button
                      key={s.subject}
                      type="button"
                      onClick={() => setParam('subject', s.subject)}
                      className={clsx(
                        'shrink-0 rounded-sm border px-2 py-1 text-[11px] transition-colors',
                        on
                          ? 'border-cinnabar bg-cinnabar text-white'
                          : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
                      )}
                    >
                      {SUBJECT_LABEL[s.subject]}
                      <span className={clsx('tnum ml-1 text-[9.5px]', on ? 'text-white/70' : 'text-ink-4')}>
                        {s.counts.points}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-2">
              <div className="mb-1 text-[10px] tracking-wide text-ink-4">任教学段</div>
              <Segmented
                size="sm"
                value={grade}
                onChange={(v) => setGrade(v as GradeBand)}
                options={GRADES.map((g) => ({ value: g, label: GRADE_SHORT[g] }))}
              />
            </div>

            <p className="mt-2 text-[10px] leading-[1.7] text-ink-4">
              {mySubject
                ? `卡片默认分析「${SUBJECT_LABEL[mySubject]}」，可随时在卡内换成别的学科；该学科已登记 ${linkedCount} 个落点。`
                : `共 ${COURSE_SCALE.points} 个知识点，卡片默认让 AI 自选分析对象。`}
              {!ready && (
                <span className="mt-1 block text-ochre">
                  AI 未配置，<Link to="/settings" className="underline">去设置</Link> 后才能分析。
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* ══ 筛选 ══ */}
      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="搜知识点、章名或落点说明…"
            size="sm"
            className="w-full sm:w-72"
          />
          <span className="text-[11px] text-ink-4">
            {points.length} 个知识点
            {onlyLinked && <span className="text-ink-3">（只看已有落点）</span>}
          </span>
          <button
            type="button"
            onClick={() => setOnlyLinked((v) => !v)}
            className={clsx(
              'inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[10.5px] transition-colors',
              onlyLinked
                ? 'border-cinnabar bg-cinnabar-p text-cinnabar'
                : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
            )}
          >
            {onlyLinked && <Check size={10} />}
            只看已有落点
          </button>
          {(q || mySubject || onlyLinked) && (
            <button
              type="button"
              onClick={() => {
                setQ('')
                setOnlyLinked(false)
                setParam('subject', 'all')
              }}
              className="text-[11px] text-cinnabar hover:text-cinnabar-h"
            >
              清除筛选
            </button>
          )}
        </div>

        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <ChapterChip
            active={chapter === 'all'}
            onClick={() => setParam('chapter', 'all')}
            label="全部章节"
            count={COURSE_SCALE.chapters}
          />
          {CHAPTER_INDEX.map((c) => (
            <ChapterChip
              key={c.chapter.id}
              active={chapter === c.chapter.id}
              onClick={() => setParam('chapter', c.chapter.id)}
              label={`${String(c.chapter.order).padStart(2, '0')} ${c.chapter.title}`}
              count={c.counts.points}
            />
          ))}
        </div>
      </div>

      {/* ══ 知识点列表 ══ */}
      {groups.length === 0 ? (
        <Card className="px-4 py-10 text-center">
          <p className="text-[12.5px] text-ink-2">没有匹配的知识点</p>
          <p className="mt-1 text-[11.5px] text-ink-4">
            {onlyLinked ? '关掉「只看已有落点」，其它知识点照样可以让 AI 分析。' : '换个关键词试试。'}
          </p>
          <button
            type="button"
            onClick={() => {
              setQ('')
              setOnlyLinked(false)
              setParam('subject', 'all')
              setParam('chapter', 'all')
            }}
            className="mt-3 text-[11.5px] text-cinnabar hover:text-cinnabar-h"
          >
            重置全部筛选
          </button>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.chapter.id}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="tnum font-serif text-[15px] font-semibold text-ink">
                  {String(g.chapter.order).padStart(2, '0')}
                </span>
                <h2 className="font-serif text-[14px] font-semibold tracking-tight text-ink">
                  {g.chapter.title}
                </h2>
                <span className="text-[10.5px] text-ink-4">
                  {g.points.length} 个知识点
                  {mySubject ? '（本科可接）' : ''}
                </span>
                <span className="ml-auto text-[10.5px] text-ink-4">{g.chapter.brief}</span>
              </div>

              <div className="grid items-start gap-2.5 xl:grid-cols-2">
                {g.points.map((p) => (
                  <PointApplyCard
                    key={p.id}
                    point={p}
                    links={linksOfPoint(p.id)}
                    focusSubject={mySubject}
                    analyses={analyses}
                    onAnalyze={(subject, force) => runAnalysis(p.id, subject, force)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ══ 课程本体指引 ══ */}
      <section className="mt-6">
        <Card className="border-dashed p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-[62ch]">
              <div className="flex flex-wrap items-center gap-1.5">
                <Compass size={13} className="text-ink-4" />
                <h3 className="font-serif text-[14px] font-semibold tracking-tight">
                  《人类与社会》课程
                </h3>
                <Tag tone="indigo" size="sm">
                  主体课程
                </Tag>
              </div>
              <p className="mt-1.5 text-[12px] leading-[1.75] text-ink-2">
                上面列的知识点全部来自这门课。每个知识点配一张知识卡（要点 / 概念 / 误区 / 追问），
                并登记了「能落到哪门学科的哪个教学内容」。素材按章节归位，图文条目与图片、音视频同属教学素材。
              </p>
              {COURSE_INDEX && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-3">
                  <span>
                    知识点卡 <span className="tnum font-medium text-ink">{COURSE_INDEX.counts.points}</span> 张
                  </span>
                  <span className="text-line">·</span>
                  <span>
                    教学素材{' '}
                    <span className="tnum font-medium text-ink">
                      {COURSE_INDEX.counts.folk + COURSE_INDEX.counts.materials}
                    </span>{' '}
                    条
                    <span className="text-ink-4">
                      （图文 {COURSE_INDEX.counts.folk} · 媒体 {COURSE_INDEX.counts.materials}）
                    </span>
                  </span>
                  <span className="text-line">·</span>
                  <span>
                    迁移课例 <span className="tnum font-medium text-ink">{COURSE_SCALE.lessons}</span> 份
                  </span>
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <Link
                to="/curriculum"
                className="inline-flex items-center gap-1 rounded-sm border border-line bg-card px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-4/60 hover:text-ink"
              >
                <Compass size={12} />
                课程脉络
              </Link>
              <Link
                to="/agent"
                className="inline-flex items-center gap-1 rounded-sm border border-line bg-card px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-ink-4/60 hover:text-ink"
              >
                <Sparkles size={12} />
                去备课工坊
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

function ChapterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex shrink-0 items-center gap-1 rounded-sm border px-2 py-1 text-[11px] transition-colors',
        active
          ? 'border-ink bg-ink text-white'
          : 'border-line bg-card text-ink-3 hover:border-ink-4/50 hover:text-ink-2',
      )}
    >
      {label}
      <span className={clsx('tnum text-[9.5px]', active ? 'text-white/65' : 'text-ink-4')}>{count}</span>
    </button>
  )
}
