import type {
  Activity,
  AgentInput,
  FlowStage,
  GeneratedPlan,
  LessonPlan,
  LlmSettings,
  RationaleItem,
} from '@/lib/types'
import { SUBJECT_META } from '@/lib/types'
import { POINT_MAP } from '@/data/curriculum'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt'

/* ═══════════════════════════════════════════════════════════════
   大模型引擎（OpenAI 兼容接口）——现在是唯一生成路径

   本地组装引擎已整体移除，所以这里不再有「失败就本地顶上」的分支：
   - 未配置 / 未启用 → 抛 AiError('config')，由界面给出前往设置的入口；
   - 网络、鉴权、超时、返回格式 → 抛对应 AiError，界面显示原因并允许重试；
   - 模型只返回了一部分字段 → 结构性补齐（空串留白 + note 提示），不代写内容。

   为什么不再兜底：兜底会让教师拿到一份「看起来完整、实际是模板拼装」的方案，
   比明确报错更糟——他会以为那就是 AI 的判断。宁可失败，也不静默降级。
   ═══════════════════════════════════════════════════════════════ */

/* 推理型模型（deepseek-flash、deepseek-reasoner、o 系列等）会先输出 reasoning_content
   再用 content 作答，思考也计费、也计入 max_tokens。超时与预算都要按「思考 + 作答」算，
   否则会出现「HTTP 200 但正文为空」——见 requestJson 里的截断重试。 */
const TIMEOUT_MS = 120_000
/** 输出预算上限：放宽到这个数仍被思考占满，就不再盲目加码 */
const TOKEN_CEILING = 16_384

export type AiErrorKind = 'config' | 'auth' | 'network' | 'timeout' | 'format'

export class AiError extends Error {
  readonly kind: AiErrorKind

  constructor(kind: AiErrorKind, message: string) {
    super(message)
    this.name = 'AiError'
    this.kind = kind
  }
}

/** 是否可以发起 AI 调用：开关、地址、Key 三者齐备 */
export function aiConfigured(settings: LlmSettings): boolean {
  return settings.enabled && Boolean(settings.baseUrl.trim()) && Boolean(settings.apiKey.trim())
}

function endpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  if (/\/chat\/completions$/.test(trimmed)) return trimmed
  return `${trimmed}/chat/completions`
}

function stripFence(raw: string): string {
  let s = raw.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
  }
  const first = s.indexOf('{')
  const last = s.lastIndexOf('}')
  if (first !== -1 && last > first) s = s.slice(first, last + 1)
  return s
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim())
}

/* ── 底层请求 ───────────────────────────────────── */

interface JsonRequestOptions {
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  /**
   * 是否带 `response_format: json_object`。默认 true。
   * 注意：DeepSeek 等兼容端点要求「提示词里出现 json 字样」才接受这个参数，
   * 否则直接 400。所以纯文本探活（连通性测试）必须显式关掉。
   */
  jsonMode?: boolean
}

/** 一次对话的原始结果。reasoning 只在推理型模型上出现 */
interface ChatResult {
  content: string
  reasoning: string
  finish: string
  completionTokens: number
}

/**
 * 单次请求。HTTP 与空正文分开处理：
 * 空正文不是「接口坏了」，很常见的原因是输出预算被思考过程吃掉（finish_reason=length），
 * 所以这里只负责取回事实，由 requestJson 决定放宽预算重试还是一次性报错。
 */
