# 动态变色星空

2026-11-05，基于 `7acb160` 继续现有应用。最新用户要求：背景跟随蛋糕颜色、星空可以动；完成后同步 xhdg 供另一台电脑修改。

## 用户可见变化

- 蛋糕预设、自定义糕体颜色、各层独立改色、撤销／重做及恢复草稿都会改变星空色调。多层蛋糕按可见层的宽高权重混色，换款时随实体过渡。
- 摄影式星系底片缓慢漂移、旋转与呼吸缩放，叠加实时远星微动／闪烁及云雾流动。背景中没有蛋糕、蜡烛、轨道或 UI。
- 暂停冻结背景运动，继续后平滑恢复；暂停中主动修改蛋糕颜色仍会更新背景。减少动态效果时关闭背景漂移。星河速度和庆祝能量仍由统一时钟管理。
- 手机画布之外的背景与场景内背景共享颜色矩阵、裁切及变换，打开设置时保持连续。高清 PNG 直接渲染同一背景，没有额外图片合成假蛋糕。
- 保留合拢编辑、低矮五瓣奶油花、既有五款／逐层编辑／音乐／许愿吹灭等交互。分层预览已按用户要求移除。

## 实现与接续

`GalaxyAppearance` 保存颜色和时间状态，不拥有额外时钟；`ExperienceEngine.tick` 驱动更新。`GalaxyBackdrop` 同步 WebGL uniform 与宿主 CSS 自定义属性，`galaxyColorGLSL` 对齐显示色彩空间；`Atmosphere` 与远星 shader 复用该颜色状态。每帧不触发 React state 更新，不新增纹理、独立粒子或依赖，原有性能分档继续生效。

固定 `pnpm@11.25.0`，运行 `pnpm install --frozen-lockfile`、`pnpm dev`；生产检查单独 `pnpm build` 后 `pnpm preview`。测试期间保持构建产物不变。源代码、两张 WebP、音乐及锁文件均在仓库，不需要数据库启动本机版本。个人 localStorage 草稿不随 Git 同步。

## 验收证据

固定依赖安装及生产构建通过，最终入口 `index-NBbdNF2C.js`。生产预览地址 `http://localhost:4173/`，桌面 1585×992，手机模拟 390×844、375×667、412×915。Browser plugin 未提供，使用现有 Playwright 与本机 Chrome 155，不安装新依赖。

[动态星空专项 16 项通过](qa-living-sky-20261105/results.json)：检查实际背景像素变化、暂停冻结、颜色矩阵、手机画布／CSS 衔接、草稿和 3200×2003 PNG 导出。连续 12 次改色的几何体／纹理计数保持 77／55；低档点数仍为 2774、DPR 1。没有运行时 console error 或 pageerror；原有 ANGLE 编译 warning 单独保留。

[逐层编辑回归 13 项通过](qa-living-sky-20261105/layers/results.json)，覆盖暂停编辑、每层独立外观、撤销／重做、层数删改恢复、许愿吹灭与重播、三种手机布局及低性能分档。本轮合计 29 项通过；两套检查均使用上述同一份生产构建。

实际截图：[蓝色](qa-living-sky-20261105/desktop-blue.webp)、[粉色](qa-living-sky-20261105/desktop-pink.webp)、[奶油白](qa-living-sky-20261105/desktop-gold.webp)、[手机 390](qa-living-sky-20261105/mobile-390-pink.webp)、[手机 375](qa-living-sky-20261105/mobile-375-pink.webp)、[手机 412](qa-living-sky-20261105/mobile-412-pink.webp)、[高清导出缩略图](qa-living-sky-20261105/hd-export-preview.webp)。[浏览器实际操作录屏](qa-living-sky-20261105/living-sky.webm) 展示背景流动与换款变色，非预渲染产品素材。

此前概念对照及移除分层预览证据保留，见 [视觉差距记录](concept-fidelity-20261104.md) 和 [移除预览结果](qa-no-exploded-preview-20261104/focused-results.json)。仓库选择最终截图及测试结果；重复导出和中间试验截图只留本机存档，不覆盖原有已提交历史证据。

不把模拟视口等同手机实机性能，也不标记与摄影级概念图逐像素一致。已有 ANGLE／后期 shader 编译 warning 和 Three.js 大分包构建提示需与运行时 error 区分；尚未接入真实云端或部署公网网站。
