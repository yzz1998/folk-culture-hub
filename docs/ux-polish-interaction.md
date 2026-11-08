# 交互体验优化：三处阻塞点的修复

> 日期：2026-11-05
> 涉及文件：`src/components/apply/PointApplyCard.tsx`、`src/components/agent/PointPicker.tsx`、
> `src/pages/Apply.tsx`、`src/pages/SettingsPage.tsx`
> 一句话：**点学科不再自动烧钱、章节标签不再藏在滚动条里、工坊的「下一步」不会再跑出屏幕、设置开关回到正中。**

---

## 一、教学应用：切换学科不再自动发起分析

### 1.1 之前是什么问题

卡片里的学科 chip 一被点击就 `setTarget` + `setOpen`，而 `useEffect([target])` 会在展开状态下
自动调 `onAnalyze(target)`。结果是：**教师只是想看看「数学能不能接」，AI 就已经开始跑了。**

对 `deepseek-flash` 这类推理模型，一次分析 15–40 秒、思考 token 也计费。挑一个学科顺手烧一次调用，
是这个页面最不该有的手感。

### 1.2 现在怎么分

| 动作 | 结果 |
| --- | --- |
| 点卡片右上角「AI 分析」 | 展开 + **立刻请求**（一次点击完成，不等第二次确认） |
| 点收起态的「分析对象：数学」 | **只展开**选择器与结果区，不发请求 |
| 点展开态里的任意学科 chip | **只改分析对象**，不发请求 |
| 点结果区的「开始分析」 | 发请求 |
| 切到已分析过的学科 | 直接显示上次结果（缓存键 `pointId\|subject`），不重复请求 |
| 切到没分析过的学科 | 结果区变成「待分析」占位：<br>「分析对象是 X。换学科不会自动重跑，点下面按钮才开始。」+「开始分析」 |

这样既保住「点 AI 分析才分析」的直觉，也保住「切换学科后结果跟着变」——切回来立刻是上次的结论，
切到新学科则明确告诉你还差一次点击，而不是悄悄扣费。

### 1.3 实现要点

```tsx
// 只有按钮会真正发请求
function startAnalyze() {
  setOpen(true)
  onAnalyze(target)
}

// 学科只改选择
function pickSubject(s: Subject | null) {
  if (s === target) return
  setTarget(s)
}
```

原来那个 `useEffect(() => { if (open) analyzeRef.current(target) }, [target])` 已删除。
`analysis` 仍按 `analysisKey(point.id, target)` 取，所以状态天然跟着学科走：

- 有缓存 → `done`，直接渲染结果
- 没缓存 → `idle`，渲染待分析占位

### 1.4 实测

浏览器内把 `baseUrl` 指向不存在的 `http://127.0.0.1:9`，再用 CDP 监听该端口的请求：

| 步骤 | 网络请求数 |
| --- | --- |
| 点收起态「分析对象：数学」chip | **0** |
| 再切到「英语」 | **0** |
| 点「开始分析」 | **2**（OPTIONS + POST `/chat/completions`） |

页面同时出现 `开始分析` 与「换学科不会自动重跑」提示，说明走的是 `idle` 分支而非自动请求。

---

## 二、智能备课工坊：章节标签与侧栏高度

### 2.1 章节标签点不到后面几章

那排章节 chip 原本是 `overflow-x-auto` + `no-scrollbar`。两个问题叠在一起：

1. **`no-scrollbar` 这个类在本项目里并不存在**（`src/styles/index.css` 没有定义），所以并不是
   「隐藏滚动条」，而是依赖浏览器默认滚动条——细、灰、贴在内容下方，很容易被认为「没有更多」。
2. 鼠标滚轮在横向容器上默认不滚（要 Shift + 滚轮），触屏用户可以直接滑、桌面用户基本滑不动。

结果就是第 7–10 章事实上点不到。

**改法**：直接换行，不做横向滚动。

```diff
- <div className="no-scrollbar -mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
+ <div className="mb-2.5 flex flex-wrap gap-1.5">
```

10 个章节 + 「全部章节」在 1280px 下排两行、375px 下排五行，都在视野内。宁可多占两行高度，
也不要让用户怀疑「是不是只有这 6 章」。

### 2.2 素材列表一长，「下一步」就跑出屏幕

