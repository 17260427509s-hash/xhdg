/* Browser plugin not available. Existing isolated Playwright; real production UI,
   local PCM playback, PNG downloads, draft restore and read-only preview. No cloud. */
const {chromium}=require('playwright'),sharp=require('sharp')
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-stage-three-local'),url=process.env.QA_URL||'http://localhost:4173'
fs.mkdirSync(out,{recursive:true})
const report={testedAt:new Date().toISOString(),url,backend:'unconfigured; no real cloud project',checks:{},errors:[],warnings:[],exports:[],layouts:[],resources:[]}
const save=()=>fs.writeFileSync(path.join(out,'stage-three-results.json'),JSON.stringify(report,null,2))
const state=p=>p.evaluate(()=>window.__GALAXY__)
const dialog=p=>p.getByRole('dialog')
const button=(p,name)=>dialog(p).getByRole('button',{name,exact:true})
const settle=p=>p.waitForFunction(()=>!window.__GALAXY__.switching&&!window.__GALAXY__.assembling&&!window.__GALAXY__.lighting)
const watch=p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())})}
async function enter(p){await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='idle');await p.waitForTimeout(500)}
async function gift(p){await p.getByRole('button',{name:'保存与分享',exact:true}).click();await p.getByRole('heading',{name:'保存与分享',exact:true}).waitFor()}
async function screenshot(p,name){await p.screenshot({path:path.join(out,name+'.png')})}
async function download(p,name,file){
 const [d]=await Promise.all([p.waitForEvent('download',{timeout:45000}),button(p,name).click()]);await d.saveAs(path.join(out,file))
 await p.getByText('图片已生成，可下载或长按下方预览保存。',{exact:true}).waitFor()
 const meta=await sharp(path.join(out,file)).metadata();report.exports.push({file,width:meta.width,height:meta.height,format:meta.format});save();return meta
}
let browser
;(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']})
 report.browser=await browser.version()
 const context=await browser.newContext({viewport:{width:1585,height:992}})
 await context.addInitScript(()=>{const Original=window.Audio;window.__QA_AUDIO_CREATED__=0;window.Audio=function(...args){const audio=new Original(...args);window.__QA_AUDIO__=audio;window.__QA_AUDIO_CREATED__++;return audio};window.Audio.prototype=Original.prototype})
 const p=await context.newPage();watch(p);await p.goto(url+'/create?qa=1')
 assert.match(await p.title(),/星河生日蛋糕/);assert.equal(await p.locator('vite-error-overlay').count(),0)
 assert.equal(await p.evaluate(()=>window.__QA_AUDIO_CREATED__),0)
 await p.getByRole('button',{name:'背景音乐已开启',exact:true}).click();await p.getByRole('button',{name:'背景音乐已关闭',exact:true}).click()
 assert.equal(await p.evaluate(()=>window.__QA_AUDIO_CREATED__),0);report.checks.noAudioBeforeEnter=true
 await p.getByRole('button',{name:'定制这份生日祝福',exact:true}).click()
 await p.getByLabel('寿星昵称',{exact:true}).fill('阶段三小星');await p.getByLabel('发送人',{exact:true}).fill('测试发送人')
 await p.getByLabel('生日',{exact:true}).fill('2030-11-20');await p.getByLabel('年龄',{exact:true}).fill('23')
 await p.getByLabel('生日祝福',{exact:true}).fill('愿新的一岁，继续闪闪发光。\n每一个心愿，都有星河回应。')
 await button(p,'完成').click();await p.waitForTimeout(600)
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('galaxy-cake:draft:v1')))
 assert.equal(saved.config.recipient,'阶段三小星');assert.equal(saved.config.age,23)
 await p.reload();assert.match(await p.title(),/阶段三小星/);assert.deepEqual((await state(p)).config,saved.config);report.checks.refreshRestoresDraft=true
 await enter(p);await p.waitForFunction(()=>window.__QA_AUDIO__?.currentTime>.05)
 const audio=await p.evaluate(()=>({paused:window.__QA_AUDIO__.paused,duration:window.__QA_AUDIO__.duration,ready:window.__QA_AUDIO__.readyState,count:window.__QA_AUDIO_CREATED__}))
 assert.equal(audio.paused,false);assert.equal(audio.duration,48);assert.equal(audio.count,1);report.audio=audio;report.checks.realLocalAudioPlays=true
 await p.getByRole('button',{name:'暂停',exact:true}).click();await p.waitForFunction(()=>window.__QA_AUDIO__.paused)
 const frozen=(await state(p)).time;report.checks.pauseAlsoPausesMusic=true
 await gift(p);await screenshot(p,'desktop-gift-panel')
 assert.equal(await button(p,'生成专属观看链接').isEnabled(),false)
 assert.equal(await p.getByText('云端分享尚未连接。本机预览、保存草稿和图片导出已可使用。',{exact:true}).count(),1)
 report.checks.unconfiguredCloudDoesNotFakeShare=true
 await button(p,'保存草稿').click()
 const before=await p.evaluate(()=>({width:document.querySelector('canvas').width,height:document.querySelector('canvas').height}))
 const hd=await download(p,'导出高清 PNG','scene-hd.png');assert.equal(Math.max(hd.width,hd.height),3200)
 const after=await p.evaluate(()=>({width:document.querySelector('canvas').width,height:document.querySelector('canvas').height}))
 assert.deepEqual(after,before);assert.equal((await state(p)).time,frozen);report.checks.hdRendersAndRestoresCanvas=true
 const card=await download(p,'生成分享卡片','birthday-card.png');assert.equal(card.width,1200);assert.equal(card.height,1800);report.checks.cardIsRealDownload=true
 for(let i=0;i<3;i++){
  await download(p,'导出高清 PNG',`scene-repeat-${i+1}.png`);await p.waitForTimeout(250)
  const s=await state(p);report.resources.push({geometries:s.stats.geometries,textures:s.stats.textures})
 }
 assert.equal(new Set(report.resources.map(v=>JSON.stringify(v))).size,1);report.checks.repeatedExportResourcesStable=true
 await screenshot(p,'desktop-export-preview')
 let raw=await p.evaluate(()=>localStorage.getItem('galaxy-cake:draft:v1'))
 const popup=context.waitForEvent('page');await dialog(p).getByRole('link',{name:'本机观看预览',exact:true}).click();const viewer=await popup;watch(viewer)
 await viewer.waitForLoadState();raw=await p.evaluate(()=>localStorage.getItem('galaxy-cake:draft:v1'));await viewer.goto(url+'/preview?qa=1');await viewer.getByRole('button',{name:'开启星河',exact:true}).waitFor()
 assert.equal(await viewer.locator('.editor-controls button').count(),0);assert.equal(await viewer.getByRole('button',{name:'定制这份生日祝福',exact:true}).count(),0)
 assert.deepEqual((await state(viewer)).config,(await state(p)).config)
 await enter(viewer);await viewer.getByRole('button',{name:'开启生日惊喜',exact:true}).click();await viewer.getByRole('button',{name:'我许好愿了',exact:true}).click();await viewer.getByRole('button',{name:'吹灭蜡烛',exact:true}).click();await viewer.waitForFunction(()=>window.__GALAXY__?.phase==='message')
 await screenshot(viewer,'readonly-preview-message');assert.equal(await viewer.getByRole('button',{name:'保存与分享',exact:true}).count(),0)
 assert.equal(await viewer.evaluate(()=>localStorage.getItem('galaxy-cake:draft:v1')),raw);report.checks.readonlyPreviewWishFlowDoesNotOverwriteDraft=true
 await viewer.close();await button(p,'完成').click();await p.getByRole('button',{name:'继续',exact:true}).click()
 await p.getByRole('button',{name:'关闭背景音乐',exact:true}).click();await p.waitForFunction(()=>window.__QA_AUDIO__.paused);await p.waitForTimeout(500)
 await p.reload();assert.equal(await p.getByRole('button',{name:'背景音乐已关闭',exact:true}).count(),1);assert.equal(await p.evaluate(()=>window.__QA_AUDIO_CREATED__),0);report.checks.musicPreferencePersists=true
 await context.close()
 for(const [width,height]of [[390,844],[375,667],[412,915]]){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1.5,isMobile:true,hasTouch:true}),page=await ctx.newPage();watch(page)
  await page.goto(url+'/create?qa=1');await enter(page);await gift(page)
  const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,dialog:document.querySelector('.gift-dialog').getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('.gift-dialog button,.gift-actions a')].map(x=>x.getBoundingClientRect().toJSON())}))
  assert(layout.scroll<=width);assert(layout.dialog.top>=0&&layout.dialog.bottom<=height);assert(layout.buttons.every(r=>r.height>=44&&r.width>=44));report.layouts.push(layout)
  await screenshot(page,`mobile-${width}-gift`);await download(page,'生成分享卡片',`mobile-${width}-card.png`)
  await screenshot(page,`mobile-${width}-export`);await ctx.close()
 }
 report.checks.threePhoneLayoutsAndDownloads=true
 const malformed=await browser.newPage();watch(malformed)
 await malformed.addInitScript(()=>localStorage.setItem('galaxy-cake:draft:v1','{broken'))
 await malformed.goto(url+'/create?qa=1');await malformed.waitForTimeout(600)
 assert.equal(await malformed.evaluate(()=>localStorage.getItem('galaxy-cake:draft:v1')),'{broken');await malformed.close();report.checks.corruptDraftIsNotSilentlyOverwritten=true
 const untrusted=await browser.newPage();watch(untrusted)
 await untrusted.addInitScript(()=>localStorage.setItem('galaxy-cake:draft:v1',JSON.stringify({version:1,musicEnabled:'yes',config:{cakeStyle:'constructor',recipient:14,birthday:'2030-99-99',layerOverrides:null}})))
 await untrusted.goto(url+'/create?qa=1');await enter(untrusted);assert.equal((await state(untrusted)).config.cakeStyle,'galaxy');await untrusted.close();report.checks.untrustedDraftIsSanitized=true
 const denied=await browser.newPage();watch(denied)
 await denied.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('blocked','SecurityError')};Storage.prototype.setItem=()=>{throw new DOMException('full','QuotaExceededError')}})
 await denied.goto(url+'/create?qa=1');await enter(denied);await gift(denied);await button(denied,'保存草稿').click();assert(await denied.getByText('本机存储不可用，请先导出图片，避免丢失。',{exact:false}).count());await denied.close();report.checks.unavailableStorageIsRecoverable=true
 const missing=await browser.newPage();watch(missing);await missing.goto(url+'/birthday/11111111-1111-4111-8111-111111111111?qa=1');await missing.getByRole('alert').waitFor();assert.equal(await missing.locator('canvas').count(),0);await missing.close();report.checks.unconfiguredShareNeverShowsDefaultGift=true
 assert.equal(report.errors.length,0);report.checks.consoleNoErrors=true
 save();await browser.close();console.log('STAGE THREE LOCAL PASSED',report.checks)
})().catch(async error=>{report.failure=error.stack;save();console.error(error);await browser?.close();process.exitCode=1})
