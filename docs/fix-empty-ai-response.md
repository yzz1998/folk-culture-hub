# 排查记录：教学应用报「AI 返回内容为空，请重试或更换模型」

> 时间：2026-11-05
> 配置：`model: deepseek-flash` · `baseUrl: https://api.deepseek.com`
> 结论：**是本站请求层的 bug，不是模型或 Key 的问题。** 已修复并加了回归脚本。

---

## 一、症状

教学应用点「AI 分析」，骨架屏跑十几秒后变成：

> AI 返回内容为空，请重试或更换模型

同一份配置在设置页点「测试连接」却显示「连接正常」。重试多次结果一样。

---

## 二、复现与实测

绕开界面直接打接口，把 `analyze.ts` 里真实的 system / user 提示词原样发过去：

| max_tokens | HTTP | finish_reason | content | reasoning_content | completion_tokens |
| --- | --- | --- | --- | --- | --- |
| 16（测试连接） | 200 | `length` | 空 | 有 | 16 全为 reasoning |
| **1600（旧代码）** | 200 | `length` | **空** | 5142 字 | 1600 全为 reasoning |
| 4096 | 200 | `stop` | 929 字，合法 JSON | 2956 字 | 1697（其中 reasoning 1161） |

关键事实：`deepseek-flash` 是**推理型模型**，先输出 `reasoning_content` 思考，再用 `content` 作答；
**思考同样计入 `max_tokens`**。旧代码给分析留了 1600 tokens，思考就把额度吃光了，
正文一个字都没剩下——接口仍是 HTTP 200，所以既不是网络问题，也不是鉴权问题。

旧代码只读 `choices[0].message.content`，读到空串就抛「AI 返回内容为空」，
把「预算不够」说成了「模型不给内容」，这是诊断信息的错，也是重试也无效的原因。

---

## 三、修复内容

### 3.1 请求层（`src/lib/agent/llm.ts`）

拆成 `chatOnce()`（单次请求，取回 content / reasoning / finish_reason）+ `requestJson()`（策略层）：

| 情况 | 处理 |
| --- | --- |
| `content` 为空且 `finish_reason === 'length'` | **自动把预算按 4 倍放宽重试**（上限 16384），最多 3 次 |
| `content` 是被截断的 JSON 且 `finish_reason === 'length'` | 同样按截断处理并重试，不再误报「不是合法 JSON」 |
| `finish_reason === 'stop'` 但只有 reasoning | 不重试，直接说明「模型只写了思考、没留正文」 |
| 三次后仍被思考占满 | 报「输出预算被思考过程占满……建议换 deepseek-chat」，并说明已尝试的 tokens 数 |
| 两个字段都空、`completion_tokens` 为 0 | 指向「模型名在该服务商下可能不存在」 |

同时把默认超时 90 秒提到 120 秒（推理模型思考慢），分析请求 75 秒提到 110 秒。

### 3.2 分析预算（`src/lib/agent/analyze.ts`）

`maxTokens: 1600 → 4096`。实测这个任务思考约 1200–1600 tokens、正文约 550 tokens，
4096 一次成功；个别知识点思考更长时，由请求层自动放宽兜底。

### 3.3 连接测试（`testConnection`）

原来的 16 tokens 在这类模型上**必然**只吐思考，却因为 HTTP 200 报「连接正常」——典型的假阳性。
现在看 `content`：
- 有正文 → 「连接正常，可以生成方案与分析」；
- 只有思考 → 「连接正常；该模型是推理型模型，会先输出思考再作答，单次分析约需 15–40 秒」；
- 两空 → 「接口可达，但模型没有返回任何内容（finish_reason=…），请确认模型名是否正确」。

### 3.4 设置页

模型名下方补一行说明：推理型模型（deepseek-flash / deepseek-reasoner）会先思考再作答，
思考也计入输出预算，预算不足时会自动放宽重试。

---

## 四、验证

| 项目 | 结果 |
| --- | --- |
| 真实接口端到端（浏览器内、注入同一份配置） | 点「AI 分析」→ 26 秒后出结果：`面向 数学`、两条数学落点（大数的认识 / 年、月、日）、三步落地，无报错 |
| `npm run check:llm`（新增，本地假接口，不花 token） | 16 项全过：截断重试、预算递增 1600→6400、始终截断的报错文案、截断 JSON 的处理、stop+空正文不重试、代码围栏剥离、请求体结构、未配置短路 |
| `npm run verify` / `npm run build` | 通过 |

---

## 五、配置建议

- **要快**：`deepseek-chat`，同一份提示词约 5–10 秒出结果，不产生思考 token。
- **要稳**：`deepseek-flash` 也能用，单次分析 15–40 秒；界面骨架屏期间不会假死，超时会明确报出来。
- `baseUrl` 填 `https://api.deepseek.com` 或 `https://api.deepseek.com/v1` 都可以，代码会补 `/chat/completions`。

---

## 六、遗留

- 备课工坊的整课生成没有显式给 `max_tokens`（用服务端默认），走同一套截断重试；
  推理模型下如果一次生成被截断，会自动放宽到 8192 / 16384。真遇到仍失败，会明确报出预算与建议。
- 这条链路的失败**不会**降级成本地模板——上一轮就定过：宁可报错，也不给「看起来完整」的假方案。

---

## 七、后续：连通性测试的 400 回归（2026-11-05 修）

上一轮把 `testConnection` 改成复用 `chatOnce` 之后，探活请求也带上了
`response_format: {type:'json_object'}`。DeepSeek 对 `json_object` 有个硬要求：
**提示词里必须出现 "json" 字样**，探活文案（「只回复两个字：可用。不要解释。」）没有，
于是接口直接 400 —— 设置页显示「接口返回 400」，而实际上接口、Key、模型都完全正常。
这属于**误报**，比不报更麻烦。

修法：

- `JsonRequestOptions` 新增 `jsonMode?: boolean`（默认 `true`）。`chatOnce` 按它决定是否带
  `response_format`；纯文本探活显式 `jsonMode: false`。
- 回归补两条（`scripts/check-llm-retry.ts` ⑦⑧）：探活请求体**不得**含 `response_format`；
  推理模型只吐 `reasoning_content` 时仍判成功，并提示「推理型模型较慢」。
- 现在 `npm run check:llm` 共 **20 项**。

判断口径：**探活是探「能不能通」，不是探「能不能出 JSON」**。要验证 JSON 能力，走真实的
分析请求（教学应用卡片），那条链路的提示词本来就含 JSON 要求。
