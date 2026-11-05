/* Browser plugin not available: use the existing isolated Playwright and Chrome. */
const {chromium}=require('playwright'),sharp=require('sharp'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-serving-plate-20261105'),url=process.env.QA_URL||'http://localhost:4174',before=process.env.QA_BEFORE==='1'
fs.mkdirSync(out,{recursive:true})
const presets=[['galaxy','星河蓝'],['strawberry','草莓粉'],['cream','奶油白'],['purple','紫色梦境'],['heart','情侣爱心'],['chocolate','浓巧樱桃'],['matcha','抹茶奶霜'],['blueberry','蓝莓慕斯'],['mango','芒果晴光'],['rainbow','彩虹心愿'],['moon','星月夜曲'],['garden','花园来信']]
const report={testedAt:new Date().toISOString(),url,checks:{},errors:[],warnings:[],layouts:[]}
let browser
const state=p=>p.evaluate(()=>window.__GALAXY__),settle=p=>p.waitForFunction(()=>!window.__GALAXY__.switching&&!window.__GALAXY__.assembling&&!window.__GALAXY__.lighting)
const shot=async(p,name)=>sharp(await p.screenshot()).webp({quality:93}).toFile(path.join(out,name+'.webp'))
async function click(p,name){await p.getByRole('dialog').getByRole('button',{name,exact:true}).click();await settle(p)}
async function open(p){await p.getByRole('button',{name:'蛋糕',exact:true}).click();await settle(p)}
async function close(p){await click(p,'完成');await p.waitForTimeout(500)}
async function layer(p,n){await p.getByRole('group',{name:'编辑范围',exact:true}).getByRole('button',{name:`第 ${n} 层`,exact:true}).click();await settle(p)}
async function enter(p,target=url+'/create?qa=1'){
 p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning'&&!report.warnings.includes(m.text()))report.warnings.push(m.text())})
 await p.goto(target);assert.match(await p.title(),/星河生日蛋糕/);await p.getByRole('button',{name:'跳过开场',exact:true}).click();await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='idle');assert.equal(await p.locator('.unavailable').isVisible(),false);assert.equal(await p.locator('vite-error-overlay').count(),0)
 await p.getByRole('button',{name:'暂停',exact:true}).click();await p.waitForTimeout(200)
}
async function drag(p,dx){const b=await p.locator('canvas').boundingBox();await p.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await p.mouse.down();await p.mouse.move(b.x+b.width*(.5+dx),b.y+b.height*.53,{steps:14});await p.mouse.up();await p.waitForTimeout(300)}
async function layout(p,label){const v=await p.evaluate(()=>({width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('dialog[open] button')].map(b=>{const r=b.getBoundingClientRect();return {width:r.width,height:r.height}})}));assert(v.scroll<=v.width);assert(v.buttons.every(b=>b.width>=43.99&&b.height>=43.99));report.layouts.push({label,...v})}
;(async()=>{try{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']})
 const p=await browser.newPage({viewport:{width:1585,height:992}});await enter(p)
 if(before){for(const [id,name] of presets.filter(([id])=>['chocolate','matcha'].includes(id))){await open(p);await click(p,name);await close(p);await shot(p,'before-'+id)}console.log('BASELINE CAPTURED');return}
 const frozen=(await state(p)).time
 for(const [id,name] of presets){await open(p);await click(p,name);await close(p);assert.equal((await state(p)).config.cakeStyle,id);await shot(p,'after-'+id);await drag(p,.12);await shot(p,'oblique-'+id);await drag(p,-.12)}
 report.checks.twelveStylesFrontAndOblique=true;assert.equal((await state(p)).time,frozen);report.checks.pausedSwitching=true
 await open(p);await click(p,'浓巧樱桃');await p.getByLabel('自定义蛋糕颜色',{exact:true}).fill('#75b8ad');await settle(p);await close(p);await shot(p,'custom-mint');await open(p);await click(p,'撤销');assert.equal((await state(p)).config.cakeColor,'#59362e');await click(p,'重做');assert.equal((await state(p)).config.cakeColor,'#75b8ad');report.checks.customColorUndoRedo=true
 await click(p,'彩虹心愿');await layer(p,1);await p.getByLabel('自定义蛋糕颜色',{exact:true}).fill('#75b8ad');await settle(p);await close(p);await shot(p,'bottom-layer-mint');await open(p);await layer(p,3);await p.getByLabel('自定义蛋糕颜色',{exact:true}).fill('#d97c9a');await settle(p);await close(p);await shot(p,'top-layer-pink');const designed=(await state(p)).config;assert.equal(designed.layerOverrides[0].cakeColor,'#75b8ad');assert.equal(designed.layerOverrides[2].cakeColor,'#d97c9a');report.checks.bottomLayerOverridesAndIndependentTop=true
 await p.waitForTimeout(700);await p.reload();await p.waitForFunction(()=>window.__GALAXY__);assert.deepEqual((await state(p)).config,designed);await p.getByRole('button',{name:'跳过开场',exact:true}).click();await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__.phase==='idle');await p.getByRole('button',{name:'暂停',exact:true}).click();await shot(p,'draft-restored');report.checks.refreshRestoresDesign=true
 await p.goto(url+'/preview?qa=1');await p.getByRole('button',{name:'跳过开场',exact:true}).click();await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__.phase==='idle');assert.equal(await p.getByRole('button',{name:'蛋糕',exact:true}).count(),0);assert.deepEqual((await state(p)).config,designed);await p.getByRole('button',{name:'暂停',exact:true}).click();await shot(p,'readonly');report.checks.readOnlyPreservesDesign=true;await p.close()
 for(const [width,height] of [[390,844],[375,667],[412,915]]){const m=await browser.newPage({viewport:{width,height},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});await enter(m);await open(m);await click(m,'浓巧樱桃');await layout(m,'mobile-'+width);await close(m);await shot(m,'mobile-'+width);await m.close()}report.checks.threeMobileSizesAnd44pxTargets=true
 const low=await browser.newPage({viewport:{width:390,height:844}});await enter(low,url+'/create?qa=1&quality=low');await open(low);await click(low,'抹茶奶霜');await close(low);assert.equal((await state(low)).budget.dpr,1);assert.equal((await state(low)).stats.points,2774);await shot(low,'low-matcha');await low.close();report.checks.lowTierBudgetUnchanged=true
 assert.equal(report.errors.length,0);report.checks.noRuntimeErrors=true;console.log('SERVING PLATE PASSED',JSON.stringify(report.checks))
 }catch(e){report.failure=e.stack;throw e}finally{if(!before)fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser?.close()}})().catch(e=>{console.error(e);process.exitCode=1})
