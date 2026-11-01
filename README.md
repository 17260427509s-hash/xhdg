# 星河生日蛋糕 · 开发接续资料

这是「星河生日蛋糕」的需求、设计与开发接续仓库。目标是开发一个可真实交互的 React + TypeScript + Vite + Three.js 生日礼物网页。

**当前进度（2026-11-01）：第一阶段八项核心体验已在 `galaxy-cake/` 实现，并完成本机 Chrome 浏览器操作、生产构建、截图对照与多尺寸验收。** 蛋糕、火焰、星轨和粒子均为实时 3D。详情见 [第一阶段验收记录](docs/acceptance-stage-1.md) 与 [实现及视觉对照](docs/implementation-notes.md)。手机实机性能尚未验证；第二、三阶段未开始。

**当前视觉任务：** 用户进一步明确要求整张画面向概念图的摄影级细节靠拢，本轮已重建滴落奶油、扭转裱花、珍珠糖粒、蜡烛与底盘，并重新校准比例、灯光、星轨和星点。当前结果见 [概念图对照记录](docs/concept-match.md) 与 `docs/qa-concept/`。摄影级视觉一致性尚未确认通过，先前只精修特效的记录属于历史版本。

## 换电脑继续开发

当前源代码、锁文件、设计图、原始视频和历史/最新验收截图均在此仓库。请先阅读 [CONTINUE-HERE.md](docs/CONTINUE-HERE.md)，其中记录启动方法、最新用户要求、尚未通过的视觉标准和下一步工作。

```powershell
git clone https://github.com/17260427509s-hash/xhdg.git
cd xhdg/galaxy-cake
pnpm install --frozen-lockfile
pnpm dev
```

已有本仓库时，先在仓库根目录执行 `git pull --ff-only`。本项目不需要 `.env`、数据库、API 密钥或其他本机私有配置。

## 启动已实现的第一阶段

```powershell
cd galaxy-cake
pnpm install --frozen-lockfile
pnpm dev
```

开发地址为 `http://localhost:5173/`。执行 `pnpm build`、`pnpm preview` 可在 `http://localhost:4173/` 检查生产版本。运行要求、操作与验收脚本见 [应用 README](galaxy-cake/README.md)。

## 仓库来源与原始开发接续说明

```bash
git clone https://github.com/17260427509s-hash/xhdg.git
cd xhdg
```

在 Codex 中打开克隆下来的 `xhdg` 文件夹。依次阅读：

1. [BRIEF.md](BRIEF.md)：完整用户需求、三阶段范围与已确认选择。
2. [PLAN.md](PLAN.md)：第一阶段实施方案与验收要求。
3. [参考视频分析](docs/reference-analysis.md)：逐段观察与不可确认的内容。
4. [视觉基准说明](design/README.md)：桌面、手机设计及彩色星点修订。
5. [原始参考视频](reference/13437993356281919.mp4)：下载后完整观看，不只看截图。

可以直接把下面这段话交给另一台电脑的 Codex：

> 请先阅读本仓库的 README.md、BRIEF.md、PLAN.md、docs/reference-analysis.md 与 design/README.md，查看 design/ 中的两张概念图，并完整分析 reference/ 中的原始视频。按照已确认方案，在 galaxy-cake/ 中从零实现第一阶段的八项核心体验。使用 React、TypeScript、Vite、Three.js、R3F 和 drei；所有 3D 画面必须实时渲染，不能用概念图或视频替代。手机使用已确认构图，并同步强化彩色近景星点。完成后启动网页、实际操作、截图对照、修正视觉差距并记录验收结果。先交付第一阶段，再继续讨论第二、三阶段。

## 已确认的决定

- 独立项目，不复制、覆盖或接入原有生日祝福网站。
- 为延续原计划，应用代码后续创建在仓库的 `galaxy-cake/` 子目录中。
- 第一轮只交付第一阶段八项核心体验，实际浏览器验收后再进入下一阶段。
- 采用深空、蓝紫奶油蛋糕、暖金火焰、三条细星轨的原创方向。
- 用户选择了“增加彩色星点”：桌面图已修订；手机沿用现有构图，同步加强蓝、粉、青、金色近景粒子，远景保持克制。
- 首阶段默认寿星“小雨”，普通单蜡烛，单层圆形蓝紫蛋糕。

## 资料结构

```text
BRIEF.md
PLAN.md
docs/reference-analysis.md
design/README.md
design/desktop-colorful-stars.png
design/mobile-layout.png
reference/README.md
reference/13437993356281919.mp4
SHA256SUMS.txt
```

`SHA256SUMS.txt` 记录原始视频和两张概念图的 SHA-256，可用于检查跨电脑下载是否完整。

Windows PowerShell 检查示例：

```powershell
Get-FileHash -Algorithm SHA256 reference/13437993356281919.mp4
Get-FileHash -Algorithm SHA256 design/desktop-colorful-stars.png
Get-FileHash -Algorithm SHA256 design/mobile-layout.png
```

概念图由内置 Image Gen 生成，只作为设计参考，不是可运行界面，也不能作为蛋糕贴图、全屏背景图或 UI 截图来替代实时实现。参考视频只用于产品逻辑、氛围和动画节奏分析；不复制原网站的品牌、Logo、UI 布局、文案、图标、配色细节或素材。

本仓库不包含原网站代码、用户数据库、访问凭据、node_modules 或运行日志。上述接续指令与资料目录保留为最初方案；现在新增 `galaxy-cake/` 应用和 `docs/qa/` 验收证据。浏览器验收已进行，真机验收尚未进行。
