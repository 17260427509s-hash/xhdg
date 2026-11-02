import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'
import { random } from '../utils/random'

/** Duplicate UV seam vertices must share normals, including the piped cream. */
function smoothSeam(geometry: BufferGeometry, rows: number, columns: number) {
  geometry.computeVertexNormals()
  const normal = geometry.getAttribute('normal')
  const average = new Vector3(), other = new Vector3()
  for (let row = 0; row < rows; row++) {
    const first = row * columns, last = first + columns - 1
    average.fromBufferAttribute(normal, first).add(other.fromBufferAttribute(normal, last)).normalize()
    normal.setXYZ(first, average.x, average.y, average.z)
    normal.setXYZ(last, average.x, average.y, average.z)
  }
}

export function frostingGeometry() {
  const rng = random(451), segments = 512
  const drips = Array.from({ length: 15 }, (_, i) => ({
    angle: (i + (rng() - .5) * .7) / 15 * Math.PI * 2,
    width: .055 + rng() * .066,
    depth: .065 + Math.pow(rng(), .7) * .25,
    lean: (rng() - .5) * .035,
  }))
  const radius = [0, .3, .7, 1.05, 1.23, 1.32, 1.365, 1.388, 1.397, 1.399, 1.396, 1.389, 1.375, 1.358, 1.343, 1.338]
  const height = [.584, .587, .588, .586, .582, .572, .554, .533, .505, .478, .451, .434, .433, .447, .471, .493]
  const weight = [0, 0, 0, 0, 0, 0, 0, .015, .09, .32, .65, .94, 1, .94, .7, .35]
  const vertices: number[] = [], uvs: number[] = [], indices: number[] = []
  for (let j = 0; j < radius.length; j++) {
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2
      let drip = 0, lean = 0
      for (const d of drips) {
        const delta = Math.atan2(Math.sin(angle - d.angle), Math.cos(angle - d.angle))
        const influence = Math.exp(-.5 * (delta / d.width) ** 2)
        drip += d.depth * influence
        lean += d.lean * influence * weight[j]
      }
      const r = radius[j] + .003 * Math.sin(angle * 7 + .8) * weight[j]
      vertices.push(Math.cos(angle + lean) * r, height[j] - drip * weight[j], Math.sin(angle + lean) * r)
      uvs.push(Math.cos(angle) * radius[j] * .5 + .5, Math.sin(angle) * radius[j] * .5 + .5)
    }
  }
  const columns = segments + 1
  for (let j = 0; j < radius.length - 1; j++) for (let i = 0; i < segments; i++) {
    const a = j * columns + i, b = a + columns
    indices.push(a, a + 1, b, b, a + 1, b + 1)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  smoothSeam(geometry, radius.length, columns)
  return geometry
}

/** Low, rounded five-petal cream blossoms, with no spiral or pointed peak. */
export function creamFlowerGeometry() {
  const steps = 28, sides = 96
  const vertices: number[] = [], uvs: number[] = [], indices: number[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const latitude = t * Math.PI
    const spread = Math.sin(latitude)
    for (let j = 0; j <= sides; j++) {
      const phi = j / sides * Math.PI * 2
      const petal = Math.cos(5 * phi)
      const r = .17 * spread * (1 + .23 * petal)
      const fold = spread * spread * (.007 * petal - .002 * Math.cos(10 * phi))
      vertices.push(Math.cos(phi) * r, .046 + Math.cos(latitude) * .052 + fold, Math.sin(phi) * r)
      uvs.push(j / sides, t)
    }
  }
  for (let i = 0; i < steps; i++) for (let j = 0; j < sides; j++) {
    const a = i * (sides + 1) + j, b = a + sides + 1
    indices.push(a, a + 1, b, b, a + 1, b + 1)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  smoothSeam(geometry, steps + 1, sides + 1)
  return geometry
}
