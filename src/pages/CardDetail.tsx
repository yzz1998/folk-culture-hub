import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bookmark, BookOpen, HelpCircle, Layers, Sparkles, TriangleAlert } from 'lucide-react'
import { POINT_MAP } from '@/data/curriculum'
import { getCard } from '@/data/knowledgeCards'
import { folkOfPoint, lessonsOfPoint, chapterTitleOf } from '@/lib/catalog'
import { linksOfPoint } from '@/data/subjectPoints'
import { GRADE_SHORT, POINT_USE_LABEL, SUBJECT_LABEL, USE_ORDER } from '@/lib/types'
import { Button, Card, SectionTitle, Tag, CATEGORY_TONE } from '@/components/ui'
import { PatternMark } from '@/components/folk/PatternMark'
import { useApp, useToast } from '@/store/AppStore'
import NotFound from './NotFound'

/* ═══════════════════════════════════════════════════════════════
   知识点卡详情

   这张卡的作用是：教师借用了某个《人类与社会》知识点、却不想用民俗素材时，
   靠它就能撑起一节课。所以四个区块都是「可直接搬进课堂」的内容，
   不是教科书定义。

   右侧第一块永远是「可落到的课堂」——它提醒读者：这个知识点是辅助的，
   服务对象是某一门学科的具体内容。
   ═══════════════════════════════════════════════════════════════ */

