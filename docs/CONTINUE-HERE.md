# 换电脑继续开发：从这里开始

更新日期：2026-11-01（Asia/Shanghai）。仓库：<https://github.com/17260427509s-hash/xhdg>。

## 先知道当前状态

应用已在 `galaxy-cake/` 实现，可以安装依赖后直接运行，**不要重新从零生成，也不要只根据最初 README 恢复旧版**。根目录是仓库，`galaxy-cake/` 是应用目录。

第一阶段八项核心体验已实现：全屏实时 3D、圆形蛋糕、动态体积火焰、分层星河粒子、三条空间轨道、拖动旋转、入场点燃、生日高潮与祝福。暂停/继续、重播、响应式布局和性能降档保留。第二、三阶段未开始。

用户最新的视觉要求是：**整张画面跟概念图一样，达到摄影级细节，尤其把发光星砂、火焰和粒子做精致。** 用户多次认为之前版本单调、粗糙；不能把“功能能运行”当作视觉完成。最近一轮已重建滴落奶油、扭转裱花、糖珠、蜡烛、弧面底盘、布光和星轨，但**摄影级视觉一致性尚未通过**。当前任务仍是第一阶段视觉打磨，不提前加入设置、许愿、吹蜡烛、音乐或分享。

所有 3D 必须实时渲染。概念图、参考视频仅用于对照，禁止用它们替代运行时画面。

## 在新电脑启动

安装 Git、兼容 Vite 7 的 Node.js（20.19+ 或 22.12+；建议使用当前支持的 LTS）及 `pnpm@11.25.0`。项目通过 `packageManager` 固定 pnpm 版本。

```powershell
# 已有 pnpm 时可跳过全局安装
npm install -g pnpm@11.25.0
git clone https://github.com/17260427509s-hash/xhdg.git
cd xhdg/galaxy-cake
pnpm install --frozen-lockfile
pnpm dev
```

打开 <http://localhost:5173/>。生产版验证：

```powershell
pnpm build
pnpm preview
```

打开 <http://localhost:4173/>。改代码后，开发版自动更新；生产预览需要重新 `pnpm build`，再刷新页面。不要在浏览器回归进行期间重新构建，以免替换它正在访问的产物。

如另一台电脑已经克隆此仓库，先保留自己的修改，再在仓库根目录运行 `git pull --ff-only`，随后在 `galaxy-cake/` 重新 `pnpm install --frozen-lockfile`。

无需数据库、后端服务、账号、`.env`、API 密钥或付费素材。`node_modules/` 和 `dist/` 不上传，分别由安装和构建生成。设计图片、原始 MP4、锁文件、源码和验收记录均随仓库提供。

## 接续前阅读与查看

1. [BRIEF.md](../BRIEF.md)、[PLAN.md](../PLAN.md)：完整需求与第一阶段边界。
2. [design/README.md](../design/README.md)：已确认的桌面与手机基准。
3. [photographic-reference.png](../design/photographic-reference.png)：用户最新再次指定的摄影级概念图；[desktop-colorful-stars.png](../design/desktop-colorful-stars.png) 为原桌面设计；[mobile-layout.png](../design/mobile-layout.png) 为手机布局。手机保留构图并增强彩色星点。
4. [reference-analysis.md](reference-analysis.md) 与 [原始视频](../reference/13437993356281919.mp4)：原视频 31.37 秒，历史完整观看与分析记录保留。
5. [concept-match.md](concept-match.md)：最近一次模型/材质修改、当前差距和视觉验收状态。
6. [qa-concept/desktop-native.png](qa-concept/desktop-native.png)、[手机截图](qa-concept/mobile-390.png) 与 [results.json](qa-concept/results.json)：最新真实浏览器证据。

`qa/`、`qa-refined/`、`qa-image/`、`qa-fine/` 和对应精修文档属于较早版本，保留作对比。不要把它们误当作最新画面。

## 当前代码入口

- `galaxy-cake/src/three/Cake.tsx`、`pastryGeometry.ts`：糕体与材质、滴落奶油、扭转裱花、糖粒、蜡烛、底盘。
- `Flame.tsx`：三维密度场射线积分火焰。`StarSand.tsx`：视角相关的糕体晶粒；`Particles.tsx` 与 `shaders/particleShaders.ts`：分层星点、星尘、火星和高潮爆发。
- `GalaxyScene.tsx`：相机、环境柔光、PCSS 阴影、桌面 N8AO、Bloom、OrbitControls。
- `OrbitRings.tsx`：三个不同倾角的椭圆星轨。`Atmosphere.tsx`、`CandleGlow.tsx`：程序化星云与微弱光晕。
- `experience/engine.ts`：统一时钟、GSAP 时间线、状态机与三档预算。不要用多个独立计时器破坏暂停/重播。
- `components/BirthdayExperience.tsx`、`styles.css`：开场、原生中文界面、祝福、底栏与手机布局。

## 下一步优先事项

1. 在 1585×992 下打开真实网页，与摄影级概念图原尺寸对照，继续改善奶油褶皱的自然度、糕体颗粒、奶油光照散射、细小反射和星光层次；保持蓝紫糕体、象牙白奶油、暖金火焰及三条细轨。
2. 改动后实际旋转查看，确认细节在不同角度成立，不能只调一个静态角度。
3. 重新检查 390×844、375×667、412×915 等手机尺寸，轨道不裁切、按钮至少 44px；模拟结果不能冒充手机实机性能。
4. 构建、实际操作、截图、对照、修正差距、记录结果。当前 14 项功能回归通过、五轮重播资源稳定，摄影级视觉标准仍需独立验收。

## 可选浏览器验收工具

正常开发与运行不依赖 Playwright。需要自动回归时，在仓库旁的隔离工具目录安装它；此目录被 Git 忽略。

在 `galaxy-cake/` 执行：

```powershell
npm install --prefix ../.qa-tools --no-save playwright
$env:NODE_PATH = (Resolve-Path ../.qa-tools/node_modules).Path
& ../.qa-tools/node_modules/.bin/playwright install chromium
# 另一个终端启动 pnpm build / pnpm preview 后运行
node scripts/verify-browser.cjs
node scripts/concept-shots.cjs
```

Windows 上默认优先使用通常路径下已安装的 Google Chrome；其他系统默认使用 Playwright Chromium。`CHROME_PATH` 可指定浏览器绝对路径，`QA_URL` 可指定预览地址，`QA_OUTPUT` 可指定截图/JSON 输出目录；设置不同输出目录可保留已有验收证据。验收脚本不依赖原电脑的用户名、项目盘符或 Codex 缓存位置。

## 可直接给下一台电脑 Codex 的接续指令

> 请先读 docs/CONTINUE-HERE.md、README.md、BRIEF.md、PLAN.md、docs/reference-analysis.md、design/README.md 和 docs/concept-match.md，查看最新摄影级概念图、手机图与 docs/qa-concept 的实际截图，并完整查看 reference 原视频。基于现有 galaxy-cake 继续第一阶段，重点缩小与概念图的摄影级材质和星砂、火焰、粒子细节差距，不要重新生成简化圆柱版本。所有 3D 必须实时渲染。改完启动网页、实际操作、截图对照、继续修正，并如实记录视觉差距；第一阶段确认后再讨论第二、三阶段。
