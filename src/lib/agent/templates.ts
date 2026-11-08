import type { FolkCategory, GradeBand, Subject } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════
   提示词素材库

   本地组装引擎已移除，这里只剩「写给模型看的口径」：
   1. VERBS —— 学段认知动词。同一件事，低年级说「看一看」，
      高年级说「考察」。这是让方案「像本年级的课」的关键。
   2. CATEGORY_VOICE / SUBJECT_VOICE —— 不同内容类型下，
      材料、方法、产出与常见毛病各是什么，供提示词取用。

   原来服务于规则拼装的环节模板（STAGE_SETS）、准备清单（PREP_BASE）
   与失误表（COMMON_ERRORS）随引擎一并删除——它们靠字符串拼接生成正文，
   正是要下线的那套东西。
   ═══════════════════════════════════════════════════════════════ */

export interface VerbSet {
  observe: string
  say: string
  act: string
  compare: string
  think: string
  create: string
  /** 该学段的课时长度习惯 */
  minuteHint: number
  /** 该学段一句学情描述，写进方案开头 */
  learnerNote: string
}

export const VERBS: Record<GradeBand, VerbSet> = {
  '1-2': {
    observe: '看一看',
    say: '说一说',
    act: '做一做',
    compare: '比一比',
    think: '猜一猜',
    create: '画一画',
    minuteHint: 40,
    learnerNote:
      '低年级以形象思维为主，注意力集中时间短，宜多感官参与、少抽象讲解，每个环节不超过 15 分钟。',
  },
  '3-4': {
    observe: '观察',
    say: '描述',
    act: '动手做',
    compare: '对比',
    think: '推测',
    create: '设计',
    minuteHint: 40,
    learnerNote:
      '中年级开始具备初步的归纳能力，能完成有明确步骤的操作任务，适合「先做后说」的探究结构。',
  },
  '5-6': {
    observe: '考察',
    say: '论证',
    act: '建模',
    compare: '分析',
    think: '质疑',
    create: '创作',
    minuteHint: 40,
    learnerNote:
      '高年级能进行多因素分析与观点论证，应留出辩论与质疑的空间，避免把结论直接给出。',
  },
}

/* ── 课堂可提供的材料与产出（三条路径共用同一形状）────── */
export interface Voice {
  /** 能拿进课堂的东西 */
  material: string
  /** 天然适合的教学方法 */
  method: string
  /** 学生可产出的成果 */
  output: string
  /** 常见教学误区，写进反思提示与纠正提示 */
  pitfall: string
}

/** 路径 A：有民俗素材，按民俗类别取声 */
export const CATEGORY_VOICE: Record<FolkCategory, Voice> = {
  节日节庆: {
    material: '节令实物、习俗照片与家庭访谈记录',
    method: '时间轴梳理与情境还原',
    output: '一份习俗调查表或一段节日叙事',
    pitfall: '容易讲成习俗清单，要追问「为什么这样做」，把现象推进到功能。',
  },
  二十四节气: {
    material: '节气盘、物候照片与本地农谚',
    method: '连续观察与数据记录',
    output: '一份物候观察日志或节气日历',
    pitfall: '容易与科学事实混淆，需区分「民俗说法」与「可验证的机制」。',
  },
  民间技艺: {
    material: '工具、半成品与艺人操作影像',
    method: '拆解工序后的动手复制',
    output: '一件可展示的作品或一份工序说明',
    pitfall: '容易停留在「好看好玩」，要落到「这个工序解决了什么问题」。',
  },
  服饰民居: {
    material: '形制图、剖面图与当地气候资料',
    method: '从形制反推环境与功能',
    output: '一张设计图或一个结构模型',
    pitfall: '容易变成建筑欣赏，要强调「形制是对气候与材料的回答」。',
  },
  饮食民俗: {
    material: '食材、器具与制作流程',
    method: '对照实验与工序还原',
    output: '一份实验记录或一张食物地图',
    pitfall: '注意卫生与过敏风险；避免把饮食课变成单纯品尝。',
  },
  民间游艺: {
    material: '器材、规则说明与表演影像',
    method: '身体参与后的规则分析',
    output: '一套改良规则或一段演示',
    pitfall: '容易只玩不析，要在玩之后追问「规则为什么这样定」。',
  },
  信仰祭祀: {
    material: '建筑照片、仪式流程说明与族谱样式',
    method: '功能分析与批判性讨论',
    output: '一份现象分析笔记',
    pitfall:
      '仅作文化现象分析，聚焦其社会与心理功能，不涉及教义宣讲，不组织仪式参与。',
  },
  民间文学: {
    material: '故事文本、方言录音与不同版本对照',
    method: '朗读、复述与版本比较',
    output: '一次讲述或一份改编文本',
    pitfall: '避免只做道德说教，重点在叙事结构与口传特征。',
  },
}

/** 路径 C：不借用任何辅助素材，完全按学科主线走 */
export const SUBJECT_VOICE: Record<Subject, Voice> = {
  语文: {
    material: '一篇课文、一段朗读音频与几则语料',
    method: '朗读、复述与语料对比',
    output: '一段口头复述或一篇短文',
    pitfall: '容易把语文课上成文化常识课，语言训练被挤掉。',
  },
  数学: {
    material: '实物模型、图形卡片与一组真实数据',
    method: '操作—猜想—验证',
    output: '一份解题过程或一张统计图',
    pitfall: '容易用情境代替算理，学生只会套例子、说不清算理。',
  },
  英语: {
    material: '图片卡、音频与简短对话文本',
    method: '听读输入后的情境对话练习',
    output: '一段 4-6 句的对话或一次口头汇报',
    pitfall: '容易把背景知识讲成中文知识课，语言目标落空。',
  },
  道德与法治: {
    material: '情境案例、规则文本与一个两难问题',
    method: '情境判断与价值澄清',
    output: '一份判断理由或一条班级规则',
    pitfall: '容易变成说教，缺少真实的两难处境，学生只会答标准答案。',
  },
  科学: {
    material: '实验器材、观察记录单与对照数据',
    method: '观察—实验—证据推理',
    output: '一份实验记录或一张证据表',
    pitfall: '容易把经验说法当成科学结论，缺少对照与证据。',
  },
  体育与健康: {
    material: '器材、场地与动作示范',
    method: '示范—练习—反馈',
    output: '一套动作组合或一份运动记录',
    pitfall: '容易只组织活动不纠正动作，运动负荷与安全提示不到位。',
  },
  艺术: {
    material: '作品图片、音响资料与创作材料',
    method: '欣赏—模仿—创作',
    output: '一件作品或一段表演',
    pitfall: '容易只讲背景不动手，审美体验被知识讲解替代。',
  },
  劳动: {
    material: '工具、材料与工序说明',
    method: '工序拆解与动手实践',
    output: '一件成品或一份工序卡',
    pitfall: '容易追求成品好看，忽略工序规范与安全。',
  },
  信息科技: {
    material: '计算机或平板、样例数据与任务单',
    method: '任务驱动下的操作与算法设计',
    output: '一个可运行的作品或一份流程图',
    pitfall: '容易变成软件功能演示，计算思维没有真正发生。',
  },
  综合实践: {
    material: '调查表、访谈提纲与实地记录',
    method: '完整探究过程：提出问题—取证—结论',
    output: '一份调查报告或一次展示',
    pitfall: '容易走过场，缺少真实的取证过程与可检验的结论。',
  },
  人类社会: {
    material: '课程文本、案例材料与知识卡',
    method: '概念梳理与案例比较',
    output: '一份概念图或一段分析',
    pitfall: '容易停在名词解释，缺少具体案例支撑。',
  },
}
