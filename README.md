# 星河生日蛋糕

可真实交互的 React + TypeScript + Vite + Three.js / R3F 生日礼物网页。当前源码在 `galaxy-cake/`，原始视频、设计基准、锁文件及历次验收证据一并保留。

## 换电脑启动

安装 Git、Node.js 24 LTS（或兼容 Vite 7 的版本），使用项目固定的 pnpm 11.25.0：

```powershell
npm install -g pnpm@11.25.0
git clone https://github.com/17260427509s-hash/xhdg.git
cd xhdg/galaxy-cake
pnpm install --frozen-lockfile
pnpm dev
```

打开 <http://localhost:5173/>。已有克隆时先保存本机改动，再在仓库根目录 `git pull --ff-only`，随后重新安装固定依赖。生产验收：`pnpm build` 后 `pnpm preview`，打开 <http://localhost:4173/>。测试期间不要替换构建产物。

不需要数据库、账号、环境变量或 API 密钥。`node_modules` 和 `dist` 不上传，由安装和构建生成；不包含外层生日网站或其数据。

## 当前完成内容

- 实时立体蛋糕、低矮五瓣奶油花、体积火焰、三条空间星轨、分层 GPU 粒子、拖动旋转、暂停与重播。
- 五款蛋糕、颜色与星河设置、0–120 岁数字蜡烛、昵称／生日／发送人／祝福编辑。
- 许愿确认 → 吹灭 → 烟雾 → 三维星点和彩纸爆发 → 定制生日祝福。
- 参考视频所示的分层编辑：糕体、奶油、糖饰及蜡烛分开悬浮，能拖动查看；可合拢预览，完成后自动合拢。
- 圆形／方形／爱心、单层／双层／三层，以及“换一组灵感”组合变化；换款按部件错时重组，底盘与星河保留。
- 桌面侧栏与独立预览区；手机上半部预览、下半部可滚动设置，避免面板遮住主体。

## 接续资料

请先读 [docs/CONTINUE-HERE.md](docs/CONTINUE-HERE.md)，再读 [第二阶段](docs/stage-two.md)、[分层与组合修订](docs/assembly-editor.md) 和 [应用运行说明](galaxy-cake/README.md)。完整需求仍见 [BRIEF.md](BRIEF.md)，第一阶段原计划见 [PLAN.md](PLAN.md)。参考视频分析、设计图片、原始视频位于 `docs/reference-analysis.md`、`design/`、`reference/`。

## 仍需区分的验收

生产构建与真实 Chrome 操作已经完成；最新截图及 JSON 见 `docs/qa-assembly/`、`docs/qa-assembly-stage-two/`、`docs/qa-assembly-regression/`。保留全部历史证据。摄影级视觉一致性和 iPhone／安卓实机性能尚未确认通过；已有 shader warning 完整保留，未隐瞒为零警告。

第三阶段的持久保存、音乐、专属分享页面、Supabase、截图导出和分享卡片未实施。当前刷新恢复默认配置；会话内重播保留配置。
