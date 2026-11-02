import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, InstancedMesh, MeshStandardMaterial, Object3D, PlaneGeometry, ShapeGeometry } from 'three'
import type { ExperienceEngine } from '../experience/engine'
import { galaxyThemes } from '../store/birthdayStore'
import { heartShape, starShape } from '../utils/ornaments'
import { random } from '../utils/random'

function ConfettiBatch({ engine, kind }: { engine: ExperienceEngine; kind: number }) {
  const mesh = useRef<InstancedMesh>(null!), dummy = useMemo(() => new Object3D(), [])
  const { tier, reduced, config } = engine.snapshot
  const count = Math.round((tier === 'desktop' ? 36 : tier === 'mobile' ? 20 : 10) * (reduced ? .4 : 1))
  const seeds = useMemo(() => {
    const rng = random(521 + kind)
    return Array.from({ length: count }, () => ({
      angle: rng() * Math.PI * 2, speed: 1.1 + rng() * 1.3, up: 1.5 + rng() * 1.8,
      spin: (rng() - .5) * 6, phase: rng() * 7, size: .045 + rng() * .035,
    }))
  }, [count, kind])
  const geometry = useMemo(() => kind === 2 ? new ShapeGeometry(starShape()) : kind === 3 ? new ShapeGeometry(heartShape()) : new PlaneGeometry(kind === 0 ? .7 : 1, 1), [kind])
  const material = useMemo(() => new MeshStandardMaterial({ side: DoubleSide, roughness: .48, metalness: .08, transparent: true, depthWrite: false }), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])
  useLayoutEffect(() => {
    const palette = galaxyThemes[config.galaxyTheme].colors
    for (let i = 0; i < count; i++) mesh.current.setColorAt(i, new Color(palette[(i + kind) % palette.length]))
    mesh.current.instanceColor!.needsUpdate = true
  }, [config.galaxyTheme, count, kind])
  useFrame(() => {
    const age = engine.phaseTime - 1.7
    const active = (engine.snapshot.phase === 'celebration' || engine.snapshot.phase === 'message') && age >= 0 && age < 6.4
    mesh.current.visible = active
    engine.stats.confetti = active ? count * 4 : 0
    if (!active) return
    material.opacity = Math.min(1, age * 5) * Math.max(0, 1 - age / 6.4)
    for (let i = 0; i < count; i++) {
      const seed = seeds[i], t = age * (reduced ? .45 : 1)
      const top = i % 5 === 0
      dummy.position.set(Math.cos(seed.angle) * seed.speed * t * .8,
        (top ? 2.8 : .25) + (top ? -.3 : seed.up) * t - .38 * t * t,
        Math.sin(seed.angle) * seed.speed * t * .8)
      dummy.rotation.set(seed.phase + t * seed.spin, t * (seed.spin + 1), seed.phase + t * seed.spin * .6)
      dummy.scale.set(seed.size, seed.size * (kind === 0 ? 1.5 : 1), seed.size)
      dummy.updateMatrix(); mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false}/>
}

export function ConfettiExplosion({ engine }: { engine: ExperienceEngine }) {
  return <>{[0, 1, 2, 3].map(kind => <ConfettiBatch key={kind} engine={engine} kind={kind}/>)}</>
}
