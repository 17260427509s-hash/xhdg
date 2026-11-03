# 第三阶段：保存、音乐、图片和独立观看

日期：2026-11-04（Asia/Shanghai）。用户已要求开始第三阶段，并确认“先完成代码和本机验收，再接入云端”；完成后上传当前 GitHub 仓库，供另一台电脑继续。本轮保留既有实时蛋糕、无标签场景、连续换款、逐层定制及许愿吹灭。

## 当前交付范围

| 功能 | 实现 |
| --- | --- |
| 本机草稿 | 自动保存及手动保存，刷新恢复完整配置、各层覆盖和音乐偏好；版本校验、异常 JSON 恢复、存储不可用提示。草稿与发布身份都留在浏览器，不上传 Git |
| 原创音乐 | 内置 48 秒 PCM 音频“星河轻笺”，有真实声音；点击“开启星河”后才播放。支持开关、暂停、后台暂停与恢复，不重复叠加播放器 |
| 高清 PNG | 从实时 WebGL 场景重新渲染，桌面长边最高 3200、手机 2400、低档 1600；完成后恢复原画布、DPR 和后期缓冲区 |
| 分享卡片 | 1200×1800 PNG，包含当前蛋糕、寿星、祝福、发送人和日期；正式链接生成后附二维码。未发布时不放本机地址二维码 |
| 制作／观看分离 | `/create` 为制作页，`/preview` 为明确标记的本机只读预览，`/birthday/:id` 从后端读取分享快照。观看页无编辑器，保留旋转、音乐、许愿和吹灭 |
| Supabase 接入代码 | 发布者匿名身份、独立表、RLS、严格数据约束、配额、按 ID 公开读取 RPC、不可变发布快照、发布者撤回。没有放开整表公开读取 |
| 手机完善 | 礼物面板独立滚动，至少 44 CSS px 操作区，长按保存图片，按 visualViewport 调整面板与键盘间距 |

**真实 Supabase 项目和公网前端尚未接入或部署。** 没有项目时生成链接按钮禁用并明确说明；本机预览不冒充跨设备分享。按用户选择，本轮不要求提供云端账号或密钥。数据库与前后端协议均可本机验证，云端接入见 [独立接入说明](../galaxy-cake/supabase/README.md)。

## 换电脑启动

准备 Node.js 24 和 Git，在仓库默认分支使用固定 pnpm 11.25.0：

```powershell
npm install -g pnpm@11.25.0
git clone https://github.com/17260427509s-hash/xhdg.git
cd xhdg/galaxy-cake
pnpm install --frozen-lockfile
pnpm dev
```

已有副本时先保存本机改动，再在仓库根目录 `git pull --ff-only`，进入 `galaxy-cake` 重新执行固定锁文件安装。打开 `http://localhost:5173/create`；无云端配置时，音乐、草稿、本机观看和图片导出均可运行。音频已提交，启动不需要 Python。

生产验收：`pnpm build` 后 `pnpm preview`，地址 `http://localhost:4173/`。测试过程中不要重新构建替换正在验收的产物。

本机草稿不会跟随 Git 迁移到另一台电脑，也不会覆盖仓库中的示例默认值。跨设备分享需部署正式前端并接入 Supabase；不能发送 localhost 给异地收件人。`.env.local`、云端密钥、浏览器会话、`node_modules`、构建产物和本机验收工具不提交。

## 云端接续

1. 建立独立 Supabase 项目，执行 `galaxy-cake/supabase/migrations/202611030001_birthday_gifts.sql`，开启 Anonymous Sign-Ins。
2. 复制 `galaxy-cake/.env.example` 为 `.env.local`，填入项目 URL、publishable 公钥、正式 HTTPS 前端 origin。构建配置会拒绝把 secret／service_role 密钥打包进浏览器。
3. 部署前端并配置 SPA fallback，仓库包含 Vercel rewrite 和 Netlify `_redirects`。音乐、模型和图片导出不依赖额外媒体服务。
4. 用两台真实设备验证发布、观看、许愿、草稿修改不影响已发布内容、撤回及二维码；再记录为真实云端验收通过。

收到链接的人可查看礼物中的个人信息。发布按钮之前已说明公开范围；URL 只包含随机 UUID，不把完整祝福拼在 URL 中。查看 RPC 不返回创建者 ID。原始 HTML 元数据使用通用生日文案；浏览器加载后再设置寿星标题，避免抓取器错误展示默认“小雨”。平台自动生成的专属 Open Graph 封面和微信内置浏览器行为尚未实机验收，不等同于已下载的分享卡片。

## 验收与证据

先使用应用内浏览器实际进入与操作，再使用既有 Playwright 对生产构建固定视口、导出与验证。Browser plugin 未列出；应用内浏览器走 CUA，自动化回归走既有 Playwright／Chrome。视口覆盖 1585×992、390×844、375×667、412×915。手机为电脑模拟，不能据此宣布 iPhone／安卓实机性能或软键盘完全通过。

最终专项共 102 项通过：第三阶段本机 16 项、协议联调 8 项、数据库权限 9 项、原有功能回归 69 项。最终通用 HTML 文案与二维码静区调整后，重新执行了生产构建及本机 16 项、协议 8 项；既有 69 项完整回归结果仍独立保留。重复导出后为 52 个几何体／42 个纹理，连续换款 25 轮后为 66／47，未见持续增长。`pnpm build` 通过，最终普通产物主入口为 `index-CaDEIv7s.js`。

