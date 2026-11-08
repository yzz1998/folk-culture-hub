import type { LessonPlan } from '@/lib/types'
import { GRADE_LABEL, durationLabel } from '@/lib/types'

/* 教案正文渲染：教案详情页与智能工坊结果页共用，打印样式也在此收敛 */

export function PlanView({ plan }: { plan: LessonPlan }) {
  const total = plan.flow.reduce((a, s) => a + s.minutes, 0)

  return (
    <div className="print-area space-y-5">
      {/* 基本信息 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-line-2 bg-paper-2/60 px-3.5 py-2.5 text-[11.5px] text-ink-3">
        <span>
          学段 <span className="text-ink-2">{GRADE_LABEL[plan.gradeBand]}</span>
        </span>
        <span className="text-line">|</span>
        <span>
          学科 <span className="text-ink-2">{plan.subject}</span>
        </span>
        <span className="text-line">|</span>
        <span>
          课时数 <span className="tnum text-ink-2">{durationLabel(plan.duration)}</span>
        </span>
        <span className="text-line">|</span>
        <span>
          环节 <span className="tnum text-ink-2">{plan.flow.length}</span> 个，合计{' '}
          <span className="tnum text-ink-2">{total} 分钟</span>
        </span>
      </div>

      {plan.caution && (
        <div className="rounded-md border border-ochre/30 bg-ochre-l/40 px-3.5 py-2.5">
          <div className="mb-0.5 text-[10.5px] font-semibold text-ochre">教学尺度提醒</div>
          <p className="text-[12px] leading-[1.8] text-ink-2">{plan.caution}</p>
        </div>
      )}

      <Block title="一、教学目标">
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { k: '知识', v: plan.objectives.knowledge },
            { k: '能力', v: plan.objectives.ability },
            { k: '情感', v: plan.objectives.emotion },
          ].map((o) => (
            <div key={o.k} className="rounded-md border border-line-2 bg-paper-2/40 p-3">
              <div className="mb-1 text-[11px] font-semibold tracking-wide text-cinnabar">{o.k}</div>
              <p className="text-[12.5px] leading-[1.8] text-ink-2">{o.v}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block title="二、教学重点与难点">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[11.5px] font-medium text-ink-2">重点</div>
            <ul className="space-y-1">
              {plan.keyPoints.map((k, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] leading-[1.75] text-ink-2">
                  <span className="mt-[0.55em] h-1 w-1 shrink-0 rotate-45 bg-cinnabar" />
                  {k}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1.5 text-[11.5px] font-medium text-ink-2">难点</div>
            <ul className="space-y-1">
              {plan.difficultPoints.map((k, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] leading-[1.75] text-ink-2">
                  <span className="mt-[0.55em] h-1 w-1 shrink-0 rotate-45 bg-indigo/60" />
                  {k}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Block>

      <Block title="三、教学准备">
        <ul className="space-y-1">
          {plan.preparation.map((p, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] leading-[1.75] text-ink-2">
              <span className="tnum shrink-0 text-[11px] text-ink-4">{i + 1}.</span>
              {p}
            </li>
          ))}
        </ul>
      </Block>

      <Block title="四、教学过程">
        {/* 桌面：表格 */}
        <div className="hidden overflow-hidden rounded-md border border-line md:block">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="bg-paper-2 text-[11.5px] text-ink-2">
                <th className="w-[88px] border-b border-line px-2.5 py-2 font-medium">环节</th>
                <th className="w-[52px] border-b border-line px-2 py-2 font-medium">时长</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">教师活动</th>
                <th className="border-b border-line px-2.5 py-2 font-medium">学生活动</th>
                <th className="w-[22%] border-b border-line px-2.5 py-2 font-medium">设计意图</th>
              </tr>
            </thead>
            <tbody>
              {plan.flow.map((s, i) => (
                <tr key={i} className="align-top even:bg-paper-2/30">
                  <td className="border-b border-line-2 px-2.5 py-2.5 text-[12px] font-medium text-ink">
                    {s.stage}
                  </td>
                  <td className="tnum border-b border-line-2 px-2 py-2.5 text-[12px] text-cinnabar">
                    {s.minutes}′
                  </td>
                  <td className="border-b border-line-2 px-2.5 py-2.5 text-[12px] leading-[1.7] text-ink-2">
                    {s.teacher}
                  </td>
                  <td className="border-b border-line-2 px-2.5 py-2.5 text-[12px] leading-[1.7] text-ink-2">
                    {s.student}
                  </td>
                  <td className="border-b border-line-2 px-2.5 py-2.5 text-[11.5px] leading-[1.7] text-ink-3">
                    {s.intent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动：卡片 */}
        <div className="space-y-2.5 md:hidden">
          {plan.flow.map((s, i) => (
            <div key={i} className="rounded-md border border-line bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-ink">{s.stage}</span>
                <span className="tnum rounded-xs bg-cinnabar-p px-1.5 py-0.5 text-[11px] font-medium text-cinnabar">
                  {s.minutes}′
                </span>
              </div>
              <dl className="space-y-1.5 text-[12px] leading-[1.7]">
                <Row k="教师" v={s.teacher} />
                <Row k="学生" v={s.student} />
                <Row k="意图" v={s.intent} muted />
              </dl>
            </div>
          ))}
        </div>
      </Block>

      {plan.activities.length > 0 && (
        <Block title="五、课堂活动">
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.activities.map((a, i) => (
              <div key={i} className="rounded-md border border-line-2 bg-paper-2/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium text-ink">{a.name}</span>
                  <span className="shrink-0 rounded-xs border border-line bg-card px-1.5 py-px text-[10.5px] text-ink-3">
                    {a.type}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.75] text-ink-2">{a.desc}</p>
                <p className="mt-1.5 text-[10.5px] text-ink-4">
                  {a.grouping} · {a.minutes} 分钟
                </p>
              </div>
            ))}
          </div>
        </Block>
      )}

      <Block title="六、评价方式">
        <p className="text-[12.5px] leading-[1.85] text-ink-2">{plan.evaluation}</p>
      </Block>

      <Block title="七、分层作业">
        <div className="space-y-1.5">
          {[
            { k: '基础', v: plan.homework.basic },
            { k: '提升', v: plan.homework.extend },
            { k: '项目', v: plan.homework.project },
          ].map((h) => (
            <div key={h.k} className="flex gap-2.5 rounded-sm bg-paper-2/50 px-2.5 py-2">
              <span className="mt-px shrink-0 rounded-xs bg-cinnabar-p px-1.5 text-[10.5px] font-medium leading-[1.6] text-cinnabar">
                {h.k}
              </span>
              <span className="text-[12px] leading-[1.75] text-ink-2">{h.v}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="八、差异化支持">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-bamboo/25 bg-bamboo-l/40 p-3">
            <div className="mb-1 text-[11px] font-semibold text-bamboo">需要支持的学生</div>
            <p className="text-[12px] leading-[1.75] text-ink-2">{plan.differentiation.support}</p>
          </div>
          <div className="rounded-md border border-ochre/25 bg-ochre-l/40 p-3">
            <div className="mb-1 text-[11px] font-semibold text-ochre">学有余力的学生</div>
            <p className="text-[12px] leading-[1.75] text-ink-2">{plan.differentiation.challenge}</p>
          </div>
        </div>
      </Block>

      {plan.boardDesign && (
        <Block title="九、板书设计">
          <p className="rounded-md border border-dashed border-line bg-card p-3 text-[12.5px] leading-[1.85] text-ink-2">
            {plan.boardDesign}
          </p>
        </Block>
      )}

      {plan.reflection && (
        <Block title="十、教学提示">
          <p className="rounded-md border border-ochre/25 bg-ochre-l/35 p-3 text-[12px] leading-[1.8] text-ink-2">
            {plan.reflection}
          </p>
        </Block>
      )}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-2 font-serif text-[14.5px] font-semibold tracking-tight text-ink">
        <span className="inline-block h-3 w-[2.5px] rounded-xs bg-cinnabar" />
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-[11px] text-ink-4">{k}</dt>
      <dd className={muted ? 'text-ink-3' : 'text-ink-2'}>{v}</dd>
    </div>
  )
}
