import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { Archive, ChevronDown, ChevronRight, Compass, Info, Map as MapIcon, Sparkles } from 'lucide-react'
import { ALL_POINTS, CURRICULUM, POINT_MAP } from '@/data/curriculum'
import {
  COURSE_SCALE,
  cardOfPoint,
  chapterIndexOf,
  folkOfPoint,
  lessonsOfPoint,
  subjectIndexOf,
} from '@/lib/catalog'
import { linksOfPoint } from '@/data/subjectPoints'
import { PRIMARY_SUBJECT_INDEX } from '@/lib/catalog'
import type { Subject } from '@/lib/types'
import { GRADE_SHORT, POINT_USE_LABEL, SUBJECT_LABEL } from '@/lib/types'
import { Button, Card, SearchInput, Tag } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { PatternMark } from '@/components/folk/PatternMark'

/* ═══════════════════════════════════════════════════════════════
   课程脉络

   这是全站的主体页：《人类与社会》十章 → 单元 → 知识点，一页贯通。
   平台的一切都从这里生出来——资源库按它归类，教案库按它归位，
   教学应用是它的落点，备课工坊从它起步。

   右侧详情回答「这个知识点能落到哪门课的哪个内容」。
   学科视角筛选不是主轴，而是把全书按一门课点亮：选中后只有
   这门课接得住的知识点保持清晰，其余压暗，避免「全书都在讲我这门课」的错觉。
   ═══════════════════════════════════════════════════════════════ */

