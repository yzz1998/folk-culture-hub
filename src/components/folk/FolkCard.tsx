import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Bookmark, MapPin } from 'lucide-react'
import type { FolkItem } from '@/lib/types'
import { GRADE_SHORT } from '@/lib/types'
import { Tag, CATEGORY_TONE } from '@/components/ui'
import { PatternMark } from './PatternMark'

export function FolkCard({
  item,
  favorited,
  onToggleFavorite,
  highlight,
}: {
  item: FolkItem
  favorited?: boolean
  onToggleFavorite?: () => void
  highlight?: string
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-line bg-card transition-all duration-200 hover:border-ink-4/60 hover:shadow-md">
      <Link to={`/resources/material/${item.id}`} className="block focus-visible:outline-none">
        <div className="relative overflow-hidden border-b border-line-2 bg-paper-2">
          <div className="transition-transform duration-500 ease-out group-hover:scale-[1.04]">
            <PatternMark spec={item.pattern} />
          </div>
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
            <Tag tone={CATEGORY_TONE[item.category]} size="sm">
              {item.category}
            </Tag>
            {item.region === '闽东' && (
              <Tag tone="bamboo" size="sm">
                <MapPin size={9} /> 本地
              </Tag>
            )}
          </div>
        </div>

        <div className="px-3.5 pb-3 pt-3">
          <h3 className="font-serif text-[15.5px] font-semibold tracking-tight text-ink transition-colors group-hover:text-cinnabar-h">
            {item.name}
          </h3>
          <p className="mt-1 clamp-2 text-[12.5px] leading-relaxed text-ink-3">{item.summary}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            {item.grades.map((g) => (
              <span
                key={g}
                className="tnum rounded-xs border border-line-2 bg-paper-2 px-1.5 py-px text-[10.5px] text-ink-3"
              >
                {GRADE_SHORT[g]}
              </span>
            ))}
          </div>
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
          <Bookmark size={12.5} fill={favorited ? 'currentColor' : 'none'} />
        </button>
      )}

      {highlight && (
        <span className="pointer-events-none absolute bottom-2 right-2.5 text-[10px] text-ink-4">
          {highlight}
        </span>
      )}
    </article>
  )
}