async function chatOnce(
  settings: LlmSettings,
  system: string,
  user: string,
  options: JsonRequestOptions,
  maxTokens: number | undefined,
): Promise<ChatResult> {
  const ac = new AbortController()
  const timeout = options.timeoutMs ?? TIMEOUT_MS
  const timer = setTimeout(() => ac.abort(), timeout)

  let res: Response
  try {
    res = await fetch(endpoint(settings.baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: maxTokens,
        ...(options.jsonMode === false ? {} : { response_format: { type: 'json_object' } }),
      }),
      signal: ac.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    const msg = e instanceof Error ? e.message : String(e)
    throw new AiError(
      /abort/i.test(msg) ? 'timeout' : 'network',
      /abort/i.test(msg)
        ? `请求超时（${Math.round(timeout / 1000)} 秒未返回）。推理型模型思考较慢，可重试或换更快的模型`
        : `网络请求失败：${msg}`,
    )
  }
  clearTimeout(timer)

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const detail = body ? `：${body.slice(0, 160)}` : ''
    if (res.status === 401 || res.status === 403) {
      throw new AiError('auth', `鉴权失败（${res.status}），请检查 API Key 是否有效${detail}`)
    }
    if (res.status === 404) {
      throw new AiError('config', `接口地址不存在（404），请检查 Base URL 是否填到 /v1${detail}`)
    }
    if (res.status === 429) {
      throw new AiError('network', `请求过于频繁或额度不足（429）${detail}`)
    }
    throw new AiError('network', `接口返回 ${res.status}${detail}`)
  }

  const data = (await res.json().catch(() => null)) as {
    choices?: {
      message?: { content?: string | null; reasoning_content?: string | null }
      finish_reason?: string | null
    }[]
    usage?: { completion_tokens?: number }
  } | null

  const choice = data?.choices?.[0]
  return {
    content: choice?.message?.content ?? '',
    reasoning: choice?.message?.reasoning_content ?? '',
    finish: choice?.finish_reason ?? '',
    completionTokens: data?.usage?.completion_tokens ?? 0,
  }
}

/**
 * 发起一次对话并解析 JSON。所有失败都收敛为 AiError，
 * 不在这里 toast，由调用方决定展示方式。
 *
 * 空正文的三种成因分开处理，不再一律报「内容为空」：
 * ① finish_reason=length：输出预算被思考占满 → 自动翻倍预算重试（上限 TOKEN_CEILING）；
 * ② finish_reason=stop 但只有 reasoning：模型把答案写进了思考里 → 直接说明；
 * ③ 两者都空：模型名或参数不对 → 指出可能的原因。
 */
export async function requestJson(
  settings: LlmSettings,
  system: string,
  user: string,
  options: JsonRequestOptions = {},
): Promise<unknown> {
  if (!aiConfigured(settings)) {
    throw new AiError('config', '尚未配置 AI 服务，请先在设置中填写接口地址与 API Key')
  }

  let budget = options.maxTokens
  let last: ChatResult | null = null

  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await chatOnce(settings, system, user, options, budget)
    last = r

    const text = r.content.trim()
    if (text) {
      try {
        return JSON.parse(stripFence(r.content))
      } catch {
        /* 正文被截断时 JSON 必然不完整，这不是模型的格式问题，加预算再来一次 */
        if (r.finish !== 'length') {
          throw new AiError('format', 'AI 返回的不是合法 JSON，请重试或更换模型')
        }
      }
    }

    /* 只有「预算耗尽」值得加码重试，其它空返回重试也不会变 */
    if (r.finish !== 'length') break

    const next = Math.min(TOKEN_CEILING, budget ? budget * 4 : 8192)
    if (budget !== undefined && next <= budget) break
    budget = next
  }

  const reasoningNote = last?.reasoning.trim()
    ? `（模型已输出 ${last.reasoning.length} 字思考过程，但没有留下正文）`
    : ''

  if (last?.finish === 'length') {
    throw new AiError(
      'format',
      `模型的输出预算被思考过程占满了${reasoningNote}，已尝试放宽到 ${budget ?? TOKEN_CEILING} tokens 仍未拿到正文。` +
        `「${settings.model}」是推理型模型时思考会占用大部分额度，建议换用 deepseek-chat 这类直接作答的模型，或重试一次`,
    )
  }

  throw new AiError(
    'format',
    last && !last.content && !last.reasoning && !last.completionTokens
      ? `接口返回了空结果，未产生任何内容。请确认模型名「${settings.model}」在该服务商下是否存在`
      : `AI 返回内容为空${reasoningNote}，请重试或更换模型`,
  )
}

/* ── 连通性测试 ─────────────────────────────────── */

/**
 * 连通性测试只回答「能不能通」，不验证出文速度。
 * 但推理型模型在 16 tokens 下必然只吐思考、正文为空，若只看 HTTP 200 会给出
 * 「连接正常」的假阳性——所以这里要看 content，并如实说明该模型的作答方式。
 */
