import clsx from 'clsx'
import type { PatternSpec } from '@/lib/types'
import { patternSvg } from '@/lib/pattern'

/** 剪纸纹样展示：用 dangerouslySetInnerHTML 内联 SVG，避免额外网络请求 */
export function PatternMark({
  spec,
  className,
  dim,
}: {
  spec: PatternSpec
  className?: string
  /** 0-1，降低不透明度用于背景装饰 */
  dim?: number
}) {
  return (
    <div
      aria-hidden
      className={clsx('aspect-square w-full overflow-hidden', className)}
      style={dim ? { opacity: dim } : undefined}
      dangerouslySetInnerHTML={{ __html: patternSvg(spec, '100%') }}
    />
  )
}
