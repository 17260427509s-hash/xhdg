import type { BirthdayConfig } from '../store/birthdayStore'

export interface CakeTier { y: number; width: number; height: number; surface: number }

/** Local tier coordinates retain the existing pastry geometry; the bottom stays on the plate. */
export function cakeAssembly(config: BirthdayConfig): CakeTier[] {
  const heights = config.cakeLayers === 1 ? [1] : config.cakeLayers === 2 ? [.72, .58] : [.62, .52, .42]
  let bottom = -.54
  return heights.map((height, i) => {
    const y = bottom + .54 * height
    const surface = y + .594 * height
    bottom = surface - .018
    return { y, width: [1, .72, .49][i], height, surface }
  })
}

export function candlePlacement(config: BirthdayConfig) {
  const tiers = cakeAssembly(config), top = tiers[tiers.length - 1]
  const scale = config.cakeLayers === 1 ? 1 : config.cakeLayers === 2 ? .85 : .74
  return { scale, y: top.surface - .594 * scale, surface: top.surface }
}

export const tierLift = (index: number, spread: number) => index * .38 * spread
export const candleLift = (config: BirthdayConfig, spread: number) => ((config.cakeLayers - 1) * .38 + 1.04) * spread
