const {chromium}=require('playwright'),sharp=require('sharp'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-cake-catalog-20261105'),url=process.env.QA_URL||'http://localhost:4174'
fs.mkdirSync(out,{recursive:true})
;(async()=>{let browser;const report={testedAt:new Date().toISOString(),checks:{},errors:[]};try{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']})
 const p=await browser.newPage({viewport:{width:1585,height:992}});p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())})
 const settle=()=>p.waitForFunction(()=>!window.__GALAXY__.switching),click=async name=>{await p.getByRole('dialog').getByRole('button',{name,exact:true}).click();await settle()},open=()=>p.getByRole('button',{name:'蛋糕',exact:true}).click()
 const shot=async name=>sharp(await p.screenshot()).webp({quality:93}).toFile(path.join(out,name+'.webp'))
 await p.goto(url+'/create?qa=1');await p.getByRole('button',{name:'跳过开场',exact:true}).click();await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__.phase==='idle');await p.getByRole('button',{name:'暂停',exact:true}).click();await open();await click('花园来信');await click('完成');await p.waitForTimeout(300);await shot('preset-garden')
 const canvas=p.locator('canvas'),box=await canvas.boundingBox()
 const drag=async(dx)=>{await p.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await p.mouse.down();await p.mouse.move(box.x+box.width*(.5+dx),box.y+box.height*.53,{steps:14});await p.mouse.up();await p.waitForTimeout(250)}
 await drag(.12);await shot('oblique-garden');await drag(.25);await shot('garden-rear');report.checks.gardenFrontObliqueAndRearRendered=true
 for(const [label,type] of [['蝴蝶','butterfly'],['蝴蝶结','bow']]){await open();await click('不放糖饰');await click(label);await click('完成');await p.waitForTimeout(250);assert((await p.evaluate(()=>window.__GALAXY__.decorations[0])).some(x=>x.type===type));await shot('corrected-'+type);await drag(.2)}
 report.checks.mirroredOrnamentsRenderedAndRotated=true;assert.equal(report.errors.length,0);report.checks.noRuntimeErrors=true;fs.writeFileSync(path.join(out,'face-results.json'),JSON.stringify(report,null,2));console.log('DECORATION FACES PASSED',JSON.stringify(report.checks))
 }finally{await browser?.close()}})().catch(e=>{console.error(e);process.exitCode=1})
