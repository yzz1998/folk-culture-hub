import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Search, X } from 'lucide-react'
import type { FolkCategory, PaletteName } from '@/lib/types'
import { patternSvg } from '@/lib/pattern'

/* ═══════════════════════════════════════════════════════════════
   基础组件
   ═══════════════════════════════════════════════════════════════ */

/* ── Button ─────────────────────────────────────── */
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'quiet' | 'indigo'
type ButtonSize = 'sm' | 'md' | 'lg'

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-cinnabar text-white border border-cinnabar hover:bg-cinnabar-h hover:border-cinnabar-h active:translate-y-px',
  indigo:
    'bg-indigo text-white border border-indigo hover:bg-indigo-h hover:border-indigo-h active:translate-y-px',
  outline:
    'bg-card text-ink border border-line hover:border-ink-4 hover:bg-paper-2 active:translate-y-px',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-paper-2 hover:text-ink',
  quiet: 'bg-paper-2 text-ink-2 border border-transparent hover:bg-paper-3 hover:text-ink',
}

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-sm',
  md: 'h-9.5 px-4 text-[13.5px] gap-2 rounded-md',
  lg: 'h-11 px-5 text-[14.5px] gap-2 rounded-md',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', size = 'md', block, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex select-none items-center justify-center font-medium transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-45',
        BTN_VARIANT[variant],
        BTN_SIZE[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})

/* ── Tag ────────────────────────────────────────── */
type TagTone = 'neutral' | 'cinnabar' | 'indigo' | 'ochre' | 'bamboo' | 'ink'

const TAG_TONE: Record<TagTone, string> = {
  neutral: 'bg-paper-2 text-ink-2 border-line',
  cinnabar: 'bg-cinnabar-p text-cinnabar border-cinnabar-l',
  indigo: 'bg-indigo-p text-indigo border-indigo-l',
  ochre: 'bg-ochre-l text-ochre border-ochre/25',
  bamboo: 'bg-bamboo-l text-bamboo border-bamboo/25',
  ink: 'bg-paper-3 text-ink-2 border-line',
}

export function Tag({
  children,
  tone = 'neutral',
  active,
  onClick,
  className,
  size = 'md',
}: {
  children: ReactNode
  tone?: TagTone
  active?: boolean
  onClick?: () => void
  className?: string
  size?: 'sm' | 'md'
}) {
  const base = clsx(
    'inline-flex items-center gap-1 border whitespace-nowrap transition-colors',
    size === 'sm' ? 'h-6 px-2 text-[11.5px] rounded-sm' : 'h-7 px-2.5 text-[12px] rounded-sm',
    TAG_TONE[tone],
    active && 'bg-cinnabar text-white border-cinnabar',
  )
  if (!onClick) return <span className={clsx(base, className)}>{children}</span>
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(base, 'hover:border-ink-4 cursor-pointer', className)}
    >
      {children}
    </button>
  )
}

/* ── 类别配色 ───────────────────────────────────── */
export const CATEGORY_TONE: Record<FolkCategory, TagTone> = {
  节日节庆: 'cinnabar',
  二十四节气: 'bamboo',
  民间技艺: 'ochre',
  服饰民居: 'indigo',
  饮食民俗: 'ochre',
  民间游艺: 'cinnabar',
  信仰祭祀: 'ink',
  民间文学: 'indigo',
}

/* ── Card ───────────────────────────────────────── */
export function Card({
  children,
  className,
  hover,
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  hover?: boolean
  as?: 'div' | 'article' | 'section' | 'li'
}) {
  return (
    <As
      className={clsx(
        'bg-card border border-line rounded-lg',
        hover && 'transition-all duration-200 hover:border-ink-4/60 hover:shadow-md',
        className,
      )}
    >
      {children}
    </As>
  )
}

/* ── SearchInput ────────────────────────────────── */
interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  size?: 'sm' | 'md'
}

