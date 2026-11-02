import { Color } from 'three'
export function random(seed = 43) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
export const palette = ['#258bff', '#bb74ff', '#ff53b8', '#32e1ce', '#ffd65e', '#f2edff']
export function colorArray(n: number, rng: () => number, strength = 1, colors: string[] = palette) {
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { const c = new Color(colors[Math.floor(rng() * colors.length)]).multiplyScalar(strength); c.toArray(a, i * 3) }
  return a
}
