/* ═══════════════════════════════════════════════════════════════
   核心类型契约
   所有页面、数据文件与智能体共用这一套结构。
   内容组织以《人类与社会》课程为主体：章 → 单元 → 知识点 → 迁移落点。
   学科是落点，不是主轴；民俗是第 7 章里的一类内容，不是全站基调。
   新增课程知识模块时只需扩展 curriculum.ts，无需改动页面。
   ═══════════════════════════════════════════════════════════════ */

export type FolkCategory =
  | '节日节庆'
  | '二十四节气'
  | '民间技艺'
  | '服饰民居'
  | '饮食民俗'
  | '民间游艺'
  | '信仰祭祀'
  | '民间文学'

export type GradeBand = '1-2' | '3-4' | '5-6'

/** 课程章节 id：ch1 … ch10 */
export type ChapterId = `ch${number}`

/** 知识点 id：ch7-u2-p1 */
export type PointId = `${ChapterId}-u${number}-p${number}`

/**
 * 小学阶段国家课程学科（《义务教育课程方案（2022 年版）》共 10 门）
 * 外加本平台所服务的《人类与社会》课程本身。
 */
export type Subject =
  | '语文'
  | '数学'
  | '英语'
  | '道德与法治'
  | '科学'
  | '体育与健康'
  | '艺术'
  | '劳动'
  | '信息科技'
  | '综合实践'
  | '人类社会'

/** 民俗与某一学科的关联强度。民俗只是当前的重点演示方向，不是所有学科的共同入口。 */
export type FolkAffinity = 'strong' | 'fair' | 'weak' | 'none'

export type Region = '全国' | '闽东'

export type Theme =
  | '家国情怀'
  | '家族伦理'
  | '人与自然'
  | '技艺传承'
  | '多元一体'
  | '生活智慧'

/* ── 纹样生成参数（剪纸风格 SVG） ───────────────────── */
export type Motif =
  | 'flower' // 团花
  | 'window' // 窗格
  | 'fish' // 鱼
  | 'bird' // 鸟
  | 'dragon' // 龙
  | 'cloud' // 云纹
  | 'wave' // 水波
  | 'mountain' // 山形
  | 'lantern' // 灯笼
  | 'fret' // 回纹

export type PaletteName = 'cinnabar' | 'indigo' | 'ochre' | 'bamboo' | 'ink'

export interface PatternSpec {
  motif: Motif
  palette: PaletteName
  density: 1 | 2 | 3
}

/* ── 民俗文化条目 ──────────────────────────────────── */
export interface FolkItem {
  id: string
  name: string
  category: FolkCategory
  region: Region
  themes: Theme[]
  subjects: Subject[]
  grades: GradeBand[]
  /** 一句话概述 */
  summary: string
  /** 文化内涵，智能体核心取用字段 */
  culturalMeaning: string
  /** 源流脉络 */
  origin: string
  /** 课堂可切入的三个观察点 */
  classroomHooks: string[]
  keywords: string[]
  /** 关联的课程知识点 id —— 民俗与知识点之间唯一的挂载边 */
  pointIds: PointId[]
  materialIds: string[]
  pattern: PatternSpec
  /** 时令推荐月份 */
  seasonMonths?: number[]
  /** 常见教学误区提示，教师视角的实用信息 */
  caution?: string
}

/* ── 课程知识结构（可扩展） ────────────────────────── */
export interface KnowledgePoint {
  id: PointId
  title: string
  summary: string
  gradeBand?: GradeBand
  /** ready = 已有内容；planned = 预留位，等待补充 */
  status: 'ready' | 'planned'
}

/* ── 辅助层内容：知识点卡（知识点的内容底片）─────────── */
export interface KnowledgeCard {
  id: string
  pointId: PointId
  status: 'ready' | 'draft'
  /** 核心要点，3 条，陈述句 */
  keyIdeas: string[]
  /** 关键概念：术语 + 一句生活化的解释 */
  concepts: { term: string; gloss: string }[]
  /** 常见误区：常见说法 → 机理上的纠正 */
  misconceptions: { claim: string; correction: string }[]
  /** 课堂追问，2 条，开放性问题 */
  inquiries: string[]
}

/* ── 跨层关系：学科借用知识点的用途 ────────────────── */
/** 情境导入 / 素材案例 / 对比辨析 / 延伸阅读 */
export type PointUse = 'context' | 'material' | 'contrast' | 'extension'

export const POINT_USE_LABEL: Record<PointUse, string> = {
  context: '情境导入',
  material: '素材案例',
  contrast: '对比辨析',
  extension: '延伸阅读',
}

