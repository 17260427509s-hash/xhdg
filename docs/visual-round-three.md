# 第三轮视觉与交互精修

2026-11-05，基于本机同步后的 `141d579`，在 `galaxy-cake` 增量修改。开发前确认工作区干净、启动 5173，并用本机真实 Chrome 操作当前页面。先完整检查桌面、12 款、蛋糕／星河面板、连续卡片开场和三种手机视口，保存本轮现场截图，随后才修改运行时代码。

## 画面与操作变化

- **星空**：保留动态背景、颜色联动和原纹理。共享显示空间的亮度／对比度及左右权重，右侧星系进一步后退；放缓漂移、远星闪烁和近景明暗变化。弱化底盘后的云雾，保留近景彩色细星与远景小星的尺寸区别。CSS 和 WebGL 使用对应的裁切、颜色及遮罩，高清导出也使用同一背景。
- **三条星轨**：重新分配倾角、椭圆短轴与高度，降低线条及大光珠亮度和速度。外圈始终处在蛋糕实体之外，前后关系由真实深度测试处理。原有顶边细光晕调暗并远离裱花；暂停时不重复上传 540 个光珠的矩阵，减少动态效果时停止轨道移动。
- **蛋糕**：低对比、经过屏幕导数过滤的微表面；降低噪点、硬清漆和过强补光。各款使用不同的粗糙度、涂层和金箔覆盖比例。滴边更宽圆、深浅有差异，保持原生 morph。五瓣花降低中心高度，保留五个圆润瓣面与自然转角，不恢复高叠螺旋。
- **糖饰与水果**：草莓细种籽及薄叶、樱桃与蓝莓顶部凹口、蓝莓柔雾表皮、倒角巧克力和芒果、切面晶糖、柔和珍珠。仍是可旋转、投影的实时几何，16 类配件及混搭规则保留。
- **光照**：降低主光和紫蓝补光，调整环境反射、接触遮蔽、蜡体及火焰颜色，减少 Bloom 对材质细节的冲淡。五瓣花保留投影和屏幕空间接触遮蔽，避免小尺寸 VSM 自阴影进一步产生条纹。
- **深色 UI**：选中款式有明确描边与勾号，同时固定无障碍名称；调整文字与图标间距、悬停和面板阴影。款式优先显示，随机灵感移至款式之后。短屏编辑抽屉为 51dvh，其他手机仍为 48dvh，首排款式名称完整可见；完成／历史操作留在固定页脚。
- **爱心开场**：加强纸卡阴影与文字对比，中央卡使用不透底的暖白纸面。实际复查发现 GSAP 的 `y` 覆盖了 CSS 百分比居中，现用外层容器定位、内层卡片做位移，避免换行后卡片偏低。保持连续队列、成形后停止、等待点击；1.05 秒纸面淡出与 .8 秒开始的蛋糕显现重叠，减少空档，减少动态效果时为 .2 秒。

没有新增运行依赖、改锁文件、重写引擎或改变 `BirthdayConfig`。12 款、16 类、三形状／三层、逐层定制、随机装饰、撤销／重做、音乐、草稿、只读预览和导出保留。未恢复分层预览，没有以 PNG 替换蛋糕，也没有新增粒子预算。

## 12 款识别点

| 款式 | 保留并复查的结构与材质 |
| --- | --- |
| 星河蓝 | 单层圆形，蓝紫星云糖霜、象牙滴边、星糖和蓝紫糖珠 |
| 草莓粉 | 圆角方形、柔软扇贝边，带细籽与薄叶的立体草莓 |
| 奶油白 | 双层圆形、卷边、细珍珠和少量金饰，更柔哑的奶油 |
| 紫色梦境 | 三层比例，淡紫奶油与新切面晶糖 |
| 情侣爱心 | 心形轮廓、花瓣边、心形糖和细珠饰 |
| 浓巧樱桃 | 浓巧滴边、倒角巧克力片、凹口樱桃、适度甘纳许反射 |
| 抹茶奶霜 | 双层哑光抹茶、奶霜卷边、马卡龙和珍珠 |
| 蓝莓慕斯 | 柔滑慕斯、薄卷边、带柔雾表皮及萼片的蓝莓、小花 |
| 芒果晴光 | 圆角方形、柔亮慕斯、倒角果块与珍珠 |
| 彩虹心愿 | 三层独立柔彩、花瓣边、实体彩虹装饰 |
| 星月夜曲 | 双层午夜蓝、雪白滴边、实体月牙、金星和珍珠 |
| 花园来信 | 心形、低矮奶油花、小花、蝴蝶和缎结，保留正反面修正 |

