import gsap from 'gsap'
import { createVisualCake, partProgress, updateVisualCake, visualLayout } from '../utils/cakeTransition'
import type { CakeTransition } from '../utils/cakeTransition'
import { cakePresets, defaultConfig, normalizeConfig } from '../store/birthdayStore'
import type { BirthdayConfig, CakeStyle, LayerAppearance, LayerSelection, SettingsSection } from '../store/birthdayStore'

export type Phase = 'intro' | 'entering' | 'idle' | 'wishing' | 'blowout' | 'celebration' | 'message'
export type Tier = 'desktop' | 'mobile' | 'low'
export const budgets = {
  desktop: { near: 600, far: 700, dust: 2400, surface: 3200, orbitDust: 400, sparks: 256, burst: 350, dpr: 2 },
  mobile: { near: 300, far: 400, dust: 1200, surface: 1800, orbitDust: 400, sparks: 160, burst: 220, dpr: 1.5 },
  low: { near: 150, far: 300, dust: 600, surface: 1000, orbitDust: 180, sparks: 64, burst: 120, dpr: 1 },
} as const
export class ExperienceEngine {
  snapshot: { phase: Phase; paused: boolean; tier: Tier; reduced: boolean; config: BirthdayConfig; wishConfirmed: boolean; switching: boolean; lighting: boolean; editing: boolean; expanded: boolean; assembling: boolean; selectedLayer: LayerSelection; canUndo: boolean; canRedo: boolean; settings: SettingsSection | null }
  time = 0
  phaseTime = 0
  orbitTime = 0
  lastInteraction = -10
  hidden = false
  dragging = false
  resetId = 0
  motion = { reveal: 0, rings: 0, ignition: 0, energy: 1, camera: 0, messageReveal: 0, cakeReveal: 1, creamReveal: 1, decorReveal: 1, flameShake: 0, spread: 0, editorFocus: 0 }
  blownAt = -1
  stats = { fps: 0, calls: 0, points: 0, geometries: 0, textures: 0, rotation: [0, 0, 0], camera: [0, 0, 0], frames: 0, flames: 0, smoke: 0, confetti: 0 }
  private timeline: gsap.core.Timeline | undefined
  private timelineTime = 0
  private switchTimeline: gsap.core.Timeline | undefined
  private switchTime = 0
  transition: CakeTransition | null = null
  visualCake = createVisualCake()
  private sourceLayout = visualLayout(defaultConfig)
  private targetLayout = visualLayout(defaultConfig)
  private queuedCake: { config: BirthdayConfig; record: boolean } | null = null
  private flameTimeline: gsap.core.Timeline | undefined
  private flameTime = 0
  private editorTimeline: gsap.core.Timeline | undefined
  private editorTime = 0
  private undoStack: BirthdayConfig[] = []
  private redoStack: BirthdayConfig[] = []
  private listeners = new Set<() => void>()
  private sample = { seconds: 0, frames: 0, slow: 0 }
  readonly readOnly:boolean
  captureScene:((longEdge:number)=>Promise<Blob>)|null=null
  constructor(initialConfig:BirthdayConfig=defaultConfig,readOnly=false) {
    this.readOnly=readOnly
    const mobile = window.matchMedia('(max-width: 700px)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const low = new URLSearchParams(location.search).get('quality') === 'low'
    this.snapshot = { phase: 'intro', paused: false, tier: low ? 'low' : mobile ? 'mobile' : 'desktop', reduced, config: normalizeConfig(defaultConfig,initialConfig), wishConfirmed: false, switching: false, lighting: false, editing: false, expanded: true, assembling: false, selectedLayer: 'all', canUndo: false, canRedo: false, settings: null }
    this.sourceLayout=this.targetLayout=visualLayout(this.snapshot.config)
    this.refreshVisualCake()
  }
  refreshVisualCake = () => { updateVisualCake(this.visualCake, this.sourceLayout, this.targetLayout, this.snapshot.config, partProgress(this.transition, 'body'), this.motion.spread) }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  getSnapshot = () => this.snapshot
  update(patch: Partial<typeof this.snapshot>) { this.snapshot = { ...this.snapshot, ...patch }; this.listeners.forEach(fn => fn()) }
  getBudget = () => {
    const base = budgets[this.snapshot.tier]
    const near = Math.min(base.near, this.snapshot.config.galaxyCount)
    return { ...base, near, dust: Math.round(base.dust * (.45 + .55 * near / base.near)) }
  }
  configure = (patch: Partial<BirthdayConfig>) => {
    if(this.readOnly)return
    if (!['intro', 'idle'].includes(this.snapshot.phase)) return
    if (this.snapshot.switching) { this.changeCake(patch); return }
    if ((patch.cakeShape && patch.cakeShape !== this.snapshot.config.cakeShape) || (patch.cakeLayers && patch.cakeLayers !== this.snapshot.config.cakeLayers)) { this.changeCake(patch); return }
    this.commitConfig(patch)
  }
  private commitConfig(patch: Partial<BirthdayConfig>, record = true) {
    const previous = this.snapshot.config, config = normalizeConfig(previous, patch)
    if (JSON.stringify(config) === JSON.stringify(previous)) return
    if (record) {
      this.undoStack.push(previous)
      if (this.undoStack.length > 40) this.undoStack.shift()
      this.redoStack = []
    }
    const selectedLayer = this.snapshot.selectedLayer
    this.update({ config, selectedLayer: selectedLayer !== 'all' && selectedLayer >= config.cakeLayers ? 'all' : selectedLayer, canUndo: this.undoStack.length > 0, canRedo: this.redoStack.length > 0 })
    this.targetLayout = visualLayout(config)
    if (!this.transition) this.sourceLayout = this.targetLayout
    this.refreshVisualCake()
    if (previous.flameEnabled !== config.flameEnabled && this.snapshot.phase === 'idle') this.animateFlame(config.flameEnabled)
  }
  selectLayer = (selectedLayer: LayerSelection) => {
    if (!['intro', 'idle'].includes(this.snapshot.phase) || this.snapshot.switching || (selectedLayer !== 'all' && selectedLayer >= this.snapshot.config.cakeLayers)) return
    this.update({ selectedLayer, settings: 'cake' })
  }
  openSettings = (settings: SettingsSection) => {
    if(this.readOnly)return
    if (!['intro', 'idle'].includes(this.snapshot.phase)) return
    this.update({ settings })
    this.setEditing(true)
  }
  closeSettings = () => { this.update({ settings: null }); this.setEditing(false) }
  editLayer = (patch: Partial<LayerAppearance>) => {
    if (!['intro', 'idle'].includes(this.snapshot.phase) || this.snapshot.switching) return
    const { config, selectedLayer } = this.snapshot
    const layerOverrides = { ...config.layerOverrides }
    const targets = selectedLayer === 'all' ? patch.decoration ? [(config.cakeLayers - 1) as 0 | 1 | 2] : Array.from({ length: config.cakeLayers }, (_, i) => i as 0 | 1 | 2) : [selectedLayer]
    for (const i of targets) layerOverrides[i] = { ...layerOverrides[i], ...patch }
    if (selectedLayer === 'all') {
      // Overall shape/color controls replace older local overrides consistently.
      for (const i of targets) {
        if (patch.shape) delete layerOverrides[i]!.shape
        if (patch.cakeColor) delete layerOverrides[i]!.cakeColor
      }
    }
    const update: Partial<BirthdayConfig> = { layerOverrides }
    if (selectedLayer === 'all' && patch.shape) update.cakeShape = patch.shape
    if (selectedLayer === 'all' && patch.cakeColor) update.cakeColor = patch.cakeColor
    if (patch.shape || patch.decoration) this.changeCake(update)
    else this.configure(update)
  }
  resetLayer = () => {
    const { config, selectedLayer } = this.snapshot
    const layerOverrides = { ...config.layerOverrides }
    if (selectedLayer === 'all') this.changeCake({ layerOverrides: {} })
    else { delete layerOverrides[selectedLayer]; this.changeCake({ layerOverrides }) }
  }
  undo = () => this.restoreHistory(this.undoStack, this.redoStack)
  redo = () => this.restoreHistory(this.redoStack, this.undoStack)
  private restoreHistory(source: BirthdayConfig[], target: BirthdayConfig[]) {
    if (!['intro', 'idle'].includes(this.snapshot.phase) || this.snapshot.switching || this.snapshot.lighting) return
    const config = source.pop()
    if (!config) return
    target.push(this.snapshot.config)
    this.changeCake(config, false)
  }
  selectCake = (style: CakeStyle) => {
    if (!['intro', 'idle'].includes(this.snapshot.phase)) return
    const preset = cakePresets[style]
    const current = this.queuedCake?.config ?? this.snapshot.config
    if (current.cakeStyle === style && current.cakeColor === preset.color && current.cakeShape === preset.shape && current.cakeLayers === preset.layers && !Object.keys(current.layerOverrides).length) return
    this.changeCake({ cakeStyle: style, cakeColor: preset.color, cakeShape: preset.shape, cakeLayers: preset.layers, layerOverrides: {} })
  }
  randomizeCake = () => {
    const choices = (Object.keys(cakePresets) as CakeStyle[]).filter(style => style !== this.snapshot.config.cakeStyle)
    const style = choices[Math.floor(Math.random() * choices.length)], preset = cakePresets[style]
    this.changeCake({ cakeStyle: style, cakeColor: preset.color, cakeShape: (['round', 'square', 'heart'] as const)[Math.floor(Math.random() * 3)], cakeLayers: (this.snapshot.config.cakeLayers % 3 + 1) as 1 | 2 | 3, layerOverrides: {} })
  }
  private changeCake(patch: Partial<BirthdayConfig>, record = true) {
    if(this.readOnly)return
    if (!['intro', 'idle'].includes(this.snapshot.phase)) return
    const config = normalizeConfig(this.queuedCake?.config ?? this.snapshot.config, patch)
    if (this.snapshot.switching) { this.queuedCake = { config, record }; return }
    if (JSON.stringify(config) === JSON.stringify(this.snapshot.config)) return
    if (this.snapshot.phase === 'intro') { this.commitConfig(config, record); return }
    const from = this.snapshot.config
    this.transition = { from, to: config, progress: 0, mode: this.snapshot.editing && this.snapshot.expanded ? 'exploded' : 'assembled' }
    this.sourceLayout = visualLayout(from)
    this.targetLayout = visualLayout(config)
    this.switchTime = 0
    this.update({ switching: true })
    this.commitConfig(config, record)
    const duration = this.snapshot.reduced ? .18 : this.transition.mode === 'exploded' ? .75 : .65
    this.switchTimeline?.kill()
    this.switchTimeline = gsap.timeline({ paused: true, onComplete: () => {
      this.transition = null
      this.sourceLayout = this.targetLayout
      const queued = this.queuedCake
      this.queuedCake = null
      if (queued && JSON.stringify(queued.config) !== JSON.stringify(this.snapshot.config)) {
        this.update({ switching: false })
        this.changeCake(queued.config, queued.record)
      } else this.update({ switching: false })
    } }).to(this.transition, { progress: 1, duration, ease: 'none' })
  }
  setEditing = (editing: boolean) => {
    if (this.snapshot.phase !== 'idle' || this.snapshot.editing === editing) return
    this.update({ editing, expanded: true })
    this.animateAssembly(editing, editing)
  }
  setExpanded = (expanded: boolean) => {
    if (!this.snapshot.editing) return
    this.update({ expanded }); this.animateAssembly(expanded, true)
  }
  private animateAssembly(expanded: boolean, focus: boolean) {
    this.editorTimeline?.kill(); this.editorTime = 0
    this.update({ assembling: true })
    this.editorTimeline = gsap.timeline({ paused: true, onComplete: () => this.update({ assembling: false }) })
      .to(this.motion, { spread: expanded ? 1 : 0, editorFocus: focus ? 1 : 0, duration: this.snapshot.reduced ? .18 : .78, ease: 'power2.inOut' })
  }
  setFlame = (enabled: boolean) => {
    if (!['intro', 'idle'].includes(this.snapshot.phase) || this.snapshot.switching) return
    this.commitConfig({ flameEnabled: enabled })
  }
  private animateFlame(enabled: boolean) {
    this.flameTimeline?.kill()
    this.flameTime = 0
    this.update({ lighting: true })
    this.flameTimeline = gsap.timeline({ paused: true, onComplete: () => this.update({ lighting: false }) }).to(this.motion, { ignition: enabled ? 1 : 0, duration: .65, ease: enabled ? 'back.out(1.4)' : 'power2.in' })
  }
  requestWish = () => {
    if (this.snapshot.phase !== 'idle' || this.snapshot.paused || this.snapshot.switching || this.snapshot.lighting || this.snapshot.editing || this.snapshot.assembling || this.motion.ignition < .9) return
    this.update({ phase: 'wishing', wishConfirmed: false })
  }
  confirmWish = () => { if (this.snapshot.phase === 'wishing') this.update({ wishConfirmed: true }) }
  cancelWish = () => { if (this.snapshot.phase === 'wishing') this.update({ phase: 'idle', wishConfirmed: false }) }
  blowOut = () => {
    if (this.snapshot.phase !== 'wishing' || !this.snapshot.wishConfirmed) return
    this.timeline?.kill(); this.flameTimeline?.kill()
    this.phaseTime = this.timelineTime = 0
    this.update({ phase: 'blowout' })
    this.timeline = gsap.timeline({ paused: true, onComplete: () => this.celebrate() })
      .to(this.motion, { flameShake: 1, duration: .2 }, 0)
      .to(this.motion, { ignition: 0, flameShake: 0, duration: .5, ease: 'power2.in' }, .2)
      .to(this.motion, { energy: .55, duration: .7 }, 0)
      .call(() => { this.blownAt = this.time }, [], .65)
      .to({}, { duration: .5 }, .7)
  }
  enter = () => {
    if (['entering', 'celebration', 'blowout'].includes(this.snapshot.phase) || this.snapshot.switching || this.snapshot.editing || this.snapshot.assembling) return
    this.timeline?.kill()
    this.flameTimeline?.kill()
    this.time = this.orbitTime = this.phaseTime = this.timelineTime = 0
    this.resetId++
    this.lastInteraction = -10
    this.dragging = false
    this.blownAt = -1
    Object.assign(this.motion, { reveal: 0, rings: 0, ignition: 0, energy: 1, camera: 0, messageReveal: 0, cakeReveal: 1, creamReveal: 1, decorReveal: 1, flameShake: 0, spread: 0, editorFocus: 0 })
    this.update({ phase: 'entering', paused: false, wishConfirmed: false, lighting: false })
    const r = this.snapshot.reduced ? .3 : 1
    this.timeline = gsap.timeline({ paused: true, onComplete: () => { this.phaseTime = 0; this.update({ phase: 'idle' }) } })
      .to(this.motion, { reveal: 1, duration: 1.6 * r, ease: 'power2.out' }, .8 * r)
      .to(this.motion, { rings: 1, duration: 1.1 * r, ease: 'power2.out' }, 2.3 * r)
      .to(this.motion, { ignition: this.snapshot.config.flameEnabled ? 1 : 0, duration: .7 * r, ease: 'back.out(2)' }, 3.5 * r)
      .to(this.motion, { energy: 1, duration: .3 * r }, 4.2 * r)
  }
  celebrate = () => {
    if (this.snapshot.phase !== 'blowout') return
    this.timeline?.kill()
    this.phaseTime = this.timelineTime = 0
    this.update({ phase: 'celebration' })
    this.timeline = gsap.timeline({ paused: true, onComplete: () => { this.update({ phase: 'message' }) } })
      .to(this.motion, { camera: this.snapshot.reduced ? .2 : 1, duration: 1.7, ease: 'power2.inOut' }, 0)
      .to(this.motion, { energy: this.snapshot.reduced ? 1.3 : 3.2, duration: 1.7 }, 0)
      .to(this.motion, { messageReveal: 1, duration: 1.3, ease: 'power2.out' }, 2.4)
      .to(this.motion, { energy: 1, camera: .3, duration: 3, ease: 'power2.out' }, 4)
  }
  toggle = () => { if (this.snapshot.phase === 'idle') this.update({ paused: !this.snapshot.paused }) }
  tick(delta: number) {
    if (this.hidden) return
    // A resumed/backgrounded tab must never jump past an entrance or celebration.
    const dt = Math.min(delta, .06)
    if (this.snapshot.switching) this.switchTimeline?.time(this.switchTime += dt, false)
    this.flameTimeline?.time(this.flameTime += dt, false)
    this.editorTimeline?.time(this.editorTime += dt, false)
    this.refreshVisualCake()
    if (this.snapshot.paused) return
    this.time += dt; this.phaseTime += dt
    this.orbitTime += dt * this.motion.energy * this.snapshot.config.galaxySpeed * (this.snapshot.reduced ? .15 : 1)
    if (['entering', 'blowout', 'celebration'].includes(this.snapshot.phase)) {
      this.timelineTime += dt
      this.timeline?.time(this.timelineTime, false)
    }
    this.stats.frames++
    if (this.snapshot.phase === 'idle' && this.phaseTime > 3) {
      this.sample.seconds += delta; this.sample.frames++
      if (this.sample.seconds >= 1) {
        this.stats.fps = this.sample.frames / this.sample.seconds
        this.sample.slow = this.stats.fps < 30 ? this.sample.slow + this.sample.seconds : 0
        this.sample.seconds = this.sample.frames = 0
        if (this.sample.slow >= 3 && this.snapshot.tier !== 'low') this.update({ tier: 'low' })
      }
    }
  }
  dispose() { this.timeline?.kill(); this.switchTimeline?.kill(); this.flameTimeline?.kill(); this.editorTimeline?.kill(); this.listeners.clear() }
}
