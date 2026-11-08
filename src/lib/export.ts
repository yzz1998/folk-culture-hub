import type { GeneratedPlan, LessonPlan, FolkItem } from '@/lib/types'
import { MATERIAL_MAP } from '@/data/materials'
import { POINT_MAP } from '@/data/curriculum'
import { GRADE_LABEL } from '@/lib/types'

/* 导出为 Markdown —— 可直接粘进 Word、公众号或教研组文档
   信息行的顺序与 Word 导出一致：学科 → 教学内容 → 辅助知识点。
   学科永远在第一行。 */

export function planToMarkdown(plan: LessonPlan, materialIds: string[] = []): string {
  const materialNames = materialIds
    .map((id) => MATERIAL_MAP.get(id)?.title)
    .filter(Boolean)
    .join('、')
  const points = plan.pointIds.map((id) => POINT_MAP.get(id)?.title).filter(Boolean).join('、')
  const L: string[] = []

  L.push(`# ${plan.title}`, '')
  L.push(
    `> 学科：${plan.subject}　学段：${GRADE_LABEL[plan.gradeBand]}　课时：${plan.duration} 分钟`,
  )
  L.push(`> 辅助知识点：${points || '未使用（按学科主线设计）'}`)
  if (materialNames) L.push(`> 教学素材：${materialNames}`)
  L.push('', '---', '')

  L.push('## 一、教学目标', '')
  L.push(`- **知识**：${plan.objectives.knowledge}`)
  L.push(`- **能力**：${plan.objectives.ability}`)
  L.push(`- **情感**：${plan.objectives.emotion}`, '')

  L.push('## 二、教学重点与难点', '')
  L.push('**重点**', ...plan.keyPoints.map((k) => `- ${k}`), '')
  L.push('**难点**', ...plan.difficultPoints.map((k) => `- ${k}`), '')

  L.push('## 三、教学准备', '')
  plan.preparation.forEach((p) => L.push(`- ${p}`))
  L.push('')

  L.push('## 四、教学过程', '')
  L.push('| 环节 | 时长 | 教师活动 | 学生活动 | 设计意图 |')
  L.push('| --- | --- | --- | --- | --- |')
  plan.flow.forEach((s) => {
    L.push(
      `| ${s.stage} | ${s.minutes}′ | ${esc(s.teacher)} | ${esc(s.student)} | ${esc(s.intent)} |`,
    )
  })
  L.push('', `合计：${plan.flow.reduce((a, s) => a + s.minutes, 0)} 分钟`, '')

  if (plan.activities.length) {
    L.push('## 五、课堂活动', '')
    plan.activities.forEach((a, i) => {
      L.push(`${i + 1}. **${a.name}**（${a.type}，${a.minutes} 分钟，${a.grouping}）`)
      L.push(`   ${a.desc}`)
    })
    L.push('')
  }

  L.push('## 六、评价方式', '', plan.evaluation, '')
  L.push('## 七、分层作业', '')
  L.push(`- **基础**：${plan.homework.basic}`)
  L.push(`- **提升**：${plan.homework.extend}`)
  L.push(`- **项目**：${plan.homework.project}`, '')
  L.push('## 八、差异化支持', '')
  L.push(`- **需要支持的学生**：${plan.differentiation.support}`)
  L.push(`- **学有余力的学生**：${plan.differentiation.challenge}`, '')

  if (plan.boardDesign) L.push('## 九、板书设计', '', plan.boardDesign, '')
  if (plan.reflection) L.push('## 十、教学提示', '', plan.reflection, '')

  L.push(
    '---',
    '',
    '> 本文档由「乡音课坊」生成，供备课时参考修改。教学主体为本学科内容；《人类与社会》知识点与民俗素材仅作辅助。',
    '',
    `生成于 ${new Date().toLocaleString('zh-CN')}`,
  )
  return L.join('\n')
}

function esc(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

export function generatedToMarkdown(g: GeneratedPlan): string {
  const head = [
    `# ${g.title}`,
    '',
    `> 生成方式：AI 辅助生成　生成时间：${new Date(g.createdAt).toLocaleString('zh-CN')}`,
    '',
    '## 为什么这样配',
    '',
    ...g.rationale.map((r) => `**${r.label}**：${r.text}`),
    '',
    '---',
    '',
  ].join('\n')
  return head + planToMarkdown(g.plan, g.input.materialIds ?? []).replace(/^# .*\n/, '')
}

export function folkToMarkdown(f: FolkItem): string {
  const L = [
    `# ${f.name}`,
    '',
    `> ${f.category}　·　${f.region === '闽东' ? '闽东本地资源' : '全国通行'}`,
    '',
    `**一句话**：${f.summary}`,
    '',
    '## 文化内涵',
    '',
    f.culturalMeaning,
    '',
    '## 源流',
    '',
    f.origin,
    '',
    '## 课堂观察点',
    '',
    ...f.classroomHooks.map((h, i) => `${i + 1}. ${h}`),
    '',
    `**可融入学科**：${f.subjects.join('、')}`,
    `**适用年级**：${f.grades.join('、')} 年级`,
    `**主题**：${f.themes.join('、')}`,
  ]
  if (f.caution) L.push('', `**教学提醒**：${f.caution}`)
  return L.join('\n')
}

/* 触发浏览器下载 */
export function download(filename: string, content: string, mime = 'text/markdown;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function safeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60)
}
