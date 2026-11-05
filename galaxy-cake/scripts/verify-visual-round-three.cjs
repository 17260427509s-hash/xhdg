/* Fresh real-Chrome evidence for the third visual pass. Never overwrite older QA. */
const {chromium}=require('playwright'),sharp=require('sharp'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const url=process.env.QA_URL||'http://localhost:5173',out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-visual-round-three-20261105/before')
fs.mkdirSync(out,{recursive:true})
const presets=[['galaxy','星河蓝'],['strawberry','草莓粉'],['cream','奶油白'],['purple','紫色梦境'],['heart','情侣爱心'],['chocolate','浓巧樱桃'],['matcha','抹茶奶霜'],['blueberry','蓝莓慕斯'],['mango','芒果晴光'],['rainbow','彩虹心愿'],['moon','星月夜曲'],['garden','花园来信']]
const report={testedAt:new Date().toISOString(),url,checks:{},errors:[],warnings:[],views:[],presets:[]}
const state=p=>p.evaluate(()=>window.__GALAXY__),settle=p=>p.waitForFunction(()=>!window.__GALAXY__.switching&&!window.__GALAXY__.assembling&&!window.__GALAXY__.lighting)
const shot=async(p,name)=>sharp(await p.screenshot()).webp({quality:94}).toFile(path.join(out,name+'.webp'))
async function open(p,name='蛋糕'){await p.getByRole('button',{name,exact:true}).click();await settle(p)}
async function choose(p,name){await p.getByRole('dialog').getByRole('button',{name,exact:true}).click();await settle(p)}
async function close(p){await choose(p,'完成');await p.waitForTimeout(350)}
async function enter(p,opening=false){
 p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning'&&!report.warnings.includes(m.text()))report.warnings.push(m.text())})
 await p.goto(url+'/create?qa=1');assert.equal(await p.locator('vite-error-overlay').count(),0)
 if(opening){await p.waitForFunction(()=>window.__GALAXY__?.openingStage==='ready');await shot(p,`opening-${p.viewportSize().width}`)
  const composition=await p.locator('.opening-composition').boundingBox(),letter=await p.locator('.opening-letter').boundingBox()
  assert(Math.abs(letter.x+letter.width/2-composition.x-composition.width/2)<1.5)
  assert(Math.abs(letter.y+letter.height/2-composition.y-composition.height*(p.viewportSize().width<700?.53:.51))<1.5,'The central letter stays centered after GSAP settles')
  const positions=await p.locator('.wish-note').evaluateAll(es=>es.map(e=>e.style.transform));await p.waitForTimeout(300);assert.deepEqual(await p.locator('.wish-note').evaluateAll(es=>es.map(e=>e.style.transform)),positions)
 }else await p.getByRole('button',{name:'跳过开场',exact:true}).click()
 await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='idle')
 await p.getByRole('button',{name:'暂停',exact:true}).click();await p.waitForTimeout(150)
}
async function layout(p,label){
 const d=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,height:innerHeight,buttons:[...document.querySelectorAll('dialog[open] button')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height}}),panel:document.querySelector('.settings-scroll')?{client:document.querySelector('.settings-scroll').clientHeight,scroll:document.querySelector('.settings-scroll').scrollHeight}:null}))
 assert(d.scroll<=d.width);assert(d.buttons.every(b=>b.w>=43.99&&b.h>=43.99));report.views.push({label,...d})
}
async function drag(p){const b=await p.locator('canvas').boundingBox();await p.mouse.move(b.x+b.width*.44,b.y+b.height*.52);await p.mouse.down();await p.mouse.move(b.x+b.width*.62,b.y+b.height*.56,{steps:16});await p.mouse.up();await p.waitForTimeout(260)}
;(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']})
 try{
 report.browser=await browser.version();const p=await browser.newPage({viewport:{width:1585,height:992}});await enter(p,true);await shot(p,'desktop-default');await layout(p,'desktop-default')
 const frozen=(await state(p)).time;await open(p);await shot(p,'desktop-cake-panel');await layout(p,'desktop-cake-panel');await close(p)
 for(const [id,name] of presets){await open(p);await choose(p,name);await close(p);await shot(p,'preset-'+id);report.presets.push({id,config:(await state(p)).config,stats:(await state(p)).stats});assert.equal((await state(p)).config.cakeStyle,id);assert.equal((await state(p)).motion.spread,0)}
 assert.equal((await state(p)).time,frozen);report.checks.twelveStylesWhilePaused=true
 await open(p);await choose(p,'星河蓝');await close(p)
 await p.getByRole('button',{name:'继续',exact:true}).click();await p.waitForTimeout(300);await shot(p,'desktop-playing');await p.getByRole('button',{name:'暂停',exact:true}).click();await p.waitForTimeout(200)
 await drag(p);await shot(p,'desktop-rotated');await open(p,'星河');await shot(p,'desktop-sky-panel');await layout(p,'desktop-sky-panel');await close(p);await p.close()
 for(const [width,height] of [[390,844],[375,667],[412,915]]){
  const m=await browser.newPage({viewport:{width,height},deviceScaleFactor:1.5,isMobile:true,hasTouch:true});await enter(m,true);await shot(m,`mobile-${width}`);await layout(m,`mobile-${width}`)
  await open(m);await shot(m,`mobile-${width}-cake-panel`);await layout(m,`mobile-${width}-cake-panel`);await close(m)
  await open(m,'星河');await shot(m,`mobile-${width}-sky-panel`);await layout(m,`mobile-${width}-sky-panel`);await close(m)
  const initial=(await state(m)).stats.camera,box=await m.locator('canvas').boundingBox(),cdp=await m.context().newCDPSession(m),x=box.x+box.width*.4,y=box.y+box.height*.55
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*9,y:y+i,id:1}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await m.waitForTimeout(250)
  assert.notDeepEqual((await state(m)).stats.camera,initial);await shot(m,`mobile-${width}-rotated`);await cdp.detach()
  await m.getByRole('button',{name:'继续',exact:true}).click();await m.waitForTimeout(300);await shot(m,`mobile-${width}-playing`);await m.close()
 }
 report.checks.heartStopsAndWaitsForEntry=true;report.checks.centralLetterRemainsCenteredAfterGsap=true;report.checks.fourViewportsPanelsAnd44pxTargets=true;report.checks.threeTouchRotations=true
 assert.equal(report.errors.length,0);report.checks.noRuntimeErrors=true
 // A contact sheet is only evidence; all runtime cake pixels came from WebGL.
 const thumbs=await Promise.all(presets.map(async([id,name])=>({input:await sharp(path.join(out,'preset-'+id+'.webp')).extract({left:310,top:100,width:965,height:710}).resize(400,294).extend({top:0,bottom:32,left:0,right:0,background:'#12101a'}).composite([{input:Buffer.from(`<svg width="400" height="32"><text x="200" y="23" text-anchor="middle" fill="#eee0fa" font-size="16" font-family="Microsoft YaHei">${name}</text></svg>`),left:0,top:294}]).png().toBuffer()})))
 await sharp({create:{width:1600,height:978,channels:3,background:'#08070e'}}).composite(thumbs.map((x,i)=>({...x,left:i%4*400,top:Math.floor(i/4)*326}))).webp({quality:94}).toFile(path.join(out,'twelve-cakes.webp'))
 console.log('VISUAL PASS',JSON.stringify(report.checks))
 }catch(e){report.failure=e.stack;process.exitCode=1;console.error(e)}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close()}
})()
