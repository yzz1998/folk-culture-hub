import type { LlmSettings, PointAnalysis, Subject } from '@/lib/types'
import { POINT_USE_LABEL, SUBJECT_LABEL } from '@/lib/types'
import { POINT_MAP } from '@/data/curriculum'
import { cardOfPoint } from '@/data/knowledgeCards'
import { linksOfPoint } from '@/data/subjectPoints'
import { AiError, requestJson } from './llm'

/* ═══════════════════════════════════════════════════════════════
   知识点 → 课堂：单点 AI 分析

   与「整课方案生成」分开，是因为它回答的问题更小、更具体：
   **这个知识点，怎么进我的课堂。**
   因此提示词里只喂三样东西，避免模型自由发挥：
   ① 知识点本身（标题、摘要、所属章 / 单元）
   ② 知识卡（核心要点 / 概念 / 误区 / 追问）——分析的事实底座
   ③ 平台已登记的学科落点——已有的迁移判断，模型只能在此基础上细化

   输出被强制为固定结构，界面按结构逐段渲染；
   任何一段缺失都不会让整张卡空掉，缺的段直接不渲染。
   ═══════════════════════════════════════════════════════════════ */

const SYSTEM = `你是一位小学教研员，任务是帮一线教师把一个课程知识点用到他自己的课堂教学里。

写作要求：
1. 先判断这个知识点本身是什么，再说它能进哪门课、哪个教学内容，最后给可操作的动作。
2. 「能落到哪些课堂」必须点名具体的教学内容（单元名、课题名、任务名），
   禁止写「有助于培养核心素养」「可以拓展学生视野」这类不点名的空话。
3. 教师指定的学科就是本次分析对象，与平台有没有登记过无关：
   已登记的落点是「常见用法」，不是允许清单。没有登记不代表接不上，
   有登记也不代表只能写那一门。重点写这门学科，可以再补 1-2 门确有把握的，
   凑不满就只写一门，不要为了显得全面而硬挂学科。
   如果这个知识点确实服务不了这门学科，就直接说「这门课上接不住」并说明原因，
   不要改写成别的学科来凑答案，也不要编一个牵强的用法。
4. 三步落地必须是真的能在 40 分钟里做的动作：写清教师做什么、学生做什么。
5. 注意事项要针对这个知识点最容易上歪的地方，不要写通用的课堂管理套话。
6. 不得编造非物质文化遗产的批次编号、代表性传承人姓名、确切起始年代。
7. 不得把这个知识点直接当成教学目标——它是材料、情境或例子，目标仍在学科自己那边。
8. 全部用中文，句子短，可直接读给同事听。

只输出一个 JSON 对象，不要 Markdown 代码块，不要解释文字。结构：
{
  "core": "一句话说清这个知识点在课堂里是什么（不超过 60 字）",
  "classrooms": [
    { "subject": "语文", "content": "具体教学内容", "use": "在这节课里承担什么作用", "example": "一句可执行的用法" }
  ],
  "flow": [
    { "step": "导入｜环节名", "action": "教师做什么、学生做什么" }
  ],
  "cautions": ["最容易上歪的一点"],
  "ask": "留给学生的一个开放问题"
}`

export function buildAnalysisPrompt(
  pointId: string,
  options: { subject?: Subject | null; gradeBand?: string } = {},
): string {
  const point = POINT_MAP.get(pointId)
  if (!point) throw new AiError('format', '找不到这个知识点')

  const card = cardOfPoint(pointId)
  const links = linksOfPoint(pointId)

  const cardBlock = card
    ? `核心要点：${card.keyIdeas.join('；')}
关键概念：${card.concepts.map((c) => `${c.term}——${c.gloss}`).join('；')}
常见误区：${card.misconceptions.map((m) => `${m.claim} → ${m.correction}`).join('；')}
课堂追问：${card.inquiries.join('；')}`
    : '（这个知识点暂无知识卡，请只依据摘要分析，不要补充未给出的史实）'

  const linkBlock = links.length
    ? links
        .map((l) => `- ${SUBJECT_LABEL[l.subject]}｜${POINT_USE_LABEL[l.use]}｜${l.why}`)
        .join('\n')
    : '（平台尚未登记任何学科落点，需要你判断它能进哪门课）'

  const grade = options.gradeBand ? `教师任教学段：${options.gradeBand} 年级` : '教师任教学段：未指定'
  const chosen = options.subject
  const registered = chosen ? links.some((l) => l.subject === chosen) : false
  const mine = chosen
    ? `本次分析对象：${chosen}（分析要重点落在这一门${
        registered ? '；平台已登记该学科落点' : '；平台未登记该学科落点，请自行判断能否接上'
      }）`
    : '本次分析对象：未指定，请按适配度排序，最多给三门'

  return `## 知识点
标题：${point.title}
摘要：${point.summary}
所属：${point.chapterTitle} / ${point.unitTitle}

## 知识卡
${cardBlock}

## 平台已登记的学科落点
${linkBlock}

## 教师情况
${mine}
${grade}

请给出 3 条以内的课堂落点、恰好 3 步落地动作、最多 3 条注意事项。`
}

/* ── 结果清洗 ───────────────────────────────────── */

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

function strArr(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, max)
}

const KNOWN_SUBJECTS = new Set(Object.keys(SUBJECT_LABEL))

function coerce(raw: unknown): PointAnalysis {
  if (!raw || typeof raw !== 'object') {
    throw new AiError('format', '分析结果无法识别，请重试')
  }
  const r = raw as Record<string, unknown>

  const core = str(r.core)
  if (!core) throw new AiError('format', 'AI 没有给出这个知识点的定位，请重试')

  const classroomsRaw = Array.isArray(r.classrooms) ? (r.classrooms as Record<string, unknown>[]) : []
  const classrooms = classroomsRaw
    .map((c) => {
      const subject = str(c.subject)
      return {
        subject: KNOWN_SUBJECTS.has(subject) ? (subject as Subject) : subject,
        content: str(c.content),
        use: str(c.use),
        example: str(c.example),
      }
    })
    .filter((c) => c.subject && c.content)
    .slice(0, 3)

  const flowRaw = Array.isArray(r.flow) ? (r.flow as Record<string, unknown>[]) : []
  const flow = flowRaw
    .map((s) => ({ step: str(s.step), action: str(s.action) }))
    .filter((s) => s.step && s.action)
    .slice(0, 4)

  if (!classrooms.length && !flow.length) {
    throw new AiError('format', 'AI 返回的分析内容不完整，请重试')
  }

  return {
    core,
    classrooms,
    flow,
    cautions: strArr(r.cautions, 3),
    ask: str(r.ask),
  }
}

/** 分析一个知识点。失败抛 AiError，由卡片就地展示。 */
export async function analyzePoint(
  pointId: string,
  settings: LlmSettings,
  options: { subject?: Subject | null; gradeBand?: string } = {},
): Promise<PointAnalysis> {
  const raw = await requestJson(settings, SYSTEM, buildAnalysisPrompt(pointId, options), {
    temperature: 0.5,
    /* 75 秒是按「直接作答」的模型估的；推理型模型（deepseek-flash / reasoner）
       思考就要十几秒，留足余量，超时由 llm.ts 报成可重试的超时错误 */
    timeoutMs: 110_000,
    /* 1600 是上一版的预算，对推理型模型不够——思考会先吃掉全部额度，
       正文一个字都剩不下（finish_reason=length，content 为空）。
       这里给到 4096；仍不够时 llm.ts 会自动放宽到 16384 再试一次。 */
    maxTokens: 4096,
  })
  return coerce(raw)
}
