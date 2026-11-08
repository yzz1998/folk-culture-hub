import type { KnowledgeCard, PointId } from '@/lib/types'
import { CH1 } from './ch1'
import { CH2 } from './ch2'
import { CH3 } from './ch3'
import { CH4 } from './ch4'
import { CH5 } from './ch5'
import { CH6 } from './ch6'
import { CH7 } from './ch7'
import { CH8 } from './ch8'
import { CH9 } from './ch9'
import { CH10 } from './ch10'

/* ═══════════════════════════════════════════════════════════════
   知识点卡：73 个知识点各一张，与 CurriculumChapter 一一对应。

   它是「知识点这一侧的内容底片」——教师借用了某个知识点、
   却不想用民俗素材时，靠它就能撑起一节课。

   编辑约束：
   - keyIdeas 用小学生能读懂的陈述句，不写「通过本课学习，学生将……」。
   - concepts 的 gloss 给生活类比，不抄教科书定义。
   - misconceptions 只讲机理，不讲「这是错的」。
   - inquiries 必须开放，答案不唯一，禁止是非题。
   - 涉及信仰与民族的章节只写社会功能与文化解释，不写教义。
   ═══════════════════════════════════════════════════════════════ */

export const KNOWLEDGE_CARDS: KnowledgeCard[] = [
  ...CH1,
  ...CH2,
  ...CH3,
  ...CH4,
  ...CH5,
  ...CH6,
  ...CH7,
  ...CH8,
  ...CH9,
  ...CH10,
]

export const CARD_MAP = new Map<string, KnowledgeCard>(KNOWLEDGE_CARDS.map((c) => [c.id, c]))

const BY_POINT = new Map<string, KnowledgeCard>(KNOWLEDGE_CARDS.map((c) => [c.pointId, c]))

export function cardOfPoint(pointId: PointId | string): KnowledgeCard | undefined {
  return BY_POINT.get(pointId)
}

export function getCard(cardId: string): KnowledgeCard | undefined {
  return CARD_MAP.get(cardId)
}

/** 已写完正文的卡片数 */
export const CARD_READY_COUNT = KNOWLEDGE_CARDS.filter((c) => c.status === 'ready').length