export function SearchInput({ value, onChange, placeholder, size = 'md', className, ...rest }: SearchInputProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2 border border-line bg-card rounded-md transition-colors',
        'focus-within:border-cinnabar/60 focus-within:ring-2 focus-within:ring-cinnabar-l/60',
        size === 'sm' ? 'h-8 px-2.5' : 'h-10 px-3',
        className,
      )}
    >
      <Search size={size === 'sm' ? 13 : 15} className="shrink-0 text-ink-3" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-4"
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="清空搜索"
          className="shrink-0 text-ink-4 transition-colors hover:text-ink-2"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

/* ── Segmented ──────────────────────────────────── */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
  wrap = false,
}: {
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
  /** 选项较多时改为换行排列，避免被横向滚动藏起来 */
  wrap?: boolean
}) {
  return (
    <div
      className={clsx(
        'max-w-full items-center gap-0.5 border border-line bg-paper-2 p-0.5 rounded-md',
        wrap ? 'flex flex-wrap' : 'no-scrollbar inline-flex overflow-x-auto',
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx(
            'shrink-0 whitespace-nowrap font-medium transition-colors rounded-sm',
            size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-8 px-3 text-[12.5px]',
            value === o.value
              ? 'bg-card text-ink shadow-xs'
              : 'text-ink-3 hover:text-ink-2',
          )}
        >
          {o.label}
          {typeof o.count === 'number' && (
            <span className="ml-1 tnum text-[11px] text-ink-4">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ── EmptyState ─────────────────────────────────── */
export function EmptyState({
  title,
  desc,
  action,
  pattern = { motif: 'flower', palette: 'ochre', density: 2 },
}: {
  title: string
  desc?: string
  action?: ReactNode
  pattern?: { motif: 'flower'; palette: PaletteName; density: 1 | 2 | 3 }
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="mb-5 h-20 w-20 opacity-45"
        dangerouslySetInnerHTML={{ __html: patternSvg(pattern, 80) }}
      />
      <p className="font-serif text-[15px] font-semibold text-ink-2">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-3">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ── Drawer（移动端筛选/详情） ─────────────────── */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'bottom',
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  side?: 'bottom' | 'right'
}) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70] flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="关闭"
        onClick={onClose}
        className="animate-fade absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
      />
      <div
        className={clsx(
          'animate-rise relative z-10 flex flex-col bg-paper shadow-lg',
          side === 'bottom'
            ? 'mt-auto max-h-[86vh] w-full rounded-t-xl border-t border-line'
            : 'ml-auto h-full w-[min(92vw,420px)] border-l border-line',
        )}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
            <h3 className="font-serif text-[15px] font-semibold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="-mr-1 p-1.5 text-ink-3 transition-colors hover:text-ink"
            >
              <X size={17} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-card px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ── 区块标题 ───────────────────────────────────── */
export function SectionTitle({
  children,
  sub,
  right,
  className,
}: {
  children: ReactNode
  sub?: string
  right?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('mb-4 flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-serif text-[17px] font-semibold tracking-tight">
          <span className="inline-block h-3.5 w-[3px] shrink-0 rounded-xs bg-cinnabar" />
          {children}
        </h2>
        {sub && <p className="mt-1 pl-[11px] text-[12.5px] leading-relaxed text-ink-3">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

/* ── 进度条 ─────────────────────────────────────── */
export function Meter({ value, max, tone = 'cinnabar' }: { value: number; max: number; tone?: 'cinnabar' | 'indigo' | 'bamboo' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const bg = tone === 'cinnabar' ? 'bg-cinnabar' : tone === 'indigo' ? 'bg-indigo' : 'bg-bamboo'
  return (
    <div className="h-1 w-full overflow-hidden rounded-xs bg-paper-3">
      <div className={clsx('h-full rounded-xs transition-all duration-500', bg)} style={{ width: `${pct}%` }} />
    </div>
  )
}
