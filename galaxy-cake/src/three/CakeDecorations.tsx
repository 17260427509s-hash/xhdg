import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BufferGeometry, Color, ExtrudeGeometry, Float32BufferAttribute, InstancedMesh, LatheGeometry, Matrix4, Object3D, Vector2, Vector3 } from 'three'
import type { CakeShape, CakeStyle } from '../store/birthdayStore'
import { cakeOutline } from '../utils/cakeShape'
import { heartShape, starShape } from '../utils/ornaments'

const berryRadius = (t: number) => Math.pow(Math.sin(t * Math.PI), .72) * (.7 + t * .35)
function leafGeometry() {
  const positions: number[] = [], indices: number[] = []
  for (let i = 0; i <= 20; i++) for (let j = 0; j <= 8; j++) {
    const t = i / 20, w = j / 8 * 2 - 1
    positions.push(w * Math.sin(Math.PI * t) * .32, Math.sin(t * Math.PI) * (.16 - Math.abs(w) * .12) + t * t * .15, t * 1.4)
  }
  for (let i = 0; i < 20; i++) for (let j = 0; j < 8; j++) { const a = i * 9 + j; indices.push(a, a + 9, a + 1, a + 1, a + 9, a + 10) }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals(); return g
}
function gemGeometry() {
  const p: number[] = [], rings = [[0, -.65], [.78, -.08], [.83, .02], [.46, .58]]
  for (let row = 0; row < rings.length - 1; row++) for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2, b = (i + 1) / 10 * Math.PI * 2
    const [ra, ya] = rings[row], [rb, yb] = rings[row + 1]
    const v = [[Math.cos(a) * ra, ya, Math.sin(a) * ra], [Math.cos(a) * rb, yb, Math.sin(a) * rb], [Math.cos(b) * ra, ya, Math.sin(b) * ra], [Math.cos(b) * rb, yb, Math.sin(b) * rb]]
    p.push(...v[0], ...v[1], ...v[2], ...v[2], ...v[1], ...v[3])
  }
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, b = (i + 1) / 10 * Math.PI * 2; p.push(0, .58, 0, Math.cos(b) * .46, .58, Math.sin(b) * .46, Math.cos(a) * .46, .58, Math.sin(a) * .46) }
  const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g
}

export function CakeDecorations({ style, shape, rim = false }: { style: CakeStyle; shape: CakeShape; rim?: boolean }) {
  const ornaments = useRef<InstancedMesh>(null!), leaves = useRef<InstancedMesh>(null!), seeds = useRef<InstancedMesh>(null!)
  const count = style === 'strawberry' ? 6 : style === 'cream' ? 7 : style === 'heart' ? 5 : style === 'purple' ? 6 : 4
  const leaf = useMemo(leafGeometry, [])
  const geometry = useMemo(() => {
    if (style === 'strawberry') return new LatheGeometry(Array.from({ length: 49 }, (_, i) => new Vector2(berryRadius(i / 48), i / 48 * 1.9 - 1)), 64)
    if (style === 'purple') return gemGeometry()
    const g = new ExtrudeGeometry(style === 'heart' ? heartShape() : starShape(), { depth: .12, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: style === 'heart' ? .045 : .025, bevelThickness: .028, curveSegments: 32 })
    g.translate(0, 0, -.06); return g
  }, [style])
  useEffect(() => () => geometry.dispose(), [geometry]); useEffect(() => () => leaf.dispose(), [leaf])
  useLayoutEffect(() => {
    const dummy = new Object3D(), local = new Object3D(), matrix = new Matrix4(), normal = new Vector3(), up = new Vector3(0, 1, 0)
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + .45
      const [x, z] = cakeOutline(angle, rim ? 1.14 : style === 'strawberry' ? .78 : .72, shape)
      const gold=style==='galaxy'||style==='cream'
      dummy.position.set(x, style === 'strawberry' ? .735 : gold ? .603 : .69, z)
      dummy.rotation.set(gold ? -Math.PI/2+.05 : style === 'strawberry' ? -.08 : -.15, angle * .5, (i % 2 ? 1 : -1) * .1)
      dummy.scale.set(style === 'strawberry' ? .105 : gold ? .065 : .125, style === 'strawberry' ? .14 : gold ? .065 : .125, style === 'strawberry' ? .105 : gold ? .065 : .125)
      dummy.updateMatrix(); ornaments.current.setMatrixAt(i, dummy.matrix)
      ornaments.current.setColorAt(i, new Color(style === 'strawberry' ? i % 2 ? '#d84650' : '#c52c42' : style === 'purple' ? i % 2 ? '#ac8fce' : '#dcc4e9' : style === 'heart' ? i % 2 ? '#df84a1' : '#efb2c5' : '#dfb36c'))
      if (style === 'strawberry') {
        for (let j = 0; j < 48; j++) {
          const t = .11 + .77 * (j + .5) / 48, a = j * 2.399963, r = berryRadius(t) * .994
          local.position.set(Math.cos(a) * r, t * 1.9 - 1, Math.sin(a) * r)
          normal.set(Math.cos(a), (.5 - t) * .8, Math.sin(a)).normalize()
          local.quaternion.setFromUnitVectors(up, normal); local.scale.set(.025, .012, .045); local.updateMatrix()
          matrix.multiplyMatrices(dummy.matrix, local.matrix); seeds.current.setMatrixAt(i * 48 + j, matrix)
        }
        for (let j = 0; j < 5; j++) {
          local.position.set(0, .85, 0); local.rotation.set(.12, j / 5 * Math.PI * 2, 0); local.scale.setScalar(.55); local.updateMatrix()
          matrix.multiplyMatrices(dummy.matrix, local.matrix); leaves.current.setMatrixAt(i * 5 + j, matrix)
        }
      }
    }
    ornaments.current.instanceMatrix.needsUpdate = true; ornaments.current.instanceColor!.needsUpdate = true
    if (style === 'strawberry') { leaves.current.instanceMatrix.needsUpdate = true; seeds.current.instanceMatrix.needsUpdate = true }
  }, [style, shape, count, rim, geometry])
  return <>
    <instancedMesh ref={ornaments} args={[geometry, undefined, count]} castShadow>
      <meshPhysicalMaterial roughness={style === 'strawberry' ? .29 : style === 'purple' ? .13 : .28} metalness={style === 'cream' || style === 'galaxy' ? .7 : .06} clearcoat={style === 'purple' ? .9 : .35} clearcoatRoughness={.23} envMapIntensity={style === 'purple' ? 1.8 : 1.1}/>
    </instancedMesh>
    {style === 'strawberry' ? <>
      <instancedMesh ref={leaves} args={[leaf, undefined, count * 5]}><meshStandardMaterial color="#507744" roughness={.55} side={2}/></instancedMesh>
      <instancedMesh ref={seeds} args={[undefined, undefined, count * 48]}><sphereGeometry args={[1, 8, 6]}/><meshPhysicalMaterial color="#f0cc82" roughness={.36} metalness={.12}/></instancedMesh>
    </> : null}
  </>
}
