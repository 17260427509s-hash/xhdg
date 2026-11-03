# 换电脑继续：先读这里

## 2026-11-04 第三阶段最新接续

用户已授权第三阶段，并确认先完成代码和本机验收、稍后再接云端；完成后上传本仓库供另一台电脑继续。最新实现、证据、启动和可复现命令先读 [stage-three.md](stage-three.md)，再读 [独立 Supabase 接入](../galaxy-cake/supabase/README.md)。

已加入草稿自动保存／刷新恢复、原创音乐、高清 PNG、分享卡片、制作与只读观看路由、Supabase SDK 与 RLS 脚本。当前没有真实云端项目或公网部署；不得把本机协议联调说成已上线。音频已在仓库，运行无需 Python。

换电脑按原固定 pnpm 命令启动，`pnpm install --frozen-lockfile` 后 `pnpm dev`。本机无云端配置也可使用草稿、音乐、导出和预览。浏览器草稿及会话不上传 Git，不能靠克隆同步个人草稿。

下方第二阶段记录保留历史，其中“第三阶段未实施”“刷新默认”等说明已被本节替代。五瓣奶油花、无模型标签、实时 3D 及已有换款仍要保留。

2026-11-03 后续蛋糕近景精修：五瓣褶皱、连续滴边、蓝紫微表面、实体糖粒、薄金箔与蜡体旋纹，最新对照和证据见 [蛋糕视觉续修](pastry-photographic.md)。

## 2026-11-03 最新续作

已按确认方案移除全部三维部件标签和引线，通过设置面板选层；五款使用不同糕体、奶油边和实体糖饰。合拢约 650 ms、悬浮约 750 ms 原生 morph 连续换款，最新目标排队；暂停时主动编辑仍完成。逐层定制、40 步撤销／重做与许愿吹灭保留。最新实现、原尺寸截图、两种换款实录与验收见 [cake-refinement.md](cake-refinement.md) 及 `qa-cake-refinement-final*`。下方早期记录保留历史；旧文档里的“点击场景标签”已取消。

更新日期：2026-11-02。仓库：https://github.com/17260427509s-hash/xhdg 。本次资料提交包含之前未推送的视觉精修、五瓣奶油花、第二阶段及最新分层编辑源码和截图。

## 最新用户要求与当前结果

用户要求第二阶段，并确认参考视频中的两种效果都要：编辑时部件分层悬浮；换款时形状、层数、装饰组合变化。已在原应用增量实现，见 [assembly-editor.md](assembly-editor.md)。本机外层生日网站没有修改，所有运行时 3D 均真实渲染。

**用户明确否决连续螺旋裱花，必须保留低矮圆润的五瓣奶油花。不要根据历史文档恢复螺旋堆叠。**

五款、颜色、数字蜡烛、寿星和祝福、星河主题／强度／速度、许愿确认、吹灭烟雾、三维爆发和彩纸均已实现。编辑中可拖动、分层／合拢预览，完成后合拢；支持三种形状、三种层数及组合灵感。暂停时主动编辑过渡仍可完成，场景时间保持冻结。

第三阶段尚未实施：音乐、localStorage、分享查看页、Supabase、截图导出和分享卡片。刷新恢复默认，会话内重播保留配置。功能通过不等于摄影级视觉通过，模拟手机不能作为实机性能结论。历史文档里“第二阶段未开始”“不要加入设置”等边界已被用户最新要求更新。

## 启动方法

使用兼容 Vite 7 的 Node.js（建议 Node.js 24 LTS）和固定 pnpm 11.25.0，不升级依赖或重写锁文件。

```powershell
npm install -g pnpm@11.25.0
git clone https://github.com/17260427509s-hash/xhdg.git
cd xhdg/galaxy-cake
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://localhost:5173/ 。生产验收单独 `pnpm build` 后 `pnpm preview`，地址 http://localhost:4173/ 。测试期间不要再次构建替换产物。已有副本先保留修改，再 `git pull --ff-only`。

无需 `.env`、数据库、账号、密钥或后端。安装目录、构建产物、日志和外层生日网站不迁移。

## 开始工作前阅读

1. README.md、BRIEF.md、PLAN.md：现状、完整需求及历史第一阶段计划。
2. docs/cake-refinement.md：本轮实现和真实验收；docs/layer-editor.md、docs/assembly-editor.md、docs/stage-two.md 为历史演进。
3. design/README.md 与摄影级概念图：视觉基准；不能把概念图用作运行时替代。
4. docs/reference-analysis.md 与 reference/13437993356281919.mp4：完整视频和原分析；本次用户已要求分层编辑，原分析里“不采用拆分编辑”的取舍已被更新。
5. docs/qa-cake-refinement-final*：最新截图、录屏与数据。旧 qa-* 目录保留，不作为最新画面。

## 代码入口

- store/birthdayStore.ts：五款、形状、层数、主题、输入校验。
- utils/cakeAssembly.ts：层级尺寸与高度、蜡烛安装点和编辑分离位移；utils/cakeShape.ts：圆／圆角方／爱心轮廓。
- three/Cake.tsx、pastryGeometry.ts、pastryMorph.ts、pastryMaterials.ts、cakeRecipes.ts：原生几何 morph、配方、精细材质与五瓣花；utils/cakeTransition.ts：共享层级及蜡烛姿态。
- three/Flame.tsx、Particles.tsx、CandleGlow.tsx：火焰、火星、光池跟随当前层数和编辑位移。
- experience/engine.ts：统一时钟和 GSAP 时间线，状态机、编辑展开合拢、连续换款队列、冲突操作守卫及性能分档。
- components/SettingsPanel.tsx：观看时为可继续拖动场景的非模态设置，开场设置与许愿仍为模态；Escape 可关闭。
- scripts/verify-cake-switch.cjs、verify-layer-editor.cjs、verify-browser.cjs、verify-stage-two.cjs、verify-assembly.cjs：换款实录、面板选层与真实浏览器回归。

## 下一步与工作记录

后续先复现当前代码，记录浏览器、视口、构建方式、修改前后截图和实际通过／未通过项目，再作定向改动。重点仍是摄影级材质与反射自然度、旋转角度的高光控制、手机实机性能与软键盘布局。不要重新生成简化圆柱版，也不要未经用户要求开展第三阶段。

测试脚本可通过 CHROME_PATH、QA_URL、QA_OUTPUT 指定浏览器、地址和新的独立证据目录。Playwright 的隔离安装方法见 galaxy-cake/README.md。不要覆盖历史证据；不要把合成负载／模拟可见性测试写成真实手机压力测试。