export async function testConnection(settings: LlmSettings): Promise<{ ok: boolean; message: string }> {
  if (!settings.apiKey.trim()) return { ok: false, message: '请先填写 API Key' }
  if (!settings.baseUrl.trim()) return { ok: false, message: '请先填写 Base URL' }
  try {
    const r = await chatOnce(
      settings,
      '',
      '只回复两个字：可用。不要解释。',
      { temperature: 0, timeoutMs: 30_000, jsonMode: false },
      128,
    )
    if (r.content.trim()) return { ok: true, message: '连接正常，可以生成方案与分析' }
    if (r.reasoning.trim()) {
      return {
        ok: true,
        message: `连接正常；「${settings.model}」是推理型模型，会先输出思考再作答，单次分析约需 15–40 秒`,
      }
    }
    return {
      ok: false,
      message: `接口可达，但模型没有返回任何内容（finish_reason=${r.finish || '未知'}）。请确认模型名「${settings.model}」是否正确`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, message: msg }
  }
}

/* ── 结果结构 ───────────────────────────────────── */

const ACTIVITY_TYPES: Activity['type'][] = ['体验', '探究', '表达', '制作', '讨论', '游戏']

/** 分母补齐：把总分钟数调整到课时长度，只改时间、不改内容 */
function fitDuration(flow: FlowStage[], duration: number): FlowStage[] {
  const sum = flow.reduce((a, s) => a + s.minutes, 0)
  if (sum <= 0) return flow
  if (sum === duration) return flow

  const raw = flow.map((s) => (s.minutes * duration) / sum)
  const base = raw.map((v) => Math.max(1, Math.floor(v)))
  let rest = duration - base.reduce((a, b) => a + b, 0)
  const order = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
  let cursor = 0
  while (rest > 0) {
    base[order[cursor % order.length].i] += 1
    rest -= 1
    cursor += 1
  }
  while (rest < 0) {
    const idx = base.findIndex((m) => m > 1)
    if (idx === -1) break
    base[idx] -= 1
    rest += 1
  }
  return flow.map((s, i) => ({ ...s, minutes: base[i] }))
}

/** 空骨架：只提供类型与时间预算，不生成任何内容 */
function skeleton(input: AgentInput): LessonPlan {
  return {
    id: `plan-${Date.now().toString(36)}`,
    title: input.topic?.trim() || `${input.subject}教学方案`,
    folkIds: [],
    chapterId: input.chapterId ?? '',
    pointIds: input.pointIds,
    cardIds: input.cardIds ?? [],
    materialIds: input.materialIds ?? [],
    gradeBand: input.gradeBand,
    subject: input.subject,
    duration: input.duration,
    folkLink: 'none',
    objectives: { knowledge: '', ability: '', emotion: '' },
    keyPoints: [],
    difficultPoints: [],
    preparation: [],
    flow: [],
    activities: [],
    evaluation: '',
    homework: { basic: '', extend: '', project: '' },
    differentiation: { support: '', challenge: '' },
    boardDesign: '',
    reflection: '',
    caution: '',
  }
}

interface CoerceResult {
  plan: LessonPlan
  missing: string[]
}

function coercePlan(raw: unknown, input: AgentInput): CoerceResult {
  const base = skeleton(input)
  if (!raw || typeof raw !== 'object') {
    throw new AiError('format', 'AI 返回的结构无法识别，请重试')
  }
  const r = raw as Record<string, unknown>
  const p = (r.plan && typeof r.plan === 'object' ? r.plan : r) as Record<string, unknown>
  const obj = (p.objectives ?? {}) as Record<string, unknown>
  const hw = (p.homework ?? {}) as Record<string, unknown>
  const dif = (p.differentiation ?? {}) as Record<string, unknown>

  const flowRaw = Array.isArray(p.flow) ? (p.flow as Record<string, unknown>[]) : []
  const flow: FlowStage[] = flowRaw
    .map((s) => ({
      stage: str(s.stage),
      minutes: Number(s.minutes) || 0,
      teacher: str(s.teacher),
      student: str(s.student),
      intent: str(s.intent),
    }))
    .filter((s) => s.stage && s.minutes > 0)

  if (flow.length < 3) {
    throw new AiError('format', 'AI 返回的教学流程不足三个环节，请重试')
  }

  const objectives = {
    knowledge: str(obj.knowledge),
    ability: str(obj.ability),
    emotion: str(obj.emotion),
  }
  if (!objectives.knowledge && !objectives.ability) {
    throw new AiError('format', 'AI 返回的教学目标为空，请重试')
  }

  const activities: Activity[] = (Array.isArray(p.activities) ? (p.activities as Record<string, unknown>[]) : [])
    .map((a) => {
      const t = str(a.type, '探究') as Activity['type']
      return {
        name: str(a.name),
        type: ACTIVITY_TYPES.includes(t) ? t : '探究',
        minutes: Number(a.minutes) || 8,
        desc: str(a.desc),
        grouping: str(a.grouping, '小组合作'),
      }
    })
    .filter((a) => a.name && a.desc)

  const plan: LessonPlan = {
    ...base,
    title: input.topic?.trim() || str(r.title, base.title),
    objectives,
    keyPoints: strArr(p.keyPoints),
    difficultPoints: strArr(p.difficultPoints),
    preparation: strArr(p.preparation),
    flow: fitDuration(flow, input.duration),
    activities,
    evaluation: str(p.evaluation),
    homework: {
      basic: str(hw.basic),
      extend: str(hw.extend),
      project: str(hw.project),
    },
    differentiation: { support: str(dif.support), challenge: str(dif.challenge) },
    boardDesign: str(p.boardDesign),
    reflection: str(p.reflection),
  }

  const missing: string[] = []
  if (!plan.evaluation) missing.push('评价方式')
  if (!plan.keyPoints.length) missing.push('教学重点')
  if (!plan.preparation.length) missing.push('教学准备')

  return { plan, missing }
}

