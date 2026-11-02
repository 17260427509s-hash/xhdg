# 第二阶段：款式、定制与许愿吹蜡烛

后续用户已追加确认“参考视频的分层编辑与组合切换两种都要”，最新源码、截图和重跑结果以 [assembly-editor.md](assembly-editor.md) 为准。以下是第二阶段首次完成时的历史记录，尚未提交／推送的描述为当时状态；本次资料提交已包含这些内容。

日期：2026-11-02，Asia/Shanghai。用户明确要求继续第二阶段，范围以 BRIEF 第二阶段十项为准。在原应用上增量实现，外层生日网站未修改，无新增运行依赖、后端或公共 API；pnpm 固定 11.25.0，依赖清单和锁文件未变。本轮修改尚未提交／推送。

## 已实现

| 体验 | 真实实现 |
| --- | --- |
| 五款蛋糕 | 星河蓝、草莓粉、奶油白、紫色梦境、情侣爱心；立体草莓、金星、水晶糖、爱心糖饰；爱心款实际修改糕体和奶油轮廓，不是平面图 |
| 款式切换与颜色 | 约 0.64 秒淡出缩小／淡入放大；内置色和自选色实时修改材质；修复换款时实例化奶油花变换丢失 |
| 年龄蜡烛 | 普通蜡烛或真实挤出数字，0–120 岁，每个数字均有烛芯和独立体积火焰；输入越界有提示 |
| 祝福定制 | 昵称、生日、年龄、发送人、300 字以内祝福；保留换行、空名字／空祝福回退；开场即可编辑 |
| 星河设置 | 五种配色、近景强度 100–600、0.5／1／1.5 倍速度、漂浮星点开关；受设备档位上限约束 |
| 许愿与吹灭 | 必须先确认许愿才能吹灭；取消后清除确认；火焰摇摆淡出、暖光和星河减弱、烟雾升起、停顿后庆祝 |
| 立体庆祝 | 原中心星点爆发，加四批实例化长方形／方块／星星／爱心彩纸；随机方向、旋转、重力及透明度衰减，结束后隐藏 |
| 设置 UI | 桌面右侧悬浮设置、手机底部抽屉，四类设置；原生 modal dialog 的焦点限制和 Escape，分类支持左右键 |

**保留用户已确认的低矮五瓣奶油花，未恢复螺旋堆叠。** 统一状态为 `intro → entering → idle → wishing → blowout → celebration → message`，不引入大量 setTimeout。场景暂停、隐藏标签页冻结与重播沿用统一时钟。暂停时允许主动编辑；换款与点燃的明确操作过渡仍可完成，其他场景运动保持冻结。

重播保留会话配置，刷新恢复默认。音乐、localStorage、分享模式、Supabase、高清截图和分享卡片仍属第三阶段，未实现。

## 生产浏览器验收

先执行 `pnpm build`，TypeScript 与 Vite 构建通过；使用本机 Chrome 155.0.8059.39 访问 `http://localhost:4173/?qa=1`。测试过程中没有替换构建产物。Vite 仍提示大型 3D chunk，不是构建失败。

[第二阶段原始结果](qa-stage-two/stage-two-results.json)：20 项专项检查通过，控制台 error 和 pageerror 为零。

[原有 14 项功能回归](qa-stage-two-regression/results.json) 同样全部通过：暂停／恢复、暂停下手动旋转、五秒自动旋转冷却、五轮重播、三种手机布局与触摸、低档、减少动态效果、隐藏页面监听、合成负载自动降档和 WebGL 不可用回退。默认普通蜡烛场景五轮均为 55 个几何体／39 个纹理。隐藏页面和低帧率检查包含合成触发，不能写成真实手机压力测试。

- 五种款式实际点击切换，保留渐变过渡；冻结场景下改色后比较真实渲染像素，确认不是只改配置。
- 检查数字 0／18／120、越界 999、火焰开关、姓名／日期／发送人／换行祝福、300 字限制。
- 点击五种主题，验证强度修改实际预算、开关、1.5 倍星河时钟；许愿取消后重新确认。
- 连续五轮完整许愿→吹灭→庆祝→重播：数字蜡烛场景每轮 58 个几何体、39 个纹理，资源数未增长。吹灭后火焰为零；烟雾和彩纸在寿命结束后为零。
- 1585×992、390×844、375×667、412×915：控制栏按钮至少 44 CSS px，无横向溢出，四类设置均可打开关闭，底部抽屉在视口内。手机爱心与数字蜡烛不裁切。
- 手机近景上限 300；低档近景上限 150、DPR 1；减少动态偏好可完成完整流程。

专项采样：桌面庆祝约 55.6 FPS，手机模拟空闲约 59.8 FPS。采样来自当前电脑的 Chrome，不能当作 iPhone／安卓真机性能结论。原始帧间隔及各按钮尺寸保留在 JSON。

首次 GPU 编译仍出现两条 WebGLProgram warning，完整保留在结果中：ANGLE 的梯度循环／精度与除零编译诊断；没有捕获到控制台 error、着色器编译失败或黑屏。不能称为“零警告”，后续可独立处理这组历史 shader 诊断。

## 实际截图与视觉边界

- [星河蓝](qa-stage-two/cake-galaxy.png)、[草莓粉](qa-stage-two/cake-strawberry.png)、[奶油白](qa-stage-two/cake-cream.png)、[紫色梦境](qa-stage-two/cake-purple.png)、[情侣爱心](qa-stage-two/cake-heart.png)。
- [数字 18](qa-stage-two/number-candles-18.png)、[高潮彩纸](qa-stage-two/celebration.png)、[定制祝福](qa-stage-two/birthday-message.png)。
- [375×667 爱心数字款](qa-stage-two/mobile-375-heart.png)、[390 手机设置](qa-stage-two/mobile-390-settings.png)、[手机庆祝](qa-stage-two/mobile-celebration.png)。

已实际查看截图：花瓣在各款中保留，数字与火焰连接，爱心糕体具有立体轮廓，星轨前后穿插，正文和主按钮可辨读。当前奶油／糖饰仍具有程序化造型特征，不能因功能通过就判定摄影级概念图一致性通过；下一轮视觉工作应保留第二阶段交互和无螺旋约束。手机键盘弹起和真实性能仍需实机验收。

另在 [原尺寸与旋转检查](qa-stage-two-visual/final-visual-check.json) 保存默认款 1585×992、390×844、冻结火焰正面／斜侧面及最终祝福截图：[桌面](qa-stage-two-visual/desktop-native.png)、[斜侧面](qa-stage-two-visual/oblique.png)、[手机](qa-stage-two-visual/mobile-390.png)。拖动后可看到糕体、蜡烛和轨道的立体关系，最终祝福后可正常重播；无控制台 error，首次编译 warning 如上保留。

## 复现

在 `galaxy-cake/` 使用固定依赖安装和构建，另一个终端运行 `pnpm preview`。Playwright 安装方法见应用 README。

```powershell
$env:QA_OUTPUT='../docs/qa-stage-two'
node scripts/verify-stage-two.cjs
$env:QA_OUTPUT='../docs/qa-stage-two-regression'
node scripts/verify-browser.cjs
$env:QA_OUTPUT='../docs/qa-stage-two-visual'
node scripts/concept-shots.cjs
```

保留旧验收目录，不覆盖历史截图。验收 getter 只读，测试通过真实按钮和输入框操作，无强制改写状态跳过许愿流程。
