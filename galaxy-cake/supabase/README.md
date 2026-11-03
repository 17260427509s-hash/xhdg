# 第三阶段云端接入

本轮用户确认先完成代码和本机验收，稍后再接入云端。当前没有创建 Supabase 项目、运行云端迁移或部署公开网站。不要把本机测试写成真实云端已上线。

1. 使用一个独立 Supabase 项目，不接入旧生日网站数据库。
2. 在 Supabase SQL Editor 执行 `migrations/202611030001_birthday_gifts.sql`；或在已链接的 Supabase CLI 项目运行 `supabase db push`。迁移是一次性的，不要重复在已有表上执行。
3. 在 Authentication 中启用 Anonymous Sign-Ins。发布者无需注册界面；Supabase 为当前浏览器建立独立匿名身份，RLS 隔离其记录。访问者只通过 `read_birthday_gift(uuid)` 读取一个已知链接的快照，不建立发布身份。
4. 将应用 `.env.example` 复制为 `.env.local`，填入项目 URL、**publishable** 公钥及正式前端 origin。不能填 `service_role` 或 `sb_secret_*`。`.env.local` 不进 Git。重启开发服务器，生产环境重新构建。
5. 把 Vite 产物部署到正式 HTTPS origin，配置 SPA 路由回退。仓库提供 Vercel rewrite 与 Netlify `_redirects`；其他静态服务器同样将 `/create`、`/preview`、`/birthday/:id` 回退到 `index.html`。
6. 使用两个真实浏览器验证：A 发布 → B 打开 `/birthday/:id` → 没有编辑器 → 完整许愿吹灭 → A 撤回 → B 刷新后不可访问。只有完成此项，才记录为真实跨设备云端验收通过。

分享内容包含昵称、生日、年龄、发送人、祝福和蛋糕／星河配置。界面在生成前明确说明公开范围。链接使用随机 UUID；拿到链接的人可查看。公开读取 RPC 只返回经过限制的礼物 payload，不返回创建者身份；不开放表列表。发布者可读、创建、撤回自己的记录，无更新权限；修改草稿不会改变已发出的礼物。数据库校验字段、长度、颜色、层级与配置，拒绝额外 payload 字段；每个发布身份每天最多保留 20 个当日新建礼物。

匿名注册受到 Supabase Auth 的 IP 限速。正式面向公众使用前，按官方文档配置注册防滥用措施；若启用 CAPTCHA，需将获得的 challenge token 交给 `signInAnonymously`，当前无云端连接的本机版本不声称已完成生产防滥用配置。不要自动清理仍有关联礼物的匿名用户，`auth.users` 删除会级联撤回其礼物。

官方依据：[匿名登录](https://supabase.com/docs/guides/auth/auth-anonymous)、[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[API 公钥与私钥](https://supabase.com/docs/guides/getting-started/api-keys)。
