import { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three'
import type { BirthdayConfig } from '../store/birthdayStore'
import { candlePlacement } from '../utils/cakeAssembly'
import { candleAnchors, digitGeometry } from '../utils/candles'

function NumberCandle({ digit, x }: { digit: string; x: number }) {
  const geometry = useMemo(() => digitGeometry(digit), [digit])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <group position={[x, .66, 0]}>
    <mesh castShadow geometry={geometry}>
      <meshPhysicalMaterial attach="material-0" color="#fff0db" roughness={.36} sheen={.2}/>
      <meshPhysicalMaterial attach="material-1" color="#e9aec0" roughness={.4}/>
    </mesh>
    <mesh position={[0, -.035, 0]}><cylinderGeometry args={[.009, .009, .13, 8]}/><meshStandardMaterial color="#d3b182"/></mesh>
  </group>
}

function RegularCandle() {
  const coil = useMemo(() => new TubeGeometry(new CatmullRomCurve3(Array.from({ length: 160 }, (_, i) => {
    const t = i / 159
    return new Vector3(Math.cos(t * Math.PI * 15) * .047, .605 + t * .78, Math.sin(t * Math.PI * 15) * .047)
  })), 160, .006, 8, false), [])
  useEffect(() => () => coil.dispose(), [coil])
  return <>
    <mesh castShadow position={[0, .994, 0]}><cylinderGeometry args={[.046, .05, .8, 48]}/><meshPhysicalMaterial color="#ffebcb" roughness={.4} sheen={.3}/></mesh>
    <mesh geometry={coil}><meshStandardMaterial color="#ffebcb" roughness={.4}/></mesh>
    <mesh position={[0, .601, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.073, .009, 12, 48]}/><meshStandardMaterial color="#c49242" metalness={.8} roughness={.25}/></mesh>
  </>
}

export function Candles({ config }: { config: BirthdayConfig }) {
  const anchors = candleAnchors(config)
  const placement = candlePlacement(config)
  return <>
    <group position-y={placement.y} scale={placement.scale}>{config.candleType === 'regular' ? <RegularCandle/> : [...String(config.age)].map((digit, i) => <NumberCandle key={i} digit={digit} x={anchors[i][0] / placement.scale}/>)}</group>
    {anchors.map(([x, y, z], i) => <mesh key={i} position={[x, y - .005, z]}><cylinderGeometry args={[.003, .005, .035, 10]}/><meshStandardMaterial color="#382016"/></mesh>)}
  </>
}
