/* Supabase SDK -> loopback HTTP fixture -> real PostgreSQL/RLS -> isolated viewer.
   This is a local integration test, NOT a deployed Supabase or public website.
   See docs/stage-three.md for the isolated fixture build command. */
const {chromium}=require('playwright'),sharp=require('sharp')
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const {startFixture}=require('./fixtures/gift-server.cjs')
const jsQR=require(path.resolve(__dirname,'../../.qa-tools/node_modules/jsqr'))
const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-stage-three-protocol'),url='http://127.0.0.1:4174'
fs.mkdirSync(out,{recursive:true})
const report={testedAt:new Date().toISOString(),url,backend:'Loopback Supabase HTTP protocol fixture with PGlite PostgreSQL/RLS; emulated identity; no real cloud account',checks:{},errors:[],warnings:[]}
const save=()=>fs.writeFileSync(path.join(out,'protocol-results.json'),JSON.stringify(report,null,2))
const watch=p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())})}
const state=p=>p.evaluate(()=>window.__GALAXY__)
const dlg=p=>p.getByRole('dialog'),button=(p,name)=>dlg(p).getByRole('button',{name,exact:true})
const settle=p=>p.waitForFunction(()=>!window.__GALAXY__.switching&&!window.__GALAXY__.assembling&&!window.__GALAXY__.lighting)
async function enter(p){await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='idle');await p.waitForTimeout(500)}
async function gift(p){await p.getByRole('button',{name:'保存与分享',exact:true}).click();await p.getByRole('heading',{name:'保存与分享',exact:true}).waitFor()}
let fixture,browser
;(async()=>{
 fixture=await startFixture()
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']})
 report.browser=await browser.version()
 const creator=await browser.newContext({viewport:{width:1585,height:992}}),p=await creator.newPage();watch(p)
 await p.goto(url+'/create?qa=1');await p.getByRole('button',{name:'定制这份生日祝福',exact:true}).click()
 await p.getByLabel('寿星昵称',{exact:true}).fill('云端协议测试');await p.getByLabel('生日祝福',{exact:true}).fill('愿每一个心愿，都有星河回应。')
 await p.getByLabel('发送人',{exact:true}).fill('独立测试发送人');await button(p,'完成').click();await enter(p)
 await p.getByRole('button',{name:'蛋糕',exact:true}).click();await settle(p);await button(p,'紫色梦境').click();await settle(p);await button(p,'完成').click();await settle(p)
 await gift(p);assert.equal(await button(p,'生成专属观看链接').isEnabled(),true)
 await button(p,'生成专属观看链接').click();await dlg(p).getByLabel('这份礼物的观看链接',{exact:true}).waitFor()
 const link=await dlg(p).locator('#gift-link').inputValue(),id=new URL(link).pathname.split('/').at(-1)
 assert.match(link,/^https:\/\/gift\.example\.test\/birthday\/[0-9a-f-]{36}$/)
 report.shareUrl=link;assert.equal(await button(p,'当前礼物已生成链接').isEnabled(),false);report.checks.publishThroughSdkAndOwnerRls=true
 await button(p,'完成').click();await p.reload();await enter(p);await gift(p)
 assert.equal(await dlg(p).locator('#gift-link').inputValue(),link);assert.equal(await button(p,'当前礼物已生成链接').isEnabled(),false);report.checks.publishedLinkAndPublisherSessionSurviveReload=true
 await p.screenshot({path:path.join(out,'published-gift-panel.png')})
 const snapshot=structuredClone((await state(p)).config),draftBefore=await p.evaluate(()=>localStorage.getItem('galaxy-cake:draft:v1'))
 const [download]=await Promise.all([p.waitForEvent('download',{timeout:45000}),button(p,'生成分享卡片').click()]);await download.saveAs(path.join(out,'card-with-qr.png'))
 await p.getByText('图片已生成，可下载或长按下方预览保存。',{exact:true}).waitFor()
 const qr=await sharp(path.join(out,'card-with-qr.png')).extract({left:886,top:1510,width:224,height:224}).ensureAlpha().raw().toBuffer({resolveWithObject:true})
 const decoded=jsQR(new Uint8ClampedArray(qr.data),qr.info.width,qr.info.height)
 assert.equal(decoded?.data,link);report.checks.realShareCardQrDecodesToGiftLink=true
 const other=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1.5,isMobile:true,hasTouch:true}),viewer=await other.newPage();watch(viewer)
 const beforeRequests=fixture.requests.length
 await viewer.goto(url+`/birthday/${id}?qa=1`);await viewer.getByRole('button',{name:'开启星河',exact:true}).waitFor()
 assert.deepEqual((await state(viewer)).config,snapshot)
 assert.equal(await viewer.evaluate(()=>localStorage.getItem('galaxy-cake:draft:v1')),null)
 assert(!fixture.requests.slice(beforeRequests).some(r=>r.path.startsWith('/auth/')))
 assert.equal(await viewer.locator('.editor-controls button,.intro-edit').count(),0)
 report.checks.isolatedViewerLoadsDatabaseRecordWithoutPublisherIdentity=true
 await enter(viewer);await viewer.screenshot({path:path.join(out,'isolated-viewer-mobile.png')})
 await viewer.getByRole('button',{name:'开启生日惊喜',exact:true}).click();await viewer.getByRole('button',{name:'我许好愿了',exact:true}).click();await viewer.getByRole('button',{name:'吹灭蜡烛',exact:true}).click();await viewer.waitForFunction(()=>window.__GALAXY__?.phase==='message')
 assert.equal(await viewer.getByRole('button',{name:'保存与分享',exact:true}).count(),0);report.checks.remoteViewerWishAndBlowoutWorks=true
 await button(p,'完成').click();await p.getByRole('button',{name:'祝福',exact:true}).click();await settle(p)
 await p.getByLabel('寿星昵称',{exact:true}).fill('修改后的草稿');await button(p,'完成').click();await settle(p);await p.waitForTimeout(400)
 await viewer.reload();await viewer.getByRole('button',{name:'开启星河',exact:true}).waitFor();assert.equal((await state(viewer)).config.recipient,snapshot.recipient)
 assert.notEqual(await p.evaluate(()=>localStorage.getItem('galaxy-cake:draft:v1')),draftBefore);report.checks.publishedGiftDoesNotChangeWithLaterEdits=true
 await gift(p);assert.equal(await dlg(p).getByLabel('上次分享的链接（与当前草稿不同）',{exact:true}).count(),1)
 await button(p,'撤回此分享链接').click();await button(p,'确认撤回此链接，收到的人将无法再打开').click()
 await p.getByText('链接已撤回，收到的人将无法继续打开。',{exact:true}).waitFor()
 await viewer.reload();await viewer.getByRole('alert').waitFor();assert.match(await viewer.getByRole('alert').innerText(),/不存在|撤回/);assert.equal(await viewer.locator('canvas').count(),0)
 await viewer.screenshot({path:path.join(out,'revoked-viewer.png')});report.checks.ownerRevocationStopsOtherBrowserReading=true
 report.requests=fixture.requests
 assert.equal(report.errors.length,0);report.checks.consoleNoErrors=true
 save();await browser.close();await fixture.close();console.log('LOCAL CLOUD PROTOCOL PASSED',report.checks)
})().catch(async error=>{report.failure=error.stack;if(fixture)report.requests=fixture.requests;save();console.error(error);await browser?.close();await fixture?.close();process.exitCode=1})
