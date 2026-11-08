import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Info, Layers, Plus, X } from 'lucide-react'
import type { PointId, Subject, SubjectPointLink } from '@/lib/types'
import { POINT_USE_LABEL, SUBJECT_LABEL } from '@/lib/types'
import { CHAPTER_INDEX, MATERIAL_FORM_LABEL, MEDIA_RESOURCES, materialsOfPoint } from '@/lib/catalog'
import type { ResourceItem } from '@/lib/catalog'
import { MATERIAL_MAP } from '@/data/materials'
import { POINT_MAP } from '@/data/curriculum'
import { cardOfPoint } from '@/data/knowledgeCards'
import { linksOfPoint } from '@/data/subjectPoints'
import { Button, Card, SearchInput, Tag } from '@/components/ui'

/** 可直接投屏的素材（剔除知识点卡与课例，也剔除图文条目） */
type MediaResource = Extract<ResourceItem, { kind: 'material' }>
const MEDIA: MediaResource[] = MEDIA_RESOURCES.filter(
  (r): r is MediaResource => r.kind === 'material',
)

/* ═══════════════════════════════════════════════════════════════
   知识点选择（工坊第 2 步）

   范围是**整门课**：10 章 73 个知识点全部可选，不再限于所选学科
   已登记的那几条落点。理由是教师手上那节课的主题，未必与登记表重合——
   登记表写的是「常见落点」，不是「允许清单」。

   学科在这里只做两件事：
   ① 打标——这个点是否已有本科落点（有就显示用法标签与一句 why）；
   ② 排序辅助——默认按章节顺序，不按学科亲疏重排。

   已经登记落点的知识点会多一行「本科用法」，未登记的照常可选，
   选满 3 个为止；哪个都不选也能生成。
   ═══════════════════════════════════════════════════════════════ */

