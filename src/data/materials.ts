import type { Material } from '@/lib/types'
import { FOLK } from './folk'
import { STORIES } from './stories'

/* ═══════════════════════════════════════════════════════════════
   教学素材库

   图片素材：由剪纸纹样生成器程序化产出，零版权风险，可直接投屏。
   故事文本：公有领域民间故事的教学改写版，可全文阅读。
   音视频素材：暂无版权素材，以「待替换」状态登记，标注用途与建议时长，
   教师可挂载本校拍摄的素材后启用。不伪造播放。
   ═══════════════════════════════════════════════════════════════ */

/* ── 图片：每条民俗配一张纹样插画 ─────────────── */
const IMAGE_MATERIALS: Material[] = FOLK.map((f) => ({
  id: `img-${f.id}`,
  type: 'image',
  title: `${f.name} · 剪纸纹样插画`,
  folkId: f.id,
  desc: `以${f.name}的典型视觉母题生成的剪纸风格插画，可用于课件封面、板书配图或课堂导入投影。矢量渲染，任意放大不失真。`,
  usage: '课件配图 / 板书示意 / 导入投影',
  status: 'ready',
  pattern: f.pattern,
}))

/* ── 文本：民间故事 ───────────────────────────── */
const TEXT_MATERIALS: Material[] = STORIES.map((s) => ({
  id: `text-${s.id}`,
  type: 'text',
  title: s.title,
  folkId: s.folkId,
  desc: `朗读约 ${s.minutes} 分钟。${s.source}。`,
  usage: '朗读 / 复述 / 对比阅读',
  gradeBands: s.gradeBands,
  status: 'ready',
  body: s.body.join('\n\n'),
}))

/* ── 音视频：登记占位，明确标注待替换 ─────────── */
const AV_MATERIALS: Material[] = [
  {
    id: 'av-01',
    type: 'video',
    title: '霍童线狮表演实录（片段）',
    folkId: 'huotongXianshi',
    desc: '建议截取 3 分钟以内的狮子腾跃段落，重点拍提线者的手部与狮身的联动。',
    duration: '建议 2-3 分钟',
    usage: '导入环节｜观察「线如何传递力」',
    status: 'placeholder',
  },
  {
    id: 'av-02',
    type: 'video',
    title: '柘荣剪纸艺人操作特写',
    folkId: 'zherongJianzhi',
    desc: '建议拍摄握剪手势、起剪顺序与细密纹样的处理过程，静音也可用。',
    duration: '建议 1-2 分钟',
    usage: '技艺示范｜慢放观察手法',
    status: 'placeholder',
  },
  {
    id: 'av-03',
    type: 'video',
    title: '木拱廊桥编木结构动画或实拍',
    folkId: 'langqiao',
    desc: '优先使用结构分解动画；若实拍，需拍到节点交叉咬合的部位。',
    duration: '建议 2 分钟',
    usage: '结构讲解｜配合雪糕棒模型实验',
    status: 'placeholder',
  },
  {
    id: 'av-04',
    type: 'video',
    title: '屏南四平戏演出片段',
    folkId: 'pingnanSiping',
    desc: '重点保留「前台干唱、后台帮腔」的段落，便于对比现代戏曲的乐队伴奏。',
    duration: '建议 3 分钟',
    usage: '比较欣赏｜听辨帮腔与主唱',
    status: 'placeholder',
  },
  {
    id: 'av-05',
    type: 'video',
    title: '闽东海上龙舟竞渡',
    folkId: 'ningdeLongzhou',
    desc: '需包含鼓手指挥与船身随浪起伏的画面，便于讨论「读水」。',
    duration: '建议 2 分钟',
    usage: '情境导入｜讨论潮汐与航线',
    status: 'placeholder',
  },
  {
    id: 'av-06',
    type: 'audio',
    title: '畲族畲歌对唱录音',
    folkId: 'shezuSanyuesan',
    desc: '选择一段完整的对答式畲歌，保留起句与应句的衔接。',
    duration: '建议 1-2 分钟',
    usage: '聆听｜辨识一唱一和的呼应结构',
    status: 'placeholder',
  },
  {
    id: 'av-07',
    type: 'audio',
    title: '童谣吟诵（方言版）',
    folkId: 'erge',
    desc: '邀请本地方言使用者录制，与普通话版本对照播放，效果最好。',
    duration: '每个 1 分钟以内',
    usage: '语音辨识｜方言与普通话对比',
    status: 'placeholder',
  },
  {
    id: 'av-08',
    type: 'audio',
    title: '制茶工序环境声（萎凋、揉捻）',
    folkId: 'tanyangHongcha',
    desc: '无解说、仅保留操作声，用于让学生「听声猜工序」。',
    duration: '建议 2 分钟',
    usage: '听辨猜测｜工序顺序判断',
    status: 'placeholder',
  },
  {
    id: 'av-09',
    type: 'video',
    title: '古田银耳栽培棚内景',
    folkId: 'gutianYin',
    desc: '需拍到温湿度计、通风口与菌棒排列，便于讨论「可控条件」。',
    duration: '建议 2 分钟',
    usage: '技术条件分析｜找出控制变量',
    status: 'placeholder',
  },
  {
    id: 'av-10',
    type: 'video',
    title: '福安线面拉抻过程',
    folkId: 'fuanMian',
    desc: '完整拍一条面从粗条到细丝的拉抻，注意手部发力与节奏。',
    duration: '建议 2 分钟',
    usage: '工艺观察｜为什么不会断',
    status: 'placeholder',
  },
]

export const MATERIALS: Material[] = [
  ...IMAGE_MATERIALS,
  ...TEXT_MATERIALS,
  ...AV_MATERIALS,
]

export const MATERIAL_MAP = new Map(MATERIALS.map((m) => [m.id, m]))

export function materialsByFolk(folkId: string): Material[] {
  return MATERIALS.filter((m) => m.folkId === folkId)
}

export const MATERIAL_COUNTS = {
  image: IMAGE_MATERIALS.length,
  text: TEXT_MATERIALS.length,
  audio: AV_MATERIALS.filter((m) => m.type === 'audio').length,
  video: AV_MATERIALS.filter((m) => m.type === 'video').length,
}