最新证据：

- [本机第三阶段专项](qa-stage-three-local-final-html/stage-three-results.json)：真实音频播放、刷新恢复、静音偏好、高清 PNG、卡片、重复导出资源、只读预览完整许愿、坏草稿和存储失败、三种手机。
- [本机协议联调](qa-stage-three-protocol-final/protocol-results.json)：真实 Supabase SDK → 仅绑定 loopback 的兼容 HTTP 测试服务 → PGlite PostgreSQL／RLS → 全新浏览器上下文。身份由测试服务模拟，**不是已连接真实 Supabase**。
- [PostgreSQL 权限](qa-stage-three-database/database-results.json)：迁移执行、创建者隔离、禁止伪造创建者、拒绝异常数据、不可更新、限制公开读取、配额和撤回。
- 原有功能回归：[基础](qa-stage-three-regression/results.json)、[第二阶段](qa-stage-three-stage-two/stage-two-results.json)、[分层组合](qa-stage-three-assembly/results.json)、[逐层编辑](qa-stage-three-layers/results.json)、[连续换款](qa-stage-three-switch/switch-results.json)。
- [桌面礼物面板](qa-stage-three-local-final-html/desktop-gift-panel.png)、[375 面板](qa-stage-three-local-final-html/mobile-375-gift.png)、[只读祝福](qa-stage-three-local-final-html/readonly-preview-message.png)。
- 实际导出文件：[3200 长边 PNG](qa-stage-three-local-final-html/scene-hd.png)、[1200×1800 卡片](qa-stage-three-local-final-html/birthday-card.png)、[带二维码卡片（本机协议测试地址）](qa-stage-three-protocol-final/card-with-qr.png)。

`qa-stage-three-*-round-*` 为过程记录，包括两次验收脚本修正：预览新窗口需显式开启只读 QA getter；点击预览会先保存，因此不应拿点击前的时间戳判断观看页是否写入草稿。原记录保留，最终结果以本节目录为准。

`pnpm build` 包含 TypeScript 检查。既有 Three.js 大 chunk 提示、ANGLE／shader 编译 warning 保留在 JSON；不将无应用 error 写成零 warning。音乐的 PCM 文件为 48 秒／22050 Hz／单声道，RMS 约 0.1903、峰值 0.78，未静音伪造播放；浏览器验证了实际媒体时间前进。完整音频与可重生成源码均在仓库，见 [音频许可](../galaxy-cake/public/audio/LICENSE.txt)。

## 在另一台电脑复现验收

应用运行不需要测试依赖。验收工具可隔离安装，不修改应用锁文件：

```powershell
cd galaxy-cake
New-Item -ItemType Directory -Path ../.qa-tools -Force
pnpm add --dir ../.qa-tools playwright sharp @electric-sql/pglite@0.5.14 jsqr@1.4.0
$env:NODE_PATH = (Resolve-Path ../.qa-tools/node_modules).Path
# 使用已安装的 Chrome，或按 Playwright 文档安装浏览器。
# 在另一个终端先完成 pnpm build，再保持 pnpm preview 运行。
node scripts/verify-stage-three.cjs
node scripts/verify-gift-database.cjs
```

协议测试使用单独的、没有真实凭据的产物；构建到被 Git 忽略的 `.qa-tools`，不会替换主应用 `dist`：

```powershell
$env:VITE_SUPABASE_URL = 'http://127.0.0.1:4310'
$env:VITE_SUPABASE_PUBLISHABLE_KEY = 'local-protocol-test-key'
$env:VITE_PUBLIC_SITE_URL = 'https://gift.example.test'
node node_modules/vite/bin/vite.js build --mode stage-three-fixture --outDir ../.qa-tools/cloud-fixture
Remove-Item Env:VITE_SUPABASE_URL,Env:VITE_SUPABASE_PUBLISHABLE_KEY,Env:VITE_PUBLIC_SITE_URL
node scripts/verify-cloud-share.cjs
```

测试脚本只在 127.0.0.1 启动临时 4174／4310 服务，完成后关闭；不创建云端资源或真实公开地址。可设置 `QA_OUTPUT` 保留新的独立证据目录，`CHROME_PATH` 指定 Chrome。拍摄、录屏工具沿用原说明。

## 代码入口

- `gifts/draft.ts`、`useDraft.ts`：版本化保存及恢复；`birthdayStore.ts`：白名单配置校验。
- `gifts/useMusic.ts`、`public/audio/`、`audio/generate-score.py`：音乐生命周期、真实音频与源码。
- `gifts/exportImage.ts`、`three/GalaxyScene.tsx`：高清实时重渲染、图片及带二维码的卡片。
- `gifts/cloud.ts`、`supabase/`：SDK、独立数据模型与权限。没有浏览器 service key。
- `App.tsx`：制作、预览、分享读取及错误状态；`GiftDialog.tsx`：保存／导出／分享入口。

视觉继续沿用 [蛋糕精修记录](pastry-photographic.md)。本轮没有把既有实时模型宣称为与摄影级概念图逐像素一致，也没有把本机阶段完成写成正式云端上线销售。
