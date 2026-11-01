import gsap from 'gsap'

export type Phase = 'intro' | 'entering' | 'idle' | 'celebration' | 'message'
export type Tier = 'desktop' | 'mobile' | 'low'
export const budgets = {
  desktop: { near: 600, far: 700, dust: 2400, surface: 3200, orbitDust: 400, sparks: 256, burst: 350, dpr: 2 },
  mobile: { near: 300, far: 400, dust: 1200, surface: 1800, orbitDust: 400, sparks: 160, burst: 220, dpr: 1.5 },
  low: { near: 150, far: 300, dust: 600, surface: 1000, orbitDust: 180, sparks: 64, burst: 120, dpr: 1 },
} as const
export class ExperienceEngine {
  snapshot: { phase: Phase; paused: boolean; tier: Tier; reduced: boolean }
  time = 0
  phaseTime = 0
  orbitTime = 0
  lastInteraction = -10
  hidden = false
  dragging = false
  resetId = 0
  motion = { reveal: 0, rings: 0, ignition: 0, energy: 1, camera: 0, messageReveal: 0 }
  stats = { fps: 0, calls: 0, points: 0, geometries: 0, textures: 0, rotation: [0, 0, 0], camera: [0, 0, 0], frames: 0 }
  private timeline: gsap.core.Timeline | undefined
  private timelineTime = 0
  private listeners = new Set<() => void>()
  private sample = { seconds: 0, frames: 0, slow: 0 }
  constructor() {
    const mobile = window.matchMedia('(max-width: 700px)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const low = new URLSearchParams(location.search).get('quality') === 'low'
    this.snapshot = { phase: 'intro', paused: false, tier: low ? 'low' : mobile ? 'mobile' : 'desktop', reduced }
  }
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  getSnapshot = () => this.snapshot
  update(patch: Partial<typeof this.snapshot>) { this.snapshot = { ...this.snapshot, ...patch }; this.listeners.forEach(fn => fn()) }
  enter = () => {
    if (this.snapshot.phase === 'entering' || this.snapshot.phase === 'celebration') return
    this.timeline?.kill()
    this.time = this.orbitTime = this.phaseTime = this.timelineTime = 0
    this.resetId++
    this.lastInteraction = -10
    this.dragging = false
    Object.assign(this.motion, { reveal: 0, rings: 0, ignition: 0, energy: 1, camera: 0, messageReveal: 0 })
    this.update({ phase: 'entering', paused: false })
    const r = this.snapshot.reduced ? .3 : 1
    this.timeline = gsap.timeline({ paused: true, onComplete: () => { this.phaseTime = 0; this.update({ phase: 'idle' }) } })
      .to(this.motion, { reveal: 1, duration: 1.6 * r, ease: 'power2.out' }, .8 * r)
      .to(this.motion, { rings: 1, duration: 1.1 * r, ease: 'power2.out' }, 2.3 * r)
      .to(this.motion, { ignition: 1, duration: .7 * r, ease: 'back.out(2)' }, 3.5 * r)
      .to(this.motion, { energy: 1, duration: .3 * r }, 4.2 * r)
  }
  celebrate = () => {
    if (this.snapshot.phase !== 'idle' || this.snapshot.paused) return
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
    if (this.hidden || this.snapshot.paused) return
    // A resumed/backgrounded tab must never jump past an entrance or celebration.
    const dt = Math.min(delta, .06)
    this.time += dt; this.phaseTime += dt
    this.orbitTime += dt * this.motion.energy * (this.snapshot.reduced ? .15 : 1)
    if (this.snapshot.phase === 'entering' || this.snapshot.phase === 'celebration') {
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
  dispose() { this.timeline?.kill(); this.listeners.clear() }
}
