import { Link } from 'react-router-dom'
import { ArrowRight, BookMarked, Compass, LayoutGrid, Link2, Sparkles } from 'lucide-react'
import { CURRICULUM } from '@/data/curriculum'
import { COURSE_SCALE, MATERIAL_FORM_COUNTS, PRIMARY_SUBJECT_INDEX, RESOURCE_COUNTS } from '@/lib/catalog'
import { AFFINITY_LABEL, AFFINITY_TONE, SUBJECT_LABEL } from '@/lib/types'
import { Button, Card, SectionTitle, Tag } from '@/components/ui'

/* ═══════════════════════════════════════════════════════════════
   首页

   首页只讲一件事：这门课讲什么，以及它怎么进你的课堂。
   所以第二屏就是十章目录，不是学科列表——课程在前，应用在后。

   民俗不出现在首页主线上：它是第 7 章里的一类内容，
   在这里仅以「第 7 章含民俗材料」一行被提及，不占版面。
   ═══════════════════════════════════════════════════════════════ */

const CHAPTERS = [...CURRICULUM].sort((a, b) => a.order - b.order)

const STEPS = [
  {
    n: '01',
    icon: Compass,
    title: '读课程脉络',
    desc: '十章按族群、生计、信仰、制度到现代社会的顺序展开，每章一句核心问题，每个知识点一张卡。',
    to: '/curriculum',
    cta: '看十章',
  },
  {
    n: '02',
    icon: Link2,
    title: '找落点',
    desc: '每个知识点都登记了「能落到哪门课的哪个教学内容、起什么作用」，按学科看得到完整清单。',
    to: '/apply',
    cta: '按学科看',
  },
  {
    n: '03',
    icon: Sparkles,
    title: '备一课',
    desc: '选一个知识点，定好要落到哪门课，生成一份能直接改的教案，导出 Word。',
    to: '/agent',
    cta: '去工坊',
  },
]