export default function CardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const card = getCard(id ?? '')
  const point = card ? POINT_MAP.get(card.pointId) : undefined
  const { isFavorite, toggleFavorite } = useApp()
  const { toast } = useToast()

  if (!card || !point) return <NotFound />

  const uses = [...linksOfPoint(point.id)].sort(
    (a, b) => USE_ORDER.indexOf(a.use) - USE_ORDER.indexOf(b.use),
  )
  const folks = folkOfPoint(point.id)
  const lessons = lessonsOfPoint(point.id)
  const fav = isFavorite('card', card.id)
  const chapterTitle = chapterTitleOf(point.chapterId)

  return (
    <div className="animate-fade">
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/resources?kind=card')}
          className="inline-flex items-center gap-1 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft size={13} />
          返回资源库
        </button>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={fav ? 'primary' : 'outline'}
            onClick={() => {
              toggleFavorite('card', card.id)
              toast(fav ? '已取消收藏' : '已收藏知识点卡')
            }}
          >
            <Bookmark size={13} fill={fav ? 'currentColor' : 'none'} />
            {fav ? '已收藏' : '收藏'}
          </Button>
          <Link to={`/agent?point=${point.id}`}>
            <Button size="sm" variant="primary">
              <Sparkles size={13} />
              用这个知识点备课
            </Button>
          </Link>
        </div>
      </div>

      {/* 标题区 */}
      <header className="mb-5 border-b border-line pb-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag size="sm" tone="indigo">
            {chapterTitle}
          </Tag>
          <Tag size="sm">{point.unitTitle}</Tag>
          {point.gradeBand && <Tag size="sm">{GRADE_SHORT[point.gradeBand]}</Tag>}
          <Tag size="sm" tone="neutral">
            知识点卡
          </Tag>
          {card.status === 'draft' && (
            <Tag size="sm" tone="ochre">
              内容待完善
            </Tag>
          )}
        </div>
        <h1 className="mt-2.5 font-serif text-[22px] font-semibold leading-tight tracking-tight md:text-[27px]">
          {point.title}
        </h1>
        <p className="mt-2.5 max-w-[64ch] text-[13px] leading-[1.85] text-ink-2">{point.summary}</p>
        <p className="mt-2 text-[11px] text-ink-4">
          属《人类与社会》课程内容　·　不是学科教学目标本身，用于为某一门课的具体教学内容提供支点
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_268px]">
        <div className="space-y-4">
          {/* ① 核心要点 */}
          <Card className="p-4 md:p-5">
            <SectionTitle sub="三条陈述句，可直接作为讲解提纲">核心要点</SectionTitle>
            <ol className="space-y-2.5">
              {card.keyIdeas.map((k, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 rounded-md border border-line-2 bg-paper-2/50 p-3"
                >
                  <span className="tnum mt-px shrink-0 font-serif text-[12px] font-semibold text-cinnabar">
                    0{i + 1}
                  </span>
                  <span className="text-[12.5px] leading-[1.8] text-ink-2">{k}</span>
                </li>
              ))}
            </ol>
          </Card>

          {/* ② 关键概念 */}
          <Card className="p-4 md:p-5">
            <SectionTitle sub="术语 + 一句生活化的解释，先懂再记名">关键概念</SectionTitle>
            <dl className="space-y-2">
              {card.concepts.map((c) => (
                <div
                  key={c.term}
                  className="rounded-md border border-line-2 p-3 last:mb-0"
                >
                  <dt className="text-[12.5px] font-semibold text-ink">{c.term}</dt>
                  <dd className="mt-1 text-[12px] leading-[1.8] text-ink-2">{c.gloss}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* ③ 常见误区 */}
          {card.misconceptions.length > 0 && (
            <Card className="border-ochre/25 bg-ochre-l/30 p-4 md:p-5">
              <div className="mb-3 flex items-center gap-1.5">
                <TriangleAlert size={14} className="text-ochre" />
                <h2 className="font-serif text-[15px] font-semibold tracking-tight text-ink">
                  常见误区
                </h2>
              </div>
              <div className="space-y-2.5">
                {card.misconceptions.map((m, i) => (
                  <div key={i} className="rounded-md border border-ochre/20 bg-card p-3">
                    <p className="text-[12px] leading-[1.75] text-ink-3">
                      <span className="mr-1.5 rounded-xs bg-ochre-l px-1 py-px text-[10px] font-medium text-ochre">
                        常见说法
                      </span>
                      {m.claim}
                    </p>
                    <p className="mt-1.5 text-[12px] leading-[1.8] text-ink-2">
                      <span className="mr-1.5 rounded-xs bg-bamboo-l px-1 py-px text-[10px] font-medium text-bamboo">
                        机理
                      </span>
                      {m.correction}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ④ 课堂追问 */}
          <Card className="p-4 md:p-5">
            <SectionTitle sub="开放问题，答案不唯一，用来把讲解转成对话">课堂追问</SectionTitle>
            <ol className="space-y-2">
              {card.inquiries.map((q, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-xs bg-cinnabar-p text-[10px] font-semibold text-cinnabar">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] leading-[1.8] text-ink-2">{q}</span>
                </li>
              ))}
            </ol>
          </Card>

          {/* 关联课例 */}
          {lessons.length > 0 && (
            <Card className="p-4 md:p-5">
              <SectionTitle sub={`已有 ${lessons.length} 份课例用到这个知识点`}>关联课例</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2">
                {lessons.map((l) => (
                  <Link key={l.id} to={`/lessons/${l.id}`}>
                    <div className="flex h-full items-start gap-2.5 rounded-md border border-line-2 bg-paper-2/40 p-2.5 transition-colors hover:border-ink-4/50 hover:bg-card">
                      <BookOpen size={14} className="mt-0.5 shrink-0 text-indigo/70" />
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium leading-snug text-ink">{l.title}</div>
                        <div className="mt-0.5 text-[10.5px] text-ink-4">
                          {SUBJECT_LABEL[l.subject]} · {GRADE_SHORT[l.gradeBand]} · {l.duration} 分钟
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* 侧栏 */}
        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          {/* 可落到的课堂 —— 永远排第一 */}
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Layers size={13} className="text-indigo/70" />
              <h3 className="text-[12px] font-semibold text-ink-2">可落到的课堂</h3>
            </div>
            {uses.length === 0 ? (
              <p className="text-[11.5px] leading-[1.75] text-ink-3">
                这个知识点尚未登记落点。
              </p>
            ) : (
              <div className="space-y-2">
                {uses.map((u) => (
                  <Link
                    key={u.subject}
                    to={`/lessons?subject=${encodeURIComponent(u.subject)}`}
                    className="group block rounded-sm border border-line-2 bg-paper-2/40 p-2 transition-colors hover:border-ink-4/50 hover:bg-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-ink group-hover:text-cinnabar-h">
                        {SUBJECT_LABEL[u.subject]}
                      </span>
                      <Tag size="sm" tone="indigo">
                        {POINT_USE_LABEL[u.use]}
                      </Tag>
                    </div>
                    <p className="mt-1 text-[10.5px] leading-[1.7] text-ink-3">{u.why}</p>
                  </Link>
                ))}
              </div>
            )}
            <p className="mt-2 text-[10px] leading-[1.7] text-ink-4">
              用途分四类：情境导入 / 素材案例 / 对比辨析 / 延伸阅读。登记在
              <span className="font-mono"> subjectPoints.ts</span>，是学科与知识点之间唯一的跨层入口。
            </p>
          </Card>

          {/* 可结合素材 */}
          <Card className="p-4">
            <h3 className="mb-2.5 text-[12px] font-semibold text-ink-2">
              可结合素材（{folks.length}）
            </h3>
            {folks.length === 0 ? (
              <p className="rounded-md border border-dashed border-line bg-paper-2/40 p-2.5 text-[11px] leading-[1.75] text-ink-3">
                这条知识点暂未挂素材，靠上面的知识卡内容即可独立备课。
              </p>
            ) : (
              <div className="space-y-1.5">
                {folks.slice(0, 6).map((f) => (
                  <Link
                    key={f.id}
                    to={`/resources/material/${f.id}`}
                    className="group flex items-center gap-2 rounded-sm border border-line-2 bg-paper-2/40 p-1.5 transition-colors hover:border-ink-4/50 hover:bg-card"
                  >
                    <div className="w-7 shrink-0 overflow-hidden rounded-xs border border-line">
                      <PatternMark spec={f.pattern} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-medium text-ink group-hover:text-cinnabar-h">
                        {f.name}
                      </div>
                      <div className="text-[9.5px] text-ink-4">{f.category}</div>
                    </div>
                    <Tag size="sm" tone={CATEGORY_TONE[f.category]}>
                      {f.region === '闽东' ? '本地' : '全国'}
                    </Tag>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="border-dashed p-3.5">
            <div className="mb-1 flex items-center gap-1.5">
              <HelpCircle size={12} className="text-ink-4" />
              <span className="text-[11.5px] font-medium text-ink-2">怎么用这张卡</span>
            </div>
            <p className="text-[11px] leading-[1.75] text-ink-3">
              它替代不了学科教材。正确用法是：先确定本科这一课要教什么，再从卡里挑一条要点或一个误区，
              作为那一处内容的入口。整节课都讲这个知识点，就跑偏了。
            </p>
            <Link to={`/curriculum?point=${point.id}`} className="mt-2.5 flex items-center gap-1 text-[11px] text-cinnabar hover:text-cinnabar-h">
              在地图中查看 <ArrowRight size={11} />
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  )
}
