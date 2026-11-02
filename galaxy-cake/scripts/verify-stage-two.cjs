const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const out = path.resolve(process.env.QA_OUTPUT || '../docs/qa-stage-two')
fs.mkdirSync(out, { recursive: true })
const url = process.env.QA_URL || 'http://localhost:4173/?qa=1'
const report = { testedAt: new Date().toISOString(), url, checks: {}, errors: [], warnings: [], presets: [], cycles: [], layouts: [], performance: {} }
let activeBrowser
const save = () => fs.writeFileSync(path.join(out, 'stage-two-results.json'), JSON.stringify(report, null, 2))
const state = page => page.evaluate(() => window.__GALAXY__)
const shot = (page, name) => page.screenshot({ path: path.join(out, `${name}.png`) })
const waitPhase = (page, phase) => page.waitForFunction(phase => window.__GALAXY__?.phase === phase, phase, { timeout: 25000 })
function watch(page) {
  page.on('pageerror', error => report.errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); if (message.type() === 'warning') report.warnings.push(message.text()) })
}
async function enter(page, target = url) {
  watch(page); await page.goto(target)
  await page.getByRole('button', { name: '开启星河', exact: true }).click()
  await waitPhase(page, 'idle'); await page.locator('.control-bar').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)))
}
async function open(page, section) {
  await page.getByRole('button', { name: section, exact: true }).click()
  await page.getByRole('dialog').waitFor()
}
async function done(page) {
  await page.getByRole('button', { name: '完成', exact: true }).click()
  await page.waitForFunction(() => !window.__GALAXY__.assembling)
  await page.waitForTimeout(350)
}
async function selectCake(page, style, name) {
  await open(page, '蛋糕')
  const before = Date.now()
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForFunction(style => window.__GALAXY__.config.cakeStyle === style && !window.__GALAXY__.switching, style)
  const durationMs = Date.now() - before
  await done(page); await page.waitForTimeout(200)
  const s = await state(page)
  report.presets.push({ style, durationMs, color: s.config.cakeColor, geometries: s.stats.geometries })
  await shot(page, `cake-${style}`)
}
async function wishAndBlow(page, capture = false) {
  await page.getByRole('button', { name: '开启生日惊喜', exact: true }).click()
  await waitPhase(page, 'wishing')
  assert.equal(await page.getByRole('button', { name: '吹灭蜡烛', exact: true }).count(), 0)
  if (capture) await shot(page, 'wish-before')
  await page.getByRole('button', { name: '我许好愿了', exact: true }).click()
  assert((await state(page)).wishConfirmed)
  if (capture) await shot(page, 'wish-confirmed')
  await page.getByRole('button', { name: '吹灭蜡烛', exact: true }).click()
  await waitPhase(page, 'blowout')
  if (capture) {
    await page.waitForFunction(() => window.__GALAXY__.blownAt >= 0 && window.__GALAXY__.motion.ignition < .02)
    const s = await state(page)
    assert(s.motion.energy < 1); assert.equal(s.stats.flames, 0)
    await shot(page, 'blowout-smoke')
  }
  await waitPhase(page, 'celebration')
}
async function frames(page, ms = 2200) {
  return page.evaluate(ms => new Promise(resolve => {
    const start = performance.now(), intervals = []; let previous = start
    function tick(time) {
      intervals.push(time - previous); previous = time
      if (time - start >= ms) { const a = intervals.slice(1).sort((x, y) => x - y); resolve({ fps: a.length / ((time - start) / 1000), p95ms: a[Math.floor(a.length * .95)], frames: a.length }) }
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }), ms)
}
async function layout(page, label) {
  const result = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, buttons: [...document.querySelectorAll('.control-bar button')].map(button => { const r = button.getBoundingClientRect(); return { text: button.innerText, width: r.width, height: r.height, bottom: r.bottom } }) }))
  assert(result.scrollWidth <= result.width)
  report.layouts.push({ label, ...result }); save()
  assert(result.buttons.every(button => button.width >= 43.99 && button.height >= 43.99 && button.bottom <= result.height + .01))
  await shot(page, label)
}

