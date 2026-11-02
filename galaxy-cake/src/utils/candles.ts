import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontData from 'three/examples/fonts/helvetiker_bold.typeface.json'
import type { BirthdayConfig } from '../store/birthdayStore'
import { candlePlacement } from './cakeAssembly'

const candleFont = new FontLoader().parse(fontData)
const digitHeight = .58
export function digitGeometry(digit: string) {
  const geometry = new TextGeometry(digit, {
    font: candleFont, size: digitHeight, depth: .075, curveSegments: 10,
    bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 3,
  })
  geometry.computeBoundingBox()
  const box = geometry.boundingBox!
  geometry.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -.04)
  geometry.scale(1, digitHeight / (box.max.y - box.min.y), 1)
  return geometry
}

export function candleAnchors(config: BirthdayConfig): [number, number, number][] {
  const { scale, y } = candlePlacement(config)
  if (config.candleType === 'regular') return [[0, y + 1.408 * scale, 0]]
  const digits = String(config.age)
  return [...digits].map((_, i) => [(i - (digits.length - 1) / 2) * .51 * scale, y + (.66 + digitHeight + .017) * scale, .015 * scale])
}
