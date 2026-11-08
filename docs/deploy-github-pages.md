# 部署到 GitHub Pages

> 仓库：https://github.com/yzz1998/folk-culture-hub
> 线上地址：https://yzz1998.github.io/folk-culture-hub/
> 首次部署：2026-11-08

## 一、为什么能直接跑在 Pages 上

两个关键设置，缺一个就会白屏或 404：

| 设置 | 值 | 原因 |
| --- | --- | --- |
| `vite.config.ts` → `base` | `'./'` | 项目页挂在 `/<repo>/` 子路径下，绝对路径 `/assets/...` 会 404；相对路径不受挂载深度影响 |
| 路由 | `HashRouter` | Pages 是纯静态托管，没有服务端重写。hash 路由（`#/apply`）不经过服务器，不需要 `404.html` 兜底 |

因此**不需要** `404.html` 重定向脚本，也不需要改 `base` 为仓库名——换仓库名照样能用。

## 二、发布链路

`.github/workflows/deploy.yml`，推到 `main` 自动跑：

```
checkout → setup-node 22 (npm cache) → npm ci → npm run build
        → configure-pages → upload-pages-artifact(dist) → deploy-pages
```

- `npm run build` 内含 `tsc --noEmit` 与 `scripts/verify.mjs` 一致性校验：**类型或数据不过，构建失败，坏版本不会上线**。
- 权限只给三样：`contents: read`、`pages: write`、`id-token: write`。
- `concurrency: pages`，同一时间只发布一个版本，避免连续提交互相覆盖。

## 三、仓库侧设置（已通过 API 完成）

`Settings → Pages → Build and deployment → Source = GitHub Actions`。
等价 API：

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  https://api.github.com/repos/<owner>/<repo>/pages \
  -d '{"build_type":"workflow"}'
```

> 注意：`build_type` 必须是 `workflow`。若选 `branch`，Pages 会去读 `gh-pages` 分支或 `docs/` 目录，与本流程不匹配。

## 四、日常更新

改完代码，提交并推送即可，云端自动重建：

```bash
git add -A
git commit -m "feat: ..."
git push origin main
```

进度看 `Actions` 页，或：

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.github.com/repos/<owner>/<repo>/actions/runs?per_page=1"
```

## 五、要注意的三件事

1. **仓库必须公开**。GitHub Free 的 Pages 只支持公开仓库；私有仓库需 Pro/Team 及以上。代价是源码（含 `docs/` 与素材文本）对外可见。
2. **AI Key 不入库**。Key 存在各使用者自己浏览器的 `localStorage`（键 `folkhub:v1:settings`），页面是纯静态的，没有服务端持有密钥。`.gitignore` 已排除 `.env`。
3. **`.gitignore` 会影响构建产物**。Tailwind v4 的自动内容扫描遵守 `.gitignore`：加入该文件后不再扫描 `dist/` 里的副本，CSS 从 57 kB 降到 51 kB（去掉的是重复类名，视觉无变化）。若发现某处样式丢失，先怀疑扫描范围。

## 六、排错

| 现象 | 原因 |
| --- | --- |
| 页面白屏、控制台 404 指向 `/assets/...` | `base` 被改成了 `'/'` |
| 直接访问 `/apply` 得 404 | 用了 BrowserRouter；改回 HashRouter，或加 `404.html` 重定向 |
| Actions 里 `deploy-pages` 报 "Get Pages site failed" | Pages 未启用，或 `build_type` 不是 `workflow` |
| 推送被拒："refusing to allow a Personal Access Token to create or update workflow" | PAT 缺 `workflow` scope |
| 部署成功但内容没更新 | CDN 缓存，等 1–2 分钟；或看 Actions 里最新 run 是否对应最新 commit |
