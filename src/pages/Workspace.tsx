import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, Bookmark, Download, FileText, Trash2 } from 'lucide-react'
import { FOLK_MAP } from '@/data/folk'
import { MATERIAL_MAP } from '@/data/materials'
import { LESSON_MAP } from '@/data/lessons'
import type { GeneratedPlan, LessonPlan } from '@/lib/types'
import { GRADE_SHORT } from '@/lib/types'
import { Button, Card, Drawer, EmptyState, Segmented, Tag } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { FolkCard } from '@/components/folk/FolkCard'
import { PlanView } from '@/components/lesson/PlanView'
import { download, generatedToMarkdown, planToMarkdown, safeFilename } from '@/lib/export'
import { useApp, useToast } from '@/store/AppStore'

type Tab = 'fav' | 'plans' | 'drafts'

export default function Workspace() {
  const {
    favorites,
    savedPlans,
    drafts,
    toggleFavorite,
    removePlan,
    removeDraft,
  } = useApp()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('fav')
  const [viewPlan, setViewPlan] = useState<{ title: string; plan: LessonPlan } | null>(null)

  const favFolk = favorites.folk.map((id) => FOLK_MAP.get(id)).filter(Boolean)
  const favLessons = favorites.lesson.map((id) => LESSON_MAP.get(id)).filter(Boolean)

  return (
    <div className="animate-fade">
      <PageHeader
        eyebrow="我的空间"
        title="收藏、方案与草稿"
        desc="所有内容只保存在这台设备的浏览器里，换电脑或清理缓存会丢失。重要方案建议导出 Markdown 另存，或在设置页做一次数据备份。"
        right={
          <Segmented
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'fav' as const, label: '收藏', count: favFolk.length + favLessons.length },
              { value: 'plans' as const, label: '我的方案', count: savedPlans.length },
              { value: 'drafts' as const, label: '草稿', count: drafts.length },
            ]}
          />
        }
      />

      {tab === 'fav' && (
        <>
          {favFolk.length === 0 && favLessons.length === 0 ? (
            <EmptyState
              title="还没有收藏"
              desc="在资源库或教案库里点收藏，就会出现在这里。"
              action={
                <Link to="/folk">
                  <Button variant="outline">去资源库看看</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-6">
              {favFolk.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 font-serif text-[14.5px] font-semibold">
                    <span className="h-3 w-[2.5px] rounded-xs bg-cinnabar" />
                    素材条目 <span className="tnum text-[12px] font-normal text-ink-4">{favFolk.length}</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {favFolk.map((f) => (
                      <FolkCard
                        key={f!.id}
                        item={f!}
                        favorited
                        onToggleFavorite={() => {
                          toggleFavorite('folk', f!.id)
                          toast('已取消收藏')
                        }}
                      />
                    ))}
                  </div>
                </section>
              )}

              {favLessons.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 font-serif text-[14.5px] font-semibold">
                    <span className="h-3 w-[2.5px] rounded-xs bg-indigo" />
                    教案 <span className="tnum text-[12px] font-normal text-ink-4">{favLessons.length}</span>
                  </h2>
                  <div className="space-y-2">
                    {favLessons.map((l) => (
                      <Card key={l!.id} hover className="flex items-center gap-3 p-3.5">
                        <FileText size={15} className="shrink-0 text-indigo/70" />
                        <Link to={`/lessons/${l!.id}`} className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-ink">{l!.title}</div>
                          <div className="text-[10.5px] text-ink-4">
                            {GRADE_SHORT[l!.gradeBand]} · {l!.subject} · {l!.duration} 分钟
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            toggleFavorite('lesson', l!.id)
                            toast('已取消收藏')
                          }}
                          aria-label="取消收藏"
                          className="shrink-0 rounded-sm p-1.5 text-ink-4 hover:text-cinnabar"
                        >
                          <Bookmark size={13} fill="currentColor" />
                        </button>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'plans' && (
        <>
          {savedPlans.length === 0 ? (
            <EmptyState
              title="还没有保存的方案"
              desc="在智能工坊生成方案后点「收藏」，就会存在这里。"
              action={
                <Link to="/agent">
                  <Button variant="primary">去生成一份</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2">
              {savedPlans.map((g) => (
                <SavedPlanCard
                  key={g.id}
                  plan={g}
                  onView={() => setViewPlan({ title: g.title, plan: g.plan })}
                  onExport={() => {
                    download(`${safeFilename(g.title)}.md`, generatedToMarkdown(g))
                    toast('已导出 Markdown')
                  }}
                  onRemove={() => {
                    removePlan(g.id)
                    toast('已移除')
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'drafts' && (
        <>
          {drafts.length === 0 ? (
            <EmptyState
              title="还没有草稿"
              desc="在方案结果页点「存草稿」，或编辑方案时保存，就会留在这里。"
            />
          ) : (
            <div className="space-y-2">
              {drafts.map((d) => (
                <Card key={d.id} className="flex items-center gap-3 p-3.5">
                  <BookMarked size={15} className="shrink-0 text-ochre/80" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">{d.title}</div>
                    <div className="text-[10.5px] text-ink-4">
                      {new Date(d.savedAt).toLocaleString('zh-CN')} · {d.plan.flow.length} 个环节 ·{' '}
                      {d.plan.duration} 分钟
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewPlan({ title: d.title, plan: d.plan })}
                    >
                      查看
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        download(`${safeFilename(d.title)}.md`, planToMarkdown(d.plan))
                        toast('已导出')
                      }}
                      aria-label="导出"
                      className="rounded-sm p-1.5 text-ink-4 hover:text-ink-2"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeDraft(d.id)
                        toast('草稿已删除')
                      }}
                      aria-label="删除"
                      className="rounded-sm p-1.5 text-ink-4 hover:text-cinnabar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Drawer
        open={Boolean(viewPlan)}
        onClose={() => setViewPlan(null)}
        side="right"
        title={viewPlan?.title}
      >
        {viewPlan && (
          <div className="p-4">
            <PlanView plan={viewPlan.plan} />
          </div>
        )}
      </Drawer>
    </div>
  )
}

function SavedPlanCard({
  plan,
  onView,
  onExport,
  onRemove,
}: {
  plan: GeneratedPlan
  onView: () => void
  onExport: () => void
  onRemove: () => void
}) {
  const materials = (plan.input.materialIds ?? [])
    .map((id) => MATERIAL_MAP.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
  return (
    <Card hover className="flex flex-col p-3.5">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onView} className="min-w-0 flex-1 text-left">
          <h3 className="clamp-2 font-serif text-[13.5px] font-semibold leading-snug text-ink hover:text-cinnabar-h">
            {plan.title}
          </h3>
        </button>
        <Tag size="sm" tone="cinnabar">
          AI
        </Tag>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-ink-4">
        <span>{GRADE_SHORT[plan.input.gradeBand]}</span>
        <span>·</span>
        <span>{plan.input.subject}</span>
        <span>·</span>
        <span className="tnum">{plan.input.duration} 分钟</span>
        <span>·</span>
        <span>{new Date(plan.createdAt).toLocaleDateString('zh-CN')}</span>
      </div>

      {materials.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {materials.map((m) => (
            <Tag key={m.id} size="sm">
              {m.title}
            </Tag>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-1 border-t border-line-2 pt-2.5">
        <Button size="sm" variant="outline" onClick={onView}>
          查看
        </Button>
        <Button size="sm" variant="ghost" onClick={onExport}>
          <Download size={12} />
          导出
        </Button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="删除"
          className="ml-auto rounded-sm p-1.5 text-ink-4 hover:text-cinnabar"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </Card>
  )
}