/**
 * 用途的展示顺序，全站唯一来源。
 * 新增 PointUse 时必须同时进这里，否则该条在各界面上会静默消失；
 * 新增后 POINT_USE_LABEL 也要补一条，否则分组标题会取不到中文名。
 */
export const USE_ORDER: PointUse[] = ['context', 'material', 'contrast', 'extension']

/**
 * 知识点 ↔ 学科的迁移映射，是全站唯一的「教学应用」入口。
 * 课程是主体、学科是落点：这里只记录「这个知识点能落到哪门学科的哪个教学内容、用来做什么」，
 * 不记录学科自己的教学主线（主线在 SUBJECT_META 里）。
 */
export interface SubjectPointLink {
  subject: Subject
  pointId: PointId
  use: PointUse
  /** 落到这门学科的哪个具体内容、起什么作用。必须点名学科侧的内容，不能只写"可作为素材" */
  why: string
}

export interface CurriculumUnit {
  id: string
  title: string
  points: KnowledgePoint[]
}

export interface CurriculumChapter {
  id: ChapterId
  order: number
  title: string
  /** 本章要回答的核心问题，一句话，用于章节卡片首行 */
  coreQuestion: string
  brief: string
  /** 该章与民俗文化的天然结合点，一句话 */
  folkAngle: string
  units: CurriculumUnit[]
}

/* ── 教案 ──────────────────────────────────────────── */
export interface FlowStage {
  stage: string
  minutes: number
  teacher: string
  student: string
  intent: string
}

/** 活动形式。民俗融合课多用前六类，学科本体课会用到后面的操作/实验/练习等。 */
export type ActivityType =
  | '体验'
  | '探究'
  | '表达'
  | '制作'
  | '讨论'
  | '游戏'
  | '操作'
  | '实验'
  | '观察'
  | '设计'
  | '练习'
  | '比赛'
  | '创作'
  | '辨析'
  | '写作'
  | '考察'

export interface Activity {
  name: string
  type: ActivityType
  minutes: number
  desc: string
  grouping: string
}

export interface Objectives {
  knowledge: string
  ability: string
  emotion: string
}

/**
 * 课例与民俗的关系。民俗只是当前的重点演示方向，不是所有课例的共同前提。
 * core    —— 民俗是内容本体（如剪纸、节日）
 * support —— 民俗作情境或素材引入，学科内容仍是主体
 * none    —— 不涉及民俗，学科内容独立呈现
 */
export type FolkLink = 'core' | 'support' | 'none'

export const FOLK_LINK_LABEL: Record<FolkLink, string> = {
  core: '民俗本体',
  support: '民俗作素材',
  none: '学科本体',
}

export interface LessonPlan {
  id: string
  title: string
  folkIds: string[]
  /** 主章节；未借用任何知识点时为空串 */
  chapterId: ChapterId | ''
  pointIds: PointId[]
  /** 借用的知识点卡 id */
  cardIds?: string[]
  /** 选用的教学素材 id */
  materialIds?: string[]
  gradeBand: GradeBand
  subject: Subject
  duration: number
  /** 本课与民俗的关系；缺省时按 folkIds 是否为空推断 */
  folkLink?: FolkLink
  objectives: Objectives
  keyPoints: string[]
  difficultPoints: string[]
  preparation: string[]
  flow: FlowStage[]
  activities: Activity[]
  evaluation: string
  homework: { basic: string; extend: string; project: string }
  differentiation: { support: string; challenge: string }
  boardDesign?: string
  reflection?: string
  /** 教学尺度提醒：涉及信仰、民族、家庭结构等敏感内容时的处理建议 */
  caution?: string
}

/* ── 素材 ──────────────────────────────────────────── */
export type MaterialType = 'image' | 'audio' | 'video' | 'text'

export interface Material {
  id: string
  type: MaterialType
  title: string
  folkId: string
  desc: string
  /** 音视频条目：建议时长 */
  duration?: string
  /** 文本素材正文 */
  body?: string
  /** 用途标注 */
  usage?: string
  /** 适用年级。原先塞在 usage 字符串里，现在提升为独立字段，便于按年级筛选 */
  gradeBands?: GradeBand[]
  /** 素材状态：placeholder = 待替换为本校素材 */
  status: 'ready' | 'placeholder'
  /** 图片素材的纹样参数，无则为 undefined */
  pattern?: PatternSpec
}

