/* Real-browser acceptance. Requires Playwright and locally installed Chrome.
   NODE_PATH can point to the desktop app's bundled node_modules. */
const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const out = path.resolve(process.env.QA_OUTPUT || '../docs/qa')
fs.mkdirSync(out, { recursive: true })
const report = { testedAt: new Date().toISOString(), url: process.env.QA_URL || 'http://localhost:4173/?qa=1', browser: 'Local Google Chrome / Playwright (Browser plugin unavailable)', checks: {}, performance: {}, cycles: [], errors: [], layouts: [] }
const save = () => fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2))
const state = p => p.evaluate(() => window.__GALAXY__)
const waitPhase = (p, phase) => p.waitForFunction(phase => window.__GALAXY__?.phase === phase, phase, { timeout: 20000 })
async function birthdaySurprise(p) {
  await p.getByRole('button',{name:'开启生日惊喜',exact:true}).click()
  await p.getByRole('button',{name:'我许好愿了',exact:true}).click()
  await p.getByRole('button',{name:'吹灭蜡烛',exact:true}).click()
  await waitPhase(p,'celebration')
}
const shot = (p, name) => p.screenshot({ path: path.join(out, name + '.png') })
async function frames(p, ms = 2500) {
  return p.evaluate(ms => new Promise(resolve => {
    const start = performance.now(); let previous = start; const intervals = []
    function frame(t) { intervals.push(t - previous); previous = t
      if (t - start >= ms) { const a = intervals.slice(1).sort((a,b) => a-b); resolve({ fps: a.length / ((t-start)/1000), p50ms: a[Math.floor(a.length*.5)], p95ms: a[Math.floor(a.length*.95)], frames: a.length }) }
      else requestAnimationFrame(frame)
    } requestAnimationFrame(frame)
  }), ms)
}
async function start(p, url = report.url) {
  p.on('pageerror', e => report.errors.push(e.message))
  p.on('console', m => { if(m.type() === 'error') report.errors.push(m.text()) })
  await p.goto(url)
  await p.getByRole('button', { name: '开启星河', exact: true }).click()
  await waitPhase(p, 'idle'); await p.waitForTimeout(800)
}
async function layout(p, label) {
  const result = await p.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, buttons: [...document.querySelectorAll('.control-bar button')].map(b => ({ text: b.innerText, width: b.getBoundingClientRect().width, height: b.getBoundingClientRect().height, bottom: b.getBoundingClientRect().bottom })) }))
  assert(result.scrollWidth <= result.width, 'No horizontal overflow')
  assert(result.buttons.every(b => b.height >= 44 && b.width >= 44 && b.bottom <= result.height), 'Controls fit safe viewport and are touch-sized')
  report.layouts.push({ label, ...result }); await shot(p, label); save()
}
;(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : process.platform === 'win32' && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] })
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await p.goto(report.url); await shot(p,'intro')
  assert.match(await p.title(), /星河生日蛋糕/)
  report.checks.identity = true
  await start(p)
  assert.equal(await p.locator('canvas').count(), 1)
  assert.equal(await p.locator('vite-error-overlay').count(), 0)
  report.checks.nonBlankAndNoOverlay = true
  const initial=await state(p),budget=initial.budget
  assert.equal(initial.stats.points,2*(budget.near+budget.far+budget.dust+budget.surface+3*budget.orbitDust+budget.sparks+budget.burst),'Two geometry passes drawing the effective configured particle budget')
  await layout(p,'desktop')
  await p.getByRole('button', { name: '暂停', exact: true }).click()
  const paused = await state(p); await p.waitForTimeout(650); const still = await state(p)
  assert.equal(paused.time, still.time); assert.equal(paused.orbitTime, still.orbitTime)
  report.checks.pauseFreezesAllAnimation = true
  await p.mouse.move(720,450); await p.mouse.down(); await p.mouse.move(910,510,{steps:18}); await p.mouse.up(); await p.waitForTimeout(400)
  assert.notDeepEqual((await state(p)).stats.camera, still.stats.camera)
  await shot(p,'rotated'); report.checks.manualRotationWhilePaused = true
  await p.getByRole('button', { name: '继续', exact: true }).click()
  await p.waitForTimeout(600); assert((await state(p)).time > still.time)
  report.checks.resume = true
  // Stop drag inertia, then check the five-second auto-rotation cooldown.
  await p.waitForTimeout(1000); const cool = await state(p); await p.waitForTimeout(1200); const coolEnd = await state(p)
  assert(Math.abs(cool.stats.camera[0]-coolEnd.stats.camera[0]) < .006)
  await p.waitForTimeout(4000); const auto = await state(p)
  assert(Math.abs(coolEnd.stats.camera[0]-auto.stats.camera[0]) > .01)
  report.checks.fiveSecondAutoRotateCooldown = true
  report.performance.desktopIdle = await frames(p)
  await p.getByRole('button', { name: '重播', exact: true }).click(); await waitPhase(p,'idle'); await p.waitForTimeout(850)
  await shot(p,'desktop')
  for(let i=0;i<5;i++) {
    if(i) {await p.getByRole('button',{name:'再看一次',exact:true}).click();await waitPhase(p,'idle');await p.waitForTimeout(750)}
    await birthdaySurprise(p)
    if(i===0) {report.performance.desktopCelebration=await frames(p,3000);await shot(p,'celebration')}
    await waitPhase(p,'message');await p.waitForTimeout(850)
    assert(await p.getByRole('button',{name:'再看一次',exact:true}).isVisible())
    const s=await state(p); report.cycles.push({ cycle:i+1,reset:s.resetId,phase:s.phase,geometries:s.stats.geometries,textures:s.stats.textures,budget:s.budget })
    if(i===0)await shot(p,'message')
    console.log('Replay cycle',i+1,report.cycles.at(-1));save()
  }
  assert.equal(new Set(report.cycles.map(c=>c.geometries)).size,1)
  assert.equal(new Set(report.cycles.map(c=>c.textures)).size,1)
  report.checks.fiveReplayCyclesStable = true
  await p.close()
  for(const [width,height,label] of [[390,844,'mobile-390'],[375,667,'mobile-375'],[412,915,'android-412']]) {
    const m=await browser.newPage({viewport:{width,height},deviceScaleFactor:1.5,isMobile:true,hasTouch:true})
    await start(m);await layout(m,label)
    assert.equal((await state(m)).tier,'mobile')
    if(width===390){
      report.performance.mobile390Idle=await frames(m)
      await m.getByRole('button',{name:'暂停',exact:true}).tap(); assert((await state(m)).paused)
      await m.getByRole('button',{name:'继续',exact:true}).tap(); assert(!(await state(m)).paused)
      await birthdaySurprise(m)
      report.performance.mobile390Celebration=await frames(m,3000);await shot(m,'mobile-celebration')
      await waitPhase(m,'message');await m.waitForTimeout(850);await shot(m,'mobile-message')
      await m.getByRole('button',{name:'再看一次',exact:true}).tap();await waitPhase(m,'idle')
      report.checks.mobileTouchFlow=true
    }
    await m.close();console.log('Layout passed',label);save()
  }
  const low=await browser.newPage({viewport:{width:390,height:844}})
  await start(low,report.url+'&quality=low');report.low=await state(low)
  assert.deepEqual(report.low.budget,{near:150,far:300,dust:600,surface:1000,orbitDust:180,sparks:64,burst:120,dpr:1});assert.equal(report.low.stats.points,2774);await shot(low,'low-quality');report.checks.lowBudget=true;await low.close()
  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'})
  await start(reduced);assert((await state(reduced)).reduced);const before=await state(reduced);await reduced.waitForTimeout(700);assert.deepEqual((await state(reduced)).stats.camera,before.stats.camera);report.checks.reducedMotion=true
  // Simulate the browser visibility API, exercising the registered listener and timeline.
  await birthdaySurprise(reduced);await reduced.waitForTimeout(600)
  await reduced.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))})
  const hidden=await state(reduced);await reduced.waitForTimeout(800);assert.equal((await state(reduced)).phaseTime,hidden.phaseTime)
  await reduced.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await reduced.waitForTimeout(500);assert((await state(reduced)).phaseTime>hidden.phaseTime)
  report.checks.visibilityListenerSimulation=true;await reduced.close()
  const slow=await browser.newPage({viewport:{width:390,height:844}})
  await start(slow);await slow.waitForTimeout(3500)
  // Controlled browser frame load, not a change to the application's quality logic.
  await slow.evaluate(()=>{window.__originalRAF=requestAnimationFrame;window.requestAnimationFrame=callback=>window.__originalRAF(t=>{const until=performance.now()+48;while(performance.now()<until){}callback(t)})})
  await slow.waitForFunction(()=>window.__GALAXY__?.tier==='low',null,{timeout:15000})
  await slow.evaluate(()=>{window.requestAnimationFrame=window.__originalRAF})
  await slow.waitForTimeout(800);report.autoLow=await state(slow);assert.equal(report.autoLow.stats.points,2774)
  report.checks.automaticLowTierUnderSyntheticLoad=true;await shot(slow,'auto-low');await slow.close()
  assert.equal(report.errors.length,0,'No runtime/resource/shader errors')
  report.checks.consoleClean=true
  await browser.close()
  const noGL=await chromium.launch({...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : process.platform === 'win32' && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}),headless:true,args:['--disable-webgl','--disable-webgl2']})
  const unavailable=await noGL.newPage({viewport:{width:390,height:844}});await unavailable.goto(report.url)
  await unavailable.getByRole('heading',{name:'星河暂时无法点亮',exact:true}).waitFor();assert(await unavailable.getByRole('button',{name:/重新尝试/}).isVisible());await shot(unavailable,'webgl-unavailable');report.checks.webglFallback=true
  await noGL.close();save();console.log('ALL CHECKS PASSED',JSON.stringify(report.performance))
})().catch(e=>{report.failure=String(e.stack||e);save();console.error(e);process.exit(1)})
