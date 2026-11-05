/* Existing isolated Playwright/Chrome; Browser plugin absent. Real production UI. */
const {chromium}=require('playwright'),sharp=require('sharp'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-cake-catalog-20261105'),url=process.env.QA_URL||'http://localhost:4174'
fs.mkdirSync(out,{recursive:true})
const presets=[['galaxy','星河蓝'],['strawberry','草莓粉'],['cream','奶油白'],['purple','紫色梦境'],['heart','情侣爱心'],['chocolate','浓巧樱桃'],['matcha','抹茶奶霜'],['blueberry','蓝莓慕斯'],['mango','芒果晴光'],['rainbow','彩虹心愿'],['moon','星月夜曲'],['garden','花园来信']]
const ornaments=[['stars','金色星星'],['strawberry','小草莓'],['crystal','水晶糖'],['hearts','小爱心'],['blueberry','蓝莓'],['cherry','樱桃'],['mango','芒果块'],['chocolate','巧克力片'],['macaron','马卡龙'],['pearls','珍珠'],['crescent','月牙'],['butterfly','蝴蝶'],['bow','蝴蝶结'],['crown','皇冠'],['flower','小花'],['rainbow','彩虹插牌']]
const report={testedAt:new Date().toISOString(),url,checks:{},errors:[],warnings:[],presets:[],resources:[],layouts:[]}
const save=()=>fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2))
const state=p=>p.evaluate(()=>window.__GALAXY__),settle=p=>p.waitForFunction(()=>!window.__GALAXY__.switching&&!window.__GALAXY__.lighting&&!window.__GALAXY__.assembling)
const button=(p,name)=>p.getByRole('dialog').getByRole('button',{name,exact:true})
async function click(p,name){await button(p,name).click();await settle(p)}
async function open(p){await p.getByRole('button',{name:'蛋糕',exact:true}).click();await settle(p)}
async function close(p){await click(p,'完成');await p.waitForTimeout(150)}
const shot=async(p,name)=>sharp(await p.screenshot()).webp({quality:93}).toFile(path.join(out,name+'.webp'))
function watch(p){p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning'&&!report.warnings.includes(m.text()))report.warnings.push(m.text())})}
async function enter(p,target=url+'/create?qa=1'){watch(p);assert.equal((await p.goto(target)).status(),200);await p.getByRole('button',{name:'跳过开场',exact:true}).click();await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='idle');assert.equal(await p.locator('.unavailable').isVisible(),false)}
async function scope(p,n){await p.getByRole('group',{name:'编辑范围',exact:true}).getByRole('button',{name:n==='all'?'整体':`第 ${n} 层`,exact:true}).click();await settle(p)}
async function layout(p,label){const d=await p.evaluate(()=>({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('dialog button')].map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height}})}));assert(d.scroll<=d.width);assert(d.buttons.every(b=>b.w>=44&&b.h>=44));report.layouts.push({label,...d});save()}
let browser
;(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']})
 report.browser=await browser.version()
 const p=await browser.newPage({viewport:{width:1585,height:992}});await enter(p);assert.match(await p.title(),/星河生日蛋糕/);assert.equal(await p.locator('vite-error-overlay').count(),0)
 await p.getByRole('button',{name:'暂停',exact:true}).click();await p.waitForTimeout(200);await open(p)
 assert.equal(await p.locator('[data-cake-style]').count(),12);await click(p,'甜品');assert.equal(await p.locator('[data-cake-style]').count(),6);await click(p,'梦幻');assert.equal(await p.locator('[data-cake-style]').count(),6);await click(p,'全部');report.checks.catalogFiltersAndTwelveChoices=true
 for(const [id,name] of presets){
  await click(p,name);await close(p);await p.waitForTimeout(350)
  let s=await state(p);assert.equal(s.config.cakeStyle,id);assert.equal(s.config.recipient,'小雨');assert.equal(s.motion.spread,0)
  assert(s.decorations[s.config.cakeLayers-1].length>0)
  await shot(p,'preset-'+id);report.presets.push({id,layers:s.config.cakeLayers,decorations:s.decorations,sky:s.sky.color})
  const canvas=p.locator('canvas'),box=await canvas.boundingBox();await p.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await p.mouse.down();await p.mouse.move(box.x+box.width*.62,box.y+box.height*.53,{steps:14});await p.mouse.up();await p.waitForTimeout(220);await shot(p,'oblique-'+id)
  await open(p)
 }
 report.checks.twelvePresetsFrontObliqueAndSky=true;save()
 await click(p,'星河蓝');await click(p,'不放糖饰')
 for(const [type,label] of ornaments){await click(p,label);assert((await state(p)).config.layerOverrides[0].decorations.includes(type));assert((await state(p)).decorations[0].some(x=>x.type===type));await click(p,'不放糖饰')}
 report.checks.allSixteenSelectAndHaveVisiblePlacements=true
 await click(p,'皇冠');await click(p,'小草莓');await click(p,'珍珠')
 assert.equal(await button(p,'蓝莓').isEnabled(),false);await click(p,'月牙')
 assert.deepEqual((await state(p)).config.layerOverrides[0].decorations,['strawberry','pearls','crescent'])
 await p.getByLabel('装饰点缀色',{exact:true}).fill('#91bbaa');await settle(p)
 await p.getByRole('group',{name:'装饰疏密',exact:true}).getByRole('button',{name:'丰富',exact:true}).click();await settle(p)
 const rich=await state(p);assert(rich.decorations[0].length<=16)
 await shot(p,'desktop-mixed-editor');await layout(p,'desktop-editor')
 const designed=rich.config;await click(p,'撤销');await click(p,'重做');assert.deepEqual((await state(p)).config,designed)
 await click(p,'换一组装饰');const shuffled=(await state(p)).config;assert.equal(shuffled.cakeColor,designed.cakeColor);assert.equal(shuffled.cakeStyle,designed.cakeStyle);assert.notEqual(shuffled.layerOverrides[0].decorationSeed,designed.layerOverrides[0].decorationSeed)
 await click(p,'撤销');assert.deepEqual((await state(p)).config,designed)
 report.checks.MixLimitHeroReplacementColorDensityShuffleUndo=true
 await click(p,'彩虹心愿');assert.equal((await state(p)).config.cakeLayers,3)
 assert.equal(new Set(Object.values((await state(p)).config.layerOverrides).map(x=>x.cakeColor)).size,3)
 await scope(p,1);assert.equal(await button(p,'皇冠').isEnabled(),false);await click(p,'金色星星');assert((await state(p)).config.layerOverrides[0].decorations.includes('stars'))
 await scope(p,3);await click(p,'不放糖饰');await click(p,'皇冠');await click(p,'小爱心');await click(p,'珍珠')
 const complex=(await state(p)).config;await close(p);await shot(p,'desktop-three-layer-mix')
 await p.waitForTimeout(650);await p.reload();await p.waitForFunction(()=>window.__GALAXY__);assert.deepEqual((await state(p)).config,complex)
 await p.getByRole('button',{name:'跳过开场',exact:true}).click();await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__.phase==='idle');await p.getByRole('button',{name:'暂停',exact:true}).click();await p.waitForTimeout(200)
 report.checks.RainbowLayerMixAndDraftRestore=true
 // Real PNG download and read-only viewer retain the mixed configuration.
 await p.getByRole('button',{name:'保存与分享',exact:true}).click()
 const [download]=await Promise.all([p.waitForEvent('download'),button(p,'导出高清 PNG').click()])
 const file=await download.path(),meta=await sharp(file).metadata();assert.equal(Math.max(meta.width,meta.height),3200);await sharp(file).resize({width:1200}).webp({quality:90}).toFile(path.join(out,'mixed-hd-preview.webp'))
 await button(p,'完成').click();await open(p)
 report.checks.mixedHighResolutionExport=true
 // Warm every preset/model first; compare the same final scene across five rounds.
 for(let round=0;round<5;round++){
  for(const [,name] of presets)await click(p,name)
  await click(p,'星河蓝');await p.waitForTimeout(250);const s=await state(p);report.resources.push({round,geometries:s.stats.geometries,textures:s.stats.textures,points:s.stats.points})
 }
 assert.equal(new Set(report.resources.map(s=>`${s.geometries}/${s.textures}/${s.points}`)).size,1);report.checks.fiveFullCatalogRoundsStable=true;await close(p);await p.close();save()
 for(const [width,height] of [[390,844],[375,667],[412,915]]){
  const m=await browser.newPage({viewport:{width,height},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});await enter(m);await open(m);await click(m,'彩虹心愿');await scope(m,3);await click(m,'皇冠');await click(m,'小爱心')
  await layout(m,'mobile-'+width);assert((await state(m)).decorations.every(list=>list.length<=12));await shot(m,'mobile-'+width+'-editor');await close(m);await shot(m,'mobile-'+width+'-cake');await m.waitForTimeout(600)
  await m.goto(url+'/preview?qa=1');await m.getByRole('button',{name:'跳过开场',exact:true}).click();await m.getByRole('button',{name:'开启星河',exact:true}).click();await m.waitForFunction(()=>window.__GALAXY__.phase==='idle');assert.equal((await state(m)).readOnly,undefined);assert.equal(await m.getByRole('button',{name:'蛋糕',exact:true}).count(),0);assert.equal((await state(m)).config.cakeStyle,'rainbow');await m.close();save()
 }
 report.checks.mobileThreeSizesTouchTargetsAndReadOnly=true
 const low=await browser.newPage({viewport:{width:390,height:844}});await enter(low,url+'/create?qa=1&quality=low');await open(low);await click(low,'星月夜曲');await scope(low,2);await low.getByRole('group',{name:'装饰疏密',exact:true}).getByRole('button',{name:'丰富',exact:true}).click();await settle(low)
 assert((await state(low)).decorations.every(list=>list.length<=8));assert.equal((await state(low)).budget.dpr,1);assert.equal((await state(low)).stats.points,2774);await shot(low,'low-mixed');await low.close();report.checks.lowTierCapsAndPointsPreserved=true
 const vc=await browser.newContext({viewport:{width:1585,height:992},recordVideo:{dir:out,size:{width:1585,height:992}}}),demo=await vc.newPage();await enter(demo);await open(demo)
 for(const name of ['浓巧樱桃','抹茶奶霜','彩虹心愿','星月夜曲']){await click(demo,name);await close(demo);await demo.waitForTimeout(800);await open(demo)}
 await click(demo,'不放糖饰');await click(demo,'皇冠');await click(demo,'小爱心');await click(demo,'珍珠');await close(demo);await demo.waitForTimeout(1000)
 const video=demo.video();await vc.close();await video.saveAs(path.join(out,'catalog-and-mixing.webm'));fs.unlinkSync(await video.path());report.checks.realMixingRecording=true
 assert.equal(report.errors.length,0);report.checks.noRuntimeErrors=true;save();await browser.close();console.log('CAKE CATALOG PASSED',JSON.stringify(report.checks))
})().catch(async e=>{report.failure=e.stack;save();console.error(e);await browser?.close();process.exitCode=1})
