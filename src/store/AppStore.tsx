import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CollectionKind, Draft, GeneratedPlan, LessonPlan, LlmSettings } from '@/lib/types'
import { DEFAULT_LLM_SETTINGS } from '@/lib/types'
import { readJSON, removeKey, writeJSON } from '@/lib/storage'
import { POINT_MAP } from '@/data/curriculum'

/* ═══════════════════════════════════════════════════════════════
   全局状态：收藏 / 方案 / 草稿 / 设置
   全部落在 localStorage，刷新不丢。

   交流模块已下线：启动时清掉历史 posts 键（该键只有本站写入）。
   ═══════════════════════════════════════════════════════════════ */

interface Favorites {
  folk: string[]
  lesson: string[]
  card: string[]
}

interface PersistShape {
  favorites: Favorites
  savedPlans: GeneratedPlan[]
  drafts: Draft[]
  settings: LlmSettings
}

/**
 * 旧快照归一化。
 * savedPlans / drafts 里嵌的是整份 LessonPlan，模型加字段后老数据会缺项；
 * 这里在读的时候补齐，而不是升 namespace 版本——升版本会直接丢掉教师攒的方案。
 */
function normalizePlan(plan: LessonPlan): LessonPlan {
  const pointIds = plan.pointIds ?? []
  const chapterId =
    plan.chapterId || (pointIds[0] ? POINT_MAP.get(pointIds[0])?.chapterId ?? '' : '')
  return {
    ...plan,
    pointIds,
    chapterId,
    cardIds: plan.cardIds ?? [],
    materialIds: plan.materialIds ?? [],
  }
}

function normalizePlans(list: GeneratedPlan[]): GeneratedPlan[] {
  return list.map((g) => ({ ...g, plan: normalizePlan(g.plan) }))
}

function normalizeDrafts(list: Draft[]): Draft[] {
  return list.map((d) => ({ ...d, plan: normalizePlan(d.plan) }))
}

function loadState(): PersistShape {
  removeKey('posts')
  const fav = readJSON<Partial<Favorites>>('favorites', {})
  return {
    favorites: { folk: fav.folk ?? [], lesson: fav.lesson ?? [], card: fav.card ?? [] },
    savedPlans: normalizePlans(readJSON<GeneratedPlan[]>('savedPlans', [])),
    drafts: normalizeDrafts(readJSON<Draft[]>('drafts', [])),
    settings: { ...DEFAULT_LLM_SETTINGS, ...readJSON<Partial<LlmSettings>>('settings', {}) },
  }
}

interface AppStore extends PersistShape {
  isFavorite: (kind: CollectionKind, id: string) => boolean
  toggleFavorite: (kind: CollectionKind, id: string) => void
  savePlan: (plan: GeneratedPlan) => void
  removePlan: (id: string) => void
  saveDraft: (draft: Draft) => void
  removeDraft: (id: string) => void
  updateSettings: (s: LlmSettings) => void
  resetAll: () => void
  reload: () => void
}

const Ctx = createContext<AppStore | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistShape>(() => loadState())

  useEffect(() => {
    writeJSON('favorites', state.favorites)
  }, [state.favorites])
  useEffect(() => {
    writeJSON('savedPlans', state.savedPlans)
  }, [state.savedPlans])
  useEffect(() => {
    writeJSON('drafts', state.drafts)
  }, [state.drafts])
  useEffect(() => {
    writeJSON('settings', state.settings)
  }, [state.settings])

  const isFavorite = useCallback(
    (kind: CollectionKind, id: string) => {
      if (kind === 'plan') return state.savedPlans.some((p) => p.id === id)
      if (kind === 'card') return state.favorites.card.includes(id)
      if (kind === 'lesson') return state.favorites.lesson.includes(id)
      return state.favorites.folk.includes(id)
    },
    [state.favorites, state.savedPlans],
  )

  const toggleFavorite = useCallback((kind: CollectionKind, id: string) => {
    if (kind === 'plan') {
      setState((s) => ({ ...s, savedPlans: s.savedPlans.filter((p) => p.id !== id) }))
      return
    }
    const key = kind as keyof Favorites
    setState((s) => {
      const list = s.favorites[key]
      const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]
      return { ...s, favorites: { ...s.favorites, [key]: next } }
    })
  }, [])

  const savePlan = useCallback((plan: GeneratedPlan) => {
    setState((s) =>
      s.savedPlans.some((p) => p.id === plan.id)
        ? s
        : { ...s, savedPlans: [plan, ...s.savedPlans].slice(0, 60) },
    )
  }, [])

  const removePlan = useCallback((id: string) => {
    setState((s) => ({ ...s, savedPlans: s.savedPlans.filter((p) => p.id !== id) }))
  }, [])

  const saveDraft = useCallback((draft: Draft) => {
    setState((s) => {
      const rest = s.drafts.filter((d) => d.id !== draft.id)
      return { ...s, drafts: [draft, ...rest].slice(0, 40) }
    })
  }, [])

  const removeDraft = useCallback((id: string) => {
    setState((s) => ({ ...s, drafts: s.drafts.filter((d) => d.id !== id) }))
  }, [])

  const updateSettings = useCallback((settings: LlmSettings) => {
    setState((s) => ({ ...s, settings }))
  }, [])

  const resetAll = useCallback(() => {
    const fresh: PersistShape = {
      favorites: { folk: [], lesson: [], card: [] },
      savedPlans: [],
      drafts: [],
      settings: DEFAULT_LLM_SETTINGS,
    }
    setState(fresh)
    removeKey('posts')
  }, [])

  const reload = useCallback(() => setState(loadState()), [])

  const value = useMemo<AppStore>(
    () => ({
      ...state,
      isFavorite,
      toggleFavorite,
      savePlan,
      removePlan,
      saveDraft,
      removeDraft,
      updateSettings,
      resetAll,
      reload,
    }),
    [
      state,
      isFavorite,
      toggleFavorite,
      savePlan,
      removePlan,
      saveDraft,
      removeDraft,
      updateSettings,
      resetAll,
      reload,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp 必须在 AppProvider 内使用')
  return ctx
}

/* ── 轻量 Toast ─────────────────────────────────── */
interface ToastItem {
  id: number
  text: string
  tone: 'ok' | 'warn'
}
interface ToastApi {
  toast: (text: string, tone?: 'ok' | 'warn') => void
  items: ToastItem[]
}
const ToastCtx = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const toast = useCallback((text: string, tone: 'ok' | 'warn' = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((s) => [...s, { id, text, tone }])
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 2600)
  }, [])
  return (
    <ToastCtx.Provider value={{ toast, items }}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8">
        {items.map((t) => (
          <div
            key={t.id}
            className="animate-rise rounded-md px-4 py-2 text-[13px] font-medium shadow-md"
            style={{
              background: t.tone === 'warn' ? '#8E3329' : '#23201D',
              color: '#FDFBF7',
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast 必须在 ToastProvider 内使用')
  return ctx
}