export default function Home() {
  const covered = PRIMARY_SUBJECT_INDEX.filter((s) => s.counts.points > 0).length

  return (
    <div className="space-y-10 md:space-y-14">
      {/* ══ HERO ══ */}
      <section className="animate-rise relative overflow-hidden rounded-xl border border-line bg-card">
        <div className="paper-texture absolute inset-0 opacity-70" />
        <div className="relative grid gap-6 p-5 md:grid-cols-[1.25fr_1fr] md:gap-8 md:p-8 lg:p-10">
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <Tag tone="cinnabar" size="sm">
                《人类与社会》课程教学辅助
              </Tag>
              <Tag tone="indigo" size="sm">
                {COURSE_SCALE.chapters} 章 · {COURSE_SCALE.points} 个知识点
              </Tag>
            </div>

            <h1 className="font-serif text-[26px] font-semibold leading-[1.28] tracking-tight text-ink md:text-[34px] lg:text-[38px]">
              先学这门课，
              <br className="hidden sm:block" />
              再把它的知识点
              <span className="relative mx-0.5 text-cinnabar">
                搬进你的课堂
                <span className="absolute -bottom-0.5 left-0 h-[3px] w-full rounded-xs bg-cinnabar/25" />
              </span>
            </h1>

            <p className="mt-4 max-w-[48ch] text-[13.5px] leading-[1.85] text-ink-2 md:text-[14px]">
              《人类与社会》从族群、生计、信仰、制度讲到现代社会，共 {COURSE_SCALE.chapters} 章{' '}
              {COURSE_SCALE.points} 个知识点。每个知识点都登记了
              <span className="font-medium text-ink">能落到哪门小学课程的哪个教学内容</span>
              ，共 {COURSE_SCALE.applies} 条落点——学完就能用，不用自己从头找接点。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link to="/curriculum">
                <Button variant="primary" size="lg">
                  <Compass size={15} />
                  从课程脉络开始
                </Button>
              </Link>
              <Link to="/apply">
                <Button variant="outline" size="lg">
                  看我教的课能接住什么
                  <ArrowRight size={15} />
                </Button>
              </Link>
            </div>

            <div className="mt-6 grid max-w-md grid-cols-4 gap-2 border-t border-line-2 pt-4">
              {[
                { n: COURSE_SCALE.chapters, l: '章' },
                { n: COURSE_SCALE.points, l: '个知识点' },
                { n: COURSE_SCALE.applies, l: '条落点' },
                { n: COURSE_SCALE.lessons, l: '份课例' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="tnum font-serif text-[19px] font-semibold leading-none text-ink">
                    {s.n}
                  </div>
                  <div className="mt-1 text-[10.5px] text-ink-3">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 十章目录：首页第二主角 */}
          <div className="relative">
            <div className="rounded-lg border border-line bg-paper-2/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium tracking-wide text-ink-3">课程十章</span>
                <Link
                  to="/curriculum"
                  className="inline-flex items-center gap-0.5 text-[11px] text-cinnabar hover:text-cinnabar-h"
                >
                  全部展开 <ArrowRight size={10} />
                </Link>
              </div>
              <ol className="space-y-0.5">
                {CHAPTERS.map((ch) => (
                  <li key={ch.id}>
                    <Link
                      to={`/curriculum?point=${ch.units[0]?.points[0]?.id ?? ''}`}
                      className="group flex items-baseline gap-2 rounded-sm px-1.5 py-1 transition-colors hover:bg-card"
                    >
                      <span className="tnum shrink-0 font-serif text-[11px] font-semibold text-ink-4">
                        {String(ch.order).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-ink group-hover:text-cinnabar-h">
                        {ch.title}
                      </span>
                      <span className="tnum shrink-0 text-[10px] text-ink-4">
                        {ch.units.reduce((n, u) => n + u.points.length, 0)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              <p className="mt-2 border-t border-line-2 pt-2 text-[10px] leading-relaxed text-ink-4">
                右侧数字为该章知识点数。第 7 章含民俗材料，属本章内容之一。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 三步 ══ */}
      <section>
        <SectionTitle sub="顺序别颠倒。先知道这门课讲了什么，才谈得上迁移；先找到落点，备课才有目标。">
          三步：读课 → 找落点 → 备一课
        </SectionTitle>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {STEPS.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.n} className="flex flex-col p-4">
                <div className="flex items-center gap-2">
                  <span className="tnum font-serif text-[15px] font-semibold text-cinnabar">
                    {s.n}
                  </span>
                  <Icon size={14} className="text-ink-3" />
                  <h3 className="font-serif text-[14px] font-semibold tracking-tight text-ink">
                    {s.title}
                  </h3>
                </div>
                <p className="mt-2 flex-1 text-[12px] leading-[1.75] text-ink-2">{s.desc}</p>
                <Link
                  to={s.to}
                  className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-cinnabar hover:text-cinnabar-h"
                >
                  {s.cta}
                  <ArrowRight size={11} />
                </Link>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ══ 十门落点学科 ══ */}
      <section>
        <SectionTitle
          sub={`${covered} / ${PRIMARY_SUBJECT_INDEX.length} 门学科有明确落点。接不住的那几门不是缺陷——它们按自己的主线走，不硬接。`}
          right={
            <Link to="/apply">
              <Button variant="ghost" size="sm">
                看完整映射
                <ArrowRight size={12} />
              </Button>
            </Link>
          }
        >
          能落到哪些课堂
        </SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-5">
          {PRIMARY_SUBJECT_INDEX.map((s) => (
            <Link
              key={s.subject}
              to="/apply"
              className="group rounded-lg border border-line bg-card p-3 transition-colors hover:border-ink-4/60"
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-serif text-[13.5px] font-semibold tracking-tight text-ink group-hover:text-cinnabar-h">
                  {SUBJECT_LABEL[s.subject]}
                </span>
                <span className="tnum text-[10px] text-ink-4">{s.counts.points}</span>
              </div>
              <div className="mt-1.5">
                <Tag tone={AFFINITY_TONE[s.meta.affinity]} size="sm">
                  {AFFINITY_LABEL[s.meta.affinity]}
                </Tag>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-[1.6] text-ink-4">
                {s.meta.topics.slice(0, 2).join(' · ')}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ 资源 ══ */}
      <section>
        <SectionTitle
          sub="都按章节归类，不按主题堆。找材料时先想是哪一章，再想是哪一类。"
          right={
            <Link to="/resources">
              <Button variant="ghost" size="sm">
                进资源库
                <ArrowRight size={12} />
              </Button>
            </Link>
          }
        >
          课程配套的三类材料
        </SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {[
            {
              n: RESOURCE_COUNTS.card,
              l: '知识点卡',
              d: '要点 · 概念 · 误区 · 追问',
              to: '/resources?kind=card',
              Icon: LayoutGrid,
            },
            {
              n: RESOURCE_COUNTS.material,
              l: '教学素材',
              d: `图文条目 ${MATERIAL_FORM_COUNTS.entry} · 媒体素材 ${RESOURCE_COUNTS.material - MATERIAL_FORM_COUNTS.entry}`,
              to: '/resources?kind=material',
              Icon: BookMarked,
            },
            {
              n: RESOURCE_COUNTS.lesson,
              l: '课例',
              d: '别人怎么迁移的',
              to: '/lessons',
              Icon: Sparkles,
            },
          ].map((r) => {
            const Icon = r.Icon
            return (
              <Link key={r.l} to={r.to}>
                <Card className="h-full p-3.5 transition-colors hover:border-ink-4/50">
                  <Icon size={14} className="text-ink-3" />
                  <div className="mt-2 tnum font-serif text-[19px] font-semibold leading-none text-ink">
                    {r.n}
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-ink-2">{r.l}</div>
                  <div className="mt-0.5 text-[10.5px] text-ink-4">{r.d}</div>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ══ 素材怎么归类 ══ */}
      <section>
        <Card className="border-dashed p-4.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 max-w-[70ch]">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-serif text-[14px] font-semibold tracking-tight text-ink">
                  素材只有一类，按章节归位
                </h3>
                <Tag tone="indigo" size="sm">
                  分类维度：章节
                </Tag>
              </div>
              <p className="mt-2 text-[12px] leading-[1.8] text-ink-2">
                教学素材共 {RESOURCE_COUNTS.material} 条，其中图文条目 {MATERIAL_FORM_COUNTS.entry} 条、
                图片 {MATERIAL_FORM_COUNTS.image} 条、文本资料 {MATERIAL_FORM_COUNTS.text} 条、
                音视频 {MATERIAL_FORM_COUNTS.audio + MATERIAL_FORM_COUNTS.video} 条。
                它们不再分成「民俗」与「素材」两类——只是形态不同，服务的是同一件事：
                把某章某个知识点讲清楚。民俗类内容集中在第 7 章，作为该章素材的一部分出现。
              </p>
            </div>
            <Link to="/resources?kind=material">
              <Button variant="outline" size="sm">
                看教学素材
                <ArrowRight size={12} />
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      <p className="border-t border-line-2 pt-4 text-[11.5px] leading-relaxed text-ink-4">
        说明：课程结构（{COURSE_SCALE.chapters} 章 / {COURSE_SCALE.units} 单元 /{' '}
        {COURSE_SCALE.points} 知识点）依据公开教学资料梳理，章节命名在不同教学点可能存在差异；
        知识点卡与迁移落点为本站整理，供备课时参考，不替代教材与教研组的统一要求。
      </p>
    </div>
  )
}
