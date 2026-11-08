import type { ReactNode } from 'react'
import clsx from 'clsx'

export function PageHeader({
  eyebrow,
  title,
  desc,
  right,
  className,
}: {
  eyebrow?: string
  title: string
  desc?: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <header className={clsx('mb-5 md:mb-6', className)}>
      {eyebrow && (
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-cinnabar">
          {eyebrow}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-serif text-[21px] font-semibold tracking-tight text-ink md:text-[25px]">
            {title}
          </h1>
          {desc && (
            <p className="mt-1.5 max-w-[68ch] text-[12.5px] leading-[1.8] text-ink-3 md:text-[13px]">
              {desc}
            </p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  )
}
