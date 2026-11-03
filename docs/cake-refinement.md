# 无标签蛋糕、精细糖饰与连续换款

2026-11-03 后续蛋糕近景精修：五瓣褶皱、连续滴边、蓝紫微表面、实体糖粒、薄金箔与蜡体旋纹，最新对照和证据见 [蛋糕视觉续修](pastry-photographic.md)。

日期：2026-11-03，Asia/Shanghai。在第二阶段及逐层编辑基础上增量修改。当前证据目录为 `qa-cake-refinement-final*`；同名不带 final 的目录及 `qa-cake-switch*` 是本轮中间版本，全部保留。

## 本轮实现

场景中的“糕体／花瓣奶油／生日蜡烛”等标签、引线和点击覆盖层已删除。通过“蛋糕 → 编辑范围 → 整体／第 1／2／3 层”选层，面板保留选中反馈。顶部寿星、操作栏、数字蜡烛及最终祝福继续使用。桌面右侧面板、手机底部抽屉不变。

| 款式 | 默认组合 | 当前几何与装饰 |
| --- | --- | --- |
| 星河蓝 | 单层圆形 | 薄象牙滴边、蓝紫珠、细金箔、小金星 |
| 草莓粉 | 单层圆角方形 | 扇贝奶油、立体带籽草莓、弯曲叶片、细奶油挂边 |
| 奶油白 | 双层圆形 | 圆润翻边、密细珍珠串、少量金星和细金线 |
| 紫色梦境 | 三层圆形 | 淡紫滴边、平顶切面水晶糖、逐级收小的层级 |
| 情侣爱心 | 单层爱心 | 圆润心形、珍珠边、小爱心糖与柔和挂边 |

全部保留低矮五瓣奶油花。花瓣由闭合圆润的曲面组成，细调花瓣弯曲、大小和转角；没有恢复被否决的螺旋尖顶裱花。各层造型、糕体色、奶油色和糖饰覆盖规则、40 步撤销／重做、许愿吹灭保留。

糕体使用低对比色泽、带 mipmap 的程序微凹凸、经过屏幕导数过滤的微色差；奶油薄边及滴落末端重做，接缝法线合并。金箔是受光的实体实例，发光星砂是单独的 GPU Points。草莓带独立籽粒及曲面叶片；水晶采用切面糖体；星糖、心糖具有圆滑倒角。柔光、侧面填充、环境反射与接触阴影重新校准，保留现有选择性 Bloom。

## 连续换款

- 内部 `CakeTransition` 记录源配置、目标配置、进度和显示模式，`BirthdayConfig` 对外结构兼容。
- 合拢约 650 ms；展开约 750 ms，糕体、奶油、装饰轻微错时；减少动态效果使用 180 ms。展开换完仍保持展开，点击“完成”才合拢。
- 对应糕体与奶油具有相同顶点拓扑，使用原生 position／normal morph；层宽、高、位置、颜色连续变化。新增层从顶面生长，移除层缩回顶面；不把整糕缩没或淡出。
- 不同拓扑糖饰短暂交替缩放；底盘和空间星轨不随换款消失。蜡烛、烛芯、火焰、火星、光池共用插值安装点。
- 快速点击只保留最新待执行目标，当前动画结束后执行；仅实际切换进入历史。暂停冻结空间时钟，主动编辑仍完成。换款和合拢期间保持许愿守卫。
- 全糕只保留一套表面星砂，轮廓和层级在同一批次插值，预算不乘层数，也不同时渲染两套完整蛋糕。
- 手机展开预览额外留出约 11% 镜头距离，改善 375×667 三层蜡烛上方余量，并保留用户旋转方向。

所有画面实时 Three.js / R3F 渲染，无概念图、参考视频、预渲染动画替代。未改变应用依赖或锁文件，未开展第三阶段。

## 验收方式与结果

生产构建：`pnpm build`（含 TypeScript 构建检查）。Vite 保留 Three.js 大包体积提示。浏览器测试针对生产预览 `http://localhost:4173/?qa=1`，独立输出证据，不在测试期间替换产物。先用应用内浏览器实际打开与操作，再用用户要求的既有 Playwright 脚本固定视口、逐帧采样和实录；GPU 浏览器串行执行。

| 检查 | 项数 | 最新机器记录 |
| --- | ---: | --- |
| 无标签、连续换款、快速队列、历史、暂停编辑、换款期间完成、资源、手机、低档与实录 | 11 | [换款专项](qa-cake-refinement-final/switch-results.json) |
| 基础入场、拖动、暂停、重播、高潮与性能分档 | 14 | [基础回归](qa-cake-refinement-final-regression/results.json) |
| 第二阶段配置、数字蜡烛、许愿吹灭等 | 20 | [第二阶段](qa-cake-refinement-final-stage-two/stage-two-results.json) |
| 分层展开、组合、三形状 × 三层数、编辑守卫 | 11 | [分层组合](qa-cake-refinement-final-assembly/results.json) |
| 面板选层、逐层覆盖、撤销重做、删层恢复、实际像素改色 | 13 | [逐层编辑](qa-cake-refinement-final-layers/results.json) |

