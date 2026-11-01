# 星河生日蛋糕 · 第一阶段

独立的 React 19 + TypeScript + Vite + Three.js + R3F 9 + drei 应用。默认寿星“小雨”、单层蓝紫蛋糕、普通蜡烛。蛋糕、奶油、蜡烛、火焰、轨道、星空、光晕和庆祝粒子均实时生成；运行时不加载 `design/` 概念图或 `reference/` 视频。

当前以用户再次指定的整张摄影级概念图为目标，重建蓝紫糕体、连续滴落奶油、扭转裱花、糖珠、螺旋蜡烛和薄底盘，采用柔光、PCSS 阴影与桌面环境遮蔽。火焰仍为真实体积密度场，星砂与粒子为实时 GPU Points。最新视觉证据见 [概念图对照记录](../docs/concept-match.md) 和 `docs/qa-concept/`；功能通过与摄影级视觉一致性分开记录。

## 本机运行

需要 Node.js 20.19+ 或 22.12+，以及 pnpm 11。

```powershell
cd galaxy-cake
pnpm install --frozen-lockfile
pnpm dev
```

开发地址：`http://localhost:5173/`。

```powershell
pnpm typecheck
pnpm build
pnpm preview
```

生产预览：`http://localhost:4173/`。开发与预览绑定局域网，未部署公网。

## 操作

1. 点击“开启星河”，观看约 4.5 秒星光聚集、蛋糕显现、轨道展开与点燃。
2. 鼠标或单指拖动旋转，滚轮或双指有限缩放；停止操作 5 秒后自动缓慢旋转。
3. “暂停”冻结火焰、星轨及所有粒子，仍可手动查看；“继续”恢复。
4. “重播”重置镜头和时间线。
5. “开启生日惊喜”播放约 7 秒高潮、三维中心爆发、Happy Birthday 和祝福。“再看一次”重新开始。

入场和高潮期间锁定冲突操作，暂停时先继续再开启惊喜。页面隐藏时冻结动画时钟；遵循减少动态效果偏好。WebGL 2 不可用或上下文丢失时显示说明及重试。

## 代码职责

- `experience/`：统一状态机、GSAP 时间线、共享时钟、可见性、性能档位。
- `three/Cake.tsx`：预设注册、蛋糕胚、程序化凹凸材质、流淌奶油、螺旋奶油花、实例化装饰。
- `three/Flame.tsx`：实时动态火焰 shader、暖色局部灯光。
- `three/Particles.tsx`：远景、近景、火星、三维中心爆发，均为 BufferGeometry 和 shader。
- `three/OrbitRings.tsx`：三条不同空间倾角的椭圆、沿路径运动的实例化星尘。
- `three/GalaxyScene.tsx`：灯光、有限 OrbitControls、镜头、材质亮度选择 Bloom、WebGL 降级。
- `components/` 与 `styles.css`：原生中文文字、开场、底部控件和响应式布局。

视觉重做保留原有近景/远景/爆发预算，额外加入 GPU 点批次的细尘、糕体星砂、轨道细尘和火星。全部预算集中在 `experience/engine.ts`；GPU Points 总数桌面 8706、手机 5280、低档 2774。细尘尺寸小，使用少量 draw call，未创建数千个 React 粒子节点。DPR 上限分别为 2/1.5/1。稳定场景完成预热后，持续低于 30 FPS 约 3 秒会降档；低档同时降低后期分辨率。`?quality=low` 可直接检查低档。此预算调整针对用户要求的更丰富星砂包围感；实测记录与手机实机限制见最新验收。

## 浏览器验收

最新结果见 [`../docs/concept-match.md`](../docs/concept-match.md)；首次实现的历史记录见 [`../docs/acceptance-stage-1.md`](../docs/acceptance-stage-1.md)。测试使用真实本机 Chrome，通过 Playwright 操作原生按钮、拖动与触摸，未安装 Browser 插件。机器可通过 `NODE_PATH` 使用 Codex 自带 Playwright；其他机器请先在可用环境中安装 Playwright。

```powershell
# 可选：安装验收脚本所需依赖（不写入项目锁文件）
npm install --prefix ../.qa-tools --no-save playwright
$env:NODE_PATH = (Resolve-Path ../.qa-tools/node_modules).Path
# 安装 Chromium；Windows 上也可直接使用已安装的 Chrome
& ../.qa-tools/node_modules/.bin/playwright install chromium
# 在另一个终端保持 pnpm build / pnpm preview 运行
node scripts/verify-browser.cjs
node scripts/concept-shots.cjs
```

两份脚本均可配置 `CHROME_PATH`、`QA_URL`、`QA_OUTPUT`。详见 [换电脑接续说明](../docs/CONTINUE-HERE.md)。脚本保存实际浏览器截图及 `results.json`，检查五次重播、暂停与恢复、旋转、自动旋转冷却、小屏布局、触摸、低档及减少动态偏好。开发环境或 URL 带 `?qa=1` 时提供只读 `window.__GALAXY__` 验收信息。

本阶段未加入款式切换、编辑、许愿、吹灭、音乐、保存、分享或后端。手机模拟结果不能替代 iPhone / 安卓真机测试。
