import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Color, ExtrudeGeometry, InstancedMesh, LatheGeometry, Object3D, OctahedronGeometry, Vector2 } from 'three'
import type { CakeShape, CakeStyle } from '../store/birthdayStore'
import { cakeOutline } from '../utils/cakeShape'
import { heartShape, starShape } from '../utils/ornaments'

export function CakeDecorations({ style, shape, rim = false }: { style: CakeStyle; shape: CakeShape; rim?: boolean }) {
  const ornaments = useRef<InstancedMesh>(null!), leaves = useRef<InstancedMesh>(null!)
  const count = style === 'strawberry' ? 6 : style === 'cream' ? 7 : style === 'heart' ? 5 : 4
  const geometry = useMemo(() => {
    if (style === 'strawberry') return new LatheGeometry([new Vector2(0, -1), new Vector2(.35, -.65), new Vector2(.78, 0), new Vector2(1, .45), new Vector2(.7, .8), new Vector2(0, .9)], 24)
    if (style === 'purple') return new OctahedronGeometry(1)
    const g = new ExtrudeGeometry(style === 'heart' ? heartShape() : starShape(), { depth: .16, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .025, bevelThickness: .025, curveSegments: 12 })
    g.translate(0, 0, -.08)
    return g
  }, [style])
  useEffect(() => () => geometry.dispose(), [geometry])
  useLayoutEffect(() => {
    const dummy = new Object3D()
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + .45
      const [x, z] = cakeOutline(angle, rim ? 1.13 : style === 'strawberry' ? .76 : .72, shape)
      dummy.position.set(x, style === 'strawberry' ? .685 : .675, z)
      dummy.rotation.set(-.15, angle * .5, (i % 2 ? 1 : -1) * .12)
      dummy.scale.set(style === 'strawberry' ? .075 : .13, style === 'strawberry' ? .105 : .13, style === 'strawberry' ? .075 : .13)
      dummy.updateMatrix(); ornaments.current.setMatrixAt(i, dummy.matrix)
      ornaments.current.setColorAt(i, new Color(style === 'strawberry' ? '#d94d65' : style === 'purple' ? i % 2 ? '#c1a4e0' : '#e9cced' : style === 'heart' ? i % 2 ? '#ed9fb9' : '#f4bfcf' : '#e8bd77'))
      if (style === 'strawberry') for (let j = 0; j < 3; j++) {
        const a = angle + j * Math.PI * 2 / 3
        dummy.position.set(x + Math.cos(a) * .025, .778, z + Math.sin(a) * .025)
        dummy.rotation.set(.8, a, .3); dummy.scale.set(.045, .055, .018)
        dummy.updateMatrix(); leaves.current.setMatrixAt(i * 3 + j, dummy.matrix)
      }
    }
    ornaments.current.instanceMatrix.needsUpdate = true
    ornaments.current.instanceColor!.needsUpdate = true
    if (style === 'strawberry') leaves.current.instanceMatrix.needsUpdate = true
  }, [style, shape, count, rim])
  return <>
    <instancedMesh ref={ornaments} args={[geometry, undefined, count]} castShadow>
      <meshPhysicalMaterial roughness={style === 'strawberry' ? .45 : .28} metalness={style === 'cream' || style === 'galaxy' ? .5 : .05} clearcoat={.2}/>
    </instancedMesh>
    {style === 'strawberry' ? <instancedMesh ref={leaves} args={[undefined, undefined, count * 3]}><coneGeometry args={[1, 1.5, 3]}/><meshStandardMaterial color="#79a77a" roughness={.65}/></instancedMesh> : null}
  </>
}
