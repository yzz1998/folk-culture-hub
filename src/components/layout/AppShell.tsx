import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import {
  BookMarked,
  Compass,
  FolderHeart,
  LayoutGrid,
  Link2,
  Map,
  Sparkles,
  Settings as SettingsIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * 导航顺序就是平台口径：
 * 课程（主体）→ 资源（课程的材料）→ 教案（别人的迁移样例）→ 应用（落到我的课堂）→ 工坊（自己做一份）
 * 民俗不占任何一级入口，它是第 7 章里的内容。
 */
const NAV = [
  { to: '/', label: '首页', icon: Compass, end: true },
  { to: '/curriculum', label: '课程脉络', icon: Map },
  { to: '/resources', label: '资源库', icon: LayoutGrid },
  { to: '/lessons', label: '教案库', icon: BookMarked },
  { to: '/apply', label: '教学应用', icon: Link2 },
  { to: '/agent', label: '智能备课工坊', icon: Sparkles },
  { to: '/workspace', label: '我的空间', icon: FolderHeart },
]

const MOBILE_TABS = [
  { to: '/curriculum', label: '课程', icon: Map },
  { to: '/resources', label: '资源', icon: LayoutGrid },
  { to: '/agent', label: '工坊', icon: Sparkles, primary: true },
  { to: '/apply', label: '应用', icon: Link2 },
  { to: '/workspace', label: '我的', icon: FolderHeart },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-paper">
      {/* ── 桌面侧栏 ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[224px] flex-col border-r border-line bg-paper-2/60 lg:flex">
        <div className="paper-texture flex items-center gap-2.5 border-b border-line px-4 py-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-cinnabar">
            <Compass size={17} className="text-white" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <div className="font-serif text-[15px] font-semibold leading-tight tracking-tight">
              乡音课坊
            </div>
            <div className="mt-0.5 truncate text-[10.5px] text-ink-3">《人类与社会》课程教学辅助</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV.map((n) => {
            const Icon = n.icon
            const active = n.end ? pathname === n.to : pathname.startsWith(n.to)
            return (
              <NavLink
                key={n.to}
                to={n.to}
                className={clsx(
                  'relative mb-0.5 flex h-9.5 items-center gap-2.5 rounded-sm px-2.5 text-[13px] transition-colors',
                  active
                    ? 'bg-card font-medium text-ink shadow-xs'
                    : 'text-ink-2 hover:bg-card/60 hover:text-ink',
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r-xs bg-cinnabar" />
                )}
                <Icon size={15} className={active ? 'text-cinnabar' : 'text-ink-3'} />
                {n.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-line px-2 py-2.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'flex h-9 items-center gap-2.5 rounded-sm px-2.5 text-[12.5px] transition-colors',
                isActive ? 'bg-card text-ink shadow-xs' : 'text-ink-3 hover:bg-card/60 hover:text-ink-2',
              )
            }
          >
            <SettingsIcon size={14} />
            设置
          </NavLink>
          <p className="px-2.5 pt-2 text-[10.5px] leading-relaxed text-ink-4">
            《人类与社会》课程教学辅助　宁德开放大学
          </p>
        </div>
      </aside>

      {/* ── 移动顶栏 ── */}
      <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-line bg-paper/92 px-4 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-xs bg-cinnabar">
            <Compass size={14} className="text-white" strokeWidth={1.6} />
          </div>
          <span className="font-serif text-[14.5px] font-semibold tracking-tight">乡音课坊</span>
        </div>
        <NavLink to="/settings" aria-label="设置" className="p-1.5 text-ink-3">
          <SettingsIcon size={17} />
        </NavLink>
      </header>

      {/* ── 内容 ── */}
      <main className="lg:pl-[224px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-4 md:px-6 md:pt-6 lg:pb-16">
          {children}
        </div>
      </main>

      {/* ── 移动底部 Tab ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="flex items-stretch">
          {MOBILE_TABS.map((t) => {
            const Icon = t.icon
            const active = pathname.startsWith(t.to)
            return (
              <NavLink
                key={t.to}
                to={t.to}
                className={clsx(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2',
                  active ? 'text-cinnabar' : 'text-ink-3',
                )}
              >
                {t.primary ? (
                  <span
                    className={clsx(
                      'mb-0.5 grid h-8 w-8 place-items-center rounded-full transition-colors',
                      active ? 'bg-cinnabar text-white' : 'bg-paper-3 text-ink-2',
                    )}
                  >
                    <Icon size={16} />
                  </span>
                ) : (
                  <Icon size={17} />
                )}
                <span className="text-[10px] font-medium">{t.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
