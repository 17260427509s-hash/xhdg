# 蛋糕近景与概念图细节续修

2026-11-03。用户再次要求依据同一张概念图细化蛋糕。本轮在第二阶段现有功能上继续，视觉参照仍是 [photographic-reference.png](../design/photographic-reference.png)，没有重新设计界面或改变五款组合。

## 对照与修正

| 对照点 | 修改前 | 本轮修改 |
| --- | --- | --- |
| 蓝紫糕体 | 颜色均匀，像光滑涂层 | 连贯的深蓝／紫色泽、过滤的微法线和微粗糙度；补充受光的立体微糖粒 |
| 五瓣奶油花 | 五个独立的圆块，缺少褶皱 | 一体闭合曲面的五条弯曲褶皱、圆润顶部、略有不同的大小和朝向 |
| 奶油滴边 | 过宽，部分滴落拼在一起，边缘显硬 | 连续采样的 64 段截面、更疏离的滴落、按深度校准末端曲率、薄卷边 |
| 糖饰 | 金星竖立偏大；金箔像小颗粒 | 缩小并平放金星；金箔为略带折面的薄片；调整表面间距，蓝紫珠交替 |
| 蜡烛 | 光滑圆柱外面绕一根线 | 蜡体本身具有连续旋纹，顶部微凹蜡池和细金色底托 |
| 光照与接触 | 浅色材质偏平，阴影边缘生硬 | 降低均匀填充，增加褶皱接触遮蔽，使用 Three.js 原生 VSM 柔影和暖色薄层近似；降低托盘清漆和环境反射，收敛侧看时的过亮光斑 |

微糖粒使用实例化几何，全糕共享最多 1200 粒；其他款式密度降低，随逐层颜色、轮廓、层级和换款过渡。金箔与星砂继续独立表现，GPU Points 预算和 DPR 上限没有改变。不使用概念图、照片或视频替代实时模型。未增加应用依赖、修改锁文件或开展第三阶段。

阴影仅在入场、换款、部件展开合拢、配置／质量改变及动画结束后的收尾帧更新；普通旋转沿用同一世界空间阴影。没有恢复历史上弃用的 PCSS shader 注入。使用原生 VSM 会多一张阴影模糊纹理，检查资源是否随多轮操作增长。

## 画面证据

本轮各次修订和失败尝试独立保留在 `qa-pastry-photographic-20261103/`。**最终画面和换款证据为 `final-delivery/`；完整回归为 `finished-*`。`round-*`、`current`、`release*` 是过程版本，`finished/` 保留最后托盘反射调整之前的画面。** 上一轮基线 `qa-cake-refinement-final*` 不覆盖。

- [原尺寸桌面](qa-pastry-photographic-20261103/final-delivery/desktop-default.png)、[糕体与奶油近景](qa-pastry-photographic-20261103/final-delivery/pastry-detail.png)。
- [概念图／修改前／本轮对照](qa-pastry-photographic-20261103/pastry-comparison-final.png)：三张图使用同一 500×380 原像素范围裁切，未放大或修图。
- [蓝糕斜侧面](qa-pastry-photographic-20261103/final-delivery/galaxy-oblique.png)、[草莓近景](qa-pastry-photographic-20261103/final-delivery/strawberry-detail.png)、[水晶近景](qa-pastry-photographic-20261103/final-delivery/crystal-detail.png)。
- 五款全图：[蓝](qa-pastry-photographic-20261103/final-delivery/preset-galaxy.png)、[粉](qa-pastry-photographic-20261103/final-delivery/preset-strawberry.png)、[白](qa-pastry-photographic-20261103/final-delivery/preset-cream.png)、[紫](qa-pastry-photographic-20261103/final-delivery/preset-purple.png)、[爱心](qa-pastry-photographic-20261103/final-delivery/preset-heart.png)。
- 手机展开：[375](qa-pastry-photographic-20261103/final-delivery/mobile-375-exploded.png)、[390](qa-pastry-photographic-20261103/final-delivery/mobile-390-exploded.png)、[412](qa-pastry-photographic-20261103/final-delivery/mobile-412-exploded.png)；同目录保留观看及合拢状态。
- 实际录屏：[合拢换款](qa-pastry-photographic-20261103/final-delivery/switch-assembled.webm)、[悬浮拼换](qa-pastry-photographic-20261103/final-delivery/switch-exploded.webm)。

## 验证

验证路径：开启星河 → 暂停与旋转近看 → 打开蛋糕面板 → 五款连续切换、快速连点及分层定制 → 完成合拢 → 许愿、吹灭、重播。手机覆盖 390×844、375×667、412×915；桌面 1585×992。

先通过应用内浏览器重新加载并实际操作，再用仓库既有 Playwright 脚本访问生产预览 `http://localhost:4173/?qa=1` 固定视口、采样真实动画帧和录屏。Browser plugin 未列出；应用内浏览器使用 CUA，固定视口回归沿用既有 Playwright。Chrome 156.0.8078.80。测试串行执行，等待完整构建完成后再开始，测试期间不替换产物。

| 检查 | 结果证据 |
| --- | --- |
| 换款、无模型标签、预算、资源、三种手机、真实录屏 | [换款专项](qa-pastry-photographic-20261103/final-delivery/switch-results.json) |
| 页面身份、非空白、无 Vite 错误层、暂停、旋转、重播、性能分档 | [基础回归](qa-pastry-photographic-20261103/finished-regression/results.json) |
| 数字蜡烛、配置、许愿、吹灭、烟雾和彩纸 | [第二阶段](qa-pastry-photographic-20261103/finished-stage-two/stage-two-results.json) |
| 三形状 × 三层数、展开与合拢、守卫 | [分层组合](qa-pastry-photographic-20261103/finished-assembly/results.json) |
| 面板选层、实际像素改色、撤销重做、删层恢复 | [逐层编辑](qa-pastry-photographic-20261103/finished-layers/results.json) |

构建命令 `pnpm build` 包含 TypeScript 检查；保留既有大包提示。shader／ANGLE 编译 warning 原样保存在 JSON，不将无 error 写成无 warning。一次早期验证在构建尚未结束时启动，预览请求失败，已纠正执行顺序后重新验证，原记录保留为 `build-race-initial-attempt.json`。

69 项完整回归全部通过：11 项换款、14 项基础、20 项第二阶段、11 项分层组合、13 项逐层编辑。最终仅收敛托盘高光后，再构建并重跑 11 项换款专项、五款截图、三种手机和实录，全部通过，结果另存 `final-delivery/`。最终入口为 `index--Xbu0dDQ.js`；最终换款五轮同样稳定在 66 几何体／47 纹理，无 page／console error。

完整回归中 25 次换款的五轮资源稳定在 66 几何体／47 纹理，默认五轮重播为 58／42，数字蜡烛为 72／46。短时采样桌面待机约 59.74 FPS、高潮约 54.39 FPS，390 模拟手机约 59.93／54.07 FPS，均非实机结论。

## 视觉边界

已直接查看概念图、最终桌面、近景和旋转图，逐项对照上述六处；页面文案与控件没有新增。五瓣花是用户在后续方案中明确保留的造型，因此不恢复概念图里的螺旋尖顶裱花。第二阶段设置入口也继续保留。

本轮改善了可见的形体、表面及受光细节，但奶油散射与部分反射仍是实时近似，不能宣称与概念图逐像素一致。功能验证与视觉判断分别记录；电脑模拟手机不代表 iPhone／安卓实机性能。
