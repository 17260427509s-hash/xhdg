import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Color, Float32BufferAttribute, Mesh, TubeGeometry, Vector3 } from 'three'
import type { ExperienceEngine } from '../experience/engine'
import type { BirthdayConfig, CakeShape, CakeStyle } from '../store/birthdayStore'
import { layerAppearance } from '../store/birthdayStore'
import { cakeOutline } from '../utils/cakeShape'
import { partProgress } from '../utils/cakeTransition'

function piping(shape: CakeShape, style: CakeStyle, collapsed: boolean) {
  const points = Array.from({ length: 161 }, (_, i) => {
    const angle = i / 161 * Math.PI * 2, [x, z] = cakeOutline(angle, 1.36, shape)
    const y = style === 'cream' ? -.34 + .018 * Math.cos(angle * 24) : style === 'purple' ? -.15 - .055 * Math.sin(angle * 8) ** 2 : .18 - .22 * Math.abs(Math.sin(angle * (style === 'heart' ? 5 : 4)))
    return new Vector3(x, y, z)
  })
  return new TubeGeometry(new CatmullRomCurve3(points, true, 'centripetal'), 384, collapsed ? .00001 : style === 'cream' ? .0045 : style === 'purple' ? .006 : .011, 8, true)
}

export function SidePiping({ engine, index, from, to }: { engine: ExperienceEngine; index: number; from: BirthdayConfig; to: BirthdayConfig }) {
  const a = layerAppearance(from, Math.min(index, from.cakeLayers - 1)), b = layerAppearance(to, Math.min(index, to.cakeLayers - 1))
  const mesh = useRef<Mesh>(null!), sourceColor = useMemo(() => new Color(), []), targetColor = useMemo(() => new Color(), [])
  const geometry = useMemo(() => {
    const g = piping(a.shape, from.cakeStyle === 'galaxy' ? to.cakeStyle : from.cakeStyle, from.cakeStyle === 'galaxy')
    const target = piping(b.shape, to.cakeStyle === 'galaxy' ? from.cakeStyle : to.cakeStyle, to.cakeStyle === 'galaxy')
    g.morphAttributes.position = [new Float32BufferAttribute(target.getAttribute('position').array.slice(), 3)]
    g.morphAttributes.normal = [new Float32BufferAttribute(target.getAttribute('normal').array.slice(), 3)]
    target.dispose(); g.computeBoundingSphere(); return g
  }, [a.shape, b.shape, from.cakeStyle, to.cakeStyle])
  useLayoutEffect(() => { mesh.current.updateMorphTargets() }, [geometry])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(() => {
    const t = partProgress(engine.transition, 'body')
    mesh.current.visible = (from.cakeStyle !== 'galaxy' && t < .999) || (to.cakeStyle !== 'galaxy' && t > .001)
    if (mesh.current.morphTargetInfluences) mesh.current.morphTargetInfluences[0] = t
    sourceColor.set(from.cakeStyle === 'cream' ? '#dfbb81' : a.creamColor); targetColor.set(to.cakeStyle === 'cream' ? '#dfbb81' : b.creamColor)
    const material = mesh.current.material as import('three').MeshPhysicalMaterial
    material.color.copy(sourceColor).lerp(targetColor, t)
    material.metalness = (from.cakeStyle === 'cream' ? .5 : 0) * (1 - t) + (to.cakeStyle === 'cream' ? .5 : 0) * t
  })
  return <mesh ref={mesh} geometry={geometry} castShadow frustumCulled={false}><meshPhysicalMaterial roughness={.36} clearcoat={.08}/></mesh>
}
