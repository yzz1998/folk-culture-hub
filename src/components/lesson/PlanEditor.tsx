import { useState } from 'react'
import type { Activity, LessonPlan } from '@/lib/types'
import { Button } from '@/components/ui'

/* 方案编辑表单：结构完整但不追求样样精致，教师最常改的是目标、流程与学生活动 */

export function PlanEditor({
  plan,
  onSave,
  onCancel,
}: {
  plan: LessonPlan
  onSave: (p: LessonPlan) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<LessonPlan>(() => structuredClone(plan))

  function patch<K extends keyof LessonPlan>(key: K, value: LessonPlan[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const flowSum = draft.flow.reduce((a, s) => a + Number(s.minutes || 0), 0)
  const sumOk = flowSum === draft.duration

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line-2 bg-paper-2/60 px-3 py-2">
        <span className="text-[11.5px] text-ink-2">
          编辑模式 · 修改后点「保存修改」生效
        </span>
        <span
          className={
            'tnum rounded-xs px-1.5 py-0.5 text-[10.5px] ' +
            (sumOk ? 'bg-bamboo-l text-bamboo' : 'bg-cinnabar-p text-cinnabar')
          }
        >
          环节合计 {flowSum} / {draft.duration} 分钟
        </span>
      </div>

      <Field label="方案标题">
        <input
          value={draft.title}
          onChange={(e) => patch('title', e.target.value)}
          className="h-9 w-full rounded-sm border border-line bg-card px-2.5 text-[13px] outline-none focus:border-cinnabar/60"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="知识目标">
          <Textarea value={draft.objectives.knowledge} onChange={(v) => patch('objectives', { ...draft.objectives, knowledge: v })} />
        </Field>
        <Field label="能力目标">
          <Textarea value={draft.objectives.ability} onChange={(v) => patch('objectives', { ...draft.objectives, ability: v })} />
        </Field>
        <Field label="情感目标">
          <Textarea value={draft.objectives.emotion} onChange={(v) => patch('objectives', { ...draft.objectives, emotion: v })} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="教学重点（每行一条）">
          <Textarea value={draft.keyPoints.join('\n')} onChange={(v) => patch('keyPoints', lines(v))} rows={3} />
        </Field>
        <Field label="教学难点（每行一条）">
          <Textarea value={draft.difficultPoints.join('\n')} onChange={(v) => patch('difficultPoints', lines(v))} rows={3} />
        </Field>
      </div>

      <Field label="教学准备（每行一条）">
        <Textarea value={draft.preparation.join('\n')} onChange={(v) => patch('preparation', lines(v))} rows={4} />
      </Field>

      <div>
        <SubTitle>教学过程</SubTitle>
        <div className="space-y-2">
          {draft.flow.map((s, i) => (
            <div key={i} className="rounded-md border border-line bg-card p-2.5">
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={s.stage}
                  onChange={(e) => {
                    const next = [...draft.flow]
                    next[i] = { ...s, stage: e.target.value }
                    patch('flow', next)
                  }}
                  className="h-7 min-w-0 flex-1 rounded-xs border border-line bg-paper-2/50 px-2 text-[12px] font-medium outline-none focus:border-cinnabar/60"
                />
                <input
                  type="number"
                  min={1}
                  value={s.minutes}
                  onChange={(e) => {
                    const next = [...draft.flow]
                    next[i] = { ...s, minutes: Number(e.target.value) || 0 }
                    patch('flow', next)
                  }}
                  className="tnum h-7 w-16 shrink-0 rounded-xs border border-line bg-paper-2/50 px-1.5 text-center text-[12px] outline-none focus:border-cinnabar/60"
                />
                <span className="shrink-0 text-[10.5px] text-ink-4">分钟</span>
              </div>
              <div className="grid gap-1.5">
                {(
                  [
                    ['teacher', '教师活动'],
                    ['student', '学生活动'],
                    ['intent', '设计意图'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="flex gap-2">
                    <span className="mt-1.5 w-14 shrink-0 text-[10px] text-ink-4">{label}</span>
                    <textarea
                      value={s[k]}
                      onChange={(e) => {
                        const next = [...draft.flow]
                        next[i] = { ...s, [k]: e.target.value }
                        patch('flow', next)
                      }}
                      rows={2}
                      className="w-full resize-none rounded-xs border border-line-2 bg-paper-2/30 px-2 py-1 text-[11.5px] leading-relaxed outline-none focus:border-cinnabar/60"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SubTitle>课堂活动</SubTitle>
        <div className="space-y-2">
          {draft.activities.map((a, i) => (
            <div key={i} className="rounded-md border border-line bg-card p-2.5">
              <div className="mb-1.5 flex items-center gap-2">
                <input
                  value={a.name}
                  onChange={(e) => {
                    const next = [...draft.activities]
                    next[i] = { ...a, name: e.target.value }
                    patch('activities', next)
                  }}
                  className="h-7 min-w-0 flex-1 rounded-xs border border-line bg-paper-2/50 px-2 text-[12px] font-medium outline-none focus:border-cinnabar/60"
                />
                <input
                  type="number"
                  min={1}
                  value={a.minutes}
                  onChange={(e) => {
                    const next = [...draft.activities]
                    next[i] = { ...a, minutes: Number(e.target.value) || 0 }
                    patch('activities', next)
                  }}
                  className="tnum h-7 w-14 shrink-0 rounded-xs border border-line bg-paper-2/50 px-1 text-center text-[12px] outline-none focus:border-cinnabar/60"
                />
                <button
                  type="button"
                  onClick={() => patch('activities', draft.activities.filter((_, j) => j !== i))}
                  className="shrink-0 px-1 text-[10.5px] text-ink-4 hover:text-cinnabar"
                >
                  删除
                </button>
              </div>
              <textarea
                value={a.desc}
                onChange={(e) => {
                  const next = [...draft.activities]
                  next[i] = { ...a, desc: e.target.value }
                  patch('activities', next)
                }}
                rows={2}
                className="w-full resize-none rounded-xs border border-line-2 bg-paper-2/30 px-2 py-1 text-[11.5px] leading-relaxed outline-none focus:border-cinnabar/60"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patch('activities', [
                ...draft.activities,
                {
                  name: '新活动',
                  type: '探究',
                  minutes: 8,
                  desc: '',
                  grouping: '小组合作',
                } satisfies Activity,
              ])
            }
            className="w-full rounded-md border border-dashed border-line py-2 text-[11.5px] text-ink-3 transition-colors hover:border-ink-4 hover:text-ink-2"
          >
            + 添加活动
          </button>
        </div>
      </div>

      <Field label="评价方式">
        <Textarea value={draft.evaluation} onChange={(v) => patch('evaluation', v)} rows={3} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="基础作业">
          <Textarea value={draft.homework.basic} onChange={(v) => patch('homework', { ...draft.homework, basic: v })} />
        </Field>
        <Field label="提升作业">
          <Textarea value={draft.homework.extend} onChange={(v) => patch('homework', { ...draft.homework, extend: v })} />
        </Field>
        <Field label="项目作业">
          <Textarea value={draft.homework.project} onChange={(v) => patch('homework', { ...draft.homework, project: v })} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="需要支持的学生">
          <Textarea value={draft.differentiation.support} onChange={(v) => patch('differentiation', { ...draft.differentiation, support: v })} />
        </Field>
        <Field label="学有余力的学生">
          <Textarea value={draft.differentiation.challenge} onChange={(v) => patch('differentiation', { ...draft.differentiation, challenge: v })} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="板书设计">
          <Textarea value={draft.boardDesign ?? ''} onChange={(v) => patch('boardDesign', v)} rows={3} />
        </Field>
        <Field label="教学提示">
          <Textarea value={draft.reflection ?? ''} onChange={(v) => patch('reflection', v)} rows={3} />
        </Field>
      </div>

      <div className="sticky bottom-0 -mx-1 flex gap-2 border-t border-line bg-paper/95 px-1 py-3 backdrop-blur-sm">
        <Button variant="primary" onClick={() => onSave(draft)} disabled={!sumOk}>
          保存修改
        </Button>
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        {!sumOk && (
          <span className="self-center text-[10.5px] text-cinnabar">
            各环节分钟数之和需等于课时长度
          </span>
        )}
      </div>
    </div>
  )
}

function lines(v: string): string[] {
  return v
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-medium tracking-wide text-ink-3">{label}</span>
      {children}
    </label>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 mt-1 flex items-center gap-1.5 font-serif text-[13px] font-semibold text-ink">
      <span className="h-2.5 w-[2px] rounded-xs bg-cinnabar" />
      {children}
    </h4>
  )
}

function Textarea({
  value,
  onChange,
  rows = 2,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full resize-none rounded-sm border border-line bg-card px-2 py-1.5 text-[12px] leading-[1.7] text-ink outline-none focus:border-cinnabar/60"
    />
  )
}