/** AI 漏写配置说明时的兜底：只用输入里的既有事实拼装，不代写判断 */
function fallbackRationale(input: AgentInput): RationaleItem[] {
  const meta = SUBJECT_META[input.subject]
  const titles = input.pointIds
    .map((id) => POINT_MAP.get(id)?.title)
    .filter((t): t is string => Boolean(t))
  return [
    { label: '学科这一侧', text: `${input.subject}：${meta.ownCore}` },
    {
      label: '辅助这一侧',
      text: titles.length
        ? `借用了 ${titles.length} 个课程知识点：${titles.join('、')}。`
        : '本课未借用任何课程知识点，按学科主线编写。',
    },
    {
      label: '两者怎么接上',
      text: titles.length
        ? 'AI 未给出衔接说明，可对照知识点详情里的落点自行调整。'
        : '无辅助内容需要衔接。',
    },
  ]
}

function coerceRationale(raw: unknown, input: AgentInput): RationaleItem[] {
  const r = raw as Record<string, unknown>
  const list = Array.isArray(r.rationale) ? (r.rationale as Record<string, unknown>[]) : []
  const items = list
    .map((x) => ({ label: str(x.label), text: str(x.text) }))
    .filter((x) => x.label && x.text)
  return items.length >= 2 ? items : fallbackRationale(input)
}

/* ── 生成 ───────────────────────────────────────── */

export interface GenerateOptions {
  /** 第几次生成，用于「换一个方案」时提示模型换角度 */
  variant?: number
}

export async function generatePlanWithAI(
  input: AgentInput,
  settings: LlmSettings,
  options: GenerateOptions = {},
): Promise<GeneratedPlan> {
  const variant = options.variant ?? 0
  const basePrompt = buildUserPrompt(input)
  const userPrompt =
    variant > 0
      ? `${basePrompt}\n\n## 本次要求\n这是同一课题的第 ${variant + 1} 次生成。请换一个切入角度与活动组合，不要重复上一次的常规上法；课时、主题与所选知识点不得改动。`
      : basePrompt

  const raw = await requestJson(settings, SYSTEM_PROMPT, userPrompt, {
    temperature: variant > 0 ? 0.95 : 0.7,
  })

  const { plan, missing } = coercePlan(raw, input)

  const notes: string[] = []
  const rawPlan = ((raw as Record<string, unknown>).plan ?? raw) as Record<string, unknown>
  const rawFlow = Array.isArray(rawPlan.flow) ? (rawPlan.flow as Record<string, unknown>[]) : []
  const declared = rawFlow.reduce((a, s) => a + (Number(s.minutes) || 0), 0)
  if (declared > 0 && declared !== input.duration) {
    notes.push(`AI 给的环节合计 ${declared} 分钟，已按 ${input.duration} 分钟重新分配`)
  }
  if (missing.length) {
    notes.push(`AI 未填写${missing.join('、')}，已在方案中留空，可点「编辑」补齐`)
  }

  return {
    id: `plan-${Date.now().toString(36)}`,
    createdAt: Date.now(),
    title: plan.title,
    input,
    rationale: coerceRationale(raw, input),
    plan,
    note: notes.length ? `${notes.join('；')}。` : undefined,
  }
}
