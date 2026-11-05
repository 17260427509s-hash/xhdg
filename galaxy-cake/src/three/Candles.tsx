import { useEffect, useMemo, useRef } from 'react'
import { Group, LatheGeometry, Vector2 } from 'three'
import { candlePlacement } from '../utils/cakeAssembly'
import type { ExperienceEngine } from '../experience/engine'
import { useFrame } from '@react-three/fiber'
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
  const wax=useMemo(()=>{
    const profile=[new Vector2(0,.597)]
    for(let i=0;i<=192;i++){
      const t=i/192,bevel=Math.min(1,t*65,(1-t)*65)
      profile.push(new Vector2(.042+.004*Math.sin(Math.max(0,bevel)*Math.PI/2),.597+t*.797))
    }
    profile.push(new Vector2(.034,1.393),new Vector2(.02,1.382),new Vector2(0,1.382))
    const g=new LatheGeometry(profile,96),p=g.getAttribute('position')
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.hypot(x,z)
      if(r>.04){
        const phase=Math.atan2(z,x)*3-(y-.597)*54
        const envelope=Math.min(1,(y-.597)*65,(1.394-y)*65)
        const ridge=(.0016*Math.cos(phase)+.0005*Math.cos(phase*2))*Math.max(0,envelope)
        p.setXYZ(i,x*(1+ridge/r),y,z*(1+ridge/r))
      }
    }
    g.computeVertexNormals();return g
  },[])
  useEffect(() => () => wax.dispose(), [wax])
  return <>
    <mesh castShadow geometry={wax}><meshPhysicalMaterial color="#ffe3ad" roughness={.39} sheen={.22} sheenColor="#ffd49a" specularIntensity={.38} clearcoat={.04}/></mesh>
    <mesh position={[0, .601, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.073, .009, 12, 48]}/><meshStandardMaterial color="#c49242" metalness={.8} roughness={.25}/></mesh>
  </>
}

export function Candles({ engine }: { engine: ExperienceEngine }) {
  const config=engine.snapshot.config,group=useRef<Group>(null!)
  const anchors = candleAnchors(config)
  const placement = candlePlacement(config)
  useFrame(()=>{group.current.position.y=engine.visualCake.candle.y+engine.visualCake.candle.lift;group.current.scale.setScalar(engine.visualCake.candle.scale)})
  return <group ref={group}>
    <group>{config.candleType === 'regular' ? <RegularCandle/> : [...String(config.age)].map((digit, i) => <NumberCandle key={i} digit={digit} x={(i-(String(config.age).length-1)/2)*.51}/>)}</group>
    {anchors.map(([x, y, z], i) => <mesh key={i} position={[x/placement.scale, (y-placement.y)/placement.scale-.005, z/placement.scale]}><cylinderGeometry args={[.003, .005, .035, 10]}/><meshStandardMaterial color="#382016"/></mesh>)}
  </group>
}
