const { chromium } = require('playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto')
const out = path.resolve(process.env.QA_OUTPUT || '../docs/qa-layer-editor')
fs.mkdirSync(out, { recursive: true })
const url = process.env.QA_URL || 'http://localhost:4173/?qa=1'
const report = { testedAt: new Date().toISOString(), url, checks: {}, errors: [], warnings: [], resources: [], layouts: [] }
const save = () => fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 2))
const state = p => p.evaluate(() => window.__GALAXY__)
const settle = p => p.waitForFunction(() => !window.__GALAXY__.switching && !window.__GALAXY__.assembling && !window.__GALAXY__.lighting)
const shot = (p, n) => p.screenshot({ path: path.join(out, n + '.png') })
let browser
function watch(p) {
  p.on('pageerror', e => report.errors.push(e.message))
  p.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); if (m.type() === 'warning') report.warnings.push(m.text()) })
}
async function enter(p, target = url) {
  watch(p); await p.goto(target)
  assert.match(await p.title(), /星河生日蛋糕/)
  await p.getByRole('button', { name: '开启星河', exact: true }).click()
  await p.waitForFunction(() => window.__GALAXY__?.phase === 'idle')
  await p.waitForTimeout(800)
  assert.equal(await p.locator('.unavailable').isVisible(), false)
}
async function open(p) { await p.getByRole('button', { name: '蛋糕', exact: true }).click(); await settle(p) }
async function click(p, name) { await p.getByRole('dialog').getByRole('button', { name, exact: true }).click(); await settle(p) }
async function layer(p, n) { await p.getByRole('tab', { name: '蛋糕', exact: true }).click(); await p.getByRole('group', { name: '编辑范围', exact: true }).getByRole('button', { name: `第 ${n} 层`, exact: true }).click(); assert.equal((await state(p)).selectedLayer, n - 1); assert.equal((await state(p)).settings, 'cake') }
async function close(p) { await click(p, '完成'); await p.waitForTimeout(500); assert.equal((await state(p)).motion.spread, 0) }
async function layout(p, label) {
  const b = await p.evaluate(() => ({ width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth,
    canvas: document.querySelector('canvas').getBoundingClientRect().toJSON(), panel: document.querySelector('dialog[open]').getBoundingClientRect().toJSON(),
    buttons: [...document.querySelectorAll('dialog[open] button')].map(el => ({ text: el.innerText, ...el.getBoundingClientRect().toJSON() })) }))
  report.layouts.push({ label, ...b }); save()
  assert(b.scroll <= b.width)
  assert(b.panel.left >= 0 && b.panel.right <= b.width + .01 && b.panel.bottom <= b.height + .01)
  assert(b.buttons.every(button => button.height >= 43.99 && button.width >= 43.99))
  if (b.width < 700) assert(b.canvas.bottom <= b.panel.top)
  else assert(b.canvas.right <= b.panel.left)
}
async function config(p) { return (await state(p)).config }
;(async () => {
  browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : process.platform === 'win32' && fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe') ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] })
  report.browser = await browser.version()
  const p = await browser.newPage({ viewport: { width: 1585, height: 992 } })
  await enter(p); await p.getByRole('button', { name: '暂停', exact: true }).click()
  const frozen = (await state(p)).time
  await open(p); await click(p, '紫色梦境'); await layout(p, 'desktop')
  await p.getByRole('tab', { name: '祝福', exact: true }).click(); await layer(p, 2)
  await click(p, '方形'); await click(p, '选择蛋糕颜色 #d97c9a'); await click(p, '选择奶油颜色 #fff0ed'); await click(p, '小草莓')
  let c = await config(p)
  assert.deepEqual(Object.keys(c.layerOverrides), ['1'])
  assert.deepEqual(c.layerOverrides[1], { shape: 'square', cakeColor: '#d97c9a', creamColor: '#fff0ed', decoration: 'strawberry' })
  await layer(p, 1); await click(p, '选择蛋糕颜色 #75b8ad'); await click(p, '爱心')
  await layer(p, 3); await click(p, '选择蛋糕颜色 #f0dec4'); await click(p, '小爱心')
  const designed = await config(p)
  await shot(p, 'desktop-mixed-layers')
  assert.equal((await state(p)).time, frozen)
  report.checks.independentLayerAppearanceAndPanelSelection = true
  report.checks.editWhilePaused = true
  await click(p, '撤销'); assert.notEqual((await config(p)).layerOverrides[2].decoration, 'heart')
  await click(p, '重做'); assert.deepEqual(await config(p), designed)
  await p.getByRole('button', { name: '重做', exact: true }).press('Control+z'); await settle(p)
  assert.notDeepEqual(await config(p), designed)
  await p.getByRole('button', { name: '撤销', exact: true }).press('Control+Shift+z'); await settle(p)
  assert.deepEqual(await config(p), designed)
  await click(p, '恢复这一层默认搭配'); assert.equal((await config(p)).layerOverrides[2], undefined)
  await click(p, '撤销'); assert.deepEqual(await config(p), designed)
  report.checks.undoRedoShortcutsAndLayerReset = true
  await click(p, '单层'); assert.equal((await state(p)).selectedLayer, 'all'); assert.equal((await config(p)).cakeLayers, 1)
  await click(p, '撤销'); assert.deepEqual(await config(p), designed)
  assert.equal((await config(p)).cakeLayers, 3)
  await click(p, '撤销'); await click(p, '选择蛋糕颜色 #7793cb')
  assert.equal((await state(p)).canRedo, false)
  report.checks.layerRemovalUndoAndRedoBranching = true
  await click(p, '整体'); await click(p, '方形')
  c = await config(p); assert.equal(c.cakeShape, 'square'); assert(Object.values(c.layerOverrides).every(layer => !layer.shape))
  await click(p, '选择蛋糕颜色 #3d4192'); c = await config(p)
  assert(Object.values(c.layerOverrides).every(layer => !layer.cakeColor))
  report.checks.overallControlsClearMatchingOverridesOnly = true
  await click(p, '紫色梦境'); assert.deepEqual((await config(p)).layerOverrides, {})
  assert.equal((await config(p)).cakeShape, 'round')
  report.checks.currentPresetRestoresDefaults = true
  await layer(p, 2)
  const before = crypto.createHash('sha256').update(await p.locator('canvas').screenshot()).digest('hex')
  for (let i = 0; i < 20; i++) { await p.getByLabel('自定义蛋糕颜色', { exact: true }).fill(i % 2 ? '#ff8098' : '#64bbae'); await p.waitForTimeout(50); const s = await state(p); report.resources.push({ geometries: s.stats.geometries, textures: s.stats.textures }) }
  const after = crypto.createHash('sha256').update(await p.locator('canvas').screenshot()).digest('hex')
  assert.notEqual(before, after)
  assert.equal(new Set(report.resources.map(s => JSON.stringify(s))).size, 1)
  report.checks.liveColorChangesPixelsWithoutResourceGrowth = true
  await p.getByRole('tab', { name: '蜡烛', exact: true }).click()
  await click(p, '关闭火焰'); assert.equal((await state(p)).stats.flames, 0)
  await click(p, '撤销'); assert.equal((await config(p)).flameEnabled, true); assert((await state(p)).stats.flames > 0)
  report.checks.undoRestoresFlameAnimation = true
  await close(p); await p.getByRole('button', { name: '继续', exact: true }).click()
  const finalConfig = await config(p)
  await p.getByRole('button', { name: '开启生日惊喜', exact: true }).click(); await p.getByRole('button', { name: '我许好愿了', exact: true }).click(); await p.getByRole('button', { name: '吹灭蜡烛', exact: true }).click()
  await p.waitForFunction(() => window.__GALAXY__.phase === 'message'); await shot(p, 'desktop-message')
  await p.getByRole('button', { name: '再看一次', exact: true }).click(); await p.waitForFunction(() => window.__GALAXY__.phase === 'idle')
  assert.deepEqual(await config(p), finalConfig)
  report.checks.wishBlowoutAndReplayPreserveLayers = true
  await p.close(); save()
  for (const [width, height] of [[390, 844], [375, 667], [412, 915]]) {
    const m = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true })
    await enter(m); await open(m); await click(m, '紫色梦境'); await layer(m, 2)
    await click(m, '选择蛋糕颜色 #d97c9a'); await click(m, '方形'); await click(m, '选择奶油颜色 #fff0ed'); await click(m, '小草莓')
    await layout(m, 'mobile-' + width); await shot(m, 'mobile-' + width + '-editor')
    await click(m, '合拢预览'); await shot(m, 'mobile-' + width + '-assembled')
    await m.keyboard.press('Escape'); await settle(m)
    assert.equal((await state(m)).settings, null); assert.equal((await state(m)).editing, false)
    await m.close(); save()
  }
  report.checks.mobileLayerEditingAndControls = true
  const intro = await browser.newPage({ viewport: { width: 390, height: 844 } }); watch(intro); await intro.goto(url)
  await intro.getByRole('button', { name: '定制这份生日祝福', exact: true }).click()
  await intro.getByLabel('寿星昵称', { exact: true }).fill('小星')
  await intro.getByRole('tab', { name: '蛋糕', exact: true }).click(); await click(intro, '紫色梦境')
  await intro.getByRole('group', { name: '编辑范围', exact: true }).getByRole('button', { name: '第 2 层', exact: true }).click()
  await click(intro, '选择蛋糕颜色 #75b8ad'); await click(intro, '撤销'); assert.equal((await config(intro)).layerOverrides[1], undefined)
  await click(intro, '重做'); await click(intro, '完成'); await intro.getByRole('button', { name: '开启星河', exact: true }).click()
  await intro.waitForFunction(() => window.__GALAXY__.phase === 'idle')
  assert.equal((await config(intro)).recipient, '小星'); assert.equal((await config(intro)).layerOverrides[1].cakeColor, '#75b8ad'); assert.equal((await state(intro)).editing, false)
  await intro.close(); report.checks.introCustomizationAndHistory = true
  const low = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await enter(low, url + (url.includes('?') ? '&' : '?') + 'quality=low')
  await open(low); await click(low, '紫色梦境'); await layer(low, 2)
  await click(low, '小草莓'); await click(low, '选择蛋糕颜色 #75b8ad')
  const lowState = await state(low)
  assert.equal(lowState.budget.dpr, 1); assert.equal(lowState.budget.surface, 1000)
  assert.equal(lowState.stats.points, 2774)
  report.lowBudget = { budget: lowState.budget, points: lowState.stats.points }
  await shot(low, 'low-custom-layers'); await low.close()
  report.checks.performanceCapsWithCustomLayers = true
  assert.equal(report.errors.length, 0); report.checks.consoleNoErrors = true
  save(); console.log('LAYER EDITOR PASSED', JSON.stringify(report.checks)); await browser.close()
})().catch(async e => { report.failure = String(e.stack); save(); console.error(e); await browser?.close(); process.exitCode = 1 })
