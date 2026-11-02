import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, Mesh, ShaderMaterial } from 'three'
import type { ExperienceEngine } from '../experience/engine'
import { candleAnchors } from '../utils/candles'
import { candleLift, candlePlacement, tierLift } from '../utils/cakeAssembly'

const vertexShader = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`

/** The reference's warm light pool and orange fire aura are rendered in 3D. */
export function CandleGlow({engine}:{engine:ExperienceEngine}) {
  const aura=useRef<Mesh>(null!),pool=useRef<Mesh>(null!)
  const config=engine.snapshot.config,anchors=useMemo(()=>candleAnchors(config),[config.age,config.candleType,config.cakeLayers])
  const placement=useMemo(()=>candlePlacement(config),[config.cakeLayers])
  const poolMaterial=useMemo(()=>new ShaderMaterial({
    transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,toneMapped:false,
    uniforms:{uPower:{value:0}},vertexShader,
    fragmentShader:`varying vec2 vUv;uniform float uPower;void main(){
      float r=length((vUv-.5)*2.);float core=exp(-r*r*11.);float halo=exp(-r*r*3.5);
      float a=(core*.045+halo*.012)*(1.-smoothstep(.75,1.,r))*uPower;
      vec3 c=mix(vec3(1.2,.34,.09),vec3(2.1,1.25,.48),core);
      if(a<.005)discard;gl_FragColor=vec4(c,a);
    }`,
  }),[])
  const auraMaterial=useMemo(()=>new ShaderMaterial({
    transparent:true,depthWrite:false,blending:AdditiveBlending,toneMapped:false,
    uniforms:{uPower:{value:0}},vertexShader,
    fragmentShader:`varying vec2 vUv;uniform float uPower;void main(){
      vec2 p=(vUv-.5)*vec2(2.3,1.8);float r=length(p);
      float a=exp(-r*r*10.)*.025*(1.-smoothstep(.7,1.,r))*uPower;
      if(a<.003)discard;gl_FragColor=vec4(2.4,.35,.025,a);
    }`,
  }),[])
  useEffect(()=>()=>{poolMaterial.dispose();auraMaterial.dispose()},[poolMaterial,auraMaterial])
  useFrame(({camera})=>{
    const power=engine.motion.ignition*engine.motion.decorReveal*(1+Math.min(engine.motion.energy-1,1)*.25)
    poolMaterial.uniforms.uPower.value=power
    auraMaterial.uniforms.uPower.value=power
    aura.current.quaternion.copy(camera.quaternion)
    aura.current.position.y=anchors[0][1]+.2+candleLift(config,engine.motion.spread)
    pool.current.position.y=placement.surface+tierLift(config.cakeLayers-1,engine.motion.spread)+.36*engine.motion.spread
  })
  return <>
    <mesh ref={pool} position={[0,.594,0]} rotation={[-Math.PI/2,0,0]} material={poolMaterial}><planeGeometry args={[2.4,2.4]}/></mesh>
    <mesh ref={aura} position={[0,1.65,-.025]} material={auraMaterial}><planeGeometry args={[.9,1.15]}/></mesh>
  </>
}