侧栏是 `lg:sticky lg:top-6 lg:self-start` 的卡片。素材选择器展开后整张卡可达 1000px 以上，
**比视口还高**；sticky 一旦钉住顶部，超出视口的那部分就永远滚不到——页面滚到底，卡片本身不移动，
底部按钮被固定在视口之外。这就是「滚轮也没用」的真实原因。

**改法**：给卡片限高，并把行动区钉在卡片底部。

```diff
- <Card className="p-4">
+ <Card className="p-4 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:overscroll-contain">
```

```diff
- <div className="mt-3 flex gap-2">
+ <div className="sticky bottom-0 z-10 -mx-4 -mb-4 mt-3 border-t border-line-2 bg-card px-4 pb-4 pt-3">
```

- `max-h` 留出 `top-6` 的 24px 间距，卡片底边始终落在视口内。
- 内容超高时在卡片内部滚动，不带动整页跳动。
- 行动区 `sticky bottom-0` + 不透明背景 + 上边框：无论素材列表多长，「下一步：定课程」都贴在卡片底部。
- 负外边距 `-mx-4 -mb-4` 抵消卡片内边距，让分隔线通栏、按钮区贴齐底边。

移动端（< lg）不加限高，仍是普通文档流，不改变原有堆叠。

### 2.3 实测（1280 × 800）

| 指标 | 值 |
| --- | --- |
| 章节 chip 数量 | **10**（01–10 全部渲染） |
| 第 10 章是否可命中 | `elementFromPoint` 命中自身 = **true** |
| 展开素材库后卡片高度 | **735px** ≤ 752px（`100vh - 3rem`） |
| 「下一步：定课程」位置 | top 663 / bottom 701（视口 800）= **完全可见且可点击** |
| 卡片内滚到底后再测 | top 663 / bottom 701 = **仍然可见** |
| 375px 横向溢出 | `scrollWidth 375 = clientWidth 375` = **0px** |

---

## 三、设置页：「大模型接入」开关错位

### 3.1 原因

原实现用的是 `h-5.5 w-10` 的轨道和 `h-4.5 w-4.5` 的圆钮，圆钮靠 `absolute top-0.5` +
`translate-x-5 / translate-x-0.5` 定位。这套写法有两个隐患：

1. `5.5` / `4.5` 属于非标准间距刻度，一旦主题里 `--spacing` 被改写，实际尺寸与位移量就对不上；
2. 位移量是**手算**的（`w-10` 40px − `w-4.5` 18px − 左 2px），轨道宽度或钮径一变，圆钮立刻偏心甚至出界。

### 3.2 改法

换成标准刻度 + flex 居中，位移直接按几何关系写死：

```tsx
<button className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-0 p-0 ...">
  <span className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200
                   {enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}" />
</button>
```

- 轨道 44 × 24，圆钮 20 × 20。
- `items-center` 保证垂直居中，不再依赖 `top-0.5`。
- 水平位移：开 = 44 − 20 − 2 = **22px**，关 = **2px**，两侧留白都是 2px。

同时给左侧标题区补 `min-w-0 flex-1`、图标补 `shrink-0`——原来标题块没有收缩约束，
窄屏上文字会把开关挤出容器，也会表现为「错位」。

### 3.3 实测

| 量 | 开 | 关 |
| --- | --- | --- |
| 轨道 | 44 × 24 | 44 × 24 |
| 圆钮 | 20 × 20 | 20 × 20 |
| 左留白 | 22px | 2px |
| 右留白 | 2px | 22px |
| 上下留白 | 各 2px | 各 2px |
| `aria-checked` | true | false |
| 背景 | `cinnabar` | `paper-3` |

左右留白互换、上下始终 2px，说明轨道与圆钮同心，切换动画到位。

---

## 四、验收

| 项目 | 结果 |
| --- | --- |
| `npx tsc --noEmit` | 0 错误 |
| `npm run verify` | 通过（错误 0，提示 3）；关联 263 / 学科↔知识点 164 未变 |
| `npm run check:llm` | 20 / 20 |
| `npm run build` | 通过，1648 模块 |
| 375px 溢出 | 0px |

## 五、顺手修的一处显示错误

教学应用页底部《人类与社会》课程卡里，「教学素材」出现了两次（一次是 `folk + materials`，
一次只有 `materials`）。现在合并成一行：

```
教学素材 136 条（图文 60 · 媒体 76） · 迁移课例 38 份
```