export function PointPicker({  subject,
  pointIds,
  onTogglePoint,
  materialIds,
  onToggleMaterial,
  onNext,
  onBack,
  onClear,
}: {
  subject: Subject
  pointIds: string[]
  onTogglePoint: (id: string) => void
  materialIds: string[]
  onToggleMaterial: (id: string) => void
  onNext: () => void
  onBack: () => void
  onClear: () => void
}) {
  const [q, setQ] = useState('')
  const [chapter, setChapter] = useState<string>('all')
  const [onlyLinked, setOnlyLinked] = useState(false)
  const [pointsOpen, setPointsOpen] = useState(true)

  /* ── 素材选择器：全库任意素材，四个筛选维度 ── */
  const [matOpen, setMatOpen] = useState(false)
  const [mq, setMq] = useState('')
  const [mForm, setMForm] = useState<'all' | 'image' | 'text' | 'audio' | 'video'>('all')
  const [mChapter, setMChapter] = useState<string>('all')
  const [mOnlyRelated, setMOnlyRelated] = useState(false)

  /** 学科 → 知识点 → 落点，查一次即可，避免列表里反复算 */
  const linkMap = useMemo(() => {
    const m = new Map<string, SubjectPointLink>()
    for (const c of CHAPTER_INDEX) {
      for (const p of c.points) {
        const hit = linksOfPoint(p.id).find((l) => l.subject === subject)
        if (hit) m.set(p.id, hit)
      }
    }
    return m
  }, [subject])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    const out = []
    for (const c of CHAPTER_INDEX) {
      if (chapter !== 'all' && c.chapter.id !== chapter) continue
      for (const p of c.points) {
        if (onlyLinked && !linkMap.has(p.id)) continue
        if (t) {
          const hay = `${p.title}${p.summary}${p.unitTitle}${p.chapterTitle}${linkMap.get(p.id)?.why ?? ''}`
          if (!hay.toLowerCase().includes(t)) continue
        }
        out.push(p)
      }
    }
    return out
  }, [q, chapter, onlyLinked, linkMap])

  const groups = useMemo(
    () =>
      CHAPTER_INDEX.map((c) => ({
        chapter: c.chapter,
        points: filtered.filter((p) => p.chapterId === c.chapter.id),
      })).filter((g) => g.points.length > 0),
    [filtered],
  )

  const linkedTotal = linkMap.size
  const selectedPoints = pointIds
    .map((id) => POINT_MAP.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
  const auxCount = pointIds.length + materialIds.length

  /* ── 素材：全库范围 + 筛选 ──────────────────────────
     「相关」只用来提示与排序，不是可选范围的门槛：
     教师完全可能想用别的章节的图或故事来给这节课打比方。 */
  const chapterLabel = useMemo(
    () =>
      new Map(
        CHAPTER_INDEX.map((c) => [
          c.chapter.id as string,
          `${String(c.chapter.order).padStart(2, '0')} ${c.chapter.title}`,
        ]),
      ),
    [],
  )

  const relatedMaterialIds = useMemo(() => {
    const s = new Set<string>()
    for (const pid of pointIds) {
      for (const m of materialsOfPoint(pid)) s.add(m.id)
    }
    return s
  }, [pointIds])

  const mediaList = useMemo(() => {
    const t = mq.trim().toLowerCase()
    const out = MEDIA.filter((r) => {
      if (mForm !== 'all' && r.form !== mForm) return false
      if (mChapter !== 'all' && !(r.chapterIds as string[]).includes(mChapter)) return false
      if (mOnlyRelated && !relatedMaterialIds.has(r.id)) return false
      if (t) {
        const hay = `${r.title} ${r.summary} ${r.searchText}`.toLowerCase()
        if (!hay.includes(t)) return false
      }
      return true
    })
    /* 与所选知识点相关的排前面，其余保持原顺序 */
    return out.sort((a, b) => Number(relatedMaterialIds.has(b.id)) - Number(relatedMaterialIds.has(a.id)))
  }, [mq, mForm, mChapter, mOnlyRelated, relatedMaterialIds])

  const selectedMaterials = materialIds
    .map((id) => MATERIAL_MAP.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-line-2 bg-paper-2/50 px-3 py-2">
        <Info size={13} className="shrink-0 text-ink-4" />
        <p className="min-w-0 flex-1 basis-[calc(100%-22px)] text-[11.5px] leading-[1.7] text-ink-2 sm:basis-0">
          全书 {CHAPTER_INDEX.reduce((n, c) => n + c.counts.points, 0)} 个知识点都可以选，
          <span className="text-ink">不限章节、不限学科已登记的范围</span>。
          「{SUBJECT_LABEL[subject]}」已有 {linkedTotal} 个常见落点，只作提示，不影响可选范围。
        </p>
        <Button size="sm" variant="outline" onClick={onNext} className="w-full shrink-0 sm:w-auto">
          跳过，直接定课程
          <ArrowRight size={13} />
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {/* 搜索 + 章节 */}
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="搜知识点、单元或用法…"
              className="w-full sm:w-64"
            />
            <span className="text-[11px] text-ink-4">已选 {pointIds.length}/3</span>
            <button
              type="button"
              onClick={() => setOnlyLinked((v) => !v)}
              className={clsx(
                'ml-auto inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[10.5px] transition-colors',
                onlyLinked
                  ? 'border-cinnabar bg-cinnabar-p text-cinnabar'
                  : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
              )}
            >
              {onlyLinked && <Check size={10} />}
              只看本科已有落点（{linkedTotal}）
            </button>
          </div>

          {/* 章节标签一行铺开、不够就换行——不要横向滚动：
              滚动条一隐藏，后面的章节就成了「点不到」 */}
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setChapter('all')}
              className={clsx(
                'shrink-0 rounded-sm border px-2 py-1 text-[11px] transition-colors',
                chapter === 'all'
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
              )}
            >
              全部章节
            </button>
            {CHAPTER_INDEX.map((c) => {
              const on = chapter === c.chapter.id
              return (
                <button
                  key={c.chapter.id}
                  type="button"
                  onClick={() => setChapter(c.chapter.id)}
                  className={clsx(
                    'shrink-0 rounded-sm border px-2 py-1 text-[11px] transition-colors',
                    on
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
                  )}
                >
                  {String(c.chapter.order).padStart(2, '0')} {c.chapter.title}
                </button>
              )
            })}
          </div>

          {/* 列表：按章节分组 */}
          {groups.length === 0 ? (
            <Card className="px-4 py-8 text-center text-[12px] text-ink-3">
              没有匹配的知识点。换个关键词，或点「跳过，直接定课程」。
            </Card>
          ) : (
            <div className="space-y-2.5">
              {groups.map((g) => (
                <Card key={g.chapter.id} className="overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-line-2 bg-paper-2/50 px-3 py-1.5">
                    <span className="tnum shrink-0 text-[10.5px] font-semibold text-ink-3">
                      {String(g.chapter.order).padStart(2, '0')}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-[11.5px] font-semibold text-ink-2">
                      {g.chapter.title}
                    </span>
                    <span className="min-w-0 truncate text-[9.5px] text-ink-4">{g.chapter.brief}</span>
                    <span className="tnum ml-auto shrink-0 text-[10px] text-ink-4">
                      {g.points.length}
                    </span>
                  </div>
                  <div className="p-1.5">
                    {g.points.map((p) => {
                      const picked = pointIds.includes(p.id)
                      const card = cardOfPoint(p.id)
                      const link = linkMap.get(p.id)
                      return (
                        <div key={p.id}>
                          <button
                            type="button"
                            onClick={() => onTogglePoint(p.id)}
                            className={clsx(
                              'flex w-full items-start gap-2 rounded-sm border px-2.5 py-2 text-left transition-colors',
                              picked
                                ? 'border-cinnabar/50 bg-cinnabar-p'
                                : 'border-transparent hover:border-line hover:bg-paper-2/60',
                            )}
                          >
                            <span
                              className={clsx(
                                'mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-xs border',
                                picked
                                  ? 'border-cinnabar bg-cinnabar text-white'
                                  : 'border-ink-4/50 bg-card',
                              )}
                            >
                              {picked && <Check size={9} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                <span
                                  className={clsx(
                                    'text-[12px]',
                                    picked ? 'font-medium text-cinnabar-h' : 'text-ink',
                                  )}
                                >
                                  {p.title}
                                </span>
                                <span className="text-[9.5px] text-ink-4">{p.unitTitle}</span>
                                {link && (
                                  <Tag tone="indigo" size="sm">
                                    本科 · {POINT_USE_LABEL[link.use]}
                                  </Tag>
                                )}
                              </span>
                              <span className="mt-0.5 block text-[10.5px] leading-[1.65] text-ink-3">
                                {link ? link.why : p.summary}
                              </span>
                            </span>
                          </button>
                          {picked && card && (
                            <div className="mb-1 ml-6 mr-1 rounded-sm border border-indigo-l/70 bg-indigo-p/40 px-2 py-1.5">
                              <div className="mb-0.5 text-[9.5px] font-semibold text-indigo">
                                知识卡要点
                              </div>
                              <ul className="space-y-0.5">
                                {card.keyIdeas.slice(0, 3).map((k, i) => (
                                  <li key={i} className="text-[10px] leading-[1.65] text-ink-2">
                                    · {k}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 已选材料 */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          {/* 整张卡限高并内部滚动：素材选择器展开后极高，若整块 sticky
              超过视口，底部的「下一步」就再也滚不到 */}
          <Card className="p-4 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[12px] font-semibold text-ink-2">已选材料（{auxCount}）</h3>
              {auxCount > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-[10.5px] text-ink-4 hover:text-cinnabar"
                >
                  全清
                </button>
              )}
            </div>

            {/* 知识点 */}
            <div className="mb-2.5">
              <button
                type="button"
                onClick={() => setPointsOpen((v) => !v)}
                className="mb-1 flex w-full items-center justify-between text-[10.5px] font-medium text-ink-3"
              >
                <span className="inline-flex items-center gap-1">
                  <Layers size={11} />
                  知识点 {pointIds.length}
                </span>
                <ChevronDown
                  size={11}
                  className={clsx('transition-transform', pointsOpen && 'rotate-180')}
                />
              </button>
              {pointsOpen &&
                (selectedPoints.length === 0 ? (
                  <p className="rounded-md border border-dashed border-line bg-paper-2/40 px-2 py-1.5 text-[10.5px] leading-[1.7] text-ink-3">
                    未选。这一步可整段跳过。
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedPoints.map((p) => (
                      <Tag key={p.id} tone="indigo" size="sm">
                        {p.title}
                        <button type="button" onClick={() => onTogglePoint(p.id)} aria-label="移除">
                          <X size={9} />
                        </button>
                      </Tag>
                    ))}
                  </div>
                ))}
            </div>

            {/* 素材：已选 + 全库选择器 */}
            <div className="mb-2.5 border-t border-line-2 pt-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10.5px] font-medium text-ink-3">
                  教学素材 {materialIds.length}
                </span>
                {materialIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => materialIds.forEach((id) => onToggleMaterial(id))}
                    className="text-[10px] text-ink-4 hover:text-cinnabar"
                  >
                    清空素材
                  </button>
                )}
              </div>

              {selectedMaterials.length === 0 ? (
                <p className="text-[10.5px] leading-[1.7] text-ink-4">
                  未选。全库 {MEDIA.length} 条素材都可用，不必与所选知识点相关。
                </p>
              ) : (
                <div className="mb-1.5 flex flex-wrap gap-1">
                  {selectedMaterials.map((m) => (
                    <Tag key={m.id} tone="indigo" size="sm">
                      <span className="max-w-[8.5rem] truncate">{m.title}</span>
                      <button
                        type="button"
                        onClick={() => onToggleMaterial(m.id)}
                        aria-label="移除"
                      >
                        <X size={9} />
                      </button>
                    </Tag>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setMatOpen((v) => !v)}
                aria-expanded={matOpen}
                className={clsx(
                  'flex w-full items-center gap-1 rounded-sm border px-2 py-1 text-[10.5px] transition-colors',
                  matOpen
                    ? 'border-indigo/40 bg-indigo-p/60 text-indigo'
                    : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
                )}
              >
                <Plus size={11} className={clsx('transition-transform', matOpen && 'rotate-45')} />
                {matOpen ? '收起素材库' : `从素材库挑选（${MEDIA.length} 条）`}
                <ChevronDown
                  size={11}
                  className={clsx('ml-auto transition-transform', matOpen && 'rotate-180')}
                />
              </button>

              {matOpen && (
                <div className="mt-1.5 rounded-md border border-line-2 bg-paper-2/50 p-1.5">
                  <SearchInput
                    value={mq}
                    onChange={setMq}
                    placeholder="搜素材名、用途、章节…"
                    className="w-full"
                  />

                  {/* 形态 */}
                  <div className="no-scrollbar mt-1.5 flex gap-1 overflow-x-auto pb-0.5">
                    {(
                      [
                        ['all', '全部'],
                        ['image', '图片'],
                        ['text', '文本'],
                        ['audio', '音频'],
                        ['video', '视频'],
                      ] as const
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setMForm(v)}
                        className={clsx(
                          'shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] transition-colors',
                          mForm === v
                            ? 'border-ink bg-ink text-white'
                            : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 章节 + 相关性 */}
                  <div className="mt-1.5 flex items-center gap-1">
                    <select
                      value={mChapter}
                      onChange={(e) => setMChapter(e.target.value)}
                      className="h-6 min-w-0 flex-1 rounded-sm border border-line bg-card px-1 text-[10px] text-ink-2 outline-none focus:border-cinnabar/60"
                    >
                      <option value="all">全部章节</option>
                      {CHAPTER_INDEX.map((c) => (
                        <option key={c.chapter.id} value={c.chapter.id}>
                          {String(c.chapter.order).padStart(2, '0')} {c.chapter.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setMOnlyRelated((v) => !v)}
                      disabled={pointIds.length === 0}
                      title={pointIds.length === 0 ? '先选知识点，才有「相关」可言' : undefined}
                      className={clsx(
                        'shrink-0 rounded-sm border px-1.5 py-1 text-[10px] transition-colors',
                        mOnlyRelated
                          ? 'border-cinnabar bg-cinnabar-p text-cinnabar'
                          : 'border-line bg-card text-ink-3 hover:border-ink-4/50',
                        pointIds.length === 0 && 'cursor-not-allowed opacity-45',
                      )}
                    >
                      仅看相关 {relatedMaterialIds.size}
                    </button>
                  </div>

                  {/* 列表 */}
                  <div className="mt-1.5 max-h-64 space-y-0.5 overflow-y-auto pr-0.5">
                    {mediaList.length === 0 ? (
                      <p className="px-1 py-3 text-center text-[10.5px] text-ink-4">
                        没有匹配的素材，放宽条件试试。
                      </p>
                    ) : (
                      mediaList.map((r) => {
                        const picked = materialIds.includes(r.id)
                        const related = relatedMaterialIds.has(r.id)
                        const ch = r.chapterIds[0] ? chapterLabel.get(r.chapterIds[0]) : ''
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => onToggleMaterial(r.id)}
                            className={clsx(
                              'flex w-full items-start gap-1.5 rounded-sm border px-1.5 py-1 text-left transition-colors',
                              picked
                                ? 'border-indigo/40 bg-indigo-p/60'
                                : 'border-transparent hover:border-line hover:bg-card',
                            )}
                          >
                            <span
                              className={clsx(
                                'mt-0.5 grid h-3 w-3 shrink-0 place-items-center rounded-xs border',
                                picked
                                  ? 'border-indigo bg-indigo text-white'
                                  : 'border-ink-4/50 bg-card',
                              )}
                            >
                              {picked && <Check size={8} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1">
                                <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-2">
                                  {r.title}
                                </span>
                                {related && (
                                  <span className="shrink-0 text-[9px] text-cinnabar">相关</span>
                                )}
                              </span>
                              <span className="block truncate text-[9px] text-ink-4">
                                {MATERIAL_FORM_LABEL[r.form]}
                                {ch ? ` · ${ch}` : ''}
                              </span>
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>

                  <p className="mt-1 px-0.5 text-[9px] leading-[1.6] text-ink-4">
                    命中 {mediaList.length} 条 · 全库共 {MEDIA.length} 条
                  </p>
                </div>
              )}
            </div>

            <p className="mt-1.5 text-[9.5px] leading-[1.65] text-ink-4">
              素材范围是全库，不限所选知识点；「相关」只作提示与排序。图文条目较长，仍在资源库里按章节浏览。
            </p>

            {/* 底部行动区常驻可见：无论素材列表多长，都不该让「下一步」跑出屏幕 */}
            <div className="sticky bottom-0 z-10 -mx-4 -mb-4 mt-3 border-t border-line-2 bg-card px-4 pb-4 pt-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft size={13} />
                </Button>
                <Button variant="primary" block onClick={onNext}>
                  下一步：定课程
                  <ArrowRight size={14} />
                </Button>
              </div>
              <p className="mt-2 text-center text-[10px] text-ink-4">
                不选任何素材也可以生成，学科主线自己就够
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

/* 供外部提示：某个知识点在本科的落点（详情页 / 工坊都可能用到） */
export function subjectLinkOf(pointId: PointId, subject: Subject) {
  return linksOfPoint(pointId).find((l) => l.subject === subject)
}
