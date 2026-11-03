import type { BirthdayConfig } from '../store/birthdayStore'
import { cakeAssembly, candlePlacement } from './cakeAssembly'

export interface CakeTransition {
  from: BirthdayConfig
  to: BirthdayConfig
  progress: number
  mode: 'assembled' | 'exploded'
}
export type PastryPart = 'body' | 'cream' | 'decor'
export function partProgress(transition: CakeTransition | null, part: PastryPart) {
  if (!transition) return 1
  const offset = part === 'body' ? 0 : part === 'cream' ? .06 : .15
  const x = Math.max(0, Math.min(1, (transition.progress - offset) / (1 - offset)))
  return x * x * (3 - 2 * x)
}
export interface VisualTier { y: number; width: number; height: number; surface: number; active: number }
export interface VisualCake {
  tiers: VisualTier[]
  candle: { y: number; scale: number; lift: number; anchors: [number, number, number][]; count: number }
  topSurface: number
  topWidth: number
  topIndex: number
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t
export function createVisualCake(): VisualCake {
  return { tiers: Array.from({ length: 3 }, () => ({ y: 0, width: 1, height: 1, surface: .594, active: 0 })), candle: { y: 0, scale: 1, lift: 0, anchors: [[0, 1.408, 0], [0, 1.408, 0], [0, 1.408, 0]], count: 1 }, topSurface: .594, topWidth: 1, topIndex: 0 }
}

// Layouts are prepared only when a transition/configuration changes. No per-frame
// arrays or React updates are needed to keep all candle effects on the same wick.
export function visualLayout(config: BirthdayConfig) {
  return { tiers: cakeAssembly(config), candle: candlePlacement(config) }
}
export function updateVisualCake(out: VisualCake, from: ReturnType<typeof visualLayout>, to: ReturnType<typeof visualLayout>, config: BirthdayConfig, t: number, spread: number) {
  for (let i = 0; i < 3; i++) {
    const a = from.tiers[i], b = to.tiers[i]
    const ay = a?.y ?? from.candle.surface, by = b?.y ?? to.candle.surface
    const tier = out.tiers[i]
    tier.y = mix(ay, by, t)
    tier.width = mix(a?.width ?? .001, b?.width ?? .001, t)
    tier.height = mix(a?.height ?? .001, b?.height ?? .001, t)
    tier.surface = tier.y + .594 * tier.height
    tier.active = mix(a ? 1 : 0, b ? 1 : 0, t)
  }
  out.topIndex = mix(from.tiers.length - 1, to.tiers.length - 1, t)
  out.topWidth = mix(from.tiers.at(-1)!.width, to.tiers.at(-1)!.width, t)
  out.topSurface = mix(from.candle.surface, to.candle.surface, t)
  out.candle.y = mix(from.candle.y, to.candle.y, t)
  out.candle.scale = mix(from.candle.scale, to.candle.scale, t)
  out.candle.lift = (out.topIndex * .38 + 1.04) * spread
  out.candle.count = config.candleType === 'regular' ? 1 : String(config.age).length
  for (let i = 0; i < 3; i++) {
    const index = i % out.candle.count, scale = out.candle.scale
    const anchor = out.candle.anchors[i]
    anchor[0] = config.candleType === 'regular' ? 0 : (index - (out.candle.count - 1) / 2) * .51 * scale
    anchor[1] = out.candle.y + (config.candleType === 'regular' ? 1.408 : 1.257) * scale + out.candle.lift
    anchor[2] = config.candleType === 'regular' ? 0 : .015 * scale
  }
}
