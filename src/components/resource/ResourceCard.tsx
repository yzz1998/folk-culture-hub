import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  BookMarked,
  BookOpen,
  Clock,
  FileText,
  Image as ImageIcon,
  Layers,
  MapPin,
  Music,
  Video,
} from 'lucide-react'
import type { ResourceItem } from '@/lib/catalog'
import { MATERIAL_FORM_LABEL, chapterTitleOf, folkOfMaterial } from '@/lib/catalog'
import { GRADE_SHORT, POINT_USE_LABEL } from '@/lib/types'
import { POINT_MAP } from '@/data/curriculum'
import { Tag, CATEGORY_TONE } from '@/components/ui'
import { PatternMark } from '@/components/folk/PatternMark'

/* ═══════════════════════════════════════════════════════════════
   统一资源卡

   三类资源（知识点卡 / 教学素材 / 课例）共用一张卡位。
   教学素材内部不再分「民俗条目」和「素材」两类，只用形态标签说明
   打开后是什么：图文条目、图片、音频、视频、文本资料。

   左上角显示学科（迁移落点），底部显示章节（课程主体）。
   章节标签只做展示，不作为筛选入口——跨章素材挂多个标签，
   点哪个都会跳到一个不完整的结果集，反而误导。
   ═══════════════════════════════════════════════════════════════ */

export function ResourceCard({
  item,
  favorited,
  onToggleFavorite,
}: {
  item: ResourceItem
  favorited?: boolean
  onToggleFavorite?: () => void
}) {
  const entry = folkOfMaterial(item)
  const chapterLabel = item.chapterIds
    .map((id) => chapterTitleOf(id))
    .filter(Boolean)
    .join(' / ')
  const pointTitles = item.pointIds
    .map((id) => POINT_MAP.get(id)?.title)
    .filter(Boolean)
    .slice(0, 2)

  const pattern = item.kind === 'material' ? item.data.pattern : undefined
  const isEntry = item.kind === 'material' && item.form === 'entry'
  /** 素材形态；非素材为 null。收窄放在变量里，模板里不必反复判 kind */
  const form = item.kind === 'material' ? item.form : null

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-card transition-all duration-200 hover:border-ink-4/60 hover:shadow-md">
      <Link to={item.route} className="flex flex-1 flex-col focus-visible:outline-none">
        {/* 缩略区：有纹样的素材给图，其余给类型条 */}
        {pattern ? (
          <div className="relative overflow-hidden border-b border-line-2 bg-paper-2">
            <div className="transition-transform duration-500 ease-out group-hover:scale-[1.04]">
              <PatternMark spec={pattern} />
            </div>
            <div className="absolute left-2 top-2 flex items-center gap-1">
              {isEntry ? (
                <Tag tone={entry ? CATEGORY_TONE[entry.category] : 'neutral'} size="sm">
                  {entry?.category ?? MATERIAL_FORM_LABEL.entry}
                </Tag>
              ) : (
                <Tag tone="ochre" size="sm">
                  {form ? MATERIAL_FORM_LABEL[form] : ''}
                </Tag>
              )}
            </div>
          </div>
        ) : (
          <div
            className={clsx(
              'flex items-center gap-2 border-b border-line-2 px-3 py-2.5',
              item.kind === 'card' ? 'bg-indigo-p/40' : 'bg-paper-2/70',
            )}
          >
            <KindIcon item={item} />
            <span className="text-[10.5px] font-medium tracking-wide text-ink-3">
              {kindLabelOf(item)}
            </span>
            {item.kind === 'lesson' && (
              <>
                <span className="text-line">·</span>
                <span className="tnum text-[10.5px] text-ink-4">
                  {GRADE_SHORT[item.data.gradeBand]}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10.5px] text-ink-4">
                  <Clock size={9} />
                  {item.data.duration}′
                </span>
              </>
            )}
            {item.kind === 'card' && item.data.status === 'draft' && (
              <Tag tone="ochre" size="sm">
                待完善
              </Tag>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col px-3 py-2.5">
          <div className="mb-1.5 flex flex-wrap items-center gap-1">
            {item.subjectIds.slice(0, 2).map((s) => (
              <span
                key={s}
                className="rounded-xs border border-cinnabar-l bg-cinnabar-p/60 px-1.5 py-px text-[10px] text-cinnabar"
              >
                {s}
              </span>
            ))}
            {item.subjectIds.length > 2 && (
              <span className="text-[10px] text-ink-4">+{item.subjectIds.length - 2}</span>
            )}
            {entry?.region === '闽东' && (
              <span className="inline-flex items-center gap-0.5 rounded-xs border border-bamboo/25 bg-bamboo-l px-1.5 py-px text-[10px] text-bamboo">
                <MapPin size={8} /> 本地
              </span>
            )}
            {!isEntry && item.kind === 'material' && (
              <span className="rounded-xs bg-paper-2 px-1.5 py-px text-[10px] text-ink-4">
                {MATERIAL_FORM_LABEL[item.form]}
              </span>
            )}
          </div>

          <h3 className="font-serif text-[14.5px] font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-cinnabar-h">
            {item.title}
          </h3>
          <p className="mt-1 clamp-2 flex-1 text-[11.5px] leading-relaxed text-ink-3">
            {item.summary}
          </p>

          {pointTitles.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-ink-4">
              <span>知识点</span>
              {pointTitles.map((t) => (
                <span key={t} className="rounded-xs bg-paper-2 px-1 py-px">
                  {t}
                </span>
              ))}
              {item.pointIds.length > 2 && <span>+{item.pointIds.length - 2}</span>}
            </div>
          )}

          {chapterLabel && (
            <div className="mt-1.5 border-t border-line-2 pt-1.5 text-[10px] text-ink-4">
              {chapterLabel}
            </div>
          )}
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onToggleFavorite()
          }}
          aria-label={favorited ? '取消收藏' : '收藏'}
          className={clsx(
            'absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-sm border transition-all',
            favorited
              ? 'border-cinnabar bg-cinnabar text-white'
              : 'border-line/80 bg-card/85 text-ink-3 backdrop-blur-sm hover:text-cinnabar',
          )}
        >
          <BookMarked size={12.5} fill={favorited ? 'currentColor' : 'none'} />
        </button>
      )}
    </article>
  )
}

/* ── 小工具 ───────────────────────────────────── */

function kindLabelOf(item: ResourceItem): string {
  if (item.kind === 'material') return MATERIAL_FORM_LABEL[item.form]
  if (item.kind === 'card') return '知识点卡'
  return '课例'
}

function KindIcon({ item }: { item: ResourceItem }) {
  const cls = item.kind === 'card' ? 'text-indigo/70' : 'text-ink-4'
  if (item.kind === 'card') return <Layers size={13} className={cls} />
  if (item.kind === 'lesson') return <BookMarked size={13} className={cls} />
  if (item.form === 'image') return <ImageIcon size={13} className={cls} />
  if (item.form === 'audio') return <Music size={13} className={cls} />
  if (item.form === 'video') return <Video size={13} className={cls} />
  if (item.form === 'text') return <FileText size={13} className={cls} />
  return <BookOpen size={13} className={cls} />
}

/** 用途标签，知识点卡详情与资源库共用，避免两处各写一套 */
export function UseTag({ use }: { use: keyof typeof POINT_USE_LABEL }) {
  return (
    <Tag size="sm" tone="indigo">
      {POINT_USE_LABEL[use]}
    </Tag>
  )
}
