# 生日快乐与祝福爱心开场

2026-11-05 后续更新：本页保留首版记录；最新开场已改为同一入口沿心形路径移动的祝福队列，生日文字位于爱心内部，成形后完全停住。请优先阅读 [heart-convoy.md](heart-convoy.md)，不恢复下文旧版短距离淡入及呼吸效果。

2026-11-05。用户确认采用浅粉奶油色、祝福卡片组成爱心、完成后点击进入蛋糕。当前修改基于本机 `2104720`，保留动态变色星空、合拢编辑和原有礼物功能，不修改外层生日网站。

## 动画与交互

打开 `/`、`/create`、`/preview` 或已加载礼物数据的 `/birthday/:id` 后，先显示中英文生日快乐与昵称；1.2 秒开始汇聚祝福卡片，最后一张约 5.8 秒就位；5.8–6.5 秒显示中央定制祝福与进入按钮。桌面 48 张、手机 32 张，均为真实 DOM 文字卡片，按照心形曲线固定排列，不使用截图或视频替代。

卡片使用原创短祝福及奶白、淡粉、浅紫、薄荷、淡金色。没有复制参考网站的窗口标题栏、关闭图标、字体素材或按钮布局。中央卡显示现有昵称、祝福和发送人，长内容在卡片内部滚动；无新增批量祝福编辑功能。

爱心完成后停留，只轻微呼吸；“跳过开场”立即显示完整爱心，不直接进入蛋糕。点击“开启星河”后开场 0.7 秒淡出，现有蛋糕从 0.8 秒开始显现，继续原有入场、许愿、吹灭与庆祝。重播仅重播蛋糕，刷新重新播放开场。静音偏好保留，未点击进入前不创建或播放音频。

定制面板打开、页面后台时冻结开场，关闭／返回继续；减少动态效果模式直接显示完整爱心，不飞入、不呼吸，进入淡出缩短至 0.2 秒。只读模式隐藏定制入口。

## 实现与兼容

独立 `BirthdayOpening` 管理 DOM 与暂停的 GSAP 时间线，`openingCards` 计算确定性的爱心位置。时间线由原有 `ExperienceEngine.tick` 的 `openingTime` 驱动，通过开场帧订阅刷新，不新增 RAF、Interval 或 setTimeout。只在标题／汇聚／完成阶段改变 React 状态，每帧不重新渲染卡片。

主状态仍为 `intro → entering → idle`，新增内部 `OpeningStage` 与只读 QA 时间信息；生日配置、草稿版本、Supabase 数据格式及公共路由不变。没有新增依赖或改动锁文件。开场退出后销毁 DOM 时间线及帧订阅。

## 参考对照与验收

重新提取并查看了原视频 1、3、5、7、9、11 秒画面，对照以下五点：生日文字先出现、卡片按顺序填满爱心、中央祝福后出现、完成后等待点击、进入后切换深色蛋糕。保留视频的产品逻辑和动画节奏，卡片外观及文字布局按已确认方案原创设计。检查桌面、手机的配色、标题字形、轮廓、层叠关系、阅读区域和入口间距；修正了桌面爱心上缘与标题昵称过近的问题。

本机 `localhost:4173` 被外层服务占用，本轮独立生产预览使用 `http://localhost:4174/`，未停止或改动外层服务。开发地址仍为 `http://localhost:5173/`。构建完成后运行专项脚本，验收期间不再次替换产物。

应用内浏览器 `createBrowserTab` 30 秒超时，转用现有隔离 Playwright 与本机 Chrome，未安装新测试依赖。原尺寸桌面 1585×992；手机模拟 390×844、375×667、412×915。后台检查通过模拟浏览器 visibility API 事件触发现有监听器，不声称是手机或操作系统实机测试。

复现命令（需现有 Playwright 环境；不属于产品运行依赖）：

```powershell
pnpm build
pnpm preview --port 4174 --strictPort
# 在另一个终端执行，QA_URL 可更换为实际预览地址
node scripts/verify-birthday-opening.cjs
```

结果见 [专项 JSON](qa-birthday-opening-20261105/results.json)，实际截图见 [标题](qa-birthday-opening-20261105/desktop-title.webp)、[汇聚](qa-birthday-opening-20261105/desktop-forming.webp)、[爱心](qa-birthday-opening-20261105/desktop-heart.webp)、[进入蛋糕](qa-birthday-opening-20261105/desktop-cake.webp)、[手机](qa-birthday-opening-20261105/mobile-390-heart.webp)、[长祝福](qa-birthday-opening-20261105/mobile-375-long-text.webp)；[浏览器操作录屏](qa-birthday-opening-20261105/opening-and-cake.webm) 为实际运行记录。

最终生产构建通过，入口 `index-BOb1e2ry.js`，专项 **14 项通过**，无运行时 console error 或 pageerror。测试包含桌面完整动画、暂停定制、后台监听器模拟、双击防重复进入、静音与点击后播放、动态星空改色／暂停、许愿吹灭、五轮蛋糕重播、三手机尺寸及长文本、刷新恢复／跳过、只读预览和减少动态效果。五轮重播没有资源持续增长，详细计数在 JSON 的 `replays` 中。保留既有 ANGLE shader 编译 warning 与 Three.js 大分包构建提示，没有把“无 error”说成“无 warning”。

另在 `http://localhost:5173/create?qa=1` 实测开发环境 Strict Mode：开场时钟推进、手机 32 张卡片、跳过后完整显示及进入蛋糕均通过，无 pageerror。

功能验收与摄影级蛋糕一致性仍分开记录；未连接真实 Supabase 或发布正式网站。换电脑继续按 [CONTINUE-HERE](CONTINUE-HERE.md) 安装固定依赖，个人浏览器草稿不会随 Git 同步。
