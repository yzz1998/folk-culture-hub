import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, Download, Layers, Printer, Sparkles } from 'lucide-react'
import { folkLinkOf, getLesson } from '@/data/lessons'
import { FOLK_MAP } from '@/data/folk'
import { POINT_MAP } from '@/data/curriculum'
import { chapterTitleOf } from '@/lib/catalog'
import { GRADE_SHORT, SUBJECT_LABEL, durationLabel, subjectCoreBrief } from '@/lib/types'
import { Button, Card, Tag, CATEGORY_TONE } from '@/components/ui'
import { PlanView } from '@/components/lesson/PlanView'
import { PatternMark } from '@/components/folk/PatternMark'
import { download, planToMarkdown, safeFilename } from '@/lib/export'
import { useApp, useToast } from '@/store/AppStore'
import NotFound from './NotFound'

export default function LessonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const lesson = getLesson(id)
  const { isFavorite, toggleFavorite } = useApp()
  const { toast } = useToast()

  if (!lesson) return <NotFound />

  const link = folkLinkOf(lesson)
  const standalone = link === 'none'
  const folk = lesson.folkIds.map((fid) => FOLK_MAP.get(fid)).filter(Boolean)
  const points = lesson.pointIds.map((pid) => POINT_MAP.get(pid)).filter(Boolean)
  const fav = isFavorite('lesson', lesson.id)
  const subjectLabel = SUBJECT_LABEL[lesson.subject]
  const chapterTitle = lesson.chapterId ? chapterTitleOf(lesson.chapterId) : ''
  const agentHref = `/agent?subject=${encodeURIComponent(lesson.subject)}&grade=${lesson.gradeBand}${
    lesson.folkIds.length ? `&folk=${lesson.folkIds.join(',')}` : ''
  }${lesson.pointIds.length ? `&point=${lesson.pointIds.join(',')}` : ''}`

  return (
    <div className="animate-fade">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/lessons')}
          className="inline-flex items-center gap-1 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft size={13} />
          返回教案库
        </button>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={fav ? 'primary' : 'outline'}
            onClick={() => {
              toggleFavorite('lesson', lesson.id)
              toast(fav ? '已取消收藏' : '已收藏教案')
            }}
          >
            <Bookmark size={13} fill={fav ? 'currentColor' : 'none'} />
            {fav ? '已收藏' : '收藏'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              download(`${safeFilename(lesson.title)}.md`, planToMarkdown(lesson, lesson.folkIds))
              toast('已导出 Markdown')
            }}
          >
            <Download size={13} />
            导出
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}>
            <Printer size={13} />
            打印
          </Button>
        </div>
      </div>

      {/* 标题区 */}
      <header className="print-area mb-5 border-b border-line pb-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag size="sm" tone="cinnabar">
            {subjectLabel}
          </Tag>
          <Tag size="sm">{GRADE_SHORT[lesson.gradeBand]}</Tag>
          <Tag size="sm">{durationLabel(lesson.duration)}</Tag>
          <Tag size="sm" tone={standalone ? 'neutral' : 'ochre'}>
            {standalone ? '学科本体' : link === 'core' ? '课程内容本体' : '课程内容作情境'}
          </Tag>
        </div>
        <h1 className="mt-2.5 font-serif text-[22px] font-semibold leading-tight tracking-tight md:text-[27px]">
          {lesson.title}
        </h1>

        <p className="mt-2.5 max-w-[64ch] text-[12px] leading-[1.8] text-ink-3">
          {standalone
            ? `本课不借用本课程的任何知识点，按${subjectLabel}自身主线编写——${subjectCoreBrief(lesson.subject)}。`
            : `${subjectLabel}这一侧的内容仍是主体，借用的课程知识点只用来提供一个入口或一处例子。`}
        </p>

        {folk.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] text-ink-4">教学素材</span>
            {folk.map((f) => (
              <Link key={f!.id} to={`/resources/material/${f!.id}`} className="no-print">
                <Tag tone={CATEGORY_TONE[f!.category]} size="sm">
                  {f!.name}
                </Tag>
              </Link>
            ))}
            <span className="print-only text-[11px]">{folk.map((f) => f!.name).join('、')}</span>
          </div>
        )}

        {(points.length > 0 || chapterTitle) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink-3">
            <span className="text-ink-4">借用的课程知识点</span>
            {points.map((p) => (
              <Link key={p!.id} to={`/resources/card/kc-${p!.id}`} className="no-print">
                <Tag tone="indigo" size="sm">
                  {p!.title}
                </Tag>
              </Link>
            ))}
            {chapterTitle && <span className="text-ink-4">属「{chapterTitle}」</span>}
          </div>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_250px]">
        <Card className="p-4 md:p-6">
          <PlanView plan={lesson} />
        </Card>

        <aside className="no-print space-y-4">
          {folk.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-2.5 text-[12px] font-semibold text-ink-2">这一课用到的素材</h3>
              <div className="space-y-2">
                {folk.map((f) => (
                  <Link
                    key={f!.id}
                    to={`/resources/material/${f!.id}`}
                    className="group flex items-center gap-2.5 rounded-sm border border-line-2 bg-paper-2/40 p-2 transition-colors hover:border-ink-4/50 hover:bg-card"
                  >
                    <div className="w-9 shrink-0 overflow-hidden rounded-xs border border-line">
                      <PatternMark spec={f!.pattern} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-medium text-ink group-hover:text-cinnabar-h">
                        {f!.name}
                      </div>
                      <div className="text-[10.5px] text-ink-4">{f!.category}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Layers size={13} className="text-ink-3" />
              <h3 className="text-[12px] font-semibold text-ink-2">
                {standalone ? '本科的主线课例' : '想换成自己的条件？'}
              </h3>
            </div>
            <p className="text-[11.5px] leading-[1.75] text-ink-3">
              {standalone
                ? `${subjectLabel}的主线是「${subjectCoreBrief(lesson.subject)}」。这份课例不依赖任何课程知识点，改编时也不必往里塞。`
                : '在智能工坊里换一份学情、换一个课时长度，方案会按新的条件重新组装；借用的课程知识点可以整批取消。'}
            </p>
            <Link to={agentHref} className="mt-3 block">
              <Button variant="primary" size="sm" block>
                <Sparkles size={13} />
                {standalone ? '按本科主线再生成一份' : '拿去改造'}
              </Button>
            </Link>
            <Link
              to={`/lessons?subject=${encodeURIComponent(lesson.subject)}`}
              className="mt-2 block text-center text-[11px] text-ink-4 hover:text-cinnabar"
            >
              更多{subjectLabel}课例
            </Link>
          </Card>

          <div className="rounded-lg border border-line-2 bg-paper-2/50 p-3.5">
            <p className="text-[11px] leading-[1.75] text-ink-3">
              教案中的非物质文化遗产表述均为定性描述，未标注批次与传承人。
              若用于公开出版或评比，请按本校所用资料核实后再引用。
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
