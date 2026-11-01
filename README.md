# 星河生日蛋糕 · 开发接续资料

这是「星河生日蛋糕」的需求、设计与开发接续仓库。目标是开发一个可真实交互的 React + TypeScript + Vite + Three.js 生日礼物网页。

**当前进度（2026-11-01）：已完成参考视频分析、第一阶段规划和视觉方向确认；尚未开始编写应用代码。** 本仓库目前没有 `package.json`，不能直接执行 `npm install` / `npm run dev` 启动网站，也没有已完成或已验收的网页。

## 在另一台电脑上继续

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

本仓库未包含原网站代码、用户数据库、访问凭据、node_modules 或运行日志。应用尚未实现，浏览器和真机验收尚未进行。
