/* IAB tab creation timed out; use existing isolated Playwright + local Chrome.
   This records the real animation and tests DOM cards, the clock and cake flow. */
const { chromium } = require('playwright'), sharp = require('sharp')
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path')
const out = path.resolve(process.env.QA_OUTPUT || '../docs/qa-birthday-opening-20261105')
const url = process.env.QA_URL || 'http://localhost:4174'
fs.mkdirSync(out, { recursive: true })
const report = { testedAt: new Date().toISOString(), url, browserPath: 'IAB createBrowserTab timed out after 30s; existing Playwright fallback', checks: {}, errors: [], warnings: [], layouts: [], replays: [] }
const save = () => fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2))
const state = p => p.evaluate(() => window.__GALAXY__)
const screenshot = async (p, name) => sharp(await p.screenshot()).webp({ quality: 94 }).toFile(path.join(out, name + '.webp'))
const button = (p, name) => p.getByRole('button', { name, exact: true })
const ready = p => p.waitForFunction(() => window.__GALAXY__?.openingStage === 'ready', {}, { timeout: 60000 })
const idle = p => p.waitForFunction(() => window.__GALAXY__?.phase === 'idle', {}, { timeout: 60000 })
function watch(p) {
  p.on('pageerror', e => report.errors.push(e.message))
  p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); if (m.type() === 'warning' && !report.warnings.includes(m.text())) report.warnings.push(m.text()) })
}
async function visit(p, route = '/create?qa=1') {
  watch(p); assert.equal((await p.goto(url + route)).status(), 200)
  await p.waitForFunction(() => window.__GALAXY__)
  assert.match(await p.title(), /星河生日蛋糕/)
  assert.equal(await p.locator('vite-error-overlay').count(), 0)
}
async function layout(p, label) {
  const result = await p.evaluate(() => {
    const controls = [...document.querySelectorAll('.birthday-opening button:not([hidden])')].filter(b => !b.closest('[inert]'))
    const bounds = e => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height } }
    return { width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth, cards: [...document.querySelectorAll('.wish-note')].map(bounds), letter: bounds(document.querySelector('.opening-letter')), heading: bounds(document.querySelector('.opening-heading')), footer: bounds(document.querySelector('.opening-footer')), controls: controls.map(bounds) }
  })
  report.layouts.push({ label, ...result }); save()
  assert(result.scroll <= result.width)
  assert(result.cards.every(c => c.left >= 0 && c.right <= result.width && c.top > result.heading.bottom && c.bottom < result.footer.top))
  assert(result.controls.every(c => c.width >= 44 && c.height >= 44 && c.bottom <= result.height))
  assert(result.letter.left >= 0 && result.letter.right <= result.width)
}
let browser
;(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] })
  report.browser = await browser.version()
  const context = await browser.newContext({ viewport: { width: 1585, height: 992 }, recordVideo: { dir: out, size: { width: 1585, height: 992 } } })
  await context.addInitScript(() => {
    const AudioConstructor = window.Audio
    window.__QA_AUDIO_COUNT__ = 0
    window.Audio = function (...args) { window.__QA_AUDIO_COUNT__++; const audio = new AudioConstructor(...args); window.__QA_AUDIO__ = audio; return audio }
    window.Audio.prototype = AudioConstructor.prototype
  })
  const p = await context.newPage(); await visit(p)
  assert.equal(await p.locator('.wish-note').count(), 48)
  await p.waitForFunction(() => window.__GALAXY__.openingTime > .25)
  assert.equal(await button(p, '开启星河').isEnabled(), false)
  await screenshot(p, 'desktop-title')
  report.checks.titleBeforeCardsAndEntryGated = true
  await button(p, '背景音乐已开启').click(); assert.equal(await p.evaluate(() => window.__QA_AUDIO_COUNT__), 0)
  await button(p, '定制这份生日祝福').click()
  const paused = (await state(p)).openingTime; await p.waitForTimeout(650)
  assert.equal((await state(p)).openingTime, paused)
  await p.getByLabel('寿星昵称', { exact: true }).fill('小雨')
  await p.getByLabel('发送人', { exact: true }).fill('小李')
  await p.getByLabel('生日祝福', { exact: true }).fill('愿新的一岁，\n有热爱，有回响，也有一路相伴的温柔。')
  await p.getByRole('dialog').getByRole('button', { name: '完成', exact: true }).click()
  await p.waitForFunction(() => window.__GALAXY__.openingTime > 2.5)
  const visible = await p.locator('.wish-note').evaluateAll(cards => cards.filter(c => Number(getComputedStyle(c).opacity) > .8).length)
  assert(visible > 0 && visible < 48)
  await screenshot(p, 'desktop-forming'); report.checks.progressiveCardsAndSettingsFreeze = true
  // Headless Chrome keeps all tabs visible; simulate the visibility API event,
  // as the existing regression does, rather than claiming a real OS tab switch.
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  const beforeBackground = (await state(p)).openingTime
  await p.waitForTimeout(800); assert.equal((await state(p)).openingTime, beforeBackground)
  await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')) })
  await p.waitForTimeout(200); assert((await state(p)).openingTime > beforeBackground)
  report.checks.visibilityListenerFreezeAndResumeSimulation = true
  await ready(p); assert.equal(await button(p, '开启星河').isEnabled(), true)
  assert.equal(await p.locator('.wish-note').evaluateAll(cards => cards.every(c => Number(getComputedStyle(c).opacity) === 1)), true)
  assert.match(await p.locator('.opening-letter').innerText(), /有热爱，有回响/)
  assert.equal(await button(p, '跳过开场').isVisible(), false)
  await screenshot(p, 'desktop-heart'); await layout(p, 'desktop-ready')
  report.checks.fullHeartCustomLetterAndOriginalCards = true
  await p.waitForTimeout(500); assert.equal((await state(p)).phase, 'intro'); report.checks.waitsForUserInsteadOfAutoEntering = true
  await p.locator('.opening-primary').dblclick()
  assert.equal((await state(p)).phase, 'entering'); const reset = (await state(p)).resetId
  await p.waitForFunction(() => window.__GALAXY__.phaseTime > .8)
  assert.equal(await p.locator('.birthday-opening').getAttribute('aria-hidden'), 'true')
  assert(Number(await p.locator('.birthday-opening').evaluate(e => getComputedStyle(e).opacity)) < .01)
  await idle(p); assert.equal((await state(p)).resetId, reset); assert.equal(await p.locator('.birthday-opening').count(), 0)
  assert.equal(await p.evaluate(() => window.__QA_AUDIO_COUNT__), 0)
  await screenshot(p, 'desktop-cake'); report.checks.exitFadeSingleEntryAndMutedMusic = true
  const sky = (await state(p)).sky.time; await p.waitForTimeout(500); assert((await state(p)).sky.time > sky)
  await button(p, '暂停').click(); await p.waitForTimeout(150); const frozen = (await state(p)).sky.time; await p.waitForTimeout(350); assert.equal((await state(p)).sky.time, frozen)
  await button(p, '蛋糕').click(); await button(p, '草莓粉').click()
  await p.waitForFunction(() => !window.__GALAXY__.switching)
  await p.waitForTimeout(1200); assert.equal((await state(p)).sky.color, '#d97c9a')
  await button(p, '完成').click(); await button(p, '继续').click()
  await screenshot(p, 'desktop-pink-sky'); report.checks.cakeColorSkyMotionAndPausePreserved = true
  await button(p, '开启生日惊喜').click(); await button(p, '我许好愿了').click(); await button(p, '吹灭蜡烛').click()
  await p.waitForFunction(() => window.__GALAXY__.phase === 'message', {}, { timeout: 60000 })
  assert.match(await p.locator('.birthday-wish').innerText(), /有热爱，有回响/)
  await screenshot(p, 'desktop-celebration'); report.checks.wishBlowoutCelebrationPreserved = true
  // Original cake replay never restores the new opening, and resources stay bounded.
  for (let i = 0; i < 5; i++) {
    await button(p, i ? '重播' : '再看一次').click(); await idle(p); await p.waitForTimeout(300)
    const s = await state(p); assert.equal(await p.locator('.birthday-opening').count(), 0)
    report.replays.push({ geometries: s.stats.geometries, textures: s.stats.textures, resetId: s.resetId })
  }
  assert.equal(new Set(report.replays.map(r => `${r.geometries}/${r.textures}`)).size, 1)
  report.checks.fiveCakeReplaysNoOpeningOrResourceGrowth = true
  const video = p.video(); await context.close(); await video.saveAs(path.join(out, 'opening-and-cake.webm')); fs.unlinkSync(await video.path()); save()
  for (const [width, height] of [[390, 844], [375, 667], [412, 915]]) {
    const m = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true })
    await visit(m); assert.equal(await m.locator('.wish-note').count(), 32)
    await button(m, '跳过开场').click(); assert.equal((await state(m)).openingStage, 'ready')
    await layout(m, `mobile-${width}`); await screenshot(m, `mobile-${width}-heart`)
    await button(m, '定制这份生日祝福').click()
    await m.getByLabel('寿星昵称', { exact: true }).fill('这是一个二十四字以内的特别长的寿星昵称')
    await m.getByLabel('发送人', { exact: true }).fill('来自一直陪伴你的好朋友们')
    await m.getByLabel('生日祝福', { exact: true }).fill(('愿新的一岁，勇敢去热爱，也记得珍惜自己。\n').repeat(12).slice(0, 300))
    await m.getByRole('dialog').getByRole('button', { name: '完成', exact: true }).click()
    const scroll = await m.locator('.opening-wish').evaluate(e => ({ scroll: e.scrollHeight, height: e.clientHeight }))
    assert(scroll.scroll > scroll.height); await layout(m, `mobile-${width}-long-text`); await screenshot(m, `mobile-${width}-long-text`)
    await button(m, '背景音乐已开启').click(); await button(m, '开启星河').click(); await idle(m)
    assert.equal(await m.locator('.birthday-opening').count(), 0); await m.reload(); await m.waitForFunction(() => window.__GALAXY__)
    assert.equal((await state(m)).phase, 'intro'); assert.equal((await state(m)).openingStage, 'title')
    await button(m, '跳过开场').click(); await m.goto(url + '/preview?qa=1'); await button(m, '跳过开场').click()
    assert.equal(await button(m, '定制这份生日祝福').count(), 0)
    await layout(m, `preview-${width}`); await button(m, '开启星河').click(); await idle(m)
    assert.equal(await button(m, '蛋糕').count(), 0); await m.close(); save()
  }
  report.checks.mobileHeartTouchTargetsAndLongText = true
  report.checks.skipReloadAndReadOnlyPreview = true
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); await visit(reduced)
  assert.equal((await state(reduced)).openingStage, 'ready')
  const transforms = await reduced.locator('.wish-note').evaluateAll(cards => cards.map(c => getComputedStyle(c).transform))
  await reduced.waitForTimeout(700); assert.equal((await state(reduced)).openingTime, 6.5)
  assert.deepEqual(await reduced.locator('.wish-note').evaluateAll(cards => cards.map(c => getComputedStyle(c).transform)), transforms)
  await screenshot(reduced, 'reduced-motion'); await reduced.close(); report.checks.reducedMotionImmediateHeartAndNoDrift = true
  const soundContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await soundContext.addInitScript(() => { const A = window.Audio; window.__QA_AUDIO_COUNT__ = 0; window.Audio = function (...args) { window.__QA_AUDIO_COUNT__++; const audio = new A(...args); window.__QA_AUDIO__ = audio; return audio }; window.Audio.prototype = A.prototype })
  const s = await soundContext.newPage(); await visit(s); await button(s, '跳过开场').click(); assert.equal(await s.evaluate(() => window.__QA_AUDIO_COUNT__), 0)
  await button(s, '开启星河').click(); await idle(s); await s.waitForFunction(() => window.__QA_AUDIO__?.readyState >= 2 && !window.__QA_AUDIO__.paused)
  assert.equal(await s.evaluate(() => window.__QA_AUDIO_COUNT__), 1); await soundContext.close(); report.checks.soundOnlyStartsAfterEntryClick = true
  assert.equal(report.errors.length, 0); report.checks.noRuntimeErrors = true; save(); await browser.close()
  console.log('OPENING PASSED', JSON.stringify(report.checks))
})().catch(async e => { report.failure = e.stack; save(); console.error(e); await browser?.close(); process.exitCode = 1 })