## 本轮证据

目录为 [`qa-visual-round-three-20261105/`](qa-visual-round-three-20261105/)，没有覆盖任何历史 QA。`before` 是修改前现场；`round-1` 保留选中勾号导致名称变化的失败；`round-2` 是中途复拍；`suite` 是第一份完整生产回归；`suite-centered` 为中央卡定位与过渡的最终补测。最终原尺寸画面以 `suite-centered/final` 为准。

- [桌面前后](qa-visual-round-three-20261105/comparisons/desktop-before-after.webp)、[手机抽屉前后](qa-visual-round-three-20261105/comparisons/mobile-sheet-before-after.webp)、[开场前后](qa-visual-round-three-20261105/comparisons/opening-before-after.webp)。
- [五瓣奶油近景对比](qa-visual-round-three-20261105/comparisons/cream-before-after.webp)、[水果近景对比](qa-visual-round-three-20261105/comparisons/fruit-before-after.webp)、[12 款前后图集](qa-visual-round-three-20261105/comparisons/twelve-before-after.webp)。对比图只是并排、裁切和等比缩放原截图，没有生成或重绘产品像素。
- 原尺寸 [1585×992 桌面运行](qa-visual-round-three-20261105/suite-centered/final/desktop-playing.webp)、[桌面蛋糕面板](qa-visual-round-three-20261105/suite-centered/final/desktop-cake-panel.webp)、[星河面板](qa-visual-round-three-20261105/suite-centered/final/desktop-sky-panel.webp)。
- 手机运行：[390×844](qa-visual-round-three-20261105/suite-centered/final/mobile-390-playing.webp)、[375×667](qa-visual-round-three-20261105/suite-centered/final/mobile-375-playing.webp)、[412×915](qa-visual-round-three-20261105/suite-centered/final/mobile-412-playing.webp)。手机截图为 DPR 1.5，文件像素大于 CSS 视口，保持原截图尺寸。
- 每款完整截图位于最终目录的 `preset-*.webp`；旋转视角见 `desktop-rotated.webp`、`mobile-*-rotated.webp` 及 `suite/catalog/oblique-*.webp`。真实换款与混搭录屏见 [catalog-and-mixing.webm](qa-visual-round-three-20261105/suite/catalog/catalog-and-mixing.webm)，星空运动录屏见 [living-sky.webm](qa-visual-round-three-20261105/living-sky/living-sky.webm)。

## 验收

最终汇总为 **95 项通过，0 项失败，0 个应用运行时 error**，见 [acceptance.json](qa-visual-round-three-20261105/acceptance.json)。构建含 TypeScript 检查，最终入口 `index-Bg3UMb_I.js`，见 [生产构建输出](qa-visual-round-three-20261105/build-final.txt)。所有 GPU 浏览器用例依次执行，性能统计不与另一套 GPU 回归并跑；最初的居中诊断在非性能用例期间短暂打开独立浏览器。

