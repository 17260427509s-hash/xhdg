# 星河生日蛋糕 · 第三阶段本机版本

2026-11-05 新增“生日快乐 → 祝福卡片爱心”开场，完成后点击进入蛋糕；支持跳过、定制及手机长文本，统一时钟与动态星空保留。先读 [开场说明](../docs/birthday-opening.md)。本机 4173 被其他服务占用时使用 `pnpm preview --port 4174 --strictPort`。

2026-11-05 最新：星空随蛋糕颜色变化并缓慢流动；CSS 全屏背景、WebGL 场景和高清导出使用同一颜色与运动状态，手机底部背景也同步。暂停冻结运动，暂停中主动改色仍生效。先读 [动态星空实现与验收](../docs/living-sky.md)。下方各日期保留历史，当前不显示分层预览。

2026-11-04 用户最新调整：已移除分层预览及分层／合拢按钮，编辑和换款始终显示合拢蛋糕；仍可分别定制各层。

2026-11-04 最新视觉对照：旋臂星空、星云反照率、金边星云底盘、奶油／星饰／光珠和构图已调整，素材在 `public/textures/`，详见 [概念对照与剩余差距](../docs/concept-fidelity-20261104.md)。背景素材不包含蛋糕或轨道，二者仍实时渲染；摄影级完全一致尚未标记通过。

2026-11-04 最新：草稿保存／恢复、原创音乐、高清实时 PNG、分享卡片及独立观看页已加入；云端接入代码和 RLS 迁移已准备，按用户安排稍后连接真实 Supabase。先读 [第三阶段与验收](../docs/stage-three.md)。

2026-11-03 后续蛋糕近景精修：五瓣褶皱、连续滴边、蓝紫微表面、实体糖粒、薄金箔与蜡体旋纹，最新对照和证据见 [蛋糕视觉续修](../docs/pastry-photographic.md)。

2026-11-03 最新修订移除全部三维部件标签，通过设置面板选层。五款采用不同几何与精细糖饰，合拢 650 ms／展开 750 ms 连续 morph 换款；保留逐层定制、40 步撤销／重做及许愿流程。见 [本轮实现与验收](../docs/cake-refinement.md)。

最新增加参考视频式的分层编辑与组合切换，见 [assembly-editor.md](../docs/assembly-editor.md)。可拖动编辑中的部件预览，完成自动合拢；三种造型与一至三层可组合。“换一组灵感”一次改变款式／形状／层数。最新验收为 `qa-cake-refinement-final*`，下方最初第二阶段验收保留为历史。

2026-11-02 按用户要求已实现第二阶段。最新状态以 [第二阶段记录](../docs/stage-two.md) 和 [接续说明](../docs/CONTINUE-HERE.md) 为准。当前是低矮五瓣奶油花，旧版连续螺旋裱花已经弃用。没有恢复 PCSS shader 注入，保留原生柔影与桌面 N8AO。

独立的 React 19 + TypeScript + Vite + Three.js + R3F 9 + drei 应用。默认寿星“小雨”、单层蓝紫蛋糕、普通蜡烛。蛋糕、奶油、蜡烛、火焰、轨道、星空、光晕和庆祝粒子均实时生成；运行时不加载 `design/` 概念图或 `reference/` 视频。

蓝紫糕体、连续滴落奶油、五瓣奶油花、糖珠、蜡烛和薄底盘采用柔光、原生柔影与桌面环境遮蔽。火焰为真实体积密度场，星砂与粒子为实时 GPU Points。最新证据见 [蛋糕精修记录](../docs/cake-refinement.md)，[概念图对照记录](../docs/concept-match.md) 保留为历史；功能通过与摄影级视觉一致性分开记录。

## 本机运行

需要兼容 Vite 7 的 Node.js，以及项目固定的 pnpm 11.25.0。

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
5. 底栏“蛋糕／星河／祝福／蜡烛”打开设置，修改立即生效：五款、颜色、星河主题／强度／速度、昵称／生日／年龄／发送人／祝福、普通或数字蜡烛、点燃或关闭火焰。手机使用底部抽屉。
6. 顶部音乐按钮控制原创配乐；“保存与分享”中保存草稿、打开本机只读预览、导出高清 PNG 与卡片。云端连接后可生成不可变观看快照并撤回。
7. “开启生日惊喜”→“我许好愿了”→“吹灭蜡烛”。火焰摇摆熄灭、烟雾上升，随后播放约 7 秒高潮、三维中心爆发、四类彩纸、Happy Birthday 和定制祝福。“再看一次”重新开始并保留会话配置。刷新恢复本机草稿；本机草稿不跨设备同步。

