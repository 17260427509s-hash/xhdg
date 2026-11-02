const {chromium}=require('playwright');
const fs=require('fs');
const path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT || path.join(__dirname,'../../docs/qa-concept'));
fs.mkdirSync(out,{recursive:true});
const output=name=>path.join(out,name);
const url=process.env.QA_URL || 'http://localhost:4173/?qa=1';
(async()=>{
 const b=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:process.platform==='win32'&&fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{}),headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const report={browser:await b.version(),errors:[],warnings:[],layouts:[]};
 for(const [width,height,name,dpr]of[[1585,992,'desktop-native',1],[390,844,'mobile-390',1.5]]){
  const p=await b.newPage({viewport:{width,height},deviceScaleFactor:dpr,isMobile:width<700,hasTouch:width<700});p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());else if(m.type()==='warning')report.warnings.push(m.text())});
  await p.goto(url);await p.getByRole('button',{name:'开启星河',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='idle');await p.waitForTimeout(800);
  await p.screenshot({path:output(`${name}.png`)});
  report.layouts.push({width,height,name,...await p.evaluate(()=>({phase:window.__GALAXY__.phase,scrollWidth:document.documentElement.scrollWidth,points:window.__GALAXY__.stats.points}))});
  if(width>700){await p.getByRole('button',{name:'暂停',exact:true}).click();await p.screenshot({path:output('flame-front.png'),clip:{x:735,y:205,width:115,height:110}});await p.mouse.move(790,570);await p.mouse.down();await p.mouse.move(990,570,{steps:20});await p.mouse.up();await p.waitForTimeout(600);await p.screenshot({path:output('flame-oblique.png'),clip:{x:735,y:205,width:115,height:110}});await p.screenshot({path:output('oblique.png')});report.frozenFlameAngleCheck=true;await p.getByRole('button',{name:'继续',exact:true}).click();await p.getByRole('button',{name:'开启生日惊喜',exact:true}).click();await p.getByRole('button',{name:'我许好愿了',exact:true}).click();await p.getByRole('button',{name:'吹灭蜡烛',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='message');await p.waitForTimeout(700);await p.screenshot({path:output('message-final.png')});await p.getByRole('button',{name:'再看一次',exact:true}).click();await p.waitForFunction(()=>window.__GALAXY__?.phase==='idle');report.finalReplay=true;}
  await p.close();
 }
 fs.writeFileSync(output('final-visual-check.json'),JSON.stringify(report,null,2));console.log(report);await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
