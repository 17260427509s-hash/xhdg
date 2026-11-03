import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, MeshPhysicalMaterial, Object3D } from 'three'
import type { CakeShape, CakeStyle } from '../store/birthdayStore'
import type { ExperienceEngine } from '../experience/engine'
import { cakeOutline } from '../utils/cakeShape'
import { partProgress } from '../utils/cakeTransition'
import { random } from '../utils/random'
import { recipes } from './cakeRecipes'

type Detail = 'flowers' | 'foot' | 'pearls' | 'gold-body' | 'gold-top' | 'sugar'
const capacity: Record<Detail, number> = { flowers: 10, foot: 84, pearls: 64, 'gold-body': 760, 'gold-top': 240, sugar:1200 }
function foilGeometry(){
  const outline=[[-1,-.45],[-.6,.72],[.25,1],[.9,.42],[.7,-.68],[-.1,-.86]],positions:number[]=[]
  for(let i=0;i<outline.length;i++){
    const a=outline[i],b=outline[(i+1)%outline.length]
    positions.push(0,0,.12,a[0],a[1],i%2?.025:-.025,b[0],b[1],i%2?-.025:.025)
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.computeVertexNormals();return g
}
function layout(kind: Detail, shape: CakeShape, style: CakeStyle, cakeColor:string) {
  const max = capacity[kind], p = new Float32Array(max * 3), scale = new Float32Array(max * 3), colors = new Float32Array(max * 3), turns = new Float32Array(max)
  const recipe = recipes[style], rng = random(76 + max)
  const n = kind === 'flowers' ? recipe.flowers : kind === 'pearls' ? recipe.pearlCount : max
  for (let i = 0; i < max; i++) {
    const a = i % n / n * Math.PI * 2 + .12
    let turn=a+rng()*2
    let radius = 1.325, y = -.509, size = .025 + rng() * .016, color = '#eed8bd'
    if (kind === 'flowers') { radius = recipe.flowerRadius+(rng()-.5)*.025; y = .586; size = i < n ? .85+rng()*.25 : 0; color = '#fff0df' }
    if (kind === 'pearls') {
      radius = n > 30 ? 1.316 : style === 'strawberry' ? 1.3 : 1.115
      size = i < n ? (n > 30 ? .019 + rng() * .004 : style === 'strawberry' ? .018 : .035 + rng() * .012) : 0
      y = .594 + size * .8; color = style === 'galaxy' ? ['#718dc6','#b481d5','#cca5ee','#b7cbe4'][i%4] : recipe.pearlColor
    }
    if (kind.startsWith('gold')||kind==='sugar') {
      const angle = rng() * Math.PI * 2, top = kind === 'gold-top'
      radius = top ? Math.sqrt(rng()) * 1.27 : 1.358
      const [x, z] = cakeOutline(angle, radius, shape)
      p.set([x, top ? .594 : -.47 + rng() * .84, z], i * 3)
      turn=top?rng()*Math.PI*2:Math.atan2(x,z)
      size = kind==='sugar' ? .004+Math.pow(rng(),2)*.013 : .003 + Math.pow(rng(), 2) * .009
      scale.set([size, size * (kind==='sugar'?.75+rng()*.5:1.1+rng()), size * (kind==='sugar'?.55:.3)], i * 3)
      color = i % 5 ? '#e0b368' : '#f6dfba'
    } else {
      const [x, z] = cakeOutline(a, radius, shape)
      p.set([x, y, z], i * 3); scale.set([size, size * (kind === 'flowers' ? .96 + rng() * .07 : 1), size], i * 3)
    }
    if(kind==='sugar')new Color(cakeColor).multiplyScalar(.65+rng()*.55).lerp(new Color('#a6a1d6'),i%13===0?.36:0).toArray(colors,i*3)
    else new Color(color).toArray(colors, i * 3)
    turns[i] = turn
  }
  return { p, scale, colors, turns }
}

export function PastryDetails({ engine, index, kind, fromShape, toShape, fromStyle, toStyle, fromCakeColor, toCakeColor, flower, creamMaterial }: {
  engine: ExperienceEngine; index: number; kind: Detail; fromShape: CakeShape; toShape: CakeShape; fromStyle: CakeStyle; toStyle: CakeStyle; fromCakeColor:string; toCakeColor:string; flower?: BufferGeometry; creamMaterial?: MeshPhysicalMaterial
}) {
  const mesh = useRef<InstancedMesh>(null!), dummy = useMemo(() => new Object3D(), []), color = useMemo(() => new Color(), [])
  const foil=useMemo(()=>kind.startsWith('gold')?foilGeometry():undefined,[kind])
  useEffect(()=>()=>foil?.dispose(),[foil])
  const from = useMemo(() => layout(kind, fromShape, fromStyle,fromCakeColor), [kind, fromShape, fromStyle,fromCakeColor])
  const to = useMemo(() => layout(kind, toShape, toStyle,toCakeColor), [kind, toShape, toStyle,toCakeColor])
  const previous = useRef({ t: -1, from, to, count: -1 })
  useFrame(() => {
    const part = kind === 'gold-body' || kind === 'sugar' || kind === 'foot' ? 'body' : kind === 'flowers' ? 'cream' : 'decor'
    const t = partProgress(engine.transition, part), max = capacity[kind]
    const total = engine.visualCake.tiers.reduce((sum, tier) => sum + tier.active, 0)
    const coverage=kind==='sugar'?(fromStyle==='galaxy'?1:.12)+((toStyle==='galaxy'?1:.12)-(fromStyle==='galaxy'?1:.12))*t:1
    const count = kind.startsWith('gold')||kind==='sugar' ? Math.floor(max * engine.visualCake.tiers[index].active / Math.max(total, .001)*coverage) : max
    if (previous.current.t === t && previous.current.from === from && previous.current.to === to && previous.current.count === count) return
    for (let i = 0; i < count; i++) {
      const k = i * 3
      dummy.position.set(from.p[k] + (to.p[k] - from.p[k]) * t, from.p[k + 1] + (to.p[k + 1] - from.p[k + 1]) * t, from.p[k + 2] + (to.p[k + 2] - from.p[k + 2]) * t)
      dummy.scale.set(from.scale[k] + (to.scale[k] - from.scale[k]) * t, from.scale[k + 1] + (to.scale[k + 1] - from.scale[k + 1]) * t, from.scale[k + 2] + (to.scale[k + 2] - from.scale[k + 2]) * t)
      const turn=from.turns[i]+(to.turns[i]-from.turns[i])*t
      if(kind==='gold-top')dummy.rotation.set(-Math.PI/2,0,turn+i*1.7)
      else dummy.rotation.set(kind==='gold-body'||kind==='sugar'?Math.sin(i)*.18:0,turn,kind==='gold-body'||kind==='sugar'?i*1.7:0)
      dummy.updateMatrix(); mesh.current.setMatrixAt(i, dummy.matrix)
      if (kind !== 'flowers') {
        color.setRGB(from.colors[k] + (to.colors[k] - from.colors[k]) * t, from.colors[k + 1] + (to.colors[k + 1] - from.colors[k + 1]) * t, from.colors[k + 2] + (to.colors[k + 2] - from.colors[k + 2]) * t)
        mesh.current.setColorAt(i, color)
      }
    }
    mesh.current.count = count; mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    previous.current = { t, from, to, count }
  })
  useLayoutEffect(() => { previous.current.t = -1 }, [from, to, flower])
  return <instancedMesh ref={mesh} args={[flower??foil, creamMaterial, capacity[kind]]} castShadow={kind === 'flowers'} receiveShadow={kind === 'flowers'} frustumCulled={false}>
    {!flower&&!foil ? kind==='sugar'?<icosahedronGeometry args={[1,1]}/>:<sphereGeometry args={[1, 24, 16]}/> : null}
    {!creamMaterial ? <meshPhysicalMaterial roughness={kind==='sugar'?.64:kind.startsWith('gold') ? .38 : .22} metalness={kind==='sugar'?0:kind.startsWith('gold') ? .5 : .08} clearcoat={kind==='sugar'?0:kind.startsWith('gold') ? .1 : .75} envMapIntensity={kind==='sugar'?.6:1.6} side={DoubleSide}/> : null}
  </instancedMesh>
}
