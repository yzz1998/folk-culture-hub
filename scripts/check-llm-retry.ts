/**
 * AI 请求层回归：本地假接口，不消耗真实 token、不需要网络。
 *
 * 背景：deepseek-flash / deepseek-reasoner 这类推理模型会先写 reasoning_content，
 * 思考同样计入 max_tokens。预算不够时接口照样 HTTP 200，但 content 为空、
 * finish_reason=length——上一版直接报「AI 返回内容为空」，看着像模型的锅，
 * 实际是请求层没把预算这件事处理对。这里把几种返回形态都钉住。
 *
 * 跑法：npm run check:llm
 */
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { AiError, requestJson, testConnection } from '@/lib/agent/llm'

interface Reply {
  content: string
  reasoning?: string
  finish: string
}

interface Seen {
  maxTokens: number | undefined
  body: Record<string, any>
}

function serve(replies: Reply[]) {
  const seen: Seen[] = []
  let i = 0
  const server = createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      const body = JSON.parse(raw || '{}') as Record<string, any>
      seen.push({ maxTokens: body.max_tokens, body })
      const r = replies[Math.min(i, replies.length - 1)]
      i += 1
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          choices: [
            {
              finish_reason: r.finish,
              message: { content: r.content, reasoning_content: r.reasoning ?? '' },
            },
          ],
          usage: { completion_tokens: 100 },
        }),
      )
    })
  })
  return new Promise<{ port: number; seen: Seen[]; close: () => void }>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        port: (server.address() as AddressInfo).port,
        seen,
        close: () => server.close(),
      })
    })
  })
}

const S = (port: number) => ({
  enabled: true,
  baseUrl: `http://127.0.0.1:${port}`,
  apiKey: 'test',
  model: 'mock',
})

let pass = 0
let fail = 0
const ok = (cond: boolean, name: string, extra = '') => {
  if (cond) {
    pass += 1
    console.log(`  ✓ ${name}`)
  } else {
    fail += 1
    console.log(`  ✗ ${name} ${extra}`)
  }
}

async function messageOf(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn()
    return '(没有抛错)'
  } catch (e) {
    return e instanceof AiError ? `${e.kind}:${e.message}` : String(e)
  }
}

/* ① 预算被思考吃光，放宽后拿到正文 */
{
  const s = await serve([
    { content: '', reasoning: '思考中…'.repeat(200), finish: 'length' },
    { content: '{"core":"ok"}', finish: 'stop' },
  ])
  const out = (await requestJson(S(s.port), 'sys', 'user', { maxTokens: 1600 })) as { core?: string }
  ok(out.core === 'ok', '截断后自动重试并拿到结果', JSON.stringify(out))
  ok(s.seen.length === 2, '共请求 2 次', `实际 ${s.seen.length}`)
  ok(
    s.seen[0].maxTokens === 1600 && s.seen[1].maxTokens === 6400,
    '预算按 4 倍放宽（1600 → 6400）',
    s.seen.map((x) => x.maxTokens).join(','),
  )
  s.close()
}

/* ② 始终截断：报出真实原因，且重试有上限 */
{
  const s = await serve([{ content: '', reasoning: '思考…'.repeat(50), finish: 'length' }])
  const msg = await messageOf(() => requestJson(S(s.port), 'sys', 'user', { maxTokens: 4096 }))
  ok(/输出预算被思考过程占满/.test(msg), '报错点明是推理占满预算', msg)
  ok(/deepseek-chat/.test(msg), '给出可执行的替代建议', msg)
  ok(!/AI 返回内容为空/.test(msg), '不再用「内容为空」这种含糊说法', msg)
  ok(s.seen.length <= 2, '重试有上限（≤2 次）', `实际 ${s.seen.length}`)
  s.close()
}

/* ③ 正文是被截断的 JSON：也要加预算重试，而不是判成「格式不合规」 */
{
  const s = await serve([
    { content: '{"core":"半截', finish: 'length' },
    { content: '{"core":"完整"}', finish: 'stop' },
  ])
  const out = (await requestJson(S(s.port), 'sys', 'user', { maxTokens: 2048 })) as { core?: string }
  ok(out.core === '完整', '截断的 JSON 会重试而不是直接判格式错', JSON.stringify(out))
  s.close()
}

/* ④ 只写思考、不写正文（finish=stop）：不浪费第二次请求，直接说明 */
{
  const s = await serve([{ content: '', reasoning: '我想好了但没写', finish: 'stop' }])
  const msg = await messageOf(() => requestJson(S(s.port), 'sys', 'user', { maxTokens: 4096 }))
  ok(/返回内容为空/.test(msg), 'stop + 空正文给出「内容为空」', msg)
  ok(/思考过程/.test(msg), '说明模型只写了思考', msg)
  ok(s.seen.length === 1, '不重试', `实际 ${s.seen.length}`)
  s.close()
}

/* ⑤ 正常返回：只请求一次，剥掉代码围栏 */
{
  const s = await serve([{ content: '```json\n{"core":"fine"}\n```', finish: 'stop' }])
  const out = (await requestJson(S(s.port), 'sys', 'user', { maxTokens: 4096 })) as { core?: string }
  ok(out.core === 'fine', '能剥掉代码围栏', JSON.stringify(out))
  ok(s.seen.length === 1, '只请求 1 次', `实际 ${s.seen.length}`)
  ok(s.seen[0].body.response_format?.type === 'json_object', '仍带 response_format=json_object')
  ok(
    s.seen[0].body.model === 'mock' && Array.isArray(s.seen[0].body.messages) && s.seen[0].body.messages.length === 2,
    '请求体结构正常',
  )
  s.close()
}

/* ⑥ 未配置：不发请求 */
{
  const msg = await messageOf(() =>
    requestJson({ enabled: false, baseUrl: 'http://127.0.0.1:1', apiKey: 'k', model: 'm' }, 's', 'u'),
  )
  ok(/^config:/.test(msg), '未配置时报 config', msg)
}

/* ⑦ 连通性测试：纯文本探活，绝不能带 response_format
   DeepSeek 要求提示词里出现 json 字样才接受 json_object，探活文案没有，
   带上就会 400——表现成「接口返回 400」而其实接口完全正常。 */
{
  const s = await serve([{ content: '可用', finish: 'stop' }])
  const r = await testConnection(S(s.port))
  ok(r.ok, '探活判定为成功', r.message)
  ok(s.seen[0].body.response_format === undefined, '探活不带 response_format', JSON.stringify(s.seen[0].body.response_format))
  s.close()
}

/* ⑧ 连通性测试：推理模型只吐思考，也要判成功并说明慢 */
{
  const s = await serve([{ content: '', reasoning: '思考中…', finish: 'length' }])
  const r = await testConnection(S(s.port))
  ok(r.ok, '只吐思考仍判成功', r.message)
  ok(/推理型模型/.test(r.message), '提示推理模型较慢', r.message)
  s.close()
}

console.log(`\n${fail === 0 ? '✓ 全部通过' : '✗ 有失败'}：${pass} 通过 / ${fail} 失败`)
process.exit(fail === 0 ? 0 : 1)
