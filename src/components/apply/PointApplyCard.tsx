import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Loader2,
  RefreshCw,
  Settings,
  Sparkles,
  TriangleAlert,
  Wand2,
} from 'lucide-react'
import type { PointAnalysis, Subject, SubjectPointLink } from '@/lib/types'
import { POINT_USE_LABEL, SUBJECTS, SUBJECT_LABEL } from '@/lib/types'
import type { PointWithContext } from '@/data/curriculum'
import { cardOfPoint } from '@/data/knowledgeCards'
import { Card, Tag } from '@/components/ui'

/* ═══════════════════════════════════════════════════════════════
   知识点卡 · 卡内 AI 分析

   一张卡回答两件事：这个知识点已经能落到哪些课堂（平台登记的事实），
   以及——点开「AI 分析」后——它具体怎么进我的课堂（模型据此展开）。

   分析对象是每张卡自己选的，不跟着页面筛选走：
   平台登记的落点只是「常见用法」，不是允许清单。英语老师想看看
   某个知识点能不能用进自己的课，不该因为登记表里没写就被挡住。

   展开与收起：
   - 点学科 chip **只改分析对象，不发请求**——挑学科是零成本的，不该顺便烧一次调用。
   - 唯一会真正发起请求的是「AI 分析」/「开始分析」按钮。
   - 已分析过的学科再切回来，直接显示缓存结果，不重复请求。
   - 未分析过的学科切过去，结果区显示「待分析」占位，点按钮才开始。
   - 收起不清缓存，再点开直接显示上次结果；要新的点「重新分析」。
   - 每张卡独立，开一张不会挤掉另一张，方便横向比较。
   ═══════════════════════════════════════════════════════════════ */

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; data: PointAnalysis; at: number }
  | { status: 'error'; message: string; hint: 'config' | 'other'; at: number }

/** 缓存键：一个知识点 × 一个分析对象（null 表示不限学科） */
export function analysisKey(pointId: string, subject: Subject | null): string {
  return `${pointId}|${subject ?? ''}`
}

const SKELETON = ['读取知识卡', '对齐已登记落点', '写课堂用法']

