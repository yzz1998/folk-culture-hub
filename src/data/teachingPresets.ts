/* ═══════════════════════════════════════════════════════════════════════
   学情与条件预设（teaching presets）

   ── 分类方式 ──────────────────────────────────────────────────────────
   按「教师备课当天就能确认的事实」分五类，不按教育学理论分类。
   每一类回答一个具体问题，且互不重叠——同一条预设只归属一类，
   避免教师在两个分组里看到意思相近的条目：

     学生基础  学生已经具备什么、缺什么（可观察的学力与经验）
     学生构成  班里有哪些差异需要照顾（人的差异）
     课堂条件  设备、场地、班额、时间这类当天改不了的硬约束
     教学资源  这节课能调用的材料、人力、场地（有则加分，决定活动上限）
     课堂管理  组织与安全上的风险点（决定活动的收放方式）

   前两类描述「学生」，后三类描述「课怎么落地」。
   教师通常先扫第三、四、五类确认活动可行性，再回头看前两类调难度。

   ── 覆盖范围 ──────────────────────────────────────────────────────────
   5 类共 32 条，覆盖小学常态课堂最常遇到的约束：
     学生基础 8　学生构成 7　课堂条件 8　教学资源 5　课堂管理 4
   选择上限 8 条：超过 8 条时各条适配建议开始互相削弱（例如同时选
   「基础较薄弱」与「基础较好」），反而失去指导意义。上限由 ISSUE_LIMIT 控制。

   ── 生效方式 ──────────────────────────────────────────────────────────
     adapt  拼进「教学提示与反思」，并在 AI 路径下写入 prompt 的学情段落
     prep   追加进「教学准备」清单
   两部分都参与 Word 导出的正文，因此预设不是标签，会真正改写教案。

   ── 维护与扩展 ────────────────────────────────────────────────────────
   本文件是唯一数据源，增删条目只改这里，界面、AI 提示词
   与 Word 导出全部自动跟随，不需要改其它文件：

     · 新增条目  往 ISSUE_PRESETS 追加 { id, label, group, adapt, prep? }
                 id 全局唯一且**不要复用**——已保存的方案按 id 回查预设
     · 修改文案  直接改 adapt / prep；历史方案下次打开即显示新文案
     · 删除条目  从数组移除即可；旧方案里残留的 id 会被 issuesByIds 静默忽略
     · 新增分组  在 ISSUE_GROUPS 增一项，新条目的 group 指过去即可；
                 界面按 ISSUE_GROUPS 顺序渲染，分组本身不参与逻辑判断
     · 调整上限  改 ISSUE_LIMIT

   写 adapt 的要求：一句话说清「这节课要改什么」，用可执行的动作，
   不要写「关注学生差异」这类无法落地的原则；涉及学生身份时不得
   让个体代表整个群体。prep 只在确实需要额外准备时才写。
   ═══════════════════════════════════════════════════════════════════════ */

export type IssueGroup = '学生基础' | '学生构成' | '课堂条件' | '教学资源' | '课堂管理'

export interface IssuePreset {
  id: string
  label: string
  group: IssueGroup
  /** 对教案的适配要求，写进「教学提示与反思」与 AI prompt */
  adapt: string
  /** 需要另行准备的东西，追加进「教学准备」 */
  prep?: string
}

export const ISSUE_GROUPS: { key: IssueGroup; note: string }[] = [
  { key: '学生基础', note: '学生已有什么、缺什么' },
  { key: '学生构成', note: '班里需要照顾的差异' },
  { key: '课堂条件', note: '设备、场地、班额这类硬约束' },
  { key: '教学资源', note: '能调用的材料、人力、场地' },
  { key: '课堂管理', note: '组织与安全上的风险点' },
]

export const ISSUE_LIMIT = 8