;(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] })
  activeBrowser = browser
  report.browser = await browser.version()
  const p = await browser.newPage({ viewport: { width: 1585, height: 992 }, deviceScaleFactor: 1 })
  await enter(p); await layout(p, 'desktop-default')
  assert.match(await p.title(), /星河生日蛋糕/)
  assert.equal(await p.locator('canvas').count(), 1); assert.equal(await p.locator('vite-error-overlay').count(), 0)
  report.checks.pageAndScene = true

  await p.getByRole('button', { name: '暂停', exact: true }).click()
  const frozen = await state(p); await p.waitForTimeout(500)
  assert.equal((await state(p)).time, frozen.time); assert.equal((await state(p)).orbitTime, frozen.orbitTime)
  report.checks.pause = true
  for (const [style, name] of [['strawberry', '草莓粉'], ['cream', '奶油白'], ['purple', '紫色梦境'], ['heart', '情侣爱心'], ['galaxy', '星河蓝']]) await selectCake(p, style, name)
  assert(report.presets.every(preset => preset.durationMs >= 400 && preset.durationMs < 6000))
  assert.equal((await state(p)).time, frozen.time, 'Cake transitions work while simulation is paused')
  report.checks.fiveAnimatedCakePresets = true

  const beforeColor = crypto.createHash('sha256').update(await p.screenshot({ clip: { x: 700, y: 510, width: 150, height: 75 } })).digest('hex')
  await open(p, '蛋糕'); await p.getByLabel('自定义蛋糕颜色', { exact: true }).fill('#75b8ad'); await done(p); await p.waitForTimeout(200)
  assert.equal((await state(p)).config.cakeColor, '#75b8ad')
  const afterColor = crypto.createHash('sha256').update(await p.screenshot({ clip: { x: 700, y: 510, width: 150, height: 75 } })).digest('hex')
  assert.notEqual(afterColor, beforeColor, 'Actual cake pixels change while time and camera are frozen')
  await shot(p, 'custom-cake-color'); report.checks.liveCakeColor = true

  await open(p, '蜡烛'); await p.getByRole('button', { name: '数字蜡烛', exact: true }).click()
  for (const age of [0, 18, 120]) { await p.getByLabel('年龄', { exact: true }).fill(String(age)); assert.equal((await state(p)).config.age, age) }
  await p.getByLabel('年龄', { exact: true }).fill('999')
  assert.equal(await p.getByLabel('年龄', { exact: true }).getAttribute('aria-invalid'), 'true')
  assert.equal((await state(p)).config.age, 120)
  await p.getByLabel('年龄', { exact: true }).fill('18')
  await p.getByRole('button', { name: '关闭火焰', exact: true }).click()
  await p.waitForFunction(() => !window.__GALAXY__.lighting)
  assert.equal((await state(p)).motion.ignition, 0)
  await p.getByRole('dialog').getByRole('button', { name: '点燃蜡烛', exact: true }).click()
  await p.waitForFunction(() => !window.__GALAXY__.lighting)
  await done(p); await p.waitForTimeout(250)
  assert.equal((await state(p)).stats.flames, 2)
  await shot(p, 'number-candles-18'); report.checks.numberCandlesAndAgeBounds = true; report.checks.flameControls = true

  await open(p, '祝福')
  await p.getByLabel('寿星昵称', { exact: true }).fill('')
  assert.equal((await state(p)).config.recipient, '')
  await p.getByLabel('寿星昵称', { exact: true }).fill('小星')
  await p.getByLabel('生日', { exact: true }).fill('2026-11-20')
  await p.getByLabel('发送人', { exact: true }).fill('小李')
  await p.getByLabel('生日祝福', { exact: true }).fill('星'.repeat(400))
  assert.equal((await state(p)).config.message.length, 300)
  await p.getByLabel('生日祝福', { exact: true }).fill('愿你眼里有星河，\n心中有热爱。')
  await shot(p, 'blessing-panel'); await done(p)
  assert.match(await p.locator('.recipient').innerText(), /小星/)
  report.checks.editableBirthdayInformation = true

  await open(p, '星河')
  for (const [id, name] of [['rose', '浪漫粉河'], ['blue', '银河蓝'], ['gold', '金色生日'], ['rainbow', '彩虹星河'], ['dream', '梦幻星河']]) {
    await p.getByRole('button', { name, exact: true }).click(); assert.equal((await state(p)).config.galaxyTheme, id)
  }
  const slider = p.getByRole('slider', { name: '星河强度', exact: true })
  await slider.focus(); await slider.press('Home'); assert.equal((await state(p)).budget.near, 100)
  const smallDust = (await state(p)).budget.dust
  await slider.press('End'); assert.equal((await state(p)).budget.near, 600); assert((await state(p)).budget.dust > smallDust)
  await p.getByRole('checkbox', { name: '漂浮星点', exact: true }).uncheck(); assert.equal((await state(p)).config.galaxyEnabled, false)
  await p.getByRole('checkbox', { name: '漂浮星点', exact: true }).check()
  await p.getByRole('button', { name: '1.5×', exact: true }).click(); await shot(p, 'galaxy-panel'); await done(p)
  report.checks.particleThemesAndDensity = true; report.checks.particleToggle = true
  await p.getByRole('button', { name: '继续', exact: true }).click()
  const speedStart = await state(p); await p.waitForTimeout(550); const speedEnd = await state(p)
  const ratio = (speedEnd.orbitTime - speedStart.orbitTime) / (speedEnd.time - speedStart.time)
  assert(Math.abs(ratio - 1.5) < .03); report.checks.galaxySpeedUsesSceneClock = true

  await p.getByRole('button', { name: '开启生日惊喜', exact: true }).click(); await waitPhase(p, 'wishing')
  await p.getByRole('button', { name: '我许好愿了', exact: true }).click(); await p.keyboard.press('Escape')
  await waitPhase(p, 'idle'); assert.equal((await state(p)).wishConfirmed, false)
  report.checks.wishCancelAndReset = true
  for (let i = 0; i < 5; i++) {
    if (i) { await p.getByRole('button', { name: '再看一次', exact: true }).click(); await waitPhase(p, 'idle'); await p.waitForTimeout(300) }
    await wishAndBlow(p, i === 0)
    if (!i) {
      report.performance.desktopCelebration = await frames(p)
      await p.waitForFunction(() => window.__GALAXY__.phaseTime > 3.85)
      assert((await state(p)).stats.confetti > 0)
      await shot(p, 'celebration')
    }
    await waitPhase(p, 'message'); await p.waitForTimeout(600)
    const s = await state(p)
    assert.equal(s.stats.flames, 0); assert.equal(s.config.recipient, '小星')
    assert.match(await p.locator('.birthday-name').innerText(), /小星/)
    assert.equal(await p.locator('.birthday-wish').innerText(), '愿你眼里有星河，\n心中有热爱。')
    assert.match(await p.locator('.birthday-from').innerText(), /小李/)
    report.cycles.push({ cycle: i + 1, geometries: s.stats.geometries, textures: s.stats.textures, flames: s.stats.flames, phase: s.phase })
    if (!i) { await shot(p, 'birthday-message'); await p.waitForFunction(() => window.__GALAXY__.phaseTime > 8.2); assert.equal((await state(p)).stats.confetti, 0); assert.equal((await state(p)).stats.smoke, 0) }
    console.log('Wish/blow/replay', i + 1, report.cycles.at(-1)); save()
  }
  assert.equal(new Set(report.cycles.map(c => `${c.geometries}/${c.textures}`)).size, 1)
  report.checks.guardedWishBlowoutCelebration = true; report.checks.smokeAndConfettiLifetime = true
  report.checks.personalizedBirthdayMessage = true; report.checks.fiveReplayCyclesKeepConfigAndResources = true
  await p.close()

  for (const [width, height] of [[390, 844], [375, 667], [412, 915]]) {
    const m = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true })
    await enter(m); await layout(m, `mobile-${width}`)
    for (const section of ['蛋糕', '星河', '祝福', '蜡烛']) {
      await open(m, section)
      const bounds = await m.getByRole('dialog').boundingBox()
      assert(bounds.x >= -.5 && bounds.y >= -.5 && bounds.x + bounds.width <= width + .5 && bounds.y + bounds.height <= height + .5)
      await m.getByRole('button', { name: '完成', exact: true }).tap()
    }
    await open(m, '蛋糕'); await m.getByRole('button', { name: '情侣爱心', exact: true }).tap()
    await m.waitForFunction(() => !window.__GALAXY__.switching && window.__GALAXY__.config.cakeStyle === 'heart'); await done(m)
    await open(m, '蜡烛'); await m.getByRole('button', { name: '数字蜡烛', exact: true }).tap(); await m.getByLabel('年龄', { exact: true }).fill('18')
    await shot(m, `mobile-${width}-settings`); await done(m); await shot(m, `mobile-${width}-heart`)
    if (width === 390) {
      await open(m, '星河'); const range = m.getByRole('slider', { name: '星河强度', exact: true }); await range.focus(); await range.press('End'); assert((await state(m)).budget.near <= 300); await done(m)
      report.performance.mobileIdle = await frames(m)
      await wishAndBlow(m); await m.waitForFunction(() => window.__GALAXY__.phaseTime > 3.85); await shot(m, 'mobile-celebration')
      await waitPhase(m, 'message'); await shot(m, 'mobile-message')
    }
    await m.close(); console.log('Mobile panels passed', width); save()
  }
  report.checks.mobileSheetsAndControls = true; report.checks.mobileHeartNumberCandlesAndCelebration = true
  const low = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await enter(low, `${url}&quality=low`); await open(low, '星河'); await low.getByRole('slider', { name: '星河强度', exact: true }).focus(); await low.getByRole('slider', { name: '星河强度', exact: true }).press('End'); await done(low)
  assert.equal((await state(low)).budget.near, 150); assert.equal((await state(low)).budget.dpr, 1); await shot(low, 'low-quality'); await low.close()
  report.checks.performanceCaps = true
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await enter(reduced); assert((await state(reduced)).reduced); await wishAndBlow(reduced); await waitPhase(reduced, 'message'); await reduced.close()
  report.checks.reducedMotionFlow = true
  assert.equal(report.errors.length, 0); report.checks.consoleNoErrors = true
  await browser.close(); save(); console.log('STAGE TWO PASSED', JSON.stringify(report.checks))
})().catch(async error => { report.failure = String(error.stack || error); save(); console.error(error); await activeBrowser?.close(); process.exitCode = 1 })
