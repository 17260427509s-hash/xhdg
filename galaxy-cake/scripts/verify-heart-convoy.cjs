/* IAB was unavailable (30s creation timeout). Existing local Playwright/Chrome.
   A passive rAF observer measures the real DOM; it never advances the app clock. */
const { chromium } = require('playwright'), sharp = require('sharp')
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path')
const url = process.env.QA_URL || 'http://localhost:4174', out = path.resolve(process.env.QA_OUTPUT || '../docs/qa-heart-convoy-20261105')
fs.mkdirSync(out, { recursive: true })
const report = { testedAt: new Date().toISOString(), url, checks: {}, runs: [], errors: [], warnings: [] }
const save = () => fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2))
const state = p => p.evaluate(() => window.__GALAXY__)
const shot = async (p, name) => sharp(await p.screenshot()).webp({ quality: 94 }).toFile(path.join(out, name + '.webp'))
const sampleTimes = [1.5, 2.5, 3.5, 4.5, 5, 5.8]
function observe() {
  const data = window.__HEART_MOTION__ = { samples: [], arrivals: [], clipped: [], maxOverlap:0,textClipped:[],titleInside: null }
  const wanted = [1.5, 2.5, 3.5, 4.5, 5, 5.8], seen = new Set()
  let lastBoundsCheck = -1
  const bounds = e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, left: r.left, right: r.right, top: r.top, bottom: r.bottom } }
  function read() {
    const engine = window.__GALAXY__, heart = document.querySelector('.opening-heart')
    if (!engine || !heart) { requestAnimationFrame(read); return }
    const time = engine.openingTime, cards = [...heart.querySelectorAll('.wish-note')], rect = heart.getBoundingClientRect()
    for (let i = 0; i < cards.length; i++) {
      const opacity = Number(getComputedStyle(cards[i]).opacity)
      if (opacity > .02 && !seen.has(i)) { seen.add(i); const c = bounds(cards[i]); data.arrivals.push({ i, time, dx: (c.x - rect.x - rect.width / 2) / rect.width, dy: (c.y - rect.y - rect.height / 2) / rect.height }) }
      if (opacity > .02 && time - lastBoundsCheck > .12) {
        const c = bounds(cards[i]), footer = document.querySelector('.opening-footer').getBoundingClientRect()
        if (c.left < rect.left-.5 || c.right > rect.right+.5 || c.top < rect.top-.5 || c.bottom > rect.bottom+.5 || c.bottom>footer.top) data.clipped.push({ i, time, ...c, viewport: [innerWidth, innerHeight], footerTop: footer.top })
      }
    }
    if (time - lastBoundsCheck > .12) {
      const visible=cards.filter(c=>Number(getComputedStyle(c).opacity)>.02)
      for(let i=0;i<visible.length;i++){
        const a=visible[i].getBoundingClientRect(),text=visible[i].querySelector('p')
        if(text.scrollHeight>text.clientHeight||visible[i].scrollHeight>visible[i].clientHeight)data.textClipped.push({i,time})
        for(let j=i+1;j<visible.length;j++){const b=visible[j].getBoundingClientRect(),area=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));data.maxOverlap=Math.max(data.maxOverlap,area/(visible[i].offsetWidth*visible[i].offsetHeight))}
      }
      lastBoundsCheck = time
    }
    const next = wanted[data.samples.length]
    if (next !== undefined && time >= next) {
      const heading = bounds(document.querySelector('.opening-heading'))
      data.samples.push({ target: next, time, width: innerWidth, height: innerHeight, heart: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width, height: rect.height }, heading, cards: [0, 2, 4].map(i => ({ i, ...bounds(cards[i]), opacity: Number(getComputedStyle(cards[i]).opacity) })) })
    }
    if (time < 6) requestAnimationFrame(read)
  }
  requestAnimationFrame(read)
}
let browser
;(async () => {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] })
  report.browser = await browser.version()
  for (const [width, height] of [[1440, 900], [390, 844], [360, 640], [375, 667], [412, 915]]) {
    const desktop = width > 700
    const context = await browser.newContext({ viewport: { width, height }, ...(!desktop ? { isMobile: true, hasTouch: true } : { recordVideo: { dir: out, size: { width, height } } }) })
    await context.addInitScript(observe)
    const p = await context.newPage()
    p.on('pageerror', e => report.errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); if (m.type() === 'warning' && !report.warnings.includes(m.text())) report.warnings.push(m.text()) })
    assert.equal((await p.goto(url + '/create?qa=1')).status(), 200)
    await p.waitForFunction(() => window.__GALAXY__?.openingTime > .3)
    assert.match(await p.title(), /星河生日蛋糕/); assert.equal(await p.locator('vite-error-overlay').count(), 0)
    const count=await p.locator('.wish-note').count();assert(count>=20&&count<=(desktop?48:32))
    if (desktop) await shot(p, 'desktop-title')
    for (const [time, name] of [[1.5, 'left'], [2.9, 'tip'], [4.4, 'right']]) {
      await p.waitForFunction(t => window.__GALAXY__.openingTime >= t, time)
      if (desktop) { assert.equal(Number(await p.locator('.opening-letter').evaluate(e => getComputedStyle(e).opacity)), 0); await shot(p, `desktop-${name}`) }
    }
    await p.waitForFunction(() => window.__HEART_MOTION__.samples.length === 6, {}, { timeout: 60000 })
    const observed = await p.evaluate(() => window.__HEART_MOTION__)
    report.runs.push({ width, height, ...observed }); save()
    assert.equal(observed.arrivals.length, count)
    assert(observed.arrivals.every(a => Math.abs(a.dx) < .09 && Math.abs(a.dy + .234375) < .14), 'All cards enter at the same upper notch')
    assert.equal(observed.clipped.length, 0, 'All moving cards stay above the footer and inside the viewport')
    assert(observed.maxOverlap<.25,'Any pair overlaps by less than 25% throughout the queue')
    assert.equal(observed.textClipped.length,0,'All card text fits')
    assert(Number(await p.locator('.opening-heading').evaluate(e=>getComputedStyle(e).opacity))===0)
    assert.equal(await p.locator('.opening-letter').evaluate(e=>getComputedStyle(e).backgroundImage.includes('rgba')),false)
    const first = observed.samples[0], left = observed.samples[1], right = observed.samples[3]
    assert(first.cards[0].x < first.heart.x - first.heart.width * .15)
    assert(right.cards[0].x > right.heart.x + right.heart.width * .15)
    assert(left.cards[0].y > left.cards[1].y && left.cards[1].y > left.cards[2].y, 'At least three cards follow in order down the left side')
    for (let c = 0; c < 3; c++) {
      const points = observed.samples.slice(0, 5).map(s => s.cards[c])
      let traveled = 0; for (let j = 1; j < points.length; j++) traveled += Math.hypot(points[j].x - points[j - 1].x, points[j].y - points[j - 1].y)
      assert(traveled > (desktop ? 700 : 300), 'Same card visibly travels around the heart, beyond a short fade-in')
    }
    const heading = first.heading
    assert(Math.abs(heading.x - first.heart.x) < 2 && Math.abs(heading.y - first.heart.y) < 10, 'Birthday title sits inside the heart')
    assert.equal((await state(p)).openingStage, 'ready')
    const frozen = await p.locator('.wish-note').evaluateAll(notes => notes.map(n => getComputedStyle(n).transform))
    await p.waitForTimeout(850)
    assert.deepEqual(await p.locator('.wish-note').evaluateAll(notes => notes.map(n => getComputedStyle(n).transform)), frozen)
    assert.equal(await p.locator('.opening-heart').evaluate(e => getComputedStyle(e).transform), 'none')
    assert.equal(await p.getByRole('button', { name: '开启星河', exact: true }).isEnabled(), true)
    await shot(p, desktop ? 'desktop-complete' : `mobile-${width}-complete`)
    if (desktop) {
      await p.getByRole('button', { name: '背景音乐已开启', exact: true }).click()
      await p.getByRole('button', { name: '开启星河', exact: true }).click()
      await p.waitForFunction(() => window.__GALAXY__.phase === 'idle')
      await shot(p, 'desktop-cake')
    }
    const video = p.video(); await context.close()
    if (video) { await video.saveAs(path.join(out, 'heart-convoy.webm')); fs.unlinkSync(await video.path()) }
    save()
  }
  report.checks.commonEntryLeftTipRightAndClosure = true
  report.checks.sameThreeCardsTravelContinuouslyInOrder = true
  report.checks.noPrematureCentralCard = true
  report.checks.titleInsideHeartAndNoClipping = true
  report.checks.fourViewportsAndFinalStop = true
  // Resize while the queue is in flight. It must not restart or disappear.
  const resize = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await resize.goto(url + '/create?qa=1'); await resize.waitForFunction(() => window.__GALAXY__?.openingTime > 2)
  const before = (await state(resize)).openingTime; await resize.setViewportSize({ width: 412, height: 915 }); await resize.waitForTimeout(180)
  assert((await state(resize)).openingTime >= before && (await state(resize)).openingTime < 5.8)
  assert((await resize.locator('.wish-note').count())>=20&&(await resize.locator('.wish-note').count())<=32)
  await resize.getByRole('button', { name: '跳过开场', exact: true }).click()
  assert.equal((await state(resize)).openingStage, 'ready')
  assert.equal(await resize.locator('.wish-note').evaluateAll(notes => notes.every(n => Number(getComputedStyle(n).opacity) === 1)), true)
  await resize.close(); report.checks.resizePreservesProgressAndSkipCompletes = true
  assert.equal(report.errors.length, 0); report.checks.noRuntimeErrors = true; save(); await browser.close()
  console.log('HEART CONVOY PASSED', JSON.stringify(report.checks))
})().catch(async e => { report.failure = e.stack; save(); console.error(e); await browser?.close(); process.exitCode = 1 })
