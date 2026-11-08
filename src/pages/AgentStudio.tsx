import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import {
  ArrowLeft,
  Bookmark,
  Check,
  ChevronDown,
  Download,
  Info,
  Loader2,
  Pencil,
  Printer,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { cardOfPoint } from '@/data/knowledgeCards'
import { ISSUE_COUNTS, ISSUE_GROUPS, ISSUE_LIMIT, ISSUE_PRESETS, issuesLabel } from '@/data/teachingPresets'
import { PRIMARY_SUBJECT_INDEX, subjectIndexOf } from '@/lib/catalog'
import type { GeneratedPlan, GradeBand, PointId, Subject, TeachStyle } from '@/lib/types'
import {
  AFFINITY_LABEL,
  AFFINITY_TONE,
  GRADE_BANDS,
  GRADE_LABEL,
  GRADE_SHORT,
  STYLES,
  SUBJECT_LABEL,
  durationLabel,
} from '@/lib/types'
import { AiError, aiConfigured, generatePlanWithAI } from '@/lib/agent/llm'
import { download, generatedToMarkdown, safeFilename } from '@/lib/export'
import {
  DEFAULT_DOCX_OPTIONS,
  FILENAME_TEMPLATE,
  buildFilename,
  buildPlanDocx,
  downloadBlob,
  DOCX_STYLE_SPEC,
  FILENAME_VARS,
  type DocxOptions,
} from '@/lib/exportDocx'
import { Button, Card, Drawer, Tag, Segmented } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { PlanView } from '@/components/lesson/PlanView'
import { PlanEditor } from '@/components/lesson/PlanEditor'
import { PointPicker } from '@/components/agent/PointPicker'
import { useApp, useToast } from '@/store/AppStore'

/* ═══════════════════════════════════════════════════════════════
   智能备课工坊

   四步，顺序本身就是口径：先定落点，再挑材料，最后交给 AI。
   ① 定落点 —— 只选这节课落在哪门课，必选；**不在这里限制知识点范围**
   ② 选知识点 —— 全书 10 章 73 个知识点任选（最多 3 个），可整段跳过
   ③ 定课程与学情 —— 主题必填，由教师自拟
   ④ AI 生成方案 —— 唯一生成路径；未配置 AI 则阻断并引导去设置

   第 2 步的范围不再跟着学科走：学科只决定「这节课落在哪」，
   不决定「能从课程里拿什么」——登记表写的是常见落点，不是允许清单。
   ═══════════════════════════════════════════════════════════════ */

const STEPS = ['定落点', '选知识点', '定课程与学情', 'AI 生成']
const PROGRESS = ['整理课程要点', '调用 AI 生成', '校验课时配比', '排版输出']

export default function AgentStudio() {
  const [params] = useSearchParams()
  const { settings, savePlan, saveDraft, isFavorite, toggleFavorite } = useApp()
  const { toast } = useToast()

  const [step, setStep] = useState(1)

  const initialSubject = ((): Subject | null => {
    const s = params.get('subject')
    return PRIMARY_SUBJECT_INDEX.some((x) => x.subject === s) ? (s as Subject) : null
  })()

  const [subject, setSubject] = useState<Subject | null>(initialSubject)
  const [pointIds, setPointIds] = useState<string[]>(() =>
    (params.get('point') ?? '').split(',').filter(Boolean).slice(0, 3),
  )
  const [materialIds, setMaterialIds] = useState<string[]>([])

  const [gradeBand, setGradeBand] = useState<GradeBand>(
    (params.get('grade') as GradeBand) ?? '3-4',
  )
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(40)
  const [style, setStyle] = useState<TeachStyle>('体验探究')
  const [issues, setIssues] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<GeneratedPlan | null>(null)
  const [editing, setEditing] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [docxOpts, setDocxOpts] = useState<DocxOptions>(DEFAULT_DOCX_OPTIONS)
  const [presetInfoOpen, setPresetInfoOpen] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const variantRef = useRef(0)

  useEffect(() => {
    if (initialSubject) setStep(2)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
    // 只在首次挂载时按深链决定起始步
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aiReady = aiConfigured(settings)
  const idx = subject ? subjectIndexOf(subject) : undefined
  const meta = idx?.meta

  const topicFilled = topic.trim().length > 0
  const canGenerate = Boolean(subject) && topicFilled
  const auxCount = pointIds.length + materialIds.length

  const filename = result
    ? buildFilename({
        topic: result.input.topic?.trim() || result.plan.title,
        gradeBand: result.plan.gradeBand,
        subject: result.plan.subject,
        duration: result.plan.duration,
      })
    : ''

  function togglePoint(id: string) {
    setPointIds((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id)
      if (s.length >= 3) {
        toast('最多选三个知识点', 'warn')
        return s
      }
      return [...s, id]
    })
  }

  function toggleMaterial(id: string) {
    setMaterialIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function toggleIssue(id: string) {
    setIssues((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id)
      if (s.length >= ISSUE_LIMIT) {
        toast(`学情预设最多选 ${ISSUE_LIMIT} 项`, 'warn')
        return s
      }
      return [...s, id]
    })
  }

  async function handleExportDocx() {
    if (!result) return
    setExporting(true)
    try {
      const blob = await buildPlanDocx(
        result.plan,
        {
          topic: result.input.topic?.trim() || result.plan.title,
          engineLabel: 'AI 生成',
          createdAt: result.createdAt,
          styleLabel: result.input.style,
          issuesLabel: issuesLabel(result.input.issues),
          rationale: result.rationale,
        },
        docxOpts,
      )
      downloadBlob(filename, blob)
      toast('Word 已导出')
      setExportOpen(false)
    } catch (e) {
      toast(`导出失败：${e instanceof Error ? e.message : '未知错误'}`, 'warn')
    } finally {
      setExporting(false)
    }
  }

  function handleExportMarkdown() {
    if (!result) return
    download(`${safeFilename(result.title)}.md`, generatedToMarkdown(result))
    toast('已导出 Markdown')
  }

  async function handleGenerate(variantBump = false) {
    if (!canGenerate || !subject) {
      toast('请先选学科并填写课程主题', 'warn')
      return
    }
    if (!aiReady) {
      setGenError('尚未配置 AI 服务，无法生成方案。请先在设置中接入大模型。')
      toast('请先在设置中配置 AI 服务', 'warn')
      return
    }

    if (variantBump) variantRef.current += 1
    else variantRef.current = 0

    setGenerating(true)
    setGenError(null)
    setProgress(0)
    setEditing(false)

    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setProgress((p) => (p < PROGRESS.length - 1 ? p + 1 : p))
    }, 900)

    const input = {
      pointIds: pointIds as PointId[],
      gradeBand,
      subject,
      topic,
      duration,
      style,
      issues,
      notes,
      cardIds: pointIds
        .map((pid) => cardOfPoint(pid)?.id)
        .filter((x): x is string => Boolean(x)),
      materialIds,
    }

    try {
      const final = await generatePlanWithAI(input, settings, { variant: variantRef.current })
      setResult(final)
      setStep(4)
      if (final.note) toast(final.note, 'warn')
      else toast('AI 已生成方案')
    } catch (e) {
      const msg =
        e instanceof AiError || e instanceof Error ? e.message : '生成失败，请稍后重试'
      setGenError(msg)
      toast(msg, 'warn')
    } finally {
      if (timerRef.current) window.clearInterval(timerRef.current)
      setGenerating(false)
      setProgress(PROGRESS.length - 1)
    }
  }
  function goStep(n: number) {
    if (n >= 2 && !subject) {
      toast('先选一门学科', 'warn')
      return
    }
    if (n === 4 && !result) return
    setStep(n)
    setEditing(false)
  }

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="智能备课工坊"
        title="先定落点，再从课程里挑知识点"
        desc="先想清楚这节课落在哪门课，再从《人类与社会》里挑它接得住的知识点。不挑也能生成——那就完全按这门课自己的主线走。"
        right={
          <div
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[11.5px]',
              aiReady
                ? 'border-cinnabar-l bg-cinnabar-p text-cinnabar'
                : 'border-line bg-paper-2 text-ink-3',
            )}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: aiReady ? '#B4453A' : '#8B8377' }}
            />
            {aiReady ? 'AI 已就绪' : 'AI 未配置'}
          </div>
        }
      />

      {/* 步骤条 */}
      <div className="no-scrollbar mb-5 flex items-center gap-1.5 overflow-x-auto">
        {STEPS.map((s, i) => {
          const n = i + 1
          const active = step === n
          const done = step > n
          return (
            <div key={s} className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => goStep(n)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[12px] transition-colors',
                  active
                    ? 'border-cinnabar bg-cinnabar text-white'
                    : done
                      ? 'border-line bg-card text-ink-2'
                      : 'border-line-2 bg-paper-2/50 text-ink-4',
                )}
              >
                <span
                  className={clsx(
                    'tnum grid h-4 w-4 place-items-center rounded-full text-[9.5px] font-semibold',
                    active ? 'bg-white/22' : done ? 'bg-bamboo-l text-bamboo' : 'bg-paper-3',
                  )}
                >
                  {done ? <Check size={9} /> : n}
                </span>
                {s}
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-4 bg-line" />}
            </div>
          )
        })}
      </div>

      {/* ══ 步骤一：选学科 ══ */}
      {step === 1 && (
        <div>
          <p className="mb-3 text-[12px] leading-[1.7] text-ink-3">
            先选这节课要落在哪门课——只决定「落在哪」，不限制你能从课程里拿什么。
            下一步的 73 个知识点全部可选，不限章节。下面按「这门课已登记多少落点」排，
            排后不等于这门课差。
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {[...PRIMARY_SUBJECT_INDEX]
              .sort((a, b) => {
                const order = { strong: 0, fair: 1, weak: 2, none: 3 } as const
                return order[a.meta.affinity] - order[b.meta.affinity]
              })
              .map((s) => {
                const picked = subject === s.subject
                return (
                  <button
                    key={s.subject}
                    type="button"
                    onClick={() => {
                      setSubject(s.subject)
                      setPointIds([])
                      setMaterialIds([])
                      setStep(2)
                    }}
                    className={clsx(
                      'group relative rounded-lg border p-3.5 text-left transition-all',
                      picked
                        ? 'border-cinnabar bg-cinnabar-p/50 ring-2 ring-cinnabar-l'
                        : 'border-line bg-card hover:border-ink-4/60 hover:shadow-md',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-serif text-[15px] font-semibold tracking-tight text-ink group-hover:text-cinnabar-h">
                        {SUBJECT_LABEL[s.subject]}
                      </span>
                      <Tag tone={AFFINITY_TONE[s.meta.affinity]} size="sm">
                        {AFFINITY_LABEL[s.meta.affinity]}
                      </Tag>
                    </div>
                    <p className="mt-1.5 clamp-2 text-[11.5px] leading-[1.7] text-ink-3">
                      {s.meta.ownCore}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-line-2 pt-1.5 text-[10.5px] text-ink-4">
                      <span>接得住 {s.counts.points} 个知识点</span>
                      <span className="text-line">·</span>
                      <span>课例 {s.counts.lessons}</span>
                      {s.counts.points === 0 && (
                        <span className="text-ochre">本课程暂无可落的点</span>
                      )}
                    </div>
                    {picked && (
                      <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-cinnabar text-white">
                        <Check size={11} />
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {/* ══ 步骤二：选知识点（全书范围，可整段跳过） ══ */}
      {step === 2 && subject && (
        <PointPicker
          subject={subject}
          pointIds={pointIds}
          onTogglePoint={togglePoint}
          materialIds={materialIds}
          onToggleMaterial={toggleMaterial}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
          onClear={() => {
            setPointIds([])
            setMaterialIds([])
          }}
        />
      )}

      {/* ══ 步骤三：定课程与学情 ══ */}
      {step === 3 && subject && (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Card className="p-4">
              <h3 className="mb-3 text-[12px] font-semibold text-ink-2">这一课教什么</h3>
              <div className="space-y-3">
                <Field label="课程主题（必填）">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={`自己拟一个，如「${meta?.topics[0] ?? '一张纸的旅行'}」`}
                    className="h-9 w-full rounded-sm border border-line bg-card px-2.5 text-[12.5px] text-ink outline-none placeholder:text-ink-4 focus:border-cinnabar/60"
                  />
                  <p className="mt-1 text-[10px] leading-[1.7] text-ink-4">
                    {topicFilled ? '会直接作为教案标题，不会自动改写。' : '由你自己拟定，不预置；填写后才能生成。'}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="text-[10px] text-ink-4">参考：</span>
                    {(meta?.topics ?? []).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopic(t)}
                        className="rounded-full border border-line bg-card px-1.5 py-[2px] text-[10.5px] text-ink-3 transition-colors hover:border-cinnabar/50 hover:text-cinnabar"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="任教年级">
                    <Segmented
                      size="sm"
                      value={gradeBand}
                      onChange={setGradeBand}
                      options={GRADE_BANDS.map((g) => ({ value: g, label: GRADE_SHORT[g] }))}
                    />
                  </Field>
                  <Field label="课时长度">
                    <Segmented
                      size="sm"
                      value={String(duration)}
                      onChange={(v) => setDuration(Number(v))}
                      options={[
                        { value: '40', label: '1 课时' },
                        { value: '80', label: '2 课时' },
                      ]}
                    />
                  </Field>
                </div>

                <Field label="教学风格">
                  <Segmented
                    size="sm"
                    value={style}
                    onChange={setStyle}
                    options={STYLES.map((s) => ({ value: s, label: s }))}
                    wrap
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-[12px] font-semibold text-ink-2">学情</h3>
              <Field label={`学情预设（${issues.length}/${ISSUE_LIMIT}）`}>
                <div className="space-y-2 rounded-sm border border-line-2 bg-paper-2/40 p-2">
                  {ISSUE_GROUPS.map((g) => (
                    <div key={g.key}>
                      <div
                        className="mb-1 flex items-center justify-between text-[9.5px] leading-none text-ink-4"
                        title={g.note}
                      >
                        <span>{g.key}</span>
                        <span className="tnum">{ISSUE_COUNTS[g.key]}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ISSUE_PRESETS.filter((p) => p.group === g.key).map((p) => {
                          const on = issues.includes(p.id)
                          return (
                            <button
                              key={p.id}
                              type="button"
                              title={p.adapt}
                              onClick={() => toggleIssue(p.id)}
                              className={clsx(
                                'rounded-full border px-1.5 py-[3px] text-[10.5px] leading-[1.4] transition-colors',
                                on
                                  ? 'border-cinnabar bg-cinnabar text-white'
                                  : 'border-line bg-card text-ink-2 hover:border-ink-4/60',
                              )}
                            >
                              {p.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-1.5 rounded-sm border border-line-2 bg-card">
                  <button
                    type="button"
                    onClick={() => setPresetInfoOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-1 px-2 py-1.5 text-left"
                  >
                    <span className="text-[10px] leading-[1.5] text-ink-3">
                      {ISSUE_PRESETS.length} 项 / {ISSUE_GROUPS.length} 类，最多选 {ISSUE_LIMIT} 项
                    </span>
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-cinnabar">
                      {presetInfoOpen ? '收起' : '分类与维护'}
                      <ChevronDown
                        size={11}
                        className={clsx('transition-transform', presetInfoOpen && 'rotate-180')}
                      />
                    </span>
                  </button>

                  {presetInfoOpen && (
                    <div className="animate-fade space-y-2 border-t border-line-2 px-2 py-2">
                      <div>
                        <div className="mb-1 text-[9.5px] font-semibold tracking-wide text-cinnabar">
                          分类方式
                        </div>
                        <p className="text-[10px] leading-[1.75] text-ink-3">
                          按「备课当天就能确认的事实」分五类，不按教育学理论分类，每类只回答一个问题。
                          前两类说学生，后三类说这节课怎么落地。
                        </p>
                        <div className="mt-1 space-y-[3px]">
                          {ISSUE_GROUPS.map((g) => (
                            <div key={g.key} className="flex gap-1.5 text-[10px] leading-[1.6]">
                              <span className="w-11 shrink-0 font-medium text-ink-2">{g.key}</span>
                              <span className="min-w-0 flex-1 text-ink-3">{g.note}</span>
                              <span className="tnum shrink-0 text-ink-4">{ISSUE_COUNTS[g.key]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-[9.5px] font-semibold tracking-wide text-cinnabar">
                          维护与扩展
                        </div>
                        <p className="text-[10px] leading-[1.75] text-ink-3">
                          预设集中维护在 <span className="font-mono text-[9.5px]">src/data/teachingPresets.ts</span>
                          ，这是唯一数据源。新增一条只要追加
                          <span className="font-mono text-[9.5px]"> {'{ id, label, group, adapt, prep? }'} </span>
                          四个字段，界面、AI 提示词与 Word 导出会自动跟上。
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Field>

              <div className="mt-3">
                <Field label="学情补充（可选）">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="如：班上有两位畲族学生；教室没有投影…"
                    className="w-full resize-none rounded-sm border border-line bg-card px-2 py-1.5 text-[11.5px] leading-relaxed text-ink outline-none placeholder:text-ink-4 focus:border-cinnabar/60"
                  />
                </Field>
              </div>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <Card className="p-4">
              <h3 className="mb-2.5 text-[12px] font-semibold text-ink-2">本课条件</h3>
              <dl className="space-y-1.5 text-[11.5px]">
                <Row k="学科" v={SUBJECT_LABEL[subject]} strong />
                <Row k="主题" v={topicFilled ? topic.trim() : '未填写'} dim={!topicFilled} />
                <Row k="年级" v={GRADE_SHORT[gradeBand]} />
                <Row k="课时" v={durationLabel(duration)} />
                <Row k="风格" v={style} />
                <Row
                  k="辅助素材"
                  v={
                    auxCount === 0
                      ? '未借用（按学科主线生成）'
                      : `${pointIds.length} 知识点 · ${materialIds.length} 教学素材`
                  }
                  dim={auxCount === 0}
                />
              </dl>

              <div className="mt-3 rounded-sm border border-line-2 bg-paper-2/50 px-2.5 py-2 text-[10.5px] leading-[1.7] text-ink-3">
                {auxCount === 0
                  ? '本课未借用任何课程知识点，方案完全按这门课自己的主线生成。'
                  : '借用的知识点只用来提供一个入口或例子，教学目标仍以这门课为准。'}
              </div>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft size={13} />
                </Button>
                <Button
                  variant="primary"
                  block
                  disabled={!canGenerate || generating}
                  onClick={() => handleGenerate(false)}
                >
                  {generating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {PROGRESS[progress]}…
                    </>
                  ) : (
                    <>
                      <Wand2 size={14} />
                      生成教学方案
                    </>
                  )}
                </Button>
              </div>
              {!topicFilled && (
                <p className="mt-2 text-center text-[10px] text-ochre">填写课程主题后才能生成</p>
              )}
              {genError && (
                <div className="mt-2 rounded-sm border border-ochre/30 bg-ochre-l/40 px-2 py-1.5 text-[10.5px] leading-[1.7] text-ink-2">
                  {genError}
                  {!aiReady && (
                    <Link to="/settings" className="ml-1 text-cinnabar underline">
                      去设置
                    </Link>
                  )}
                </div>
              )}
              <p className="mt-2 text-center text-[10px] text-ink-4">
                {aiReady
                  ? '提交后由 AI 生成，通常 20–60 秒；失败会给出原因，不代写方案'
                  : '需要先配置 AI 才能生成'}
              </p>
            </Card>
          </aside>
        </div>
      )}

      {/* ══ 步骤四：结果 ══ */}
      {step === 4 && result && (
        <div>
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                <ArrowLeft size={13} />
                改条件
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerate(true)}
                disabled={generating}
              >
                <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                换一个方案
              </Button>
              <Button
                variant={editing ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setEditing((v) => !v)}
              >
                <Pencil size={13} />
                {editing ? '退出编辑' : '编辑'}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  saveDraft({
                    id: `draft-${Date.now().toString(36)}`,
                    title: result.plan.title,
                    savedAt: Date.now(),
                    plan: result.plan,
                  })
                  toast('已存入草稿')
                }}
              >
                <Save size={13} />
                存草稿
              </Button>
              <Button
                variant={isFavorite('plan', result.id) ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  const was = isFavorite('plan', result.id)
                  if (was) {
                    toast('已从收藏移除')
                  } else {
                    savePlan(result)
                    toast('已收藏方案')
                  }
                  toggleFavorite('plan', result.id)
                }}
              >
                <Bookmark size={13} fill={isFavorite('plan', result.id) ? 'currentColor' : 'none'} />
                收藏
              </Button>
              <Button variant="primary" size="sm" onClick={() => setExportOpen(true)}>
                <Download size={13} />
                导出 Word
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer size={13} />
                打印
              </Button>
            </div>
          </div>

          <Card className="no-print mb-4 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-line-2 bg-paper-2/50 px-4 py-2.5">
              <span className="inline-flex items-center gap-1 rounded-xs bg-cinnabar-p px-1.5 py-0.5 text-[10.5px] font-medium text-cinnabar">
                <Sparkles size={10} />
                AI 生成
              </span>
              <span className="text-[10.5px] text-ink-4">
                {SUBJECT_LABEL[result.input.subject]} · {GRADE_LABEL[result.input.gradeBand]} ·{' '}
                {durationLabel(result.input.duration)} · {result.input.style} ·{' '}
                {auxCount === 0 ? '未借用知识点' : `借用 ${pointIds.length} 个课程知识点`}
              </span>
              {result.note && (
                <span className="ml-auto max-w-full rounded-xs bg-ochre-l/60 px-1.5 py-0.5 text-[10px] text-ochre">
                  {result.note}
                </span>
              )}
            </div>

            <div className="p-4">
              <h3 className="mb-2 flex items-center gap-1.5 font-serif text-[13.5px] font-semibold">
                <span className="h-3 w-[2.5px] rounded-xs bg-cinnabar" />
                为什么这样配
              </h3>
              <div className="grid gap-2 md:grid-cols-3">
                {result.rationale.map((r) => (
                  <div key={r.label} className="rounded-md border border-line-2 bg-paper-2/40 p-2.5">
                    <div className="mb-1 text-[10.5px] font-semibold tracking-wide text-cinnabar">
                      {r.label}
                    </div>
                    <p className="text-[11.5px] leading-[1.75] text-ink-2">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {editing ? (
            <Card className="p-4 md:p-6">
              <PlanEditor
                plan={result.plan}
                onCancel={() => setEditing(false)}
                onSave={(p) => {
                  setResult({ ...result, plan: p, title: p.title })
                  setEditing(false)
                  toast('已更新方案')
                }}
              />
            </Card>
          ) : (
            <>
              <Card className="p-4 md:p-6">
                <h1 className="mb-4 border-b border-line pb-3 font-serif text-[20px] font-semibold leading-tight tracking-tight md:text-[24px]">
                  {result.plan.title}
                </h1>
                <PlanView plan={result.plan} />
              </Card>

              <div className="no-print mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-paper-2/50 p-3.5">
                <p className="text-[11.5px] text-ink-3">
                  不满意？换一个方案会改变切入角度与活动组合，不会改动你选的落点、主题与知识点。
                </p>
                <Button variant="primary" size="sm" onClick={() => handleGenerate(true)}>
                  <RefreshCw size={13} />
                  换一个
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ 导出面板 ══ */}
      <Drawer
        open={exportOpen && Boolean(result)}
        onClose={() => setExportOpen(false)}
        side="right"
        title="导出为 Word"
        footer={
          <div className="flex gap-2">
            <Button variant="primary" block disabled={exporting} onClick={handleExportDocx}>
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {exporting ? '正在生成…' : '下载 .docx'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportMarkdown}
              disabled={exporting}
              className="shrink-0 whitespace-nowrap"
            >
              下载 .md
            </Button>
          </div>
        }
      >
        <div className="space-y-4 px-4 py-3.5">
          <div>
            <div className="mb-1 text-[10.5px] font-medium tracking-wide text-ink-3">文件名</div>
            <div className="break-all rounded-sm border border-line bg-paper-2/70 px-2.5 py-2 font-mono text-[11px] leading-[1.7] text-ink-2">
              {filename}
            </div>
            <p className="mt-1 text-[10px] leading-[1.7] text-ink-4">
              规则 <span className="font-mono">{FILENAME_TEMPLATE}</span>
              ，学科在第三段——按学科归档时可直接排序。带分钟级时间戳，同一主题反复导出不会互相覆盖。
            </p>

            <div className="mt-2 overflow-hidden rounded-sm border border-line-2">
              <div className="flex bg-paper-2/70 px-2 py-1 text-[9.5px] font-medium text-ink-3">
                <span className="w-12 shrink-0">变量</span>
                <span className="min-w-0 flex-1">取值</span>
                <span className="w-[64px] shrink-0 text-right">示例</span>
              </div>
              {FILENAME_VARS.map((v) => (
                <div key={v.token} className="flex gap-1 border-t border-line-2 px-2 py-1">
                  <span className="w-12 shrink-0 font-mono text-[10px] text-ink">{v.token}</span>
                  <span className="min-w-0 flex-1 text-[10px] leading-[1.6] text-ink-3">{v.desc}</span>
                  <span className="w-[64px] shrink-0 break-all text-right font-mono text-[9px] text-ink-4">
                    {v.example}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10.5px] font-medium tracking-wide text-ink-3">导出范围</div>
            <div className="mb-2 space-y-1">
              <div className="rounded-sm border border-line-2 bg-paper-2/40 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-xs bg-ink/75 px-1 py-[1px] text-[9px] font-medium text-white">恒含</span>
                  <span className="text-[10px] text-ink-4">不可关闭</span>
                </div>
                <p className="mt-1 text-[10.5px] leading-[1.75] text-ink-2">
                  课程信息表（学科在首行）、教案正文十节（一～十）、教学尺度提醒（有则出）、页眉页脚、文末口径声明。
                </p>
              </div>
              <div className="rounded-sm border border-line-2 bg-paper-2/40 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="rounded-xs bg-bamboo/80 px-1 py-[1px] text-[9px] font-medium text-white">不进文档</span>
                </div>
                <p className="mt-1 text-[10.5px] leading-[1.75] text-ink-3">
                  站点导航与侧栏、收藏与草稿等本地状态、按钮与徽标、屏幕专用样式。纹样矢量图不内嵌为图片，
                  改以文字条目出现在素材清单里——避免 Word 里出现无法印刷的大块色块。
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              {(
                [
                  { k: 'rationale' as const, label: '为什么这样配', desc: '学科这一侧 / 辅助这一侧 / 两者怎么接上' },
                  { k: 'materials' as const, label: '教学素材清单', desc: '所选素材的纹样图、文本与音视频条目' },
                  { k: 'cardDigest' as const, label: '知识要点摘录', desc: '所借知识点的核心要点、关键概念与常见误区' },
                ] as const
              ).map((o) => (
                <button
                  key={o.k}
                  type="button"
                  onClick={() => setDocxOpts((v) => ({ ...v, [o.k]: !v[o.k] }))}
                  className={clsx(
                    'flex w-full items-start gap-2 rounded-sm border px-2.5 py-2 text-left transition-colors',
                    docxOpts[o.k]
                      ? 'border-cinnabar/45 bg-cinnabar-p/60'
                      : 'border-line bg-card hover:border-ink-4/50',
                  )}
                >
                  <span
                    className={clsx(
                      'mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-xs border',
                      docxOpts[o.k] ? 'border-cinnabar bg-cinnabar text-white' : 'border-ink-4/50 bg-card',
                    )}
                  >
                    {docxOpts[o.k] && <Check size={9} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-medium text-ink">{o.label}</span>
                    <span className="mt-0.5 block text-[10.5px] leading-[1.6] text-ink-3">{o.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10.5px] font-medium tracking-wide text-ink-3">排版规范</div>
            <div className="space-y-2">
              {DOCX_STYLE_SPEC.map((g) => (
                <div key={g.title} className="overflow-hidden rounded-sm border border-line-2">
                  <div className="bg-paper-2/70 px-2 py-1 text-[9.5px] font-medium text-ink-2">{g.title}</div>
                  {g.rows.map(([k, v]) => (
                    <div key={k} className="flex gap-2 border-t border-line-2 px-2 py-1 text-[10px] leading-[1.65]">
                      <span className="w-[88px] shrink-0 text-ink-3">{k}</span>
                      <span className="min-w-0 flex-1 text-ink-2">{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* 空态引导 */}
      {step === 3 && auxCount === 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg border border-line-2 bg-paper-2/50 p-3.5">
          <Info size={14} className="text-ink-4" />
          <p className="text-[11.5px] text-ink-3">
            本课不借用任何课程知识点，方案会完全按「{SUBJECT_LABEL[subject ?? '语文']}」的主线生成。
            如果想加一个入口，也可以回上一步挑一个知识点——
            <Link to="/apply" className="ml-1 text-cinnabar hover:text-cinnabar-h">
              看这门课接得住什么
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10.5px] font-medium tracking-wide text-ink-3">{label}</div>
      {children}
    </div>
  )
}

function Row({ k, v, strong, dim }: { k: string; v: string; strong?: boolean; dim?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="shrink-0 text-ink-4">{k}</dt>
      <dd
        className={clsx(
          'min-w-0 truncate text-right',
          dim ? 'text-ink-4' : strong ? 'font-medium text-ink' : 'text-ink-2',
        )}
        title={v}
      >
        {v}
      </dd>
    </div>
  )
}

/* 供外部跳转使用 */
export function AgentEntryLink({ folkId, pointId }: { folkId?: string; pointId?: string }) {
  const q = [folkId ? `folk=${folkId}` : '', pointId ? `point=${pointId}` : '']
    .filter(Boolean)
    .join('&')
  return <Link to={`/agent?${q}`}>去备课</Link>
}