最终构建五组共 **69 项全部通过**，均无记录到 page／console error。本机 Chrome 156.0.8078.80；最终 JS 入口 `index-CFgeGt8A.js`。25 次换款的五轮资源均为 63 几何体／46 纹理，默认普通蜡烛五轮重播均为 57／41，数字蜡烛五轮为 68／45。同一场景资源没有累积增长。

基础回归短时采样：桌面待机约 59.94 FPS、高潮约 53.72 FPS；390 模拟手机待机约 59.66 FPS、高潮约 54.05 FPS。原始逐帧和 FPS 数据保存在对应 JSON，不能外推为手机实机性能。

专项通过真实按钮驱动换款，采样每帧的显示进度、各层尺寸、烛芯位置和实际 GPU Points，检查糕体持续可见、安装点无跳位及预算未翻倍；不是只检查最终配置。25 次预设切换分五轮对比同一场景的几何体／纹理数量。原回归另外检查五轮重播与 20 次实际改色的资源稳定性。

视口覆盖 1585×992、390×844、375×667、412×915，检查观看、展开、合拢、面板与画布边界、横向溢出和至少 44 CSS px 按钮。手机截图以 DPR 1.5 保存，因此图片像素尺寸是模拟 CSS 视口的 1.5 倍；桌面原图 1585×992。

GPU 源点预算仍为桌面 7746、手机 5280、低档 2774；表面星砂分别 3200／1800／1000。桌面多渲染通道的 `gl.info.render.points` 可为源点的两倍，不代表两套蛋糕；专项比较同一通道配置下换款前后点数。DPR 上限 2／1.5／1 不变。

控制台 shader／ANGLE 编译 warning 原样保存在 JSON，不能写成“零警告”。本机 Chrome 的短时 FPS 与模拟触摸不代表 iPhone／安卓实机性能。

## 原尺寸截图和实录

- [默认桌面](qa-cake-refinement-final/desktop-default.png)、[展开编辑](qa-cake-refinement-final/desktop-exploded.png)、[合拢编辑](qa-cake-refinement-final/desktop-assembled-editor.png)。
- 五款：[星河蓝](qa-cake-refinement-final/preset-galaxy.png)、[草莓粉](qa-cake-refinement-final/preset-strawberry.png)、[奶油白](qa-cake-refinement-final/preset-cream.png)、[紫色梦境](qa-cake-refinement-final/preset-purple.png)、[情侣爱心](qa-cake-refinement-final/preset-heart.png)。
- 近景：[奶油与糕体](qa-cake-refinement-final/pastry-detail.png)、[草莓籽与叶片](qa-cake-refinement-final/strawberry-detail.png)、[切面糖饰](qa-cake-refinement-final/crystal-detail.png)。裁切原始浏览器截图，未放大修图。
- 旋转对照：[蓝糕斜侧面](qa-cake-refinement-final/galaxy-oblique.png)、[草莓斜侧面](qa-cake-refinement-final/strawberry-oblique.png)。
- 手机：[375 展开](qa-cake-refinement-final/mobile-375-exploded.png)、[390 展开](qa-cake-refinement-final/mobile-390-exploded.png)、[412 展开](qa-cake-refinement-final/mobile-412-exploded.png)；同目录另有各尺寸合拢及观看画面。
- 实际网页录屏：[合拢换款](qa-cake-refinement-final/switch-assembled.webm)、[悬浮拼换](qa-cake-refinement-final/switch-exploded.webm)。录屏包含打开设置及连续四次切换；未将录屏用于运行时。
- 录屏抽帧复查：[合拢联系图](qa-cake-refinement-final/assembled-contact.jpg)、[悬浮联系图](qa-cake-refinement-final/exploded-contact.jpg)。结合逐帧尺寸与烛芯跟随记录，未观察到整糕空白、蜡烛脱离或换款粒子翻倍。

## 视觉对照结论

相较上一轮，模型标签已完全移除，五款不再只是改色；奶油曲面、实体糖饰、草莓籽叶、糕体微表面及独立金箔更清晰，换款保留持续可见的糕体。已按桌面、手机、细节与旋转视角检查并修改过多轮，包括收敛过强随机噪声、调整五瓣花体积及短屏展开余量。

**功能验收与摄影级视觉分开记录。** 与 [已确认概念图](../design/photographic-reference.png) 相比，当前实时材质仍采用近似的奶油散射与环境反射，柔软通透感、微小装饰自然度及局部星光分布还有可见差异；本轮不将“摄影级一致”标记通过。所有最新原图均保留，便于直接判断实际结果。

## 接续入口

`utils/cakeTransition.ts`：共享插值姿态；`experience/engine.ts`：队列、时钟、历史；`three/pastryMorph.ts`：同拓扑与接缝；`pastryMaterials.ts`：表面；`cakeRecipes.ts`：配方；`PastryDetails.tsx`、`SidePiping.tsx`、`CakeDecorations.tsx`：实体细节；`StarSand.tsx`：单批次星砂；`scripts/verify-cake-switch.cjs`：本轮专项。三维标签相关旧脚本已改为面板选层。