/* ── 智能体 ────────────────────────────────────────── */
export type TeachStyle =
  | '体验探究'
  | '知识讲授'
  | '项目式'
  | '情境任务'
  | '复习巩固'
  | '跨学科主题'

export interface AgentInput {
  pointIds: PointId[]
  /** 知识点的所属章节，由 pointIds 反推，留空表示本课不借用辅助素材 */
  chapterId?: ChapterId | ''
  /** 借用的知识点卡 */
  cardIds?: string[]
  /** 选用的教学素材 */
  materialIds?: string[]
  gradeBand: GradeBand
  subject: Subject
  /** 教师自拟的课程主题，直接作为教案标题 */
  topic?: string
  duration: number
  style: TeachStyle
  /** 已选学情预设的 id（见 src/data/teachingPresets.ts），可空 */
  issues?: string[]
  /** 教师补充的学情说明，可空 */
  notes?: string
}

export interface RationaleItem {
  label: string
  text: string
}

/**
 * 方案只可能由 AI 生成（本地组装引擎已移除），因此不再记录 engine 字段。
 * 旧快照里残留的 engine 会被忽略，不影响读取。
 */
export interface GeneratedPlan {
  id: string
  createdAt: number
  title: string
  input: AgentInput
  rationale: RationaleItem[]
  plan: LessonPlan
  /** 生成时的结构性提示，例如「环节分钟数已按课时重新分配」 */
  note?: string
}

/**
 * 单个知识点的课堂落点分析（教学应用页 · 卡内 AI 分析）。
 * 由 `lib/agent/analyze.ts` 生成，字段缺失的段落界面不渲染。
 */
export interface PointAnalysis {
  /** 一句话定位：这个知识点在课堂里是什么 */
  core: string
  /** 能落到的课堂，按适配度排序，最多 3 条 */
  classrooms: {
    subject: Subject | string
    /** 具体的教学内容：单元 / 课题 / 任务名 */
    content: string
    /** 在这节课里承担什么作用 */
    use: string
    /** 一句可执行的用法 */
    example: string
  }[]
  /** 三步落地动作 */
  flow: { step: string; action: string }[]
  /** 最容易上歪的地方 */
  cautions: string[]
  /** 留给学生的开放问题 */
  ask: string
}

/* ── 收藏 / 草稿 / 交流 ────────────────────────────── */
export type CollectionKind = 'folk' | 'lesson' | 'plan' | 'card'

export interface Draft {
  id: string
  title: string
  savedAt: number
  plan: LessonPlan
}

/* ── 设置 ──────────────────────────────────────────── */
export interface LlmSettings {
  enabled: boolean
  baseUrl: string
  apiKey: string
  model: string
}

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  enabled: false,
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
}

/* ── 字典与展示辅助 ────────────────────────────────── */
export const FOLK_CATEGORIES: FolkCategory[] = [
  '节日节庆',
  '二十四节气',
  '民间技艺',
  '服饰民居',
  '饮食民俗',
  '民间游艺',
  '信仰祭祀',
  '民间文学',
]

export const GRADE_BANDS: GradeBand[] = ['1-2', '3-4', '5-6']

/** 小学阶段国家课程学科，用于「落到哪门课」筛选与迁移适配度 */
export const SUBJECTS: Subject[] = [
  '语文',
  '数学',
  '英语',
  '道德与法治',
  '科学',
  '体育与健康',
  '艺术',
  '劳动',
  '信息科技',
  '综合实践',
]

/** 本平台所服务的课程，独立于小学国家课程学科 */
export const HOST_SUBJECT: Subject = '人类社会'

/** 筛选器使用的完整学科列表（10 门学科 + 本课程） */
export const ALL_SUBJECTS: Subject[] = [...SUBJECTS, HOST_SUBJECT]

export const SUBJECT_LABEL: Record<Subject, string> = {
  语文: '语文',
  数学: '数学',
  英语: '英语',
  道德与法治: '道德与法治',
  科学: '科学',
  体育与健康: '体育与健康',
  艺术: '艺术',
  劳动: '劳动',
  信息科技: '信息科技',
  综合实践: '综合实践',
  人类社会: '人类与社会',
}

/**
 * 各学科的定位说明——这是「本课程与各学科课堂之间是什么关系」的唯一数据源。
 * 教学应用页、教案库标记、智能工坊提示都从这里取用，避免各处口径不一。
 *
 * 方向不可写反：这里描述的是**本课程的知识点能为这门学科提供什么**，
 * 不是这门学科需要多少民俗。学科是迁移的落点，不是平台的主轴。
 */
