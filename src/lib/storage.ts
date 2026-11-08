/* localStorage 版本化封装。键名含命名空间与版本，便于未来迁移。 */

const NS = 'folkhub'
const VERSION = 'v1'

export function storageKey(name: string): string {
  return `${NS}:${VERSION}:${name}`
}

export function readJSON<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(name))
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(name: string, value: T): void {
  try {
    localStorage.setItem(storageKey(name), JSON.stringify(value))
  } catch {
    // 存储配额用尽时静默失败，不阻断交互
  }
}

export function removeKey(name: string): void {
  try {
    localStorage.removeItem(storageKey(name))
  } catch {
    /* noop */
  }
}

export function clearAll(): void {
  try {
    const prefix = `${NS}:${VERSION}:`
    Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* noop */
  }
}

export function exportAll(): string {
  const prefix = `${NS}:${VERSION}:`
  const out: Record<string, unknown> = {
    __meta: { app: 'folk-culture-hub', version: VERSION, exportedAt: new Date().toISOString() },
  }
  Object.keys(localStorage)
    .filter((k) => k.startsWith(prefix))
    .forEach((k) => {
      try {
        out[k.slice(prefix.length)] = JSON.parse(localStorage.getItem(k) ?? 'null')
      } catch {
        out[k.slice(prefix.length)] = localStorage.getItem(k)
      }
    })
  return JSON.stringify(out, null, 2)
}

export function importAll(json: string): { ok: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(json) as Record<string, unknown>
    if (!data || typeof data !== 'object') return { ok: false, count: 0, error: '文件格式不正确' }
    const skip = new Set(['__meta', 'posts'])
    let count = 0
    Object.entries(data).forEach(([k, v]) => {
      if (skip.has(k)) return
      localStorage.setItem(storageKey(k), JSON.stringify(v))
      count += 1
    })
    return { ok: true, count }
  } catch (e) {
    return { ok: false, count: 0, error: e instanceof Error ? e.message : '解析失败' }
  }
}
