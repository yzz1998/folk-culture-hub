/**
 * 用 vite 自带的 esbuild 把 TS 校验脚本打成单文件再执行，
 * 这样 @ 别名与 TS 语法都不需要额外配置，也不新增运行时依赖。
 * 默认跑数据一致性；传参可跑其它校验脚本：node scripts/verify.mjs scripts/check-llm-retry.ts
 */
import { build } from 'esbuild'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'

const entry = process.argv[2] ?? 'scripts/check-integrity.ts'

const out = await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'silent',
  alias: { '@': path.resolve('src') },
})

mkdirSync('node_modules/.cache', { recursive: true })
const tmp = `node_modules/.cache/${path.basename(entry, '.ts')}.mjs`
writeFileSync(tmp, out.outputFiles[0].text)
try {
  await import(pathToFileURL(path.resolve(tmp)).href)
} finally {
  rmSync(tmp, { force: true })
}