export interface SubjectMeta {
  key: Subject
  /** 该学科在小学阶段的主线内容，用于说明「它自己讲什么」 */
  ownCore: string
  /** 迁移适配度：本课程内容能贴进这门学科课堂的程度 */
  affinity: FolkAffinity
  /** 本课程能为该学科提供什么；affinity 为 none 时说明为什么不必硬接 */
  applyRole: string
  /** 这门学科应当怎样接入本课程的内容（或不接入） */
  presentation: string
  /** 典型落点：这门学科里可以承接本课程知识点的具体教学内容 */
  topics: string[]
}

export const SUBJECT_META: Record<Subject, SubjectMeta> = {
  语文: {
    key: '语文',
    ownCore: '识字与写字、阅读与鉴赏、表达与交流、梳理与探究；以课文、整本书与写作任务为主线。',
    affinity: 'strong',
    applyRole:
      '本课程的神话传说、民间故事、谚语俗语与说明性材料，可直接作为朗读、复述与习作的语料；第 1、7、8 章尤其集中。',
    presentation: '以「课程材料 × 阅读/习作任务」接入：语料取自课程，语文能力仍是目标。',
    topics: ['民间故事复述', '谚语与俗语', '说明文抓住特征', '写人记事习作'],
  },
  数学: {
    key: '数学',
    ownCore:
      '数与运算、图形与几何、统计与概率、综合与实践；以概念理解、算理与问题解决为主线。',
    affinity: 'weak',
    applyRole:
      '第 5 章的城市化数据、第 6 章的度量与量具、纹样的对称与密铺，可用于统计与图形单元。分数、方程这类主线单元与本课程关联弱，不必强行嫁接。',
    presentation: '多数单元按学科主线独立备课；只在统计与图形单元取本课程的情境与图形。',
    topics: ['分数的初步认识', '图形的运动', '条形统计图', '面积与周长'],
  },
  英语: {
    key: '英语',
    ownCore: '在语境中学习语音、词汇、语法与语篇，通过听、说、读、写完成任务。',
    affinity: 'none',
    applyRole:
      '本课程的知识点不适合作为英语课的语言材料——用第二语言承载社会科学概念，会同时牺牲语言目标与理解深度。仅「不同地方的不同做法」这类话题可作浅层背景。',
    presentation: '独立组织，按话题与功能推进，不接入本课程知识点。',
    topics: ['Colours around us', 'My weekend plan', '问候与介绍', '食物与喜好'],
  },
  道德与法治: {
    key: '道德与法治',
    ownCore: '围绕自我、家庭、学校、社区、国家与世界的成长议题，以情境判断与价值澄清为主线。',
    affinity: 'strong',
    applyRole:
      '第 3 章的家庭结构、第 5 章的社区与公共空间、第 7 章的节庆与礼俗、第 10 章的多元文化，都是现成的价值辨析情境，且比虚构情境更有说服力。',
    presentation: '以「课程情境 × 价值辨析」接入；注意区分事实描述与价值倡导。',
    topics: ['节庆中的家庭', '社区公共生活', '规则怎么定', '多元文化与尊重'],
  },
  科学: {
    key: '科学',
    ownCore: '物质科学、生命科学、地球与宇宙、技术与工程；以观察实验、证据推理为主线。',
    affinity: 'fair',
    applyRole:
      '第 6 章的农业与手工业技术（酿造、腌制、造纸、桥梁）可作探究起点与工程案例，第 2 章的资源与能源可接物质科学；但结论必须回到实验证据。',
    presentation: '以「课程案例 × 探究实验」接入，同时保留不依赖本课程的物质科学单元。',
    topics: ['水的三态变化', '发酵与腌制', '简单机械', '植物的一生'],
  },
  体育与健康: {
    key: '体育与健康',
    ownCore: '基本运动技能、体能、专项运动技能、健康教育与安全；以身体练习为主线。',
    affinity: 'fair',
    applyRole:
      '第 7 章的民间游艺（踢毽、跳绳、龙舟、舞龙）与第 6 章的体力劳作，可作运动形式与集体规则的补充单元。',
    presentation: '主教材仍按体能与大项推进；本课程内容作为民间体育单元的来源。',
    topics: ['快速跑与接力', '民间体育游戏', '体能循环练习', '运动安全'],
  },
  艺术: {
    key: '艺术',
    ownCore: '音乐与美术的感受、欣赏、表现与创造；以审美经验与艺术实践为主线。',
    affinity: 'strong',
    applyRole:
      '第 7 章的剪纸、年画、泥塑、戏曲、民歌本身就是艺术课程的学习对象；第 2、8 章的器物与纹样可作造型与色彩材料。',
    presentation: '以「课程内容即艺术本体」接入，直接作为欣赏与创作对象。',
    topics: ['剪纸与对称', '民间色彩', '地方戏曲', '民歌与节奏'],
  },
  劳动: {
    key: '劳动',
    ownCore: '日常生活劳动、生产劳动、服务性劳动；以真实任务中的动手实践与习惯养成为主线。',
    affinity: 'strong',
    applyRole:
      '第 6 章的传统技艺（竹编、制茶、酿造、缝纫、农事）自带完整工序与质量标准，是最贴近劳动任务的载体。',
    presentation: '以「传统技艺 × 劳动任务」接入，强调工序、安全与成品质量。',
    topics: ['整理与收纳', '竹编与纸艺', '种植与养护', '校园服务岗'],
  },
  信息科技: {
    key: '信息科技',
    ownCore: '数据、算法、网络、信息处理与信息安全；以数字化工具的使用与计算思维为主线。',
    affinity: 'none',
    applyRole:
      '主线是数据、算法与网络，与本课程没有必然联系。第 5 章的城市化数据可作统计练习的素材，但撑不起一整节课。',
    presentation: '独立组织，按数据、算法、网络三条线推进。',
    topics: ['生活中的编码', '用循环画图形', '数据的收集与整理', '网络安全'],
  },
  综合实践: {
    key: '综合实践',
    ownCore: '考察探究、社会服务、设计制作、职业体验；以跨学科主题任务与完整探究过程为主线。',
    affinity: 'fair',
    applyRole:
      '第 5、6、8 章提供大量可考察的真实议题：社区公共空间、老字号经营、手艺人生存状况，适合做考察探究与社会服务。',
    presentation: '以「课程议题 × 主题任务」接入；本课程是选题库之一，不是唯一来源。',
    topics: ['校园用水调查', '社区访谈', '设计制作', '职业体验'],
  },
  人类社会: {
    key: '人类社会',
    ownCore:
      '《人类与社会》课程本身：从族群、生计、信仰、制度到现代社会的整体理解，是本平台的主体内容。',
    affinity: 'strong',
    applyRole:
      '本课程自身。提供章节、单元与知识点，并逐点登记「可迁移到哪门学科的哪个教学内容、用来做什么」。',
    presentation: '以课程脉络为主线，知识点为最小单位，教学应用为出口。',
    topics: ['课程脉络', '知识点与知识卡', '跨学科迁移', '单元整体设计'],
  },
}

