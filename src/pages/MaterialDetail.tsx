import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  ChevronRight,
  FileText,
  Info,
  Images,
  MapPin,
  Music,
  Sparkles,
  Target,
  Video,
} from 'lucide-react'
import type { FolkItem, Material } from '@/lib/types'
import { GRADE_LABEL, GRADE_SHORT } from '@/lib/types'
import { FOLK, getFolk } from '@/data/folk'
import { MATERIAL_MAP, materialsByFolk } from '@/data/materials'
import { POINT_MAP } from '@/data/curriculum'
import { lessonsByFolk } from '@/data/lessons'
import { MATERIAL_FORM_LABEL } from '@/lib/catalog'
import { Button, Card, Tag, CATEGORY_TONE, SectionTitle, EmptyState } from '@/components/ui'
import { PatternMark } from '@/components/folk/PatternMark'
import { useApp, useToast } from '@/store/AppStore'
import NotFound from './NotFound'

/* ═══════════════════════════════════════════════════════════════
   教学素材详情

   素材只有一种身份，两种形态：
   - 图文条目：原「民俗条目」，有文化内涵、来历、观察点，本身就是一份可讲的内容
   - 媒体素材：图片 / 音频 / 视频 / 文本，挂靠某条图文条目，用于投屏或朗读

   两条共用 /resources/material/:id，靠 id 落在哪张表决定渲染哪一版。
   旧链 /resources/folk/:id 在路由层重定向过来，已有收藏与分享链接不失效。
   ═══════════════════════════════════════════════════════════════ */

export default function MaterialDetail() {
  const { id } = useParams()
  const entry = getFolk(id)
  if (entry) return <EntryMaterial item={entry} />
  const media = id ? MATERIAL_MAP.get(id) : undefined
  if (media) return <MediaMaterial item={media} />
  return <NotFound />
}

/* ── 形态一：图文条目 ───────────────────────────── */

