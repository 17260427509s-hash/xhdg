/* Targeted production QA, using the existing isolated Playwright and Chrome.
   Browser plugin not available. Each task writes a separate evidence file. */
const {chromium}=require('playwright'),sharp=require('sharp'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const url=process.env.QA_URL||'http://localhost:4174',out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-optimization-20261110'),task=process.env.QA_TASK||'seam'
fs.mkdirSync(out,{recursive:true})
const report={task,testedAt:new Date().toISOString(),url,checks:{},runs:[],errors:[],warnings:[]}
const state=p=>p.evaluate(()=>window.__GALAXY__),settle=p=>p.waitForFunction(()=>!window.__GALAXY__.switching&&!window.__GALAXY__.assembling&&!window.__GALAXY__.lighting)
const shot=async(p,name)=>{const buffer=await p.screenshot();await sharp(buffer).webp({quality:94}).toFile(path.join(out,name+'.webp'));return buffer}
function watch(p){p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning'&&!report.warnings.includes(m.text()))report.warnings.push(m.text())})}
async function enter(p,target=url+'/create?qa=1'){watch(p);await p.goto(target);assert.match(await p.title(),/星河生日蛋糕/);const skip=p.getByRole('button',{name:'跳过开场',exact:true});if(await skip.isVisible())await skip.click();await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='idle',null,{timeout:60000});assert.equal(await p.locator('.unavailable').isVisible(),false);assert.equal(await p.locator('vite-error-overlay').count(),0)}
async function open(p){await p.getByRole('button',{name:'蛋糕',exact:true}).click();await settle(p)}
async function click(p,name){await p.getByRole('dialog').getByRole('button',{name,exact:true}).click();await settle(p)}
async function freeze(p,value){await p.evaluate(value=>{if(value)Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});else delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))},value)}
async function seam(p,width,phase){
 await freeze(p,true);const snapshot=await state(p),rect=await p.locator('.scene').boundingBox();assert.equal(rect.y,0);assert.equal(rect.height,p.viewportSize().height)
 await shot(p,`seam-${width}-${phase}`)
 // Measure the background separately so title letter strokes cannot bias sky rows.
 const style=await p.addStyleTag({content:'.birthday-message{visibility:hidden!important}'}),buffer=await p.screenshot();await style.evaluate(e=>e.remove())
 const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true}),boundary=width>700?110:115
 const mean=(start,end)=>{let sum=0;for(let y=start;y<end;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*info.channels;sum+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]}return sum/((end-start)*info.width)}
 const above=mean(boundary-3,boundary),below=mean(boundary,boundary+3),difference=Math.abs(above-below)/Math.max(above,below,.001)
 report.runs.push({width,phase,time:snapshot.phaseTime,scene:rect,above,below,difference});assert(difference<.1,`Sky seam ${width}/${phase}: ${difference}`);await freeze(p,false)
}
let browser
;(async()=>{try{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']})
 if(task==='accessibility'){
  const p=await browser.newPage({viewport:{width:1440,height:900}});await enter(p);await p.evaluate(()=>document.activeElement.blur());const focus=[]
  for(let i=0;i<5;i++){await p.keyboard.press('Tab');const item=await p.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect();return {tag:e.tagName,text:e.textContent,w:r.width,h:r.height,hidden:Boolean(e.closest('[aria-hidden=true],[inert]'))}});assert(item.tag!=='BODY'&&item.w>0&&item.h>0&&!item.hidden);focus.push(item)}
  report.runs.push({focus});await p.locator('canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await p.getByRole('heading',{name:'星河暂时无法点亮',exact:true}).waitFor();assert(await p.getByRole('button',{name:/重新尝试/}).isEnabled());await shot(p,'webgl-context-lost');report.checks.contextLostVisible=true;await p.close();await browser.close()
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-webgl','--disable-webgl2']})
  const no=await browser.newPage({viewport:{width:390,height:844}});await no.goto(url+'/create?qa=1');await no.waitForTimeout(800);if(!await no.getByRole('heading',{name:'星河暂时无法点亮',exact:true}).isVisible()){const skip=no.getByRole('button',{name:'跳过开场',exact:true});if(await skip.isVisible())await skip.click();await no.getByRole('button',{name:'开启星河',exact:true}).click()}await no.getByRole('heading',{name:'星河暂时无法点亮',exact:true}).waitFor();const retry=no.getByRole('button',{name:/重新尝试/});assert(await retry.isEnabled());await shot(no,'webgl-unavailable');await Promise.all([no.waitForNavigation(),retry.click()]);report.checks.retryReloads=true;await no.close()
 }
 if(task==='seam')for(const [width,height] of [[1440,900],[390,844]]){
  const p=await browser.newPage({viewport:{width,height}});await enter(p);await p.getByRole('button',{name:'暂停',exact:true}).click();await shot(p,`seam-${width}-idle`);const idle=await state(p);report.runs.push({width,phase:'idle',camera:idle.stats.camera,scene:await p.locator('.scene').boundingBox()});await p.getByRole('button',{name:'继续',exact:true}).click()
  await p.getByRole('button',{name:'开启生日惊喜',exact:true}).click();await p.getByRole('button',{name:'我许好愿了',exact:true}).click();await p.getByRole('button',{name:'吹灭蜡烛',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__.phase==='celebration'&&window.__GALAXY__.phaseTime>3.7);await seam(p,width,'celebration');await p.waitForFunction(()=>window.__GALAXY__.phase==='message');await seam(p,width,'message');await p.close()
 }
 report.checks[task]=true;assert.equal(report.errors.length,0);report.checks.noRuntimeErrors=true
 }catch(e){report.failure=e.stack;throw e}finally{fs.writeFileSync(path.join(out,task+'-results.json'),JSON.stringify(report,null,2));await browser?.close()}})().then(()=>console.log('OPTIMIZATION PASSED',task)).catch(e=>{console.error(e);process.exitCode=1})