export default function CurriculumMap() {
  const [params, setParams] = useSearchParams()
  const focusPoint = params.get('point')
  const focusSubject = params.get('subject')

  const [q, setQ] = useState('')
  const [subject, setSubject] = useState<Subject | 'all'>(
    PRIMARY_SUBJECT_INDEX.some((s) => s.subject === focusSubject)
      ? (focusSubject as Subject)
      : 'all',
  )
  const [openChapters, setOpenChapters] = useState<string[]>(() => {
    const p = focusPoint ? POINT_MAP.get(focusPoint) : undefined
    return p ? [p.chapterId] : ['ch1']
  })
  const [selected, setSelected] = useState<string | null>(focusPoint)

  useEffect(() => {
    if (focusPoint) {
      const p = POINT_MAP.get(focusPoint)
      if (p) {
        setSelected(focusPoint)
        setOpenChapters((s) => (s.includes(p.chapterId) ? s : [...s, p.chapterId]))
      }
    }
  }, [focusPoint])

  const matched = useMemo(() => {
    if (!q.trim()) return null
    const t = q.trim().toLowerCase()
    return new Set(
      ALL_POINTS.filter(
        (p) => p.title.toLowerCase().includes(t) || p.summary.toLowerCase().includes(t),
      ).map((p) => p.id),
    )
  }, [q])

  /** 选中某学科时，这门课接得住的知识点集合 */
  const reachable = useMemo(() => {
    if (subject === 'all') return null
    const idx = subjectIndexOf(subject)
    return idx ? new Set(idx.points.map((p) => p.id)) : new Set<string>()
  }, [subject])

  const stats = useMemo(() => {
    const ready = ALL_POINTS.filter((p) => p.status === 'ready').length
    return { total: ALL_POINTS.length, ready, planned: ALL_POINTS.length - ready }
  }, [])

  const point = selected ? POINT_MAP.get(selected) : undefined
  const card = point ? cardOfPoint(point.id) : undefined
  const hooks = point ? folkOfPoint(point.id) : []
  const relatedLessons = point ? lessonsOfPoint(point.id) : []
  const uses = point ? linksOfPoint(point.id) : []
  const chapterIdx = point ? chapterIndexOf(point.chapterId) : undefined

  function pickSubject(s: Subject | 'all') {
    setSubject(s)
    const next = new URLSearchParams(params)
    if (s === 'all') next.delete('subject')
    else next.set('subject', s)
    setParams(next, { replace: true })
    if (s !== 'all') {
      const idx = subjectIndexOf(s)
      if (idx && idx.points.length > 0) {
        setOpenChapters((prev) => [...new Set([...prev, ...idx.points.map((p) => p.chapterId)])])
      }
    }
  }

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="课程脉络"
        title="《人类与社会》十章"
        desc={`共 ${COURSE_SCALE.chapters} 章 / ${COURSE_SCALE.units} 单元 / ${stats.total} 个知识点，每个知识点配一张知识卡。这是课程本身的结构：资源、教案与备课都从这里长出来。`}
        right={
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="搜知识点…"
            className="w-full sm:w-52"
          />
        }
      />

      {/* 出现方式说明 */}
      <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-indigo-l/70 bg-indigo-p/40 p-3">
        <MapIcon size={14} className="mt-0.5 shrink-0 text-indigo/70" />
        <p className="text-[11.5px] leading-[1.75] text-ink-2">
          <span className="font-medium text-ink">这是课程主体。</span>
          十章按族群、生计、信仰、制度到现代社会的顺序展开，知识点是最小单位。
          学完一章后想知道「它能用在我教的哪门课」，点右侧详情里的「可落到的课堂」，
          或直接去
          <Link to="/apply" className="mx-0.5 text-cinnabar hover:text-cinnabar-h">
            教学应用
          </Link>
          按学科看。
        </p>
      </div>

      {/* 概览 */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { l: '章节', n: COURSE_SCALE.chapters },
          { l: '知识点', n: stats.total },
          { l: '知识点卡', n: COURSE_SCALE.cards },
          { l: '迁移落点', n: COURSE_SCALE.applies },
        ].map((s) => (
          <Card key={s.l} className="px-3.5 py-2.5">
            <div className="tnum font-serif text-[18px] font-semibold leading-none">{s.n}</div>
            <div className="mt-1 text-[10.5px] text-ink-3">{s.l}</div>
          </Card>
        ))}
      </div>

      {/* 学科视角 */}
      <div className="mb-4">
        <div className="mb-1.5 flex flex-wrap items-baseline gap-1.5">
          <span className="text-[11px] font-medium tracking-wide text-ink-3">落到哪门课</span>
          <span className="text-[10px] text-ink-4">选中后只点亮这门课接得住的知识点</span>
          {subject !== 'all' && (
            <span className="text-[11px] text-cinnabar">
              {SUBJECT_LABEL[subject]}可承接 {reachable?.size ?? 0} 个
            </span>
          )}
        </div>
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          <button
            type="button"
            onClick={() => pickSubject('all')}
            className={clsx(
              'shrink-0 rounded-sm border px-2.5 py-1 text-[11px] transition-colors',
              subject === 'all'
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-card text-ink-2 hover:border-ink-4/60',
            )}
          >
            全书
          </button>
          {PRIMARY_SUBJECT_INDEX.map((s) => (
            <button
              key={s.subject}
              type="button"
              onClick={() => pickSubject(s.subject)}
              title={`本科可承接 ${s.counts.points} 个知识点`}
              className={clsx(
                'flex shrink-0 items-center gap-1 rounded-sm border px-2.5 py-1 text-[11px] transition-colors',
                subject === s.subject
                  ? 'border-cinnabar bg-cinnabar text-white'
                  : 'border-line bg-card text-ink-2 hover:border-ink-4/60',
              )}
            >
              {SUBJECT_LABEL[s.subject]}
              <span
                className={clsx(
                  'tnum text-[10px]',
                  subject === s.subject ? 'text-white/75' : 'text-ink-4',
                )}
              >
                {s.counts.points}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_336px]">
        {/* 树 */}
        <div className="space-y-2">
          {CURRICULUM.map((ch) => {
            const open = openChapters.includes(ch.id)
            const chIdx = chapterIndexOf(ch.id)
            const chapterMatchCount = matched
              ? ch.units.flatMap((u) => u.points).filter((p) => matched.has(p.id)).length
              : 0
            if (matched && chapterMatchCount === 0) return null

            const reachInChapter = reachable
              ? ch.units.flatMap((u) => u.points).filter((p) => reachable.has(p.id)).length
              : 0

            return (
              <Card key={ch.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setOpenChapters((s) => (open ? s.filter((x) => x !== ch.id) : [...s, ch.id]))
                  }
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-paper-2/50"
                >
                  <span className="tnum shrink-0 font-serif text-[15px] font-semibold text-ink-4">
                    {String(ch.order).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-[14px] font-semibold tracking-tight text-ink">
                      {ch.title}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-ink-4">
                      <span>
                        {ch.units.length} 单元 ·{' '}
                        {ch.units.reduce((a, u) => a + u.points.length, 0)} 个知识点
                      </span>
                      {chIdx && (
                        <>
                          <span className="text-line">·</span>
                          <span>卡片 {chIdx.counts.cards}</span>
                          <span className="text-line">·</span>
                          <span>资源 {chIdx.counts.resources}</span>
                          <span className="text-line">·</span>
                          <span>课例 {chIdx.counts.lessons}</span>
                        </>
                      )}
                      {reachable && reachInChapter > 0 && (
                        <Tag size="sm" tone="cinnabar">
                          本科可承接 {reachInChapter}
                        </Tag>
                      )}
                    </div>
                  </div>
                  {open ? (
                    <ChevronDown size={15} className="shrink-0 text-ink-3" />
                  ) : (
                    <ChevronRight size={15} className="shrink-0 text-ink-3" />
                  )}
                </button>

                {open && (
                  <div className="animate-fade border-t border-line-2 bg-paper-2/25 px-3.5 py-3">
                    <p className="mb-2.5 rounded-sm border-l-2 border-cinnabar/40 bg-card/70 px-2.5 py-1.5 text-[11.5px] leading-[1.7] text-ink-2">
                      <span className="font-medium text-cinnabar">本章核心问题　</span>
                      {ch.coreQuestion}
                    </p>

                    {ch.units.map((u) => (
                      <div key={u.id} className="mb-2.5 last:mb-0">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="h-1 w-1 rotate-45 bg-ink-4" />
                          <span className="text-[11.5px] font-medium text-ink-2">{u.title}</span>
                        </div>
                        <div className="ml-2.5 space-y-1 border-l border-line pl-2.5">
                          {u.points
                            .filter((p) => !matched || matched.has(p.id))
                            .map((p) => {
                              const isPlanned = p.status === 'planned'
                              const active = selected === p.id
                              const dimmed = reachable ? !reachable.has(p.id) : false
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setSelected(p.id)}
                                  className={clsx(
                                    'group flex w-full items-start gap-2 rounded-sm border px-2.5 py-1.5 text-left transition-colors',
                                    active
                                      ? 'border-cinnabar/50 bg-cinnabar-p'
                                      : 'border-transparent hover:border-line hover:bg-card',
                                    isPlanned && !active && 'opacity-60',
                                    dimmed && !active && 'opacity-35',
                                  )}
                                >
                                  {isPlanned ? (
                                    <Archive size={12} className="mt-1 shrink-0 text-ink-4" />
                                  ) : (
                                    <span
                                      className={clsx(
                                        'mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full',
                                        dimmed ? 'bg-ink-4' : 'bg-bamboo/70',
                                      )}
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span
                                        className={clsx(
                                          'text-[12px]',
                                          active ? 'font-medium text-cinnabar-h' : 'text-ink',
                                        )}
                                      >
                                        {p.title}
                                      </span>
                                      {isPlanned && (
                                        <span className="rounded-xs border border-line bg-paper-2 px-1 text-[9.5px] text-ink-4">
                                          待建
                                        </span>
                                      )}
                                      {p.gradeBand && (
                                        <span className="tnum text-[9.5px] text-ink-4">
                                          {GRADE_SHORT[p.gradeBand]}
                                        </span>
                                      )}
                                      {reachable?.has(p.id) && (
                                        <span className="rounded-xs bg-cinnabar-p px-1 text-[9.5px] text-cinnabar">
                                          可承接
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}

          {matched && matched.size === 0 && (
            <Card className="px-4 py-10 text-center">
              <p className="text-[13px] text-ink-2">没有匹配的知识点</p>
              <p className="mt-1 text-[11.5px] text-ink-3">
                试试「家庭」「城市」「信仰」这类关键词。
              </p>
            </Card>
          )}
        </div>

        {/* 右侧详情 */}
        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          {!point ? (
            <Card className="p-5">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-line bg-paper-2/60">
                <Compass size={18} className="text-ink-4" />
              </div>
              <p className="mt-3 text-center text-[12.5px] leading-[1.7] text-ink-3">
                点左侧任意知识点，查看它能落到哪门课的哪个教学内容、知识卡要点、可搭配材料与已有课例
              </p>
            </Card>
          ) : (
            <>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag size="sm" tone="indigo">
                    {point.chapterTitle}
                  </Tag>
                  {point.gradeBand && <Tag size="sm">{GRADE_SHORT[point.gradeBand]}</Tag>}
                  {point.status === 'planned' && (
                    <Tag size="sm" tone="ochre">
                      待建
                    </Tag>
                  )}
                </div>
                <h3 className="mt-2.5 font-serif text-[16px] font-semibold leading-snug tracking-tight">
                  {point.title}
                </h3>
                <p className="mt-1 text-[10.5px] text-ink-4">{point.unitTitle}</p>
                <p className="mt-2.5 text-[12.5px] leading-[1.85] text-ink-2">{point.summary}</p>
                {chapterIdx && (
                  <p className="mt-2 border-t border-line-2 pt-2 text-[10.5px] text-ink-4">
                    本章共 {chapterIdx.counts.points} 个知识点 · 素材{' '}
                    {chapterIdx.counts.folk + chapterIdx.counts.materials} 条 · 课例{' '}
                    {chapterIdx.counts.lessons} 份
                  </p>
                )}
              </Card>

              {/* ① 可落到的课堂 */}
              <Card className="p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
                  <MapIcon size={12} className="text-indigo/70" />
                  可落到的课堂（{uses.length}）
                </h4>
                {uses.length === 0 ? (
                  <p className="rounded-md border border-dashed border-line bg-paper-2/40 p-2.5 text-[11px] leading-[1.75] text-ink-3">
                    还没有登记落点。可以去备课工坊，按自己的课给它造一个。
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {uses.map((u) => (
                      <div
                        key={u.subject}
                        className="rounded-sm border border-line-2 bg-paper-2/40 px-2 py-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11.5px] font-medium text-ink">
                            {SUBJECT_LABEL[u.subject]}
                          </span>
                          <span className="rounded-xs bg-indigo-p px-1 text-[9.5px] text-indigo">
                            {POINT_USE_LABEL[u.use]}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10.5px] leading-[1.65] text-ink-3">{u.why}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* ② 知识点卡摘要 */}
              <Card className="p-4">
                <h4 className="mb-2 text-[12px] font-semibold text-ink-2">
                  知识卡要点{card?.status === 'draft' ? '（待完善）' : ''}
                </h4>
                {card ? (
                  <>
                    <ol className="space-y-1.5">
                      {card.keyIdeas.map((k, i) => (
                        <li key={i} className="flex gap-1.5 text-[11.5px] leading-[1.7] text-ink-2">
                          <span className="tnum shrink-0 font-serif text-[10px] text-cinnabar">
                            0{i + 1}
                          </span>
                          {k}
                        </li>
                      ))}
                    </ol>
                    <Link
                      to={`/resources/card/${card.id}`}
                      className="mt-2 inline-flex items-center gap-0.5 text-[11px] text-cinnabar hover:text-cinnabar-h"
                    >
                      看完整知识卡 →
                    </Link>
                  </>
                ) : (
                  <p className="text-[11.5px] text-ink-3">暂无知识卡。</p>
                )}
              </Card>

              {/* ③ 可搭配素材：图文条目与媒体素材都在这里 */}
              <Card className="p-4">
                <h4 className="mb-2 text-[12px] font-semibold text-ink-2">
                  可搭配材料（{hooks.length}）
                </h4>
                {hooks.length === 0 ? (
                  <p className="rounded-md border border-dashed border-line bg-paper-2/40 p-2.5 text-[11px] leading-[1.75] text-ink-3">
                    这条知识点没有挂素材，靠知识卡即可独立使用。
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {hooks.slice(0, 6).map((f) => (
                      <Link
                        key={f.id}
                        to={`/resources/material/${f.id}`}
                        className="group flex items-center gap-2.5 rounded-sm border border-line-2 bg-paper-2/40 p-1.5 transition-colors hover:border-ink-4/50 hover:bg-card"
                      >
                        <div className="w-8 shrink-0 overflow-hidden rounded-xs border border-line">
                          <PatternMark spec={f.pattern} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11.5px] font-medium text-ink group-hover:text-cinnabar-h">
                            {f.name}
                          </div>
                          <div className="text-[9.5px] text-ink-4">{f.category}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* ④ 已有课例 */}
              <Card className="p-4">
                <h4 className="mb-2 text-[12px] font-semibold text-ink-2">
                  别人怎么用它（{relatedLessons.length}）
                </h4>
                {relatedLessons.length === 0 ? (
                  <p className="text-[11.5px] text-ink-3">还没有课例用到这个知识点。</p>
                ) : (
                  <div className="space-y-1.5">
                    {relatedLessons.slice(0, 5).map((l) => (
                      <Link
                        key={l.id}
                        to={`/lessons/${l.id}`}
                        className="block rounded-sm border border-line-2 px-2 py-1.5 text-[11.5px] leading-snug text-ink-2 transition-colors hover:border-ink-4/50 hover:bg-paper-2/60 hover:text-cinnabar-h"
                      >
                        {l.title}
                        <span className="ml-1 text-[10px] text-ink-4">
                          {SUBJECT_LABEL[l.subject]}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                <Link to={`/agent?point=${point.id}`} className="mt-3 block">
                  <Button size="sm" variant="primary" block>
                    <Sparkles size={13} />
                    用这条知识点备课
                  </Button>
                </Link>
              </Card>
            </>
          )}

          <div className="flex gap-2 rounded-lg border border-line-2 bg-paper-2/50 p-3">
            <Info size={13} className="mt-0.5 shrink-0 text-ink-4" />
            <p className="text-[10.5px] leading-[1.75] text-ink-3">
              「待建」表示仅预留结构位、内容尚在补充。新增知识点只需在
              <span className="font-mono"> curriculum.ts </span>
              追加，再写一张知识卡、在
              <span className="font-mono"> subjectPoints.ts </span>
              登记落点，四个模块会同时出现，不需要改页面。
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-paper-2/60 p-4">
        <h3 className="font-serif text-[13px] font-semibold text-ink-2">维护说明</h3>
        <div className="mt-2 space-y-1.5 text-[11.5px] leading-[1.8] text-ink-3">
          <p>
            课程结构、单元与知识点集中在
            <code className="rounded-xs bg-card px-1 py-px text-[11px] text-cinnabar">src/data/curriculum.ts</code>
            ；知识点卡在
            <code className="rounded-xs bg-card px-1 py-px text-[11px] text-cinnabar">src/data/knowledgeCards/</code>
            ，按章一个文件；知识点到学科的迁移落点在
            <code className="rounded-xs bg-card px-1 py-px text-[11px] text-cinnabar">src/data/subjectPoints.ts</code>
            ，是全站唯一的应用入口。
          </p>
          <p>
            页面上所有数字都由
            <code className="rounded-xs bg-card px-1 py-px text-[11px] text-cinnabar">src/lib/catalog.ts</code>
            现算，不手工维护；<code className="rounded-xs bg-card px-1 py-px text-[11px] text-cinnabar">npm run verify</code>
            会把学科维与章维两张表打出来，供逐项对账。
          </p>
        </div>
      </div>
    </div>
  )
}