export function PointApplyCard({
  point,
  links,
  focusSubject,
  analyses,
  onAnalyze,
}: {
  point: PointWithContext
  links: SubjectPointLink[]
  /** 页面级「我的学科」：作为默认分析对象，也用于高亮 */
  focusSubject: Subject | null
  analyses: Record<string, AnalysisState>
  onAnalyze: (subject: Subject | null, force?: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<Subject | null>(
    () => focusSubject ?? links[0]?.subject ?? null,
  )
  const card = cardOfPoint(point.id)

  const analysis: AnalysisState = analyses[analysisKey(point.id, target)] ?? { status: 'idle' }
  const focused = target ? links.find((l) => l.subject === target) : undefined
  const registered = Boolean(focused)

  /* 页面切换「我的学科」时，卡片跟随；页面清空则保持卡片自己的选择。
     这里只同步选择，不触发请求——要不要分析由教师自己决定。 */
  useEffect(() => {
    if (focusSubject) setTarget(focusSubject)
  }, [focusSubject])

  /** 展开结果区，但不发请求。用于「先看看有哪些学科可选」。 */
  function handleExpand() {
    setOpen(true)
  }

  /** 唯一会真正发起分析的动作。 */
  function startAnalyze() {
    setOpen(true)
    onAnalyze(target)
  }

  /** 只改分析对象，不自动重跑；该学科已有缓存则直接显示上次结果。 */
  function pickSubject(s: Subject | null) {
    if (s === target) return
    setTarget(s)
  }

  return (
    <Card className={clsx('overflow-hidden transition-colors', open && 'border-indigo-l')}>
      <div className="p-3.5">
        {/* 标题区 */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-ink-4">
              <span className="tnum">
                {point.chapterId.replace('ch', '').padStart(2, '0')}
              </span>
              <span className="text-line">·</span>
              <span className="truncate">{point.chapterTitle}</span>
              <span className="text-line">/</span>
              <span className="truncate">{point.unitTitle}</span>
            </div>
            <h3 className="mt-1 font-serif text-[14.5px] font-semibold leading-snug tracking-tight text-ink">
              {point.title}
            </h3>
            <p className="mt-1 text-[11.5px] leading-[1.7] text-ink-3">{point.summary}</p>
          </div>

          <button
            type="button"
            onClick={() => (open ? setOpen(false) : startAnalyze())}
            aria-expanded={open}
            className={clsx(
              'inline-flex shrink-0 items-center gap-1 rounded-sm border px-2 py-1.5 text-[11px] font-medium transition-colors',
              open
                ? 'border-line bg-card text-ink-3 hover:text-ink'
                : 'border-indigo-l bg-indigo-p text-indigo hover:border-indigo/40',
            )}
          >
            {open ? (
              <>
                收起
                <ChevronDown size={11} className="rotate-180" />
              </>
            ) : (
              <>
                <Sparkles size={11} />
                AI 分析
              </>
            )}
          </button>
        </div>

        {/* 已登记的落点：事实层，不依赖 AI */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1">
          {links.length === 0 ? (
            <span className="rounded-xs border border-dashed border-line px-1.5 py-[2px] text-[10px] text-ink-4">
              暂无登记落点 · 可选任意学科让 AI 现找
            </span>
          ) : (
            <>
              <span className="mr-0.5 text-[10px] text-ink-4">已登记落点</span>
              {links.slice(0, 4).map((l) => (
                <Tag
                  key={`${l.subject}-${l.pointId}`}
                  size="sm"
                  tone={l.subject === target ? 'cinnabar' : 'neutral'}
                >
                  {SUBJECT_LABEL[l.subject]} · {POINT_USE_LABEL[l.use]}
                </Tag>
              ))}
              {links.length > 4 && (
                <span className="text-[10px] text-ink-4">+{links.length - 4}</span>
              )}
            </>
          )}
          {card && (
            <Link
              to={`/resources/card/kc-${point.id}`}
              className="ml-auto inline-flex items-center gap-0.5 text-[10.5px] text-ink-4 transition-colors hover:text-cinnabar"
            >
              <BookOpen size={10} />
              知识卡
            </Link>
          )}
        </div>

        {/* 分析对象：每张卡自己定，不受登记表限制。
            收起时只占一行，展开后才铺开全部学科，避免列表被十余枚 chip 撑满 */}
        {open ? (
          <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-line-2 pt-2">
            <span className="mr-0.5 shrink-0 text-[10px] text-ink-4">分析对象</span>
            <SubjectChip active={target === null} onClick={() => pickSubject(null)} label="不限" />
            {SUBJECTS.map((s) => (
              <SubjectChip
                key={s}
                active={target === s}
                registered={links.some((l) => l.subject === s)}
                onClick={() => pickSubject(s)}
                label={SUBJECT_LABEL[s]}
              />
            ))}
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-1.5 border-t border-line-2 pt-2">
            <span className="shrink-0 text-[10px] text-ink-4">分析对象</span>
            <button
              type="button"
              onClick={handleExpand}
              className="inline-flex items-center gap-0.5 rounded-sm border border-line bg-card px-1.5 py-[2px] text-[10px] text-ink-2 transition-colors hover:border-cinnabar/50 hover:text-cinnabar"
            >
              {target ? SUBJECT_LABEL[target] : '不限'}
              <ChevronDown size={9} />
            </button>
            <span className="text-[9.5px] text-ink-4">可换任意学科</span>
          </div>
        )}

        {/* 该学科的一句说明，帮助教师确认「为什么是这门课」 */}
        {focused && (
          <p className="mt-2 rounded-sm border-l-2 border-cinnabar/40 bg-cinnabar-p/40 px-2 py-1 text-[10.5px] leading-[1.7] text-ink-2">
            <span className="font-medium text-cinnabar-h">{SUBJECT_LABEL[focused.subject]}</span>
            ：{focused.why}
          </p>
        )}
        {open && target && !registered && (
          <p className="mt-2 rounded-sm border-l-2 border-indigo-l bg-indigo-p/40 px-2 py-1 text-[10.5px] leading-[1.7] text-ink-2">
            「{SUBJECT_LABEL[target]}」还没有登记落点，下面的结果由 AI 现找——
            接得上就有具体用法，接不上会直说。
          </p>
        )}
      </div>

      {/* ══ 展开区：AI 分析 ══ */}
      {open && (
        <div className="animate-fade border-t border-line-2 bg-paper-2/40 px-3.5 py-3">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo">
              <Sparkles size={11} />
              AI 分析 · 怎么用到你的课堂
            </span>
            <Tag size="sm" tone={registered ? 'cinnabar' : 'indigo'}>
              {target ? `面向 ${SUBJECT_LABEL[target]}` : '不限学科'}
            </Tag>
            {registered ? (
              <span className="text-[10px] text-ink-4">已登记落点</span>
            ) : target ? (
              <span className="text-[10px] text-ink-4">未登记 · AI 现找</span>
            ) : null}
            {analysis.status === 'done' && (
              <button
                type="button"
                onClick={() => onAnalyze(target, true)}
                className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-ink-4 transition-colors hover:text-cinnabar"
              >
                <RefreshCw size={10} />
                重新分析
              </button>
            )}
          </div>

          {analysis.status === 'idle' && (
            <div className="rounded-md border border-dashed border-line bg-card/70 p-2.5">
              <p className="text-[11.5px] leading-[1.75] text-ink-2">
                分析对象是
                <span className="mx-0.5 font-medium text-cinnabar-h">
                  {target ? SUBJECT_LABEL[target] : '不限学科'}
                </span>
                。换学科不会自动重跑，点下面按钮才开始。
              </p>
              <button
                type="button"
                onClick={startAnalyze}
                className="mt-2 inline-flex items-center gap-1 rounded-sm border border-indigo/40 bg-indigo-p px-2.5 py-1 text-[11px] font-medium text-indigo transition-colors hover:border-indigo/70"
              >
                <Sparkles size={11} />
                开始分析
              </button>
            </div>
          )}

          {analysis.status === 'loading' && <LoadingBlock />}

          {analysis.status === 'error' && (
            <div className="rounded-md border border-ochre/30 bg-ochre-l/40 p-2.5">
              <div className="flex items-start gap-1.5">
                <TriangleAlert size={12} className="mt-0.5 shrink-0 text-ochre" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] leading-[1.75] text-ink-2">{analysis.message}</p>
                  {analysis.hint === 'config' && (
                    <p className="mt-1 text-[10.5px] leading-[1.7] text-ink-3">
                      AI 是本站唯一的生成与分析引擎，配置后即可使用。
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {analysis.hint === 'config' ? (
                      <Link
                        to="/settings"
                        className="inline-flex items-center gap-1 rounded-sm border border-line bg-card px-2 py-1 text-[11px] text-ink-2 hover:border-ink-4/50"
                      >
                        <Settings size={11} />
                        去设置接入
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAnalyze(target, true)}
                        className="inline-flex items-center gap-1 rounded-sm border border-line bg-card px-2 py-1 text-[11px] text-ink-2 hover:border-ink-4/50"
                      >
                        <RefreshCw size={11} />
                        重试
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="text-[10.5px] text-ink-4 hover:text-ink-2"
                    >
                      收起
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {analysis.status === 'done' && (
            <AnalysisBody
              data={analysis.data}
              pointId={point.id}
              mySubject={target}
              at={analysis.at}
            />
          )}
        </div>
      )}
    </Card>
  )
}

/* ── 学科小 chip ────────────────────────────────── */

function SubjectChip({
  active,
  registered,
  onClick,
  label,
}: {
  active: boolean
  registered?: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-sm border px-1.5 py-[2px] text-[10px] transition-colors',
        active
          ? 'border-cinnabar bg-cinnabar text-white'
          : registered
            ? 'border-cinnabar-l bg-cinnabar-p/50 text-cinnabar-h hover:border-cinnabar/50'
            : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
      )}
    >
      {label}
      {registered && !active && <span className="text-[8px] leading-none">·</span>}
    </button>
  )
}

/* ── 加载骨架 ───────────────────────────────────── */

function LoadingBlock() {
  const [step, setStep] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    timer.current = window.setInterval(() => {
      setStep((s) => (s < SKELETON.length - 1 ? s + 1 : s))
    }, 1600)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [])

  return (
    <div className="rounded-md border border-line-2 bg-card p-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-ink-2">
        <Loader2 size={11} className="animate-spin text-indigo" />
        {SKELETON[step]}…
        <span className="ml-auto text-[10px] text-ink-4">通常 5–15 秒</span>
      </div>
      <div className="mt-2 space-y-1.5">
        {[86, 72, 60].map((w, i) => (
          <div
            key={i}
            className="h-2 animate-pulse rounded-xs bg-paper-3"
            style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── 分析结果 ───────────────────────────────────── */

function AnalysisBody({
  data,
  pointId,
  mySubject,
  at,
}: {
  data: PointAnalysis
  pointId: string
  mySubject: Subject | null
  at: number
}) {
  const agentHref = `/agent?point=${encodeURIComponent(pointId)}${
    mySubject ? `&subject=${encodeURIComponent(mySubject)}` : ''
  }`

  return (
    <div className="space-y-3">
      {/* ① 一句话定位 */}
      <div className="flex gap-2 rounded-md border border-indigo-l/70 bg-card px-2.5 py-2">
        <span className="mt-0.5 h-3.5 w-[2.5px] shrink-0 rounded-xs bg-indigo" />
        <p className="text-[12px] font-medium leading-[1.75] text-ink">{data.core}</p>
      </div>

      {/* ② 能落到的课堂 */}
      {data.classrooms.length > 0 && (
        <section>
          <SectionLabel n="一" title="能落到哪些课堂" />
          <div className="space-y-1.5">
            {data.classrooms.map((c, i) => (
              <div
                key={`${c.subject}-${i}`}
                className="rounded-md border border-line-2 bg-card px-2.5 py-2"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag
                    size="sm"
                    tone={c.subject === mySubject ? 'cinnabar' : 'neutral'}
                  >
                    {SUBJECT_LABEL[c.subject as Subject] ?? c.subject}
                  </Tag>
                  <span className="text-[11.5px] font-medium leading-snug text-ink">{c.content}</span>
                </div>
                {c.use && (
                  <p className="mt-1 text-[11px] leading-[1.7] text-ink-2">
                    <span className="text-ink-4">作用　</span>
                    {c.use}
                  </p>
                )}
                {c.example && (
                  <p className="mt-0.5 text-[11px] leading-[1.7] text-ink-2">
                    <span className="text-ink-4">怎么用　</span>
                    {c.example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ③ 三步落地 */}
      {data.flow.length > 0 && (
        <section>
          <SectionLabel n="二" title="三步落地" />
          <ol className="space-y-1.5">
            {data.flow.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="tnum mt-[1px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-indigo-p text-[9.5px] font-semibold text-indigo">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[11.5px] font-medium text-ink">{s.step}</div>
                  <p className="text-[11px] leading-[1.7] text-ink-2">{s.action}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ④ 注意与追问 */}
      {(data.cautions.length > 0 || data.ask) && (
        <section className="space-y-1.5">
          {data.cautions.length > 0 && (
            <div className="rounded-md border border-ochre/25 bg-ochre-l/40 px-2.5 py-2">
              <div className="mb-0.5 text-[10px] font-semibold tracking-wide text-ochre">
                容易上歪的地方
              </div>
              <ul className="space-y-0.5">
                {data.cautions.map((c, i) => (
                  <li key={i} className="text-[11px] leading-[1.7] text-ink-2">
                    · {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.ask && (
            <div className="rounded-md border border-line-2 bg-card px-2.5 py-2">
              <div className="mb-0.5 text-[10px] font-semibold tracking-wide text-ink-4">
                留给学生的追问
              </div>
              <p className="text-[11.5px] leading-[1.75] text-ink-2">{data.ask}</p>
            </div>
          )}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line-2 pt-2">
        <Link
          to={agentHref}
          className="inline-flex items-center gap-1 rounded-sm border border-line bg-card px-2 py-1 text-[11px] font-medium text-ink-2 transition-colors hover:border-cinnabar/50 hover:text-cinnabar"
        >
          <Wand2 size={11} />
          带它去备课
          <ArrowRight size={10} />
        </Link>
        <span className="text-[10px] text-ink-4">
          由 AI 依据知识卡与已登记落点生成 · {new Date(at).toLocaleTimeString('zh-CN')}
        </span>
      </div>
    </div>
  )
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="grid h-3.5 w-3.5 place-items-center rounded-xs bg-paper-3 text-[9px] font-semibold text-ink-3">
        {n}
      </span>
      <span className="text-[10.5px] font-semibold tracking-wide text-ink-2">{title}</span>
    </div>
  )
}
