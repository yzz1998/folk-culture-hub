import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-line bg-paper-2/60">
        <Compass size={24} className="text-ink-4" />
      </div>
      <h1 className="mt-5 font-serif text-[19px] font-semibold text-ink">这一页没找到</h1>
      <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-3">
        链接可能已经失效，或者这一页被移走了。回课程脉络重新找吧。
      </p>
      <div className="mt-5 flex gap-2">
        <Link to="/curriculum">
          <Button variant="primary">回课程脉络</Button>
        </Link>
        <Link to="/">
          <Button variant="outline">回首页</Button>
        </Link>
      </div>
    </div>
  )
}