function EntryMaterial({ item }: { item: FolkItem }) {
  const navigate = useNavigate()
  const { isFavorite, toggleFavorite } = useApp()
  const { toast } = useToast()

  const lessons = lessonsByFolk(item.id)
  const materials = materialsByFolk(item.id)
  const points = item.pointIds
    .map((pid) => POINT_MAP.get(pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const related = FOLK.filter((f) => f.id !== item.id && f.category === item.category).slice(0, 4)
  const fav = isFavorite('folk', item.id)

  return (
    <div className="animate-fade">
      <button
        type="button"
        onClick={() => navigate('/resources')}
        className="mb-4 inline-flex items-center gap-1 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft size={13} />
        返回资源库
      </button>

      {/* Hero */}
      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="grid md:grid-cols-[300px_1fr]">
          <div className="relative border-b border-line-2 bg-paper-2 md:border-b-0 md:border-r">
            <PatternMark spec={item.pattern} />
          </div>

          <div className="flex flex-col justify-center p-5 md:p-7">
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag tone="indigo" size="sm">
                教学素材 · {MATERIAL_FORM_LABEL.entry}
              </Tag>
              <Tag tone={CATEGORY_TONE[item.category]} size="sm">
                {item.category}
              </Tag>
              {item.region === '闽东' ? (
                <Tag tone="bamboo" size="sm">
                  <MapPin size={9} /> 闽东本地资源
                </Tag>
              ) : (
                <Tag size="sm">全国通行</Tag>
              )}
              {item.grades.map((g) => (
                <Tag key={g} size="sm">
                  {GRADE_SHORT[g]}
                </Tag>
              ))}
            </div>

            <h1 className="mt-3 font-serif text-[24px] font-semibold tracking-tight md:text-[29px]">
              {item.name}
            </h1>
            <p className="mt-2 max-w-[52ch] text-[13.5px] leading-[1.85] text-ink-2">
              {item.summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link to={points[0] ? `/agent?point=${points[0].id}` : '/agent'}>
                <Button variant="primary">
                  <Sparkles size={14} />
                  用它备一节课
                </Button>
              </Link>
              <Button
                variant={fav ? 'primary' : 'outline'}
                onClick={() => {
                  toggleFavorite('folk', item.id)
                  toast(fav ? '已取消收藏' : '已收藏')
                }}
              >
                <Bookmark size={14} fill={fav ? 'currentColor' : 'none'} />
                {fav ? '已收藏' : '收藏'}
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line-2 pt-3 text-[11.5px] text-ink-3">
              <span>
                可落到：
                <span className="text-ink-2">{item.subjects.join('、')}</span>
              </span>
              <span>
                适用年级：
                <span className="text-ink-2">
                  {item.grades.map((g) => GRADE_LABEL[g].replace(' 年级', '')).join(' / ')} 年级
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_290px]">
        {/* 主栏 */}
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle sub="它为什么值得讲，比它是什么更重要">内容说明</SectionTitle>
            <p className="prose-paper">{item.culturalMeaning}</p>
          </Card>

          <Card className="p-5">
            <SectionTitle sub="源流脉络，便于回答学生「这是从哪来的」">来历</SectionTitle>
            <p className="prose-paper">{item.origin}</p>
          </Card>

          <Card className="p-5">
            <SectionTitle
              sub="三个现成的提问，可以直接搬进课堂，也可以作为探究起点"
              right={<Target size={15} className="text-ink-4" />}
            >
              课堂观察点
            </SectionTitle>
            <ol className="space-y-2.5">
              {item.classroomHooks.map((h, i) => (
                <li key={i} className="flex gap-2.5 rounded-md border border-line-2 bg-paper-2/60 p-3">
                  <span className="tnum mt-px font-serif text-[12px] font-semibold text-cinnabar">
                    0{i + 1}
                  </span>
                  <span className="text-[13px] leading-[1.75] text-ink-2">{h}</span>
                </li>
              ))}
            </ol>
          </Card>

          {item.caution && (
            <div className="flex gap-2.5 rounded-lg border border-ochre/25 bg-ochre-l/50 p-4">
              <Info size={15} className="mt-0.5 shrink-0 text-ochre" />
              <div>
                <div className="text-[12px] font-semibold text-ochre">教学提醒</div>
                <p className="mt-1 text-[12.5px] leading-[1.75] text-ink-2">{item.caution}</p>
              </div>
            </div>
          )}

          {/* 关联课例 */}
          <div>
            <SectionTitle
              sub={`已有 ${lessons.length} 份课例用到这条素材`}
              right={
                <Link
                  to="/lessons"
                  className="inline-flex items-center gap-1 text-[12px] text-cinnabar hover:text-cinnabar-h"
                >
                  全部课例 <ArrowRight size={12} />
                </Link>
              }
            >
              关联课例
            </SectionTitle>
            {lessons.length === 0 ? (
              <EmptyState title="还没有基于它的现成课例" desc="可以在智能备课工坊里现场生成一份。" />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {lessons.map((l) => (
                  <Link key={l.id} to={`/lessons/${l.id}`}>
                    <Card hover className="flex h-full items-start gap-3 p-3.5">
                      <BookOpen size={15} className="mt-0.5 shrink-0 text-indigo/70" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium leading-snug text-ink">{l.title}</div>
                        <div className="mt-1 text-[11px] text-ink-3">
                          {GRADE_SHORT[l.gradeBand]} · {l.subject} · {l.duration} 分钟
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 侧栏 */}
        <aside className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-2.5 text-[12px] font-semibold text-ink-2">关联课程知识点</h3>
            {points.length === 0 ? (
              <p className="text-[11.5px] text-ink-3">暂无直接关联，可在备课工坊中自行指定。</p>
            ) : (
              <div className="space-y-1.5">
                {points.map((p) => (
                  <Link
                    key={p.id}
                    to={`/curriculum?point=${p.id}`}
                    className="group flex items-start justify-between gap-2 rounded-sm border border-line-2 bg-paper-2/50 px-2.5 py-2 transition-colors hover:border-ink-4/50 hover:bg-card"
                  >
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-ink group-hover:text-cinnabar-h">
                        {p.title}
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-ink-4">{p.chapterTitle}</div>
                    </div>
                    <ChevronRight size={12} className="mt-1 shrink-0 text-ink-4" />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
              <Images size={13} className="text-ink-4" />
              配套素材（{materials.length}）
            </h3>
            <div className="space-y-1">
              {materials.map((m) => (
                <Link
                  key={m.id}
                  to={`/resources/material/${m.id}`}
                  className="flex items-center justify-between gap-2 rounded-sm px-1.5 py-1.5 text-[11.5px] text-ink-2 transition-colors hover:bg-paper-2"
                >
                  <span className="min-w-0 truncate">{m.title}</span>
                  <span className="shrink-0 text-[10px] text-ink-4">{MATERIAL_FORM_LABEL[m.type]}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-2.5 text-[12px] font-semibold text-ink-2">主题标签</h3>
            <div className="flex flex-wrap gap-1.5">
              {item.themes.map((t) => (
                <Tag key={t} size="sm">
                  {t}
                </Tag>
              ))}
            </div>
            <h3 className="mb-2 mt-4 text-[12px] font-semibold text-ink-2">检索关键词</h3>
            <p className="text-[11px] leading-relaxed text-ink-3">{item.keywords.join('　')}</p>
          </Card>
        </aside>
      </div>

      {/* 同类推荐 */}
      {related.length > 0 && (
        <section className="mt-8">
          <SectionTitle sub={`同属「${item.category}」`}>还可以看看</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/resources/material/${r.id}`}
                className="group overflow-hidden rounded-lg border border-line bg-card transition-all hover:border-ink-4/60 hover:shadow-md"
              >
                <div className="overflow-hidden border-b border-line-2">
                  <div className="transition-transform duration-500 group-hover:scale-105">
                    <PatternMark spec={r.pattern} />
                  </div>
                </div>
                <div className="p-2.5">
                  <h4 className="font-serif text-[13.5px] font-semibold group-hover:text-cinnabar-h">
                    {r.name}
                  </h4>
                  <p className="mt-0.5 clamp-2 text-[11px] leading-relaxed text-ink-3">{r.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/* ── 形态二：媒体素材 ───────────────────────────── */

const MEDIA_ICON = {
  image: Images,
  audio: Music,
  video: Video,
  text: FileText,
} as const

const MEDIA_HINT: Record<Material['type'], string> = {
  image: '按原始尺寸使用即可，矢量渲染，投影放大不失真。',
  audio: '音频条目为占位登记，需替换为本校可用的录音后再播放。',
  video: '视频条目为占位登记，需替换为本校拍摄的素材后再播放。',
  text: '全文可直接朗读，也可截取其中一段作为课堂阅读材料。',
}

function MediaMaterial({ item }: { item: Material }) {
  const navigate = useNavigate()
  const entry = getFolk(item.folkId)
  const points = (entry?.pointIds ?? [])
    .map((pid) => POINT_MAP.get(pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const Icon = MEDIA_ICON[item.type]

  return (
    <div className="animate-fade">
      <button
        type="button"
        onClick={() => navigate('/resources')}
        className="mb-4 inline-flex items-center gap-1 text-[12.5px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft size={13} />
        返回资源库
      </button>

      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="grid md:grid-cols-[300px_1fr]">
          <div className="relative flex items-center justify-center border-b border-line-2 bg-paper-2 md:border-b-0 md:border-r">
            {item.pattern ? (
              <PatternMark spec={item.pattern} />
            ) : (
              <div className="flex flex-col items-center gap-2 py-16 text-ink-4">
                <Icon size={30} />
                <span className="text-[11px]">{MATERIAL_FORM_LABEL[item.type]}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center p-5 md:p-7">
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag tone="indigo" size="sm">
                教学素材 · {MATERIAL_FORM_LABEL[item.type]}
              </Tag>
              {item.status === 'placeholder' && (
                <Tag tone="ochre" size="sm">
                  待替换为本校素材
                </Tag>
              )}
              {entry && <Tag size="sm">{entry.category}</Tag>}
              {item.gradeBands?.map((g) => (
                <Tag key={g} size="sm">
                  {GRADE_SHORT[g]}
                </Tag>
              ))}
            </div>

            <h1 className="mt-3 font-serif text-[22px] font-semibold tracking-tight md:text-[26px]">
              {item.title}
            </h1>
            <p className="mt-2 max-w-[52ch] text-[13px] leading-[1.85] text-ink-2">{item.desc}</p>

            {entry && (
              <div className="mt-4">
                <Link
                  to={`/resources/material/${entry.id}`}
                  className="inline-flex items-center gap-1 rounded-sm border border-line bg-paper-2/60 px-2.5 py-1.5 text-[12px] text-ink-2 transition-colors hover:border-ink-4/60 hover:text-ink"
                >
                  <BookOpen size={12} />
                  所属条目《{entry.name}》
                  <ChevronRight size={11} className="text-ink-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_290px]">
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle sub="这条素材在课堂上承担什么">用途</SectionTitle>
            <p className="prose-paper">{item.usage || '未标注具体用途，按素材类型正常使用即可。'}</p>
            <p className="mt-3 border-t border-line-2 pt-3 text-[11.5px] leading-[1.75] text-ink-3">
              {MEDIA_HINT[item.type]}
              {item.duration ? `建议时长 ${item.duration}。` : ''}
            </p>
          </Card>

          {item.type === 'text' && item.body && (
            <Card className="p-5">
              <SectionTitle sub="可直接朗读或截取片段">全文</SectionTitle>
              <div className="space-y-3">
                {item.body.split('\n\n').map((para, i) => (
                  <p key={i} className="prose-paper">
                    {para}
                  </p>
                ))}
              </div>
            </Card>
          )}

          {item.status === 'placeholder' && (
            <div className="flex gap-2.5 rounded-lg border border-ochre/25 bg-ochre-l/50 p-4">
              <Info size={15} className="mt-0.5 shrink-0 text-ochre" />
              <div>
                <div className="text-[12px] font-semibold text-ochre">这是一条占位登记</div>
                <p className="mt-1 text-[12.5px] leading-[1.75] text-ink-2">
                  平台没有该素材的版权版本，因此不伪造播放。教师可挂载本校拍摄或已授权的素材后启用；
                  在此之前，这一条只用于提示「这里需要一份什么样的材料」。
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-2.5 text-[12px] font-semibold text-ink-2">关联课程知识点</h3>
            {points.length === 0 ? (
              <p className="text-[11.5px] text-ink-3">暂未挂到具体知识点。</p>
            ) : (
              <div className="space-y-1.5">
                {points.map((p) => (
                  <Link
                    key={p.id}
                    to={`/curriculum?point=${p.id}`}
                    className="group flex items-start justify-between gap-2 rounded-sm border border-line-2 bg-paper-2/50 px-2.5 py-2 transition-colors hover:border-ink-4/50 hover:bg-card"
                  >
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-ink group-hover:text-cinnabar-h">
                        {p.title}
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-ink-4">{p.chapterTitle}</div>
                    </div>
                    <ChevronRight size={12} className="mt-1 shrink-0 text-ink-4" />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {entry && (
            <Card className="p-4">
              <h3 className="mb-2.5 text-[12px] font-semibold text-ink-2">同一主题的其它素材</h3>
              <div className="space-y-1">
                {materialsByFolk(entry.id)
                  .filter((m) => m.id !== item.id)
                  .map((m) => (
                    <Link
                      key={m.id}
                      to={`/resources/material/${m.id}`}
                      className="flex items-center justify-between gap-2 rounded-sm px-1.5 py-1.5 text-[11.5px] text-ink-2 transition-colors hover:bg-paper-2"
                    >
                      <span className="min-w-0 truncate">{m.title}</span>
                      <span className="shrink-0 text-[10px] text-ink-4">
                        {MATERIAL_FORM_LABEL[m.type]}
                      </span>
                    </Link>
                  ))}
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}
