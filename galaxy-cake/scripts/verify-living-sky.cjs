/* Browser plugin not available: existing isolated Playwright + local Chrome.
   Assert rendered background pixels as well as shared-clock/color state. */
const {chromium}=require('playwright'),sharp=require('sharp')
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-living-sky-20261105'),url=process.env.QA_URL||'http://localhost:4173'
fs.mkdirSync(out,{recursive:true})
const report={testedAt:new Date().toISOString(),url,checks:{},errors:[],warnings:[],colors:{},layouts:[],resources:[]}
const save=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2))
const state=p=>p.evaluate(()=>window.__GALAXY__)
const settle=p=>p.waitForFunction(()=>!window.__GALAXY__.switching&&!window.__GALAXY__.lighting&&!window.__GALAXY__.assembling)
const button=(p,name)=>p.getByRole('dialog').getByRole('button',{name,exact:true})
const shot=async(p,name)=>sharp(await p.screenshot()).webp({quality:93}).toFile(path.join(out,name+'.webp'))
function watch(p){p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())})}
async function enter(p,target=url+'/create?qa=1'){watch(p);await p.goto(target);await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='idle');await p.waitForTimeout(500)}
async function open(p){await p.getByRole('button',{name:'蛋糕',exact:true}).click();await settle(p)}
async function choose(p,name){await button(p,name).click();await settle(p)}
async function close(p){await choose(p,'完成')}
async function patchColor(p,color){await p.getByLabel('自定义蛋糕颜色',{exact:true}).fill(color);await p.waitForTimeout(1400)}
async function pixels(p,rect={left:20,top:140,width:250,height:260}){return sharp(await p.screenshot()).extract(rect).removeAlpha().raw().toBuffer()}
function difference(a,b){let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);return sum/a.length}
function average(data){const c=[0,0,0];for(let i=0;i<data.length;i++)c[i%3]+=data[i];return c.map(x=>x/(data.length/3))}
let browser
;(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']})
 report.browser=await browser.version()
 const p=await browser.newPage({viewport:{width:1585,height:992}})
 await enter(p);assert.match(await p.title(),/星河生日蛋糕/);assert.equal(await p.locator('vite-error-overlay').count(),0);assert.equal(await p.locator('.unavailable').isVisible(),false)
 report.checks.pageIdentityAndRendering=true
 const moving=await pixels(p),time=(await state(p)).sky.time;await p.waitForTimeout(1200)
 report.motionDifference=difference(moving,await pixels(p));assert(report.motionDifference>1);assert((await state(p)).sky.time>time)
 report.checks.backgroundActuallyMoves=true
 await p.getByRole('button',{name:'暂停',exact:true}).click();await p.waitForTimeout(400)
 const frozen=await state(p),still=await pixels(p);await p.waitForTimeout(800)
 assert.equal((await state(p)).sky.time,frozen.sky.time);assert(difference(still,await pixels(p))<.1)
 report.checks.pauseFreezesRenderedBackground=true
 await open(p);assert.equal(await button(p,'分层预览').count(),0)
 const blue=average(await pixels(p));report.colors.blue=blue
 await choose(p,'草莓粉');await p.waitForTimeout(1400)
 const pink=average(await pixels(p));report.colors.pink=pink
 assert.equal((await state(p)).sky.color,'#d97c9a');assert(pink[0]/(pink[2]+1)>blue[0]/(blue[2]+1)+.12)
 report.checks.presetChangesBackgroundPixels=true
 await patchColor(p,'#00c8b4');const teal=average(await pixels(p));report.colors.teal=teal
 assert.equal((await state(p)).sky.color,'#00c8b4');assert(teal[1]/(teal[0]+1)>pink[1]/(pink[0]+1)+.2)
 report.checks.customColorChangesBackgroundPixels=true
 await patchColor(p,'#eeeeee');assert((await state(p)).sky.saturation<=.17)
 report.colors.neutral=average(await pixels(p));report.checks.neutralColorDesaturatesSky=true
 await choose(p,'紫色梦境');await p.waitForTimeout(1200);const purple=(await state(p)).sky.color
 await p.getByRole('group',{name:'编辑范围',exact:true}).getByRole('button',{name:'第 2 层',exact:true}).click()
 await patchColor(p,'#75b8ad');const layered=(await state(p)).sky.color;assert.notEqual(layered,purple)
 assert.equal((await state(p)).config.layerOverrides[1].cakeColor,'#75b8ad')
 await choose(p,'撤销');await p.waitForTimeout(1200);assert.equal((await state(p)).sky.color,purple)
 await choose(p,'重做');await p.waitForTimeout(1200);assert.equal((await state(p)).sky.color,layered)
 assert.equal((await state(p)).sky.time,frozen.sky.time);report.checks.layerColorsAndUndoRedoFollowWhilePaused=true
 for(let i=0;i<12;i++){await p.getByLabel('自定义蛋糕颜色',{exact:true}).fill(i%2?'#e46f9c':'#75b8ad');await p.waitForTimeout(80);const s=await state(p);report.resources.push({geometries:s.stats.geometries,textures:s.stats.textures})}
 assert.equal(new Set(report.resources.map(x=>JSON.stringify(x))).size,1);report.checks.recolorDoesNotAllocateTextures=true
 await p.waitForTimeout(1600);await close(p);await p.getByRole('button',{name:'继续',exact:true}).click();await p.waitForTimeout(800)
 assert((await state(p)).sky.time>frozen.sky.time);report.checks.resumeRestartsSky=true
 const expected=(await state(p)).config,expectedSky=(await state(p)).sky.color
 await p.waitForTimeout(600);await p.reload();assert.deepEqual((await state(p)).config,expected)
 await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__.phase==='idle')
 assert.equal((await state(p)).sky.color,expectedSky);report.checks.draftRestoresSkyColor=true
 await p.getByRole('button',{name:'暂停',exact:true}).click();await p.waitForTimeout(500)
 await p.getByRole('button',{name:'保存与分享',exact:true}).click()
 const dimensions=await p.locator('canvas').evaluate(c=>({width:c.width,height:c.height})),exportState=(await state(p)).sky
 const [download]=await Promise.all([p.waitForEvent('download'),button(p,'导出高清 PNG').click()])
 const exported=await download.path(),metadata=await sharp(exported).metadata();assert.equal(Math.max(metadata.width,metadata.height),3200)
 assert.deepEqual(await p.locator('canvas').evaluate(c=>({width:c.width,height:c.height})),dimensions)
 assert.deepEqual((await state(p)).sky,exportState)
 await sharp(exported).resize({width:1200}).webp({quality:93}).toFile(path.join(out,'hd-export-preview.webp'))
 report.export={width:metadata.width,height:metadata.height,sky:exportState};report.checks.hdIncludesColoredSkyAndRestoresState=true
 await p.close();save()
 for(const [width,height] of [[390,844],[375,667],[412,915]]){
  const m=await browser.newPage({viewport:{width,height},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});await enter(m)
  const first=await m.locator('main').evaluate(e=>e.style.getPropertyValue('--sky-transform'));await m.waitForTimeout(700)
  assert.notEqual(await m.locator('main').evaluate(e=>e.style.getPropertyValue('--sky-transform')),first)
  await m.getByRole('button',{name:'暂停',exact:true}).click();await open(m);await choose(m,'草莓粉');await patchColor(m,'#e46f9c')
  assert.match(await m.locator('main').evaluate(e=>e.style.getPropertyValue('--sky-filter')),/hue-rotate/)
  assert(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
  assert(await m.locator('dialog button').evaluateAll(buttons=>buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44})))
  // Isolate the two background render paths. Independent foreground star glows
  // are intentionally absent from the CSS image and must not bias this check.
  await m.getByRole('tab',{name:'星河',exact:true}).click();await m.getByLabel('漂浮星点',{exact:true}).uncheck();await settle(m);await m.waitForTimeout(250)
  const rect={left:8,top:75,width:85,height:70},rendered=await pixels(m,rect)
  const hidden=await m.addStyleTag({content:'.scene{visibility:hidden!important}'})
  const backdropOnly=await pixels(m,rect);await hidden.evaluate(e=>e.remove())
  const seamError=difference(rendered,backdropOnly);report.layouts.push({width,height,seamError,isolatedNearParticles:true})
  assert(seamError<6,'CSS and WebGL use matching color and background coordinates')
  await m.getByLabel('漂浮星点',{exact:true}).check();await close(m);await m.getByRole('button',{name:'继续',exact:true}).click();await shot(m,`mobile-${width}-pink`);await m.close();save()
 }
 report.checks.mobileFullPageMotionColorAndNoSeams=true
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await enter(reduced)
 const a=(await state(reduced)).sky;await reduced.waitForTimeout(800);assert.deepEqual((await state(reduced)).sky,a)
 await reduced.close();report.checks.reducedMotionDisablesDrift=true
 const low=await browser.newPage({viewport:{width:390,height:844}});await enter(low,url+'/create?qa=1&quality=low')
 assert.equal((await state(low)).budget.dpr,1);assert.equal((await state(low)).stats.points,2774);await low.close();report.checks.lowBudgetUnchanged=true
 // Short actual browser recording, with the controls operated normally.
 const videoContext=await browser.newContext({viewport:{width:1585,height:992},recordVideo:{dir:out,size:{width:1585,height:992}}})
 const demo=await videoContext.newPage();await enter(demo);await shot(demo,'desktop-blue')
 await open(demo);await choose(demo,'草莓粉');await close(demo);await demo.waitForTimeout(1500);await shot(demo,'desktop-pink');await demo.waitForTimeout(2200)
 await open(demo);await choose(demo,'奶油白');await close(demo);await demo.waitForTimeout(1500);await shot(demo,'desktop-gold');await demo.waitForTimeout(1800)
 const video=demo.video();await videoContext.close();await video.saveAs(path.join(out,'living-sky.webm'));fs.unlinkSync(await video.path())
 report.checks.realMotionRecording=true
 assert.equal(report.errors.length,0);report.checks.noRuntimeErrors=true;save();await browser.close();console.log('LIVING SKY PASSED',JSON.stringify(report.checks))
})().catch(async e=>{report.failure=e.stack;save();console.error(e);await browser?.close();process.exitCode=1})