入场和高潮期间锁定冲突操作，暂停时先继续再开启惊喜。页面隐藏时冻结动画时钟；遵循减少动态效果偏好。WebGL 2 不可用或上下文丢失时显示说明及重试。

## 代码职责

- `experience/`：统一状态机、GSAP 时间线、共享时钟、可见性、性能档位。
- `store/birthdayStore.ts`：配置校验、五款预设和五种星河配色。
- `three/Cake.tsx`、`CakeDecorations.tsx`、`Candles.tsx`：圆形／爱心糕体、程序化凹凸、流淌奶油、五瓣奶油花、实例化装饰和立体数字。数字使用 Three.js 随附字体，离线打包。
- `SmokeParticles.tsx`、`ConfettiExplosion.tsx`：短时 GPU 烟雾和实例化彩纸，结束后隐藏，不累计创建。
- `three/Flame.tsx`：实时动态火焰 shader、暖色局部灯光。
- `three/Particles.tsx`：远景、近景、火星、三维中心爆发，均为 BufferGeometry 和 shader。
- `three/OrbitRings.tsx`：三条不同空间倾角的椭圆、沿路径运动的实例化星尘。
- `three/GalaxyScene.tsx`：灯光、有限 OrbitControls、镜头、材质亮度选择 Bloom、WebGL 降级。
- `components/` 与 `styles.css`：原生中文文字、开场、底部控件和响应式布局。

全部预算集中在 `experience/engine.ts`；默认 GPU 点源总数桌面 7746、手机 5280、低档 2774。近景强度最高 600／300／150，DPR 上限分别为 2／1.5／1。烟雾最多 48／30／18，彩纸最多 144／80／40；减少动态偏好会进一步收敛效果。均使用批次，未创建数千个 React 粒子节点。持续低于 30 FPS 约 3 秒会降档；`?quality=low` 可直接检查低档。模拟结果不能代表手机实机性能。

## 浏览器验收

最新结果见 [cake-refinement.md](../docs/cake-refinement.md)；首次实现的历史记录见 [acceptance-stage-1.md](../docs/acceptance-stage-1.md)。测试使用真实本机 Chrome，通过 Playwright 操作原生按钮、拖动与触摸。机器可通过 `NODE_PATH` 使用 Codex 自带 Playwright；其他机器请先在可用环境中安装 Playwright。

```powershell
# 可选：安装验收脚本所需依赖（不写入项目锁文件）
npm install --prefix ../.qa-tools --no-save playwright
$env:NODE_PATH = (Resolve-Path ../.qa-tools/node_modules).Path
# 安装 Chromium；Windows 上也可直接使用已安装的 Chrome
& ../.qa-tools/node_modules/.bin/playwright install chromium ffmpeg
# 在另一个终端保持 pnpm build / pnpm preview 运行
node scripts/verify-browser.cjs
node scripts/verify-stage-two.cjs
node scripts/verify-assembly.cjs
node scripts/verify-layer-editor.cjs
node scripts/verify-stage-three.cjs
node scripts/verify-cake-switch.cjs
node scripts/concept-shots.cjs
```

脚本均可配置 `CHROME_PATH`、`QA_URL`、`QA_OUTPUT`。详见 [换电脑接续说明](../docs/CONTINUE-HERE.md)。脚本保存实际浏览器截图及 `results.json`，检查五次重播、暂停与恢复、旋转、自动旋转冷却、小屏布局、触摸、低档及减少动态偏好。开发环境或 URL 带 `?qa=1` 时提供只读 `window.__GALAXY__` 验收信息。

第三阶段本机实现及 Supabase 接入说明见 [stage-three.md](../docs/stage-three.md)；目前不连接真实云端，也不伪造可跨设备分享的 localhost 链接。手机模拟结果不能替代 iPhone／安卓真机测试。生产验收期间不要重新构建；使用不同的 `QA_OUTPUT` 保留历史证据。暂停冻结场景，主动编辑时换款／点燃过渡仍会完成。弹窗支持 Escape 和焦点限制，设置分类支持方向键。
