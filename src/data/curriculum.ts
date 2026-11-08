import type { CurriculumChapter } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════
   《人类与社会》课程知识地图

   教材依据：国家开放大学出版社 2020 年第二版（惠中主编），全书十章，
   以人在社会中的活动为中心，从历史与现实两个层面展开。

   说明：章节标题依据公开教学资料梳理，第五章至第七章的确切命名在不同
   版本与教学点之间存在差异。本文件是站内唯一的数据源，如需按本校所用
   教材版本调整，直接修改本章节数组即可，页面与智能体无需改动。
   ═══════════════════════════════════════════════════════════════ */

export const CURRICULUM: CurriculumChapter[] = [
  {
    id: 'ch1',
    order: 1,
    title: '人类的产生与发展',
    coreQuestion: '我们从哪里来？为什么不同地方的人，过着很不一样的生活？',
    brief:
      '从宇宙与地球的形成讲到人类的起源，再到人口的数量、分布、迁移以及种族、民族与语言的形成，勾勒人类赖以生存的环境与自身的发展轨迹。',
    folkAngle: '创世神话、迁徙传说与族源故事，是儿童理解「我们从哪里来」的第一手材料。',
    units: [
      {
        id: 'ch1-u1',
        title: '人类的家园',
        points: [
          {
            id: 'ch1-u1-p1',
            title: '宇宙、太阳与地球的形成',
            summary: '了解宇宙起源的主要假说、太阳系的组成，以及地球在太阳系中的位置。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch1-u1-p2',
            title: '地球表层环境的物质组成',
            summary: '岩石圈、大气圈、水圈、生物圈的基本构成与相互关系。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch1-u1-p3',
            title: '地理环境与生活方式',
            summary: '不同地理环境下人们的生产与居住方式差异。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch1-u2',
        title: '人类的由来',
        points: [
          {
            id: 'ch1-u2-p1',
            title: '人类的起源与演化',
            summary: '从古猿到现代人的演化脉络，以及主要的人类起源学说。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch1-u2-p2',
            title: '种族与民族的形成',
            summary: '种族的自然属性、民族的社会属性，以及二者的区别。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch1-u2-p3',
            title: '语言的多样与方言',
            summary: '语言的形成、语系分布，以及汉语方言的地域差异。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch1-u3',
        title: '人口的发展与迁移',
        points: [
          {
            id: 'ch1-u3-p1',
            title: '世界人口的增长与分布',
            summary: '人口增长的历史阶段、分布不均的原因与人口密度概念。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch1-u3-p2',
            title: '人口迁移与聚落形成',
            summary: '推力与拉力因素，迁徙对文化传播的影响。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch1-u3-p3',
            title: '人口结构与老龄化',
            summary: '年龄结构、性别结构与人口老龄化带来的社会变化。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
    ],
  },
  {
    id: 'ch2',
    order: 2,
    title: '人类社会的资源基础',
    coreQuestion: '人靠什么活下去？脚下的资源究竟够不够用？',
    brief:
      '自然资源是人类社会赖以生存的前提。本章讨论土地、水、矿产等资源的分布与利用，以及人口增长带来的资源压力与可持续发展问题。',
    folkAngle: '「靠山吃山、靠水吃水」的生存智慧，是理解资源与生计关系最直观的入口。',
    units: [
      {
        id: 'ch2-u1',
        title: '自然资源的类型与分布',
        points: [
          {
            id: 'ch2-u1-p1',
            title: '土地资源与耕地',
            summary: '土地资源的分类、耕地分布，以及人多地少的基本国情。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch2-u1-p2',
            title: '水资源的分布与利用',
            summary: '淡水资源的有限性、时空分布不均与跨流域调水。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch2-u1-p3',
            title: '生物资源与物产',
            summary: '地方物产与气候土壤的关系，生物多样性的价值。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch2-u2',
        title: '人口与资源的紧张',
        points: [
          {
            id: 'ch2-u2-p1',
            title: '资源承载力的概念',
            summary: '一定区域内资源能支撑的人口规模，以及超载的后果。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch2-u2-p2',
            title: '环境问题的产生',
            summary: '工业化与城市化带来的污染、生态退化问题。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch2-u2-p3',
            title: '可持续发展与绿色生活',
            summary: '可持续发展的基本内涵，以及个人可以采取的行动。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
    ],
  },
  {
    id: 'ch3',
    order: 3,
    title: '婚姻、家庭的产生与发展',
    coreQuestion: '家庭是怎么出现的？为什么它的样子一直在变？',
    brief:
      '婚姻与家庭是人类社会最基本的组织形式。本章讨论婚姻的本质与形式、家庭的结构与功能，以及二者在历史上的演变与当代变化。',
    folkAngle: '婚俗、家训、族谱与人生礼仪，把抽象的家庭制度变成孩子看得见的仪式与故事。',
    units: [
      {
        id: 'ch3-u1',
        title: '婚姻的本质与形式',
        points: [
          {
            id: 'ch3-u1-p1',
            title: '婚姻的含义与社会功能',
            summary: '婚姻作为一种社会制度，承担生育、经济、情感与社会联结功能。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch3-u1-p2',
            title: '婚姻形式的历史演变',
            summary: '从群婚、对偶婚到一夫一妻制的演变过程。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch3-u1-p3',
            title: '婚俗中的礼仪与象征',
            summary: '说媒、定亲、迎娶等环节中的文化象征意义。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch3-u2',
        title: '家庭的结构与功能',
        points: [
          {
            id: 'ch3-u2-p1',
            title: '家庭的结构类型',
            summary: '核心家庭、主干家庭、联合家庭的划分标准。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch3-u2-p2',
            title: '家庭的社会功能',
            summary: '生育、抚养、赡养、经济与情感支持等多重功能。',
            gradeBand: '1-2',
            status: 'ready',
          },
          {
            id: 'ch3-u2-p3',
            title: '家训、家风与代际传承',
            summary: '家训文本、家风养成，以及手艺在家族内部的传递。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch3-u3',
        title: '当代婚姻家庭的变化',
        points: [
          {
            id: 'ch3-u3-p1',
            title: '家庭规模的小型化',
            summary: '户均人口下降的原因与影响。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch3-u3-p2',
            title: '家庭关系的现代调整',
            summary: '代际关系、性别分工与育儿观念的变化。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
    ],
  },
  {
    id: 'ch4',
    order: 4,
    title: '国家、制度与社会秩序',
    coreQuestion: '一群人要怎样才能有序地生活在一起？',
    brief:
      '国家是人类社会发展到一定阶段的产物。本章讨论国家的起源、政权形式、法律与礼制、军队与战争，以及社会秩序的维持方式。',
    folkAngle: '乡约、族规、礼俗与「礼尚往来」，让制度从条文变成日常可感的行为规范。',
    units: [
      {
        id: 'ch4-u1',
        title: '国家的产生与形式',
        points: [
          {
            id: 'ch4-u1-p1',
            title: '国家产生的历史条件',
            summary: '私有制、阶级分化与国家机器的形成。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch4-u1-p2',
            title: '政权形式与政体',
            summary: '主要政体类型的比较。',
            gradeBand: '5-6',
            status: 'planned',
          },
          {
            id: 'ch4-u1-p3',
            title: '领土、主权与公民',
            summary: '国家的构成要素与公民身份的含义。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch4-u2',
        title: '法律、礼制与秩序',
        points: [
          {
            id: 'ch4-u2-p1',
            title: '法与礼的关系',
            summary: '中国传统社会中「礼」与「法」并行的治理逻辑。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch4-u2-p2',
            title: '乡约与民间自治',
            summary: '乡规民约在基层秩序中的作用。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch4-u2-p3',
            title: '公共生活中的规则意识',
            summary: '公共秩序、公德与规则的内化。',
            gradeBand: '1-2',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch4-u3',
        title: '军队与战争',
        points: [
          {
            id: 'ch4-u3-p1',
            title: '战争对社会的影响',
            summary: '战争对人口、经济与文化传播的双重作用。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch4-u3-p2',
            title: '和平与国防观念',
            summary: '和平发展的意义与国防教育的必要性。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
    ],
  },
  {
    id: 'ch5',
    order: 5,
    title: '城市化与乡村社会',
    coreQuestion: '人为什么往城里走？留在乡村的人又该怎么办？',
    brief:
      '城市化是现代社会结构变迁的主线。本章讨论城市化的进程与动力、乡村社会的特点，以及城乡关系的演变。',
    folkAngle: '从村落形制、民居布局到赶集庙会，乡村是最完整的民俗现场。',
    units: [
      {
        id: 'ch5-u1',
        title: '城市化的进程',
        points: [
          {
            id: 'ch5-u1-p1',
            title: '城市化的含义与动力',
            summary: '人口向城市集中，以及工业化、服务业对城市化的推动。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch5-u1-p2',
            title: '城市空间与功能分区',
            summary: '居住区、商业区、工业区的布局逻辑。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch5-u1-p3',
            title: '城市化带来的问题',
            summary: '住房、交通、环境与社区认同等问题。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch5-u2',
        title: '乡村社会与村落文化',
        points: [
          {
            id: 'ch5-u2-p1',
            title: '村落的形成与形态',
            summary: '聚落选址的自然与社会因素，村落布局的基本形态。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch5-u2-p2',
            title: '农耕节律与乡村生活',
            summary: '农事节气如何塑造乡村的时间秩序与生活节奏。',
            gradeBand: '1-2',
            status: 'ready',
          },
          {
            id: 'ch5-u2-p3',
            title: '村落共同体的维系',
            summary: '宗族、庙会、互助与公共空间对社区凝聚的作用。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch5-u3',
        title: '城乡关系',
        points: [
          {
            id: 'ch5-u3-p1',
            title: '城乡差异与要素流动',
            summary: '人口、资金、信息的城乡流动及其影响。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch5-u3-p2',
            title: '乡村振兴与乡土文化保护',
            summary: '传统村落的保护价值与活化路径。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
    ],
  },
  {
    id: 'ch6',
    order: 6,
    title: '农业、工业与商贸交通',
    coreQuestion: '一件东西从地里长出来，到端上餐桌，中间发生了什么？',
    brief:
      '物质生产是社会运行的基础。本章讨论农业的起源与发展、工业革命的进程、商业与贸易的形态，以及交通对区域联系的塑造。',
    folkAngle: '农具、耕作习俗、老字号、商帮与驿道，是产业史最生动的教具。',
    units: [
      {
        id: 'ch6-u1',
        title: '农业的起源与发展',
        points: [
          {
            id: 'ch6-u1-p1',
            title: '农业革命的标志',
            summary: '从采集狩猎到种植养殖的转变及其意义。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch6-u1-p2',
            title: '传统农具与耕作方式',
            summary: '主要农具的功能演进与精耕细作传统。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch6-u1-p3',
            title: '现代农业与粮食安全',
            summary: '农业技术进步、粮食生产与供给保障。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch6-u2',
        title: '工业革命的进程',
        points: [
          {
            id: 'ch6-u2-p1',
            title: '三次工业革命的技术标志',
            summary: '蒸汽机、电力、信息技术带来的生产变革。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch6-u2-p2',
            title: '手工业与工匠传统',
            summary: '师徒制、行会与手艺传承的组织方式。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch6-u2-p3',
            title: '技术改变日常生活',
            summary: '生产工具与家用器具变化对生活方式的影响。',
            gradeBand: '1-2',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch6-u3',
        title: '商业、贸易与交通',
        points: [
          {
            id: 'ch6-u3-p1',
            title: '集市、商帮与老字号',
            summary: '传统商业组织形式与信用机制。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch6-u3-p2',
            title: '丝绸之路与区域贸易',
            summary: '贸易路线对物产、技术与文化传播的作用。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch6-u3-p3',
            title: '交通方式的变迁',
            summary: '从驿道、水运到铁路、航空的演进。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
    ],
  },
  {
    id: 'ch7',
    order: 7,
    title: '宗教与民俗',
    coreQuestion: '人们为什么会相信？又为什么非要一起过节？',
    brief:
      '本章讨论宗教的起源与主要类型，民俗的构成与功能，以及信仰仪式、节庆活动与人生礼仪在社会生活中的位置。这是全书中与民俗文化结合最紧密的一章。',
    folkAngle: '本章即本站的主场：节庆、仪式、技艺、饮食与游艺，都从这里的理论框架获得解释。',
    units: [
      {
        id: 'ch7-u1',
        title: '宗教的起源与类型',
        points: [
          {
            id: 'ch7-u1-p1',
            title: '宗教的起源与功能',
            summary: '自然崇拜、图腾崇拜、祖先崇拜的产生与心理社会功能。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch7-u1-p2',
            title: '世界主要宗教概览',
            summary: '主要宗教的基本信仰与分布，以及宗教文化多样性。',
            gradeBand: '5-6',
            status: 'planned',
          },
          {
            id: 'ch7-u1-p3',
            title: '民间信仰与日常生活',
            summary: '民间信仰如何嵌入日常的祈愿、禁忌与节令。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch7-u2',
        title: '民俗的构成与功能',
        points: [
          {
            id: 'ch7-u2-p1',
            title: '民俗的四大类型',
            summary: '物质民俗、社会民俗、精神民俗与语言民俗的划分。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch7-u2-p2',
            title: '民俗的社会功能',
            summary: '教化、凝聚、调节与认同功能。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch7-u2-p3',
            title: '民俗的传承与变迁',
            summary: '口传心授的传承机制，以及现代化中的变异与新生。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch7-u3',
        title: '节庆与人生礼仪',
        points: [
          {
            id: 'ch7-u3-p1',
            title: '传统节日的形成与体系',
            summary: '节日与农时、信仰的关系，以及节日体系的层次。',
            gradeBand: '1-2',
            status: 'ready',
          },
          {
            id: 'ch7-u3-p2',
            title: '人生礼仪的四个阶段',
            summary: '诞生礼、成年礼、婚礼、丧礼的文化含义。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch7-u3-p3',
            title: '节庆中的公共生活',
            summary: '庙会、灯会、赛会如何组织社区公共交往。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
    ],
  },
  {
    id: 'ch8',
    order: 8,
    title: '文化类型与文化传播',
    coreQuestion: '不同的文化为什么不一样？它们又是怎么彼此影响的？',
    brief:
      '本章讨论文化的类型划分、文化传播的路径与机制，以及文化冲突与文化融合的过程。',
    folkAngle: '南北方言、饮食差异与移民路线的故事，是理解文化传播最接地气的样本。',
    units: [
      {
        id: 'ch8-u1',
        title: '文化的类型与特征',
        points: [
          {
            id: 'ch8-u1-p1',
            title: '文化的层次结构',
            summary: '物质文化、制度文化、精神文化三个层次。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch8-u1-p2',
            title: '地域文化的形成',
            summary: '自然环境与历史进程共同塑造的地域文化特征。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch8-u1-p3',
            title: '文化的多样与统一',
            summary: '多元一体格局的形成逻辑。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch8-u2',
        title: '文化传播与变迁',
        points: [
          {
            id: 'ch8-u2-p1',
            title: '文化传播的路径',
            summary: '迁徙、贸易、宗教与媒介四条主要传播路径。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch8-u2-p2',
            title: '文化冲突与融合',
            summary: '冲突的成因与融合的机制。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch8-u2-p3',
            title: '传统文化的现代转化',
            summary: '创造性转化与创新性发展的路径。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
    ],
  },
  {
    id: 'ch9',
    order: 9,
    title: '现代化、全球化与知识经济',
    coreQuestion: '世界越连越紧，对普通人来说是好事吗？',
    brief:
      '本章讨论现代化的含义与发展历程、战后世界经济的全球化趋势，以及知识经济的特征与影响。',
    folkAngle: '老手艺遇上新市场、非遗进直播间，是讲「传统如何回应现代」的现成案例。',
    units: [
      {
        id: 'ch9-u1',
        title: '现代化的历程',
        points: [
          {
            id: 'ch9-u1-p1',
            title: '现代化的多重含义',
            summary: '工业化、城市化、民主化与理性化等多重维度。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch9-u1-p2',
            title: '中国现代化的曲折历程',
            summary: '近代以来的探索与改革开放后的发展。',
            gradeBand: '5-6',
            status: 'ready',
          },
        ],
      },
      {
        id: 'ch9-u2',
        title: '全球化与知识经济',
        points: [
          {
            id: 'ch9-u2-p1',
            title: '经济全球化的表现',
            summary: '贸易、投资、生产与金融的跨国联结。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch9-u2-p2',
            title: '知识经济的特征',
            summary: '知识作为核心生产要素，创新驱动增长。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch9-u2-p3',
            title: '技术进步与文化传承',
            summary: '数字化手段对传统文化保存与传播的作用。',
            gradeBand: '3-4',
            status: 'ready',
          },
        ],
      },
    ],
  },
  {
    id: 'ch10',
    order: 10,
    title: '当代社会与文化发展',
    coreQuestion: '我们今天的社会，还有哪些问题没有解决？',
    brief:
      '本章讨论当代人类社会面临的共同课题、文化发展的基本方向，以及在多样性中寻求共识的可能。',
    folkAngle: '「各美其美、美美与共」——民俗正是这句话最日常的注脚。',
    units: [
      {
        id: 'ch10-u1',
        title: '当代社会的共同课题',
        points: [
          {
            id: 'ch10-u1-p1',
            title: '环境与气候议题',
            summary: '全球环境治理的挑战与合作机制。',
            gradeBand: '5-6',
            status: 'ready',
          },
          {
            id: 'ch10-u1-p2',
            title: '文化多样性的价值',
            summary: '保护文化多样性对人类社会创新的意义。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch10-u1-p3',
            title: '人类命运共同体',
            summary: '相互依存背景下的合作共赢理念。',
            gradeBand: '5-6',
            status: 'planned',
          },
        ],
      },
      {
        id: 'ch10-u2',
        title: '文化自觉与教育传承',
        points: [
          {
            id: 'ch10-u2-p1',
            title: '文化认同的建立',
            summary: '从乡土认同到国家认同的层级递进。',
            gradeBand: '3-4',
            status: 'ready',
          },
          {
            id: 'ch10-u2-p2',
            title: '学校中的文化传承',
            summary: '课程、活动与校园文化三条传承路径。',
            gradeBand: '1-2',
            status: 'ready',
          },
        ],
      },
    ],
  },
]

/* ── 查询工具 ─────────────────────────────────────── */
export const ALL_POINTS = CURRICULUM.flatMap((c) =>
  c.units.flatMap((u) => u.points.map((p) => ({ ...p, chapterId: c.id, chapterTitle: c.title, unitId: u.id, unitTitle: u.title }))),
)

export type PointWithContext = (typeof ALL_POINTS)[number]

export const POINT_MAP = new Map<string, PointWithContext>(ALL_POINTS.map((p) => [p.id, p]))

export function getChapter(id: string): CurriculumChapter | undefined {
  return CURRICULUM.find((c) => c.id === id)
}