/** 取学科主线的第一句并去掉尾随标点，便于直接拼进句子 */
export function subjectCoreBrief(subject: Subject): string {
  return SUBJECT_META[subject].ownCore.split('；')[0].replace(/[。，、；\s]+$/, '')
}

/**
 * 迁移适配度：本课程的内容能贴进这门学科课堂的程度。
 * 说的是「这门课能给它什么」，不是「它需要多少民俗」。
 * none 不是缺陷——英语、信息科技本就该按自己的主线走，硬接只会两边都不讨好。
 */
export const AFFINITY_LABEL: Record<FolkAffinity, string> = {
  strong: '可直接融入',
  fair: '可作素材',
  weak: '少数单元可用',
  none: '关联较弱',
}

export const AFFINITY_TONE: Record<FolkAffinity, 'cinnabar' | 'ochre' | 'indigo' | 'neutral'> = {
  strong: 'cinnabar',
  fair: 'ochre',
  weak: 'indigo',
  none: 'neutral',
}

export const THEMES: Theme[] = [
  '家国情怀',
  '家族伦理',
  '人与自然',
  '技艺传承',
  '多元一体',
  '生活智慧',
]

export const STYLES: TeachStyle[] = [
  '体验探究',
  '知识讲授',
  '项目式',
  '情境任务',
  '复习巩固',
  '跨学科主题',
]

export const GRADE_LABEL: Record<GradeBand, string> = {
  '1-2': '低年级 1-2 年级',
  '3-4': '中年级 3-4 年级',
  '5-6': '高年级 5-6 年级',
}

export const GRADE_SHORT: Record<GradeBand, string> = {
  '1-2': '1-2 年级',
  '3-4': '3-4 年级',
  '5-6': '5-6 年级',
}

/** 课时表述：40 分钟为 1 课时，其余保持分钟数 */
export function durationLabel(minutes: number): string {
  const k = minutes / 40
  return Number.isInteger(k) && k >= 1 ? `${k} 课时` : `${minutes} 分钟`
}
