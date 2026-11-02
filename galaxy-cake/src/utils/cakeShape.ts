import type { BufferGeometry } from 'three'
import type { CakeShape } from '../store/birthdayStore'

export function cakeOutline(angle: number, radius: number, shape: CakeShape): [number, number] {
  if (shape === 'square') {
    // A rounded square with a smooth normal at each corner, rather than a hard radial kink.
    const c = Math.cos(angle), s = Math.sin(angle)
    const r = radius / Math.pow(Math.pow(Math.abs(c), 6) + Math.pow(Math.abs(s), 6), 1 / 6)
    return [c * r * .87, s * r * .87]
  }
  if (shape === 'round') return [Math.cos(angle) * radius, Math.sin(angle) * radius]
  const t = angle + Math.PI / 2
  return [Math.sin(t) ** 3 * radius,
    -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 * radius]
}

export function shapeCakeGeometry(geometry: BufferGeometry, shape: CakeShape) {
  if (shape === 'round') return geometry
  const positions = geometry.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i)
    const [nx, nz] = cakeOutline(Math.atan2(z, x), Math.hypot(x, z), shape)
    positions.setXYZ(i, nx, positions.getY(i), nz)
  }
  positions.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
