# 民间文化教学资源站 · folk-culture-hub

面向小学教师的《人类与社会》课程教学辅助平台：把课程知识点与小学课堂的教学内容逐一对应，再由 AI 生成可直接修改、可导出 Word 的教案。

**在线访问：<https://yzz1998.github.io/folk-culture-hub/>**

[![Deploy](https://github.com/yzz1998/folk-culture-hub/actions/workflows/deploy.yml/badge.svg)](https://github.com/yzz1998/folk-culture-hub/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-19-087ea4)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646cff)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com)

---

## 这是什么

《人类与社会》是小学教师的一门通识课程，讲族群、生计、信仰、制度与现代社会。它的内容离课堂很近，但老师通常不知道**哪个知识点能接到自己那门课的哪一课**——这正是本站要解决的问题。

平台的组织逻辑只有一条：**课程是主体，学科是迁移的出口**。

```
读课程脉络 → 找落点 → 备一课
  /curriculum   /apply    /agent
```

民俗（第 7 章的一类内容）**不是**平台主线：它有入口、有详情页，但不占一级导航、不进首页主线，也不作为配色与纹样的来源。

## 功能地图

| 页面 | 路由 | 只回答一个问题 |
| --- | --- | --- |
| 首页 | `/` | 这门课讲什么、怎么用、从哪开始 |
| 课程脉络 | `/curriculum` | 这一章这一单元讲了什么，这个点能落到哪 |
| 资源库 | `/resources` | 这一章有哪些可用材料（知识点卡 / 教学素材 / 课例） |
| 教案库 | `/lessons` | 别人怎么把它迁移进课堂 |
| 教学应用 | `/apply` | 这个点能落到哪些课堂；按我的学科具体怎么用 |
| 智能备课工坊 | `/agent` | 给我这个点 + 这门课，产出一份能改的教案 |
| 我的空间 | `/workspace` | 我生成的方案与本地数据 |
| 设置 | `/settings` | 大模型接入与数据导入导出 |

各页详情路由：`/resources/card/:id`（知识点卡）、`/resources/material/:id`（教学素材）、`/lessons/:id`（课例）。

## 内容规模

数字全部由 `src/lib/catalog.ts` 统一计算，页面不自行统计（`npm run verify` 会核对）。

| 维度 | 数量 |
| --- | --- |
| 章节 / 单元 / 知识点 | 10 章 · 26 单元 · 73 个 |
| 知识点卡 | 73 张（要点 / 概念 / 误区 / 追问） |
| 教学素材 | 136 条（图文条目 60 · 媒体素材 76） |
| 课例 | 38 份 |
| 资源合计 | 247 条（跨章去重后） |
| 学科 ↔ 知识点落点 | 164 条 |
| 覆盖学科 | 10 门小学国家课程（语文、数学、英语、道德与法治、科学、体育与健康、艺术、劳动、信息科技、综合实践） |

每条落点都写明**以什么方式用**（情境导入 / 素材案例 / 对比辨析 / 延伸阅读）与**落到哪个具体教学内容、起什么作用**，不接受「可作素材」这类空话。

## 技术栈

- **React 19 + TypeScript 5.7**，函数组件 + hooks
- **Vite 7** 构建，`base: './'` 以便部署在任意子路径
- **Tailwind CSS v4**（`@tailwindcss/vite`），设计令牌集中在 `src/styles/index.css`
- **React Router 7 · HashRouter** —— 纯静态托管无需服务端重写，不需要 `404.html`
- **docx** —— 浏览器端生成 Word 教案
- **lucide-react** 图标、**clsx** 类名合并
- 无后端、无数据库：所有个人数据（方案、设置）存放在浏览器 `localStorage`（命名空间 `folkhub:v1:*`）

## 本地运行

```bash
npm install
npm run dev        # http://localhost:5173
```

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 开发服务器 |
| `npm run build` | 类型检查 → 数据一致性校验 → 打包（任一不过则构建失败） |
| `npm run preview` | 预览构建产物 |
| `npm run typecheck` | 仅类型检查 |
| `npm run verify` | 数据一致性校验（247 条资源 / 263 条关联 / 164 条落点） |
| `npm run check:llm` | AI 请求层回归（截断重试、预算递增、探活请求体等 20 项） |

`verify` 用 vite 自带的 esbuild 把 TS 校验脚本打成单文件执行，因此 `@/` 别名和 TS 语法都不需要额外配置，也不新增运行时依赖。它分两级：`error` 阻断构建，`warn` 只提示补料（如某章课例偏少）。

## 配置 AI

设置页 → **大模型接入**，填三项即可：

| 字段 | 示例 |
| --- | --- |
| 模型名称 | `deepseek-chat` / `deepseek-flash` |
| Base URL | `https://api.deepseek.com` |
| API Key | `sk-...` |

- 接口按 OpenAI Chat Completions 格式调用，任何兼容该格式的服务都能接。
- **Key 只存在你自己的浏览器里**（`localStorage` 键 `folkhub:v1:settings`），页面是纯静态的，不存在服务端转发，也不会随站点分发。公共电脑上用完请清除。
- 推理型模型（如 `deepseek-flash`）的思考过程与正文共享输出预算。若思考把预算占满会导致正文为空，请求层会自动放大预算重试（1600 → 4096 → 上限 16384），并在仍失败时如实说明原因，而不是丢一句「请重试」。追求速度可直接用 `deepseek-chat`。
- **没有 AI 就不生成**：未配置时按钮仍可点，但会说明原因并链到设置，不会静默降级成本地拼装。

## 目录结构

```
src/
├── data/                 课程内容（纯数据，无副作用）
│   ├── curriculum.ts     10 章 / 26 单元 / 73 知识点
│   ├── knowledgeCards/   73 张知识卡，按章拆分 ch1–ch10
│   ├── folk.ts           60 条图文条目
│   ├── materials.ts      76 条媒体素材
│   ├── lessons.ts        38 份课例
│   └── subjectPoints.ts  164 条学科 ↔ 知识点落点
├── lib/
│   ├── catalog.ts        双索引层：章节索引 + 学科索引，全站数字的唯一来源
│   ├── agent/            AI 请求与提示词（llm.ts 是唯一出口）
│   ├── exportDocx.ts     Word 导出
│   └── storage.ts        版本化 localStorage 封装
├── pages/                8 个页面
├── components/           按域分目录（apply / agent / folk / lesson / resource / layout / ui）
└── store/                全局状态（未接后端，全部落地 localStorage）
```

## 三条设计约束

改任何页面前请先读 [`docs/information-architecture.md`](docs/information-architecture.md)。最容易犯的三个错：

1. **章节归属一律派生** —— 由资源关联的知识点反推（`chapterIdsOfPoints()`），不手写 `chapterIds` 数组。跨章资源在各章都出现，全局计数按 `key` 去重。
2. **数字只来自 `catalog.ts`** —— 页面里不写 `filter().length`，否则「课程脉络说 12 份、资源库列出 9 份」这类不一致会重新长出来。
3. **空态合法** —— 某门课可承接 0 个知识点是必须存在的界面状态（英语、信息科技本就如此），文案是「按自己的主线备课即可」，不是缺料警告。

## 部署

推送到 `main` 即自动发布到 GitHub Pages（`.github/workflows/deploy.yml`）：

```
checkout → setup-node 22 → npm ci → npm run build
        → configure-pages → upload-pages-artifact(dist) → deploy-pages
```

因为 `build` 内含类型检查与数据校验，**坏版本不会被推上线**。仓库 Pages 源需设为 `GitHub Actions`（`build_type: workflow`）。细节与排错见 [`docs/deploy-github-pages.md`](docs/deploy-github-pages.md)。

## 文档

| 文件 | 内容 |
| --- | --- |
| [`docs/information-architecture.md`](docs/information-architecture.md) | 信息架构：四层结构、导航、数据层、三条硬约束 |
| [`docs/deploy-github-pages.md`](docs/deploy-github-pages.md) | Pages 部署链路与排错 |
| [`docs/fix-empty-ai-response.md`](docs/fix-empty-ai-response.md) | 「AI 返回内容为空」的根因分析与修复 |
| [`docs/change-studio-material-picker.md`](docs/change-studio-material-picker.md) | 工坊素材选择区改造 |
| [`docs/ux-polish-interaction.md`](docs/ux-polish-interaction.md) | 交互细节优化（显式触发分析、章节标签、开关对齐） |
| [`docs/export-and-presets.md`](docs/export-and-presets.md) | 导出与教学预设 |
| `docs/change-*.md` | 历次结构调整记录 |

## 内容说明

课程内容为教学用途整理，引用民俗材料时以「可核实、可溯源」为先；发现错漏欢迎提 Issue。代码与内容版权归仓库作者所有。
