/* Production-browser regression and real recordings for label-free pastry morphs.
   Uses the existing isolated Playwright installation; no application dependencies. */
const { chromium } = require('playwright')
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const out = path.resolve(process.env.QA_OUTPUT || '../docs/qa-cake-switch')
fs.mkdirSync(out, { recursive: true })
const url = process.env.QA_URL || 'http://localhost:4173/?qa=1'
const report = { testedAt: new Date().toISOString(), url, checks: {}, errors: [], warnings: [], presets: [], transitions: [], resources: [], layouts: [], recordings: [] }
const save = () => fs.writeFileSync(path.join(out, 'switch-results.json'), JSON.stringify(report, null, 2))
const state = p => p.evaluate(() => window.__GALAXY__)
const settle = p => p.waitForFunction(() => !window.__GALAXY__.switching && !window.__GALAXY__.assembling && !window.__GALAXY__.lighting)
const presets = ['星河蓝', '草莓粉', '奶油白', '紫色梦境', '情侣爱心']
const shot = (p, name, options = {}) => p.screenshot({ path: path.join(out, name + '.png'), ...options })
function watch(p) {
  p.on('pageerror', e => report.errors.push(e.message))
  p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); if (m.type() === 'warning') report.warnings.push(m.text()) })
}
async function enter(p) {
  watch(p); await p.goto(url); await p.getByRole('button', { name: '开启星河', exact: true }).click()
  await p.waitForFunction(() => window.__GALAXY__?.phase === 'idle'); await p.waitForTimeout(900)
  assert.equal(await p.locator('vite-error-overlay').count(), 0)
}
const button = (p, name) => p.getByRole('dialog').getByRole('button', { name, exact: true })
async function noLabels(p) {
  assert.equal(await p.locator('.cake-part-label,.selectable-part-label,[aria-label^="编辑第 "]').count(), 0)
  assert.equal(await p.locator('canvas').count(), 1)
}
async function open(p) { await p.getByRole('button', { name: '蛋糕', exact: true }).click(); await settle(p); await noLabels(p); assert.equal((await state(p)).motion.spread, 0); assert.equal(await button(p, '分层预览').count(), 0); assert.equal(await button(p, '合拢预览').count(), 0) }
async function choose(p, name) { await button(p, name).click(); await settle(p) }
async function close(p) { await button(p, '完成').click(); await settle(p); await noLabels(p) }
async function sampleSwitch(p, name, mode) {
  const expectedPoints = (await state(p)).stats.points
  // Observe animation using the read-only QA getter, driven by real button input.
  const samples = p.evaluate(() => new Promise(resolve => {
    const start = performance.now(), frames = []
    function sample() {
      const s = window.__GALAXY__
      frames.push({ at: performance.now() - start, switching: s.switching, transition: s.transition,
        tiers: s.visualCake.tiers.map(t => ({ ...t })), candle: { y: s.visualCake.candle.y, scale: s.visualCake.candle.scale, anchors: s.visualCake.candle.anchors.map(a => [...a]) },
        spread: s.motion.spread, points: s.stats.points, reveal: s.motion.cakeReveal })
      if (performance.now() - start < 1500) requestAnimationFrame(sample); else resolve(frames)
    }
    requestAnimationFrame(sample)
  }))
  await button(p, name).click(); await settle(p)
  const frames = await samples, moving = frames.filter(f => f.transition)
  assert(moving.length >= 2, 'Observed real intermediate frames')
  assert(moving.every(f => f.transition.mode === mode))
  assert(frames.every(f => f.reveal === 1), 'Pastry is never faded out during a style switch')
  assert(frames.every(f => f.tiers.some(t => t.active > .5 && t.width > .1 && t.height > .1)), 'A complete body remains visible')
  assert(frames.every(f => f.points <= expectedPoints), 'Surface particle budget is not duplicated')
  for (let i = 1; i < frames.length; i++) {
    assert(Math.abs(frames[i].candle.anchors[0][1] - frames[i - 1].candle.anchors[0][1]) < .22, 'No wick mounting jump')
  }
  report.transitions.push({ name, mode, expectedPoints, frames }); save()
}
async function fps(p) {
  return p.evaluate(() => new Promise(resolve => {
    const start = performance.now(); let n = 0
    function frame(t) { n++; if (t - start > 2500) resolve(n * 1000 / (t - start)); else requestAnimationFrame(frame) }
    requestAnimationFrame(frame)
  }))
}
let browser
;(async () => {
  browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] })
  report.browser = await browser.version()
  const p = await browser.newPage({ viewport: { width: 1585, height: 992 } })
  await enter(p); await noLabels(p); await shot(p, 'desktop-default')
  await p.getByRole('button', { name: '暂停', exact: true }).click()
  await shot(p, 'pastry-detail', { clip: { x: 565, y: 325, width: 460, height: 355 } })
  await open(p)
  const frozen = (await state(p)).time
  await sampleSwitch(p, '紫色梦境', 'assembled'); assert.equal((await state(p)).time, frozen)
  assert.equal((await state(p)).motion.spread, 0)
  await shot(p, 'desktop-editor')
  await sampleSwitch(p, '草莓粉', 'assembled')
  assert.equal((await state(p)).motion.spread, 0)
  await shot(p, 'desktop-assembled-editor')
  report.checks.assembledSwitchesContinuousWhilePaused = true
  for (let i = 0; i < presets.length; i++) {
    await choose(p, presets[i]); await close(p); await p.waitForTimeout(250)
    await noLabels(p); await shot(p, `preset-${['galaxy', 'strawberry', 'cream', 'purple', 'heart'][i]}`)
    if (i === 1) await shot(p, 'strawberry-detail', { clip: { x: 540, y: 310, width: 510, height: 370 } })
    if (i === 3) await shot(p, 'crystal-detail', { clip: { x: 540, y: 250, width: 510, height: 440 } })
    if (i < 2) {
      await p.mouse.move(785, 570); await p.mouse.down(); await p.mouse.move(985, 585, { steps: 24 }); await p.mouse.up(); await p.waitForTimeout(600)
      await shot(p, `${i === 0 ? 'galaxy' : 'strawberry'}-oblique`)
    }
    report.presets.push({ name: presets[i], config: (await state(p)).config }); await open(p)
  }
  report.checks.fiveDistinctPastryRecipesAndNoLabels = true
  await button(p, '紫色梦境').click({ force: true }); await button(p, '情侣爱心').click({ force: true }); await button(p, '草莓粉').click({ force: true }); await settle(p)
  assert.equal((await state(p)).config.cakeStyle, 'strawberry'); report.checks.lastQueuedSelectionWins = true
  const desired = (await state(p)).config
  await choose(p, '撤销'); assert.notEqual((await state(p)).config.cakeStyle, 'strawberry')
  await choose(p, '重做'); assert.deepEqual((await state(p)).config, desired); report.checks.switchHistory = true
  await button(p, '紫色梦境').click(); await button(p, '完成').click(); await settle(p)
  assert.equal((await state(p)).editing, false); assert.equal((await state(p)).motion.spread, 0)
  assert.equal((await state(p)).config.cakeStyle, 'purple'); report.checks.finishDuringSwitch = true
  await open(p)
  for (let i = 0; i < 5; i++) {
    for (const preset of presets) await choose(p, preset)
    await p.waitForTimeout(500)
    const s = await state(p); report.resources.push({ geometries: s.stats.geometries, textures: s.stats.textures })
    console.log('Morph resource cycle', i + 1, report.resources.at(-1)); save()
  }
  assert.equal(new Set(report.resources.map(s => JSON.stringify(s))).size, 1); report.checks.twentyFiveSwitchesResourcesStable = true
  await close(p); await p.getByRole('button', { name: '继续', exact: true }).click(); report.desktopIdleFps = await fps(p)
  await p.close()
  for (const [width, height] of [[390, 844], [375, 667], [412, 915]]) {
    const mobile = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true })
    await enter(mobile); await open(mobile); await choose(mobile, '紫色梦境'); await noLabels(mobile)
    const layout = await mobile.evaluate(() => ({ width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth, canvas: document.querySelector('canvas').getBoundingClientRect().toJSON(), panel: document.querySelector('dialog[open]').getBoundingClientRect().toJSON(), buttons: [...document.querySelectorAll('dialog[open] button')].map(b => b.getBoundingClientRect().toJSON()) }))
    assert(layout.scroll <= width); assert(layout.canvas.bottom <= layout.panel.top); assert(layout.panel.bottom <= height)
    assert(layout.buttons.every(b => b.width >= 44 && b.height >= 44)); report.layouts.push(layout)
    await shot(mobile, `mobile-${width}-assembled-editor`)
    await close(mobile); await shot(mobile, `mobile-${width}`); await mobile.close()
  }
  report.checks.threePhoneLayouts = true
  const reduced = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await reduced.emulateMedia({ reducedMotion: 'reduce' }); await enter(reduced); await open(reduced)
  await sampleSwitch(reduced, '紫色梦境', 'assembled')
  const reducedFrames = report.transitions.at(-1).frames.filter(f => f.transition)
  assert(reducedFrames.at(-1).at - reducedFrames[0].at < 260, 'Reduced motion transition is brief')
  await reduced.close(); report.checks.reducedSwitchMotion = true
  const low = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  watch(low); await low.goto(url + '&quality=low'); await low.getByRole('button', { name: '开启星河', exact: true }).click()
  await low.waitForFunction(() => window.__GALAXY__?.phase === 'idle'); await low.waitForTimeout(800)
  await open(low); await sampleSwitch(low, '紫色梦境', 'assembled')
  assert.equal((await state(low)).stats.points, 2774); await low.close(); report.checks.lowTierSurfacePool = true
  for (const mode of ['assembled']) {
    const context = await browser.newContext({ viewport: { width: 1585, height: 992 }, recordVideo: { dir: out, size: { width: 1585, height: 992 } } })
    const page = await context.newPage(); await enter(page); await open(page)
    for (const preset of presets.slice(1)) { await choose(page, preset); await page.waitForTimeout(500) }
    const video = page.video(); await context.close(); await video.saveAs(path.join(out, `switch-${mode}.webm`))
    fs.unlinkSync(await video.path()); report.recordings.push(`switch-${mode}.webm`); save()
  }
  report.checks.actualScreenRecordings = true
  assert.equal(report.errors.length, 0, 'No page, runtime or shader errors')
  report.checks.consoleClean = true; save(); await browser.close(); console.log('CAKE SWITCH CHECKS PASSED', report.checks)
})().catch(async error => { report.failure = error.stack; save(); console.error(error); await browser?.close(); process.exitCode = 1 })
