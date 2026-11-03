# 参考视频分层编辑与组合切换

> 历史记录：最新无标签、连续 morph 换款与精细糕体见 [cake-refinement.md](cake-refinement.md)。本文所述旧场景标签与缩放淡出换款已被替换，截图保留为历史。

2026-11-02。用户确认两种效果都要：编辑时部件悬浮分离，换款时形状／层数／装饰一起变化。已在第二阶段代码基础上增量完成。

- 编辑时糕体、奶油、糖饰、蜡烛分开；“分层预览／合拢预览”可切换，完成自动合拢。编辑视口与面板分开，保留拖动旋转。
- 圆形、圆角方形、爱心均为真实几何，支持一至三层；五款预设包含方糕、双层和三层。“换一组灵感”同时变化款式、造型、层数，保留生日信息。
- 换款按糕体、奶油、装饰错时重组，底盘和星河保持。没有使用整张图片／视频替代，也没有复制参考网站 UI、Logo、文案或图标。
- 火焰、火星、烛芯、光池同步当前层数与编辑位移。多层分配既有糕体星砂预算，不将粒子总数简单乘以层数。
- 保留用户明确要求的低矮五瓣奶油花，继续使用统一时钟；暂停时主动编辑动画仍能完成，场景时间保持冻结。

## 实际验收

固定依赖生产构建通过；真实本机 Chrome 155.0.8059.39，在 localhost:4173 验证，未在测试期间替换构建产物。Browser plugin 未列出，使用现有 Playwright 验收工具，无新增项目依赖。

- [分层专项 11 项](qa-assembly/results.json)：展开／合拢、编辑中拖动、暂停时编辑、五预设、三形状×三层数、数字蜡烛、随机组合、完整许愿吹灭、五轮编辑资源稳定、三种手机尺寸、控制台无 error 全部通过。
- [第二阶段 20 项](qa-assembly-stage-two/stage-two-results.json) 全部通过；数字场景五轮重播均为 59 几何体／39 纹理。
- [原有 14 项](qa-assembly-regression/results.json) 全部通过；默认普通蜡烛五轮重播均为 56 几何体／39 纹理。
- 1585×992、390×844、375×667、412×915 已检查，预览与面板不重叠，无横向溢出，设置按钮至少 44 CSS px。手机为电脑模拟，未做 iPhone／安卓实机性能结论。
- 保留完整 shader 编译 warning，没有记录到控制台 error；大型 3D chunk 的构建提示仍在。功能通过与摄影级视觉通过分别记录，摄影级一致性尚未确认。

## 截图

- [编辑展开](qa-assembly/desktop-exploded.png)、[旋转后](qa-assembly/desktop-exploded-rotated.png)。
- [三层方形与数字蜡烛](qa-assembly/desktop-three-square-numbers.png)、[合拢预览](qa-assembly/desktop-editor-assembled.png)。
- [375 小屏分层](qa-assembly/mobile-375-three.png)、[390 手机分层](qa-assembly/mobile-390-exploded.png)、[完成后](qa-assembly/mobile-375-assembled.png)。

先前证据保留在 qa-stage-two、qa-polish、qa-cream-flowers 等目录。新的回归脚本 `galaxy-cake/scripts/verify-assembly.cjs` 支持 QA_OUTPUT、QA_URL、CHROME_PATH；跨电脑启动见 CONTINUE-HERE.md。