export const ISSUE_PRESETS: IssuePreset[] = [
  /* ══ 学生基础 ══ */
  {
    id: 'base-weak',
    label: '基础较薄弱',
    group: '学生基础',
    adapt: '操作与表达环节给出半成品支架，评价侧重「是否完成」而非「是否精细」。',
    prep: '准备半成品学案（已填一半的记录单）。',
  },
  {
    id: 'base-strong',
    label: '基础较好',
    group: '学生基础',
    adapt: '压缩讲解时间，增加开放性追问，把省下的时间给展示与互评。',
  },
  {
    id: 'hand-few',
    label: '动手经验少',
    group: '学生基础',
    adapt: '制作类活动拆成三步演示，先全班跟做一遍再分组独立完成。',
    prep: '准备分步示范材料（成品一件、半成品一件）。',
  },
  {
    id: 'read-lots',
    label: '阅读量较大',
    group: '学生基础',
    adapt: '可直接发放文字材料供自学，教师少讲，用提问检验理解。',
    prep: '准备文字资料单（一页以内，含两个待答问题）。',
  },
  {
    id: 'folk-lived',
    label: '有民俗生活经验',
    group: '学生基础',
    adapt: '优先调用学生的生活记忆作为课堂素材，教师只做归纳与提升。',
    prep: '提前请 2-3 名学生带来一件家中旧物或照片。',
  },
  {
    id: 'no-preview',
    label: '没有预习习惯',
    group: '学生基础',
    adapt: '不布置课前预习任务，把必要背景放在导入环节用 3 分钟讲清，不假设学生已读过材料。',
    prep: '准备 3 分钟能讲完的背景图卡，或一段实物演示。',
  },
  {
    id: 'slow-write',
    label: '书写速度慢',
    group: '学生基础',
    adapt: '压缩书面记录量，结论用勾选、连线或贴纸代替整段抄写，把时间留给展示。',
    prep: '准备勾选式记录单（不超过 5 行）。',
  },
  {
    id: 'dialect',
    label: '方言表达为主',
    group: '学生基础',
    adapt: '允许先用方言描述，再请同伴转成普通话，教师做一次完整转述示范，不因表达卡顿打断学生。',
    prep: '准备 3 组「方言—普通话」对照词卡。',
  },

  /* ══ 学生构成 ══ */
  {
    id: 'multi-ethnic',
    label: '有少数民族学生',
    group: '学生构成',
    adapt: '可请其介绍家乡习俗，但须事先征得同意，避免让个体代表整个民族。',
    prep: '课前私下沟通，确认愿意分享的范围。',
  },
  {
    id: 'migrant',
    label: '有随迁子女',
    group: '学生构成',
    adapt: '把不同家乡的同类习俗并置比较，差异本身就是课程资源。',
  },
  {
    id: 'mixed-grade',
    label: '复式班 / 混龄',
    group: '学生构成',
    adapt: '同一活动设基础层与挑战层两套产出要求，分层推进。',
    prep: '准备两档任务卡。',
  },
  {
    id: 'special-needs',
    label: '有特殊需要学生',
    group: '学生构成',
    adapt: '调整参与方式（可负责记录、计时或分发材料），评价只看个人进步幅度。',
    prep: '与资源教师确认本节课的支持方式。',
  },
  {
    id: 'quiet',
    label: '发言不积极',
    group: '学生构成',
    adapt: '采用「先写后说」：独立写 1 分钟，再小组交流，最后抽签发言。',
    prep: '准备发言卡与计时器。',
  },
  {
    id: 'left-behind',
    label: '留守儿童较多',
    group: '学生构成',
    adapt: '把依赖家长配合的作业改为校内完成或同伴互助，不把任务成败系于家庭支持。',
    prep: '确认可留校完成的时段与看护安排。',
  },
  {
    id: 'new-comer',
    label: '有转学新生',
    group: '学生构成',
    adapt: '每组固定搭一名熟悉本校的学生带新同学，避免新生在需要本地经验的活动里落单。',
    prep: '课前指定 3-4 名「带新」学生。',
  },

  /* ══ 课堂条件 ══ */
  {
    id: 'no-projector',
    label: '无投影设备',
    group: '课堂条件',
    adapt: '素材改用打印图卡与实物传递，板书承担全部呈现功能，不依赖投屏。',
    prep: '把纹样图打印成 A4 图卡，每组一份。',
  },
  {
    id: 'space-small',
    label: '教室空间小',
    group: '课堂条件',
    adapt: '分组活动改为同桌两人组，走动路线限制在座位周边。',
    prep: '课前调整座位为两人一组。',
  },
  {
    id: 'large-class',
    label: '大班额（45 人以上）',
    group: '课堂条件',
    adapt: '控制组数不超过 8 组，用统一口令切换环节，减少个别指导比例。',
    prep: '准备组号牌与统一口令流程。',
  },
  {
    id: 'time-tight',
    label: '课时紧张',
    group: '课堂条件',
    adapt: '删减一个次要活动，把表达交流压缩为两组代表发言。',
    prep: '课前圈定必做与选做活动。',
  },
  {
    id: 'mat-short',
    label: '材料不足',
    group: '课堂条件',
    adapt: '用低成本替代物完成核心操作，不减环节，只换材料。',
    prep: '收集旧报纸、包装纸等替代材料。',
  },
  {
    id: 'no-network',
    label: '教室无网络',
    group: '课堂条件',
    adapt: '全部素材改用本地文件或打印件，不安排任何在线检索与投屏播放。',
    prep: '提前把素材拷到教室电脑或做成打印件。',
  },
  {
    id: 'fixed-seats',
    label: '座位固定不可移动',
    group: '课堂条件',
    adapt: '不搬动桌椅，以「前后桌四人」在原座位合并成组，需要展示时到讲台前集中。',
    prep: '课前按前后桌划好四人组。',
  },
  {
    id: 'shared-room',
    label: '合用教室需按时清场',
    group: '课堂条件',
    adapt: '把收尾与清场算进课时，倒数 3 分钟停止制作，留出整理时间。',
    prep: '准备收纳盒与垃圾袋，指定两名值日生。',
  },

  /* ══ 教学资源 ══ */
  {
    id: 'real-object',
    label: '有实物教具',
    group: '教学资源',
    adapt: '把实物作为第一手材料先发下去观察触摸，再引入图片与讲解，减少纯口头描述。',
    prep: '借齐实物教具，每 4 人一件，注意登记归还。',
  },
  {
    id: 'campus-walk',
    label: '可在校园内考察',
    group: '教学资源',
    adapt: '把一个环节改成 8-10 分钟校园实地观察，回教室后用见闻支撑结论。',
    prep: '提前踩点路线，与班主任报备时间与人数。',
  },
  {
    id: 'parent-help',
    label: '有家长志愿者',
    group: '教学资源',
    adapt: '请家长承担材料分发与制作协助，教师专注教学与评价，不让家长代替讲授。',
    prep: '课前与家长对一遍分工与时间点。',
  },
  {
    id: 'cross-subject',
    label: '可跨学科协同',
    group: '教学资源',
    adapt: '与其他学科教师对齐同一素材的不同用法，避免重复教学，明确本课只承担本学科目标。',
    prep: '与相关学科教师碰一次 10 分钟的对齐。',
  },
  {
    id: 'library-media',
    label: '有图书与多媒体资源',
    group: '教学资源',
    adapt: '课上只做方法示范，把延伸查找放到课后，指向图书角或资源库。',
    prep: '提前把 3-5 本相关图书放到班级图书角。',
  },

  /* ══ 课堂管理 ══ */
  {
    id: 'noisy',
    label: '课堂纪律较松',
    group: '课堂管理',
    adapt: '用固定口令与手势切换环节，制作环节先讲规则再发材料，减少走动与争抢。',
    prep: '准备口令卡与材料领取顺序表。',
  },
  {
    id: 'group-hard',
    label: '分组合作不熟练',
    group: '课堂管理',
    adapt: '给每组一张角色卡（组长/记录/材料/发言），先做 2 分钟小组演练再进入正式任务。',
    prep: '准备角色卡，每组一套四张。',
  },
  {
    id: 'tool-safety',
    label: '用剪刀刻刀需强调安全',
    group: '课堂管理',
    adapt: '动手前用 2 分钟讲清握持与传递规范，全程要求「刀口朝下、递柄不递刃」，教师巡视不离操作区。',
    prep: '清点工具数量与锋利度，备创可贴。',
  },
  {
    id: 'no-extend',
    label: '不能占用课间',
    group: '课堂管理',
    adapt: '把整理与小结压进课时内，倒数 5 分钟必须停止制作，不靠拖堂完成收尾。',
    prep: '准备收纳盒，指定两名值日生。',
  },
]

export const ISSUE_MAP = new Map(ISSUE_PRESETS.map((p) => [p.id, p]))

/** 按 id 取回预设；未知 id（如旧数据残留）静默丢弃 */
export function issuesByIds(ids: readonly string[] | undefined): IssuePreset[] {
  if (!ids?.length) return []
  return ids.map((id) => ISSUE_MAP.get(id)).filter((p): p is IssuePreset => Boolean(p))
}

/** 拼接成一句可供展示与写进文档的文字 */
export function issuesLabel(ids: readonly string[] | undefined): string {
  return issuesByIds(ids)
    .map((p) => p.label)
    .join('、')
}

/** 每个分组各有多少条，供界面显示与自检 */
export function presetCountByGroup(): Record<IssueGroup, number> {
  const out = {} as Record<IssueGroup, number>
  for (const g of ISSUE_GROUPS) out[g.key] = 0
  for (const p of ISSUE_PRESETS) out[p.group] = (out[p.group] ?? 0) + 1
  return out
}

/** 各分组条数，预计算一次，供界面直接读取 */
export const ISSUE_COUNTS = presetCountByGroup()
