import { useRef, useState } from 'react'
import { AlertTriangle, Check, Database, Download, Loader2, Plug, RotateCcw, Upload } from 'lucide-react'
import type { LlmSettings } from '@/lib/types'
import { Button, Card, Tag } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { testConnection } from '@/lib/agent/llm'
import { clearAll, exportAll, importAll } from '@/lib/storage'
import { download } from '@/lib/export'
import { useApp, useToast } from '@/store/AppStore'

export default function SettingsPage() {
  const { settings, updateSettings, resetAll, reload } = useApp()
  const { toast } = useToast()
  const [draft, setDraft] = useState<LlmSettings>(settings)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function patch<K extends keyof LlmSettings>(k: K, v: LlmSettings[K]) {
    setDraft((d) => ({ ...d, [k]: v }))
    setTestResult(null)
  }

  async function handleTest() {
    setTesting(true)
    const r = await testConnection(draft)
    setTestResult(r)
    setTesting(false)
  }

  function save() {
    updateSettings(draft)
    toast('设置已保存')
  }

  return (
    <div className="animate-fade max-w-3xl">
      <PageHeader
        eyebrow="设置"
        title="AI 接入与数据管理"
        desc="AI 是本平台唯一的生成引擎：方案与知识点分析都由它完成，不再提供离线兜底。在这里填一次，全站可用。"
      />

      {/* AI 配置 */}
      <Card className="mb-4 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line-2 bg-paper-2/50 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Plug size={15} className="shrink-0 text-ink-3" />
            <div className="min-w-0">
              <h2 className="font-serif text-[14px] font-semibold">大模型接入</h2>
              <p className="mt-0.5 text-[10.5px] leading-[1.6] text-ink-4">
                OpenAI 兼容接口，可填 DeepSeek / 通义 / 智谱 等任意兼容服务
              </p>
            </div>
          </div>
          {/* 开关用固定像素尺寸 + flex 居中，不依赖 padding 推算位置，
              避免圆钮压在边缘或与轨道不同心 */}
          <button
            type="button"
            role="switch"
            aria-checked={draft.enabled}
            aria-label="大模型接入开关"
            onClick={() => patch('enabled', !draft.enabled)}
            className={
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-0 p-0 transition-colors ' +
              (draft.enabled ? 'bg-cinnabar' : 'bg-paper-3')
            }
          >
            <span
              className={
                'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ' +
                (draft.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]')
              }
            />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-medium text-ink-3">Base URL</span>
            <input
              value={draft.baseUrl}
              onChange={(e) => patch('baseUrl', e.target.value)}
              placeholder="https://api.deepseek.com/v1"
              className="h-9 w-full rounded-sm border border-line bg-card px-2.5 font-mono text-[12px] outline-none focus:border-cinnabar/60"
            />
            <span className="mt-1 block text-[10px] text-ink-4">
              只填到 /v1 即可，系统会自动补 /chat/completions
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10.5px] font-medium text-ink-3">API Key</span>
            <input
              type="password"
              value={draft.apiKey}
              onChange={(e) => patch('apiKey', e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
              className="h-9 w-full rounded-sm border border-line bg-card px-2.5 font-mono text-[12px] outline-none focus:border-cinnabar/60"
            />
            <span className="mt-1 block text-[10px] text-ink-4">
              仅保存在本机浏览器，不会上传到任何第三方服务器
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10.5px] font-medium text-ink-3">模型名</span>
            <input
              value={draft.model}
              onChange={(e) => patch('model', e.target.value)}
              placeholder="deepseek-chat"
              className="h-9 w-full rounded-sm border border-line bg-card px-2.5 font-mono text-[12px] outline-none focus:border-cinnabar/60"
            />
            <span className="mt-1 block text-[10px] leading-[1.7] text-ink-4">
              deepseek-flash / deepseek-reasoner 这类推理型模型会先思考再作答，单次分析约 15–40 秒；
              思考也计入输出预算，预算不足时系统会自动放宽重试，仍失败会说明原因。
            </span>
          </label>

          {testResult && (
            <div
              className={
                'flex items-start gap-2 rounded-sm border px-2.5 py-2 text-[11.5px] ' +
                (testResult.ok
                  ? 'border-bamboo/30 bg-bamboo-l/50 text-bamboo'
                  : 'border-cinnabar-l bg-cinnabar-p text-cinnabar')
              }
            >
              {testResult.ok ? (
                <Check size={13} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              )}
              <span className="leading-[1.7]">{testResult.message}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="primary" size="sm" onClick={save}>
              保存设置
            </Button>
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />}
              {testing ? '测试中…' : '测试连接'}
            </Button>
          </div>

          <div className="rounded-sm border border-line-2 bg-paper-2/50 p-3">
            <p className="text-[11px] leading-[1.8] text-ink-3">
              生成失败时（网络中断、Key 无效、返回格式不符），系统会直接给出原因并保留重试入口，
              <span className="font-medium text-ink-2">不会用模板拼一份方案糊弄过去</span>——
              那种「看起来完整」的结果比报错更难发现。
            </p>
            <p className="mt-1.5 text-[11px] leading-[1.8] text-ink-3">
              同一份配置同时供三处使用：备课工坊生成方案、教学应用页的知识点分析、
              以及设置页的连接测试。没有单独的「本地模式」开关。
            </p>
          </div>
        </div>
      </Card>

      {/* 数据管理 */}
      <Card className="mb-4 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line-2 bg-paper-2/50 px-4 py-3">
          <Database size={15} className="text-ink-3" />
          <div>
            <h2 className="font-serif text-[14px] font-semibold">数据备份</h2>
            <p className="mt-0.5 text-[10.5px] text-ink-4">
              收藏、方案、草稿、交流帖全部存在本机浏览器，建议定期导出备份
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                download(
                  `乡音课坊备份-${new Date().toISOString().slice(0, 10)}.json`,
                  exportAll(),
                  'application/json',
                )
                toast('已导出备份文件')
              }}
            >
              <Download size={13} />
              导出全部数据
            </Button>

            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload size={13} />
              导入备份
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const text = await file.text()
                const r = importAll(text)
                if (r.ok) {
                  reload()
                  toast(`已导入 ${r.count} 项数据`)
                } else {
                  toast(`导入失败：${r.error}`, 'warn')
                }
                e.target.value = ''
              }}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!window.confirm('确定要清空所有本地数据吗？此操作不可撤销。')) return
                clearAll()
                resetAll()
                toast('已清空本地数据')
              }}
            >
              <RotateCcw size={13} />
              清空全部
            </Button>
          </div>

          <div className="flex items-start gap-2 rounded-sm border border-ochre/25 bg-ochre-l/40 p-3">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-ochre" />
            <p className="text-[11px] leading-[1.8] text-ink-2">
              清空操作会删除收藏、已保存方案、草稿与你发布的交流帖，并恢复 6 条示例帖。
              课程数据与教案内容属于随站点发布的静态资源，不受影响。
            </p>
          </div>
        </div>
      </Card>

      {/* 关于 */}
      <Card className="overflow-hidden">
        <div className="border-b border-line-2 bg-paper-2/50 px-4 py-3">
          <h2 className="font-serif text-[14px] font-semibold">关于内容口径</h2>
        </div>
        <div className="space-y-2.5 p-4 text-[11.5px] leading-[1.85] text-ink-3">
          <p>
            <span className="font-medium text-ink-2">课程结构　</span>
            依据《人类与社会》（国家开放大学出版社 2020 年第二版）公开教学资料梳理，
            全书十章。第五章至第七章的确切命名在不同教学点存在差异，可在课程知识地图页按本校教材调整。
          </p>
          <p>
            <span className="font-medium text-ink-2">非物质文化遗产　</span>
            统一表述为「列入国家级 / 省级 / 联合国教科文组织名录」，
            不标注批次编号、代表性传承人姓名与确切起始年代。用于公开出版或评比前请另行核实。
          </p>
          <p>
            <span className="font-medium text-ink-2">素材　</span>
            纹样插画由程序按剪纸的对称与镂空语法生成，可自由下载使用；
            音视频暂无版权来源，以「待替换」状态登记，不提供伪造的播放。
          </p>
          <p>
            <span className="font-medium text-ink-2">技术栈　</span>
            React 19 + TypeScript + Vite 7 + Tailwind v4，纯前端，无后端依赖，可静态部署。
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Tag size="sm">本地存储</Tag>
            <Tag size="sm">可离线</Tag>
            <Tag size="sm">AI 生成</Tag>
            <Tag size="sm">A4 打印</Tag>
          </div>
        </div>
      </Card>
    </div>
  )
}