| 专项 | 通过 | 证据 |
| --- | ---: | --- |
| 最终四视口、居中、触摸与面板 | 6 | [结果](qa-visual-round-three-20261105/suite-centered/final/results.json) |
| 动态星空、真实像素冻结、颜色及手机衔接 | 16 | [结果](qa-visual-round-three-20261105/living-sky/results.json) |
| 12 款／16 类、混搭、五轮资源检查 | 11 | [结果](qa-visual-round-three-20261105/suite/catalog/browser-results.json) |
| 逐层编辑、三形状／层数、历史及许愿 | 13 | [结果](qa-visual-round-three-20261105/suite/layers/results.json) |
| 连续队列、停稳、长文本及响应式开场 | 7 | [结果](qa-visual-round-three-20261105/suite-centered/heart/results.json)、[录屏](qa-visual-round-three-20261105/suite-centered/heart/heart-convoy.webm) |
| 草稿、实际音频、高清 PNG／卡片、只读预览 | 16 | [结果](qa-visual-round-three-20261105/suite-centered/stage-three/stage-three-results.json) |
| 基础流程、性能、触摸、后台及自动降档 | 14 | [结果](qa-visual-round-three-20261105/suite/core/results.json) |
| 糖饰正反面与旋转 | 3 | [结果](qa-visual-round-three-20261105/suite/decoration-faces/face-results.json) |
| 轨道间距、五瓣低花、三档／三形状几何 | 4 | [结果](qa-visual-round-three-20261105/suite/geometry/results.json) |
| 配方、布局、旧数据与异常输入兼容 | 5 | [结果](qa-visual-round-three-20261105/suite/catalog-data/data-results.json) |

完整场景回归使用 `index-DyR08VQH.js`；随后仅修正了开场中央卡的定位容器与纸面淡出时长，未再修改渲染代码。最终构建重新执行四视口／居中／触摸、完整爱心运动和全部第三阶段保存音乐导出专项；不把较早回归写成在最终 hash 上全部重跑。源码几何及数据专项另用 Vite SSR 加载生成器，不冒充浏览器画面验收。

本机 Chrome 156 测量：桌面空闲约 59.8 FPS、庆祝约 54.7；390 模拟空闲约 59.7、庆祝约 54.7。三个手机尺寸均无横向溢出，按钮至少 44 CSS px，可滚动设置、触摸旋转；暂停时场景时钟与实际像素冻结。手机背景衔接区域的平均通道差为 1.10／3.23／0.90（0–255），均低于既有阈值 6，不宣称逐像素相同。

视觉复查以本轮截图为依据：背景明显后退，蛋糕中心更清晰，奶油滴边和微表面更柔和，手机首排款式完整显示，中央祝福不再透出大标题或在换行后偏低。12 款均保留各自实体造型／层级及默认装饰。摄影级一致性及真实手机项仍按下节保留待验证，没有用上述功能数量代替视觉结论。

几何检查对三个轨道各采样 4096 点，包围圆柱半径 1.56 已覆盖圆／圆角方／爱心及奶油外沿，扣除最大光珠后最小间距约 .325 世界单位。五瓣花三档细节均为五瓣，高约 .102、宽约 .322，高宽比约 .317。原生糕体／奶油 morph 对全部 12 款和三形状保持相同拓扑、有限坐标及法线。

五轮完整款式循环保持 98 个几何体／48 个纹理。桌面默认 `stats.points` 修改前后均为 15492，是包含后期额外绘制的点绘制统计；逻辑 GPU 点源仍为原来的 7746／5280／2774，DPR 上限 2／1.5／1，未用额外粒子掩盖画面。

复现：先 `pnpm build`、`pnpm preview --port 4174 --strictPort`，不要在生产测试中途替换 `dist`。验收工具仍使用现有 Playwright、sharp 和本机 Chrome；可按 [第三阶段说明](stage-three.md) 隔离安装，用 `NODE_PATH` 指向工具目录。

```powershell
$env:QA_URL='http://localhost:4174'
$env:QA_OUTPUT='../docs/qa-visual-round-three-new-run'
node scripts/verify-living-sky.cjs
# 再为套件指定新的证据目录，脚本拒绝覆盖已有套件结果。
$env:QA_OUTPUT='../docs/qa-visual-round-three-new-suite'
node scripts/verify-visual-suite.cjs
```

## 实际限制

- 390×844、375×667、412×915 是真实 Chrome 的模拟视口和触摸输入；没有连接真实 iPhone／安卓设备，Safari、手机 GPU／温控和软键盘仍待实机验证。
- 本轮提升了材质和构图，但奶油透光、果肉、镜面反射仍为实时近似，近景仍可见程序化特征。没有把与摄影级概念图完全一致标记通过。
- 保留 Vite 大 chunk 提示和现有 ANGLE／shader warning，具体见 JSON；不把无应用 error 写成无 warning。
