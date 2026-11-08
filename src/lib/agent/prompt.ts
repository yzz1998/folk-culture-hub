import type { AgentInput } from '@/lib/types'
import { SUBJECT_META } from '@/lib/types'
import { POINT_MAP, getChapter } from '@/data/curriculum'
import { cardOfPoint } from '@/data/knowledgeCards'
import { MATERIAL_MAP } from '@/data/materials'
import { MATERIAL_FORM_LABEL } from '@/lib/catalog'
import { CHAPTER_LENS, DEFAULT_LENS } from './fusionRules'
import { SUBJECT_VOICE, VERBS } from './templates'
import { issuesByIds } from '@/data/teachingPresets'

/* ═══════════════════════════════════════════════════════════════
   Prompt 构造

   结构：角色 + 三段材料（学科与教学内容 / 可借用的知识点与素材 / 学情与课时）
        + 结构约束 + 禁止事项。
   学科永远在第一段：模型读到的顺序，就是它组织内容的顺序。

   输出强制为 JSON，前端解析后直接成为方案正文。
   本地组装引擎已下线，这份提示词是生成质量的唯一来源——
   改这里的口径，等于改全站方案的写法。
   ═══════════════════════════════════════════════════════════════ */

export const SYSTEM_PROMPT = `你是一位小学教研员，负责为一线教师设计可直接上课的教学方案。
平台的定位是：学科教学是主体，《人类与社会》的知识点只是可选的辅助素材。
你要为教师所教的学科设计一节课，而不是设计一节《人类与社会》的课。

硬性要求：
1. 学科主线必须在最前面说清楚：这一课要教什么、学生要完成什么。
2. 如果提供了辅助知识点，必须写明「它为本学科的这个内容提供了什么」，
   不能把它直接当作教学目标，也不能整节课都讲这个知识点。
3. 如果没有提供任何辅助知识点与素材，就完全围绕学科本身设计，
   不要虚构素材内容，也不要硬拉《人类与社会》的概念进来。
   提供的素材只有一种身份：这节课的材料。不要把它当成独立主题来讲。
4. 教学流程必须分五个环节，各环节分钟数之和精确等于用户给定的课时长度。
5. 认知动词要匹配学段：1-2 年级用「看一看/说一说/做一做」，3-4 年级用「观察/描述/对比」，5-6 年级用「考察/论证/建模/质疑」。
6. 活动必须可操作：写清学生具体做什么、用什么材料、几人一组。
7. 语言用中文，简洁具体，不写「通过本课学习，学生将深刻认识到……」这类空话。

禁止事项：
- 不得跨学科挪用：不要给语文课设计数学任务，也不要给体育课设计历史分析。
- 不得编造非物质文化遗产的批次编号、代表性传承人姓名、确切起始年代、获奖情况。如需提及名录，只写「列入国家级/省级非遗代表性项目名录」这类可核验的定性表述。
- 涉及民间信仰的内容，只作文化现象与社区功能分析，不涉及教义宣讲，不设计仪式参与环节。
- 不得虚构学生的学情数据或调研结论。`

export function buildUserPrompt(input: AgentInput): string {
  const meta = SUBJECT_META[input.subject]
  const points = input.pointIds.map((id) => POINT_MAP.get(id)).filter(Boolean)
  const cards = points.map((p) => (p ? cardOfPoint(p!.id) : undefined)).filter(Boolean)
  const chapter = points[0] ? getChapter(points[0]!.chapterId) : undefined
  const lens = (chapter && CHAPTER_LENS[chapter.id]) ?? DEFAULT_LENS
  const verbs = VERBS[input.gradeBand]
  const voice = SUBJECT_VOICE[input.subject]
  const materials = (input.materialIds ?? [])
    .map((id) => MATERIAL_MAP.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))

  const issueLine =
    issuesByIds(input.issues)
      .map((p) => `${p.label}（${p.adapt}）`)
      .join('；') || '教师未选择预设，按常态学情处理'

  const materialBlock = materials.length
    ? materials
        .map(
          (m) =>
            `【${m.title}】${MATERIAL_FORM_LABEL[m.type]}｜用途：${m.usage ?? '未标注'}
说明：${m.desc}${m.duration ? `\n建议时长：${m.duration}` : ''}`,
        )
        .join('\n\n')
    : '（教师未选具体素材）'

  const pointBlock = points.length
    ? points
        .map((p) => `【${p!.title}】${p!.summary}（所属：${p!.chapterTitle} / ${p!.unitTitle}）`)
        .join('\n')
    : '（教师未借用任何知识点）'

  const cardBlock = cards.length
    ? cards
        .map(
          (c) =>
            `【${points[cards.indexOf(c)]!.title} 知识卡】\n核心要点：${c!.keyIdeas.join('；')}\n关键概念：${c!.concepts
              .map((x) => `${x.term}——${x.gloss}`)
              .join('；')}\n常见误区：${c!.misconceptions
              .map((m) => `${m.claim} → ${m.correction}`)
              .join('；')}`,
        )
        .join('\n\n')
    : '（无）'

  return `## 一、学科与教学内容
学科：${input.subject}
学科主线：${meta.ownCore}
本站对该学科的呈现方式：${meta.presentation}
典型内容线索：${meta.topics.join('；')}
课程主题（教师自拟，标题必须与之一字不差）：${input.topic}
任教年级：${input.gradeBand} 年级
课时长度：${input.duration / 40} 课时（共 ${input.duration} 分钟，五环节分钟数之和必须等于此数）
教学风格：${input.style}

## 二、可借用的辅助知识点
${chapter ? `来源：《人类与社会》${chapter.title}——${chapter.brief}\n学科视角：${lens.domain}` : '本科未借用《人类与社会》的任何知识点，也不必提及这门课。'}
知识点：
${pointBlock}

${cardBlock}

可用素材（可选，仅作具体案例；不必全部用到）：
${materialBlock}

## 三、学情与课时
学情提示：${verbs.learnerNote}
学情预设：${issueLine}
本科常见教学风险：${voice?.pitfall ?? '注意不要用情境代替学科本身的训练。'}
${input.notes ? `教师补充说明：${input.notes}` : ''}

## 四、输出要求
只输出一个 JSON 对象，不要 Markdown 代码块，不要任何解释文字。结构如下：

{
  "title": "等于教师给出的课程主题，一字不差",
  "rationale": [
    { "label": "学科这一侧", "text": "这一课在${input.subject}里要完成什么" },
    { "label": "辅助这一侧", "text": "借用了什么；未借用则写「本课未借用辅助素材」" },
    { "label": "两者怎么接上", "text": "辅助内容具体服务于学科的哪一处" }
  ],
  "plan": {
    "objectives": { "knowledge": "...", "ability": "...", "emotion": "..." },
    "keyPoints": ["...", "..."],
    "difficultPoints": ["...", "..."],
    "preparation": ["...", "...", "..."],
    "flow": [
      { "stage": "环节名", "minutes": 5, "teacher": "...", "student": "...", "intent": "..." }
    ],
    "activities": [
      { "name": "...", "type": "体验|探究|表达|制作|讨论|游戏|操作|实验|练习", "minutes": 10, "desc": "...", "grouping": "..." }
    ],
    "evaluation": "...",
    "homework": { "basic": "...", "extend": "...", "project": "..." },
    "differentiation": { "support": "...", "challenge": "..." },
    "boardDesign": "...",
    "reflection": "..."
  }
}

flow 必须恰好 5 个环节，minutes 之和 = ${input.duration}。`
}
