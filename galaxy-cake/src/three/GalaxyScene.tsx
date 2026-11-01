import { Component, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, ElementRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls, SoftShadows } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO } from '@react-three/postprocessing'
import { Color, Vector3 } from 'three'
import type { ExperienceEngine, Phase, Tier } from '../experience/engine'
import { budgets } from '../experience/engine'
import { Cake } from './Cake'
import { Flame } from './Flame'
import { ParticleLayer } from './Particles'
import { OrbitRings } from './OrbitRings'
import { Atmosphere } from './Atmosphere'
import { CandleGlow } from './CandleGlow'

function Scene({engine,phase,tier,onLost}:{engine:ExperienceEngine;phase:Phase;tier:Tier;onLost:()=>void}) {
  const controls=useRef<ElementRef<typeof OrbitControls>>(null!),lastReset=useRef(-1),lastPhase=useRef<Phase>('intro'),celebrationCamera=useMemo(()=>new Vector3(),[])
  const {camera,size,gl,scene}=useThree(),mobile=size.width<700
  const introBackground=useMemo(()=>new Color('#050507'),[])
  const litBackground=useMemo(()=>new Color('#050507'),[])
  const distance=mobile?3.3/(Math.tan(20*Math.PI/180)*(size.width/size.height)):9.2
  const target=useMemo(()=>new Vector3(0,mobile?.42:-.08,0),[mobile])
  const budget=budgets[tier]
  useEffect(()=>{
    const canvas=gl.domElement
    gl.info.autoReset=false
    const lost=(e:Event)=>{e.preventDefault();onLost()}
    canvas.addEventListener('webglcontextlost',lost)
    return()=>canvas.removeEventListener('webglcontextlost',lost)
  },[gl,onLost])
  useEffect(()=>{lastReset.current=-1},[size.width,size.height])
  useFrame((_,delta)=>{
    engine.tick(delta)
    if(scene.background instanceof Color)scene.background.copy(introBackground).lerp(litBackground,engine.motion.reveal)
    document.documentElement.style.setProperty('--message',String(engine.motion.messageReveal))
    if(lastReset.current!==engine.resetId){
      camera.position.set(0,target.y+distance*.3,distance*.954)
      controls.current.target.copy(target);controls.current.update();lastReset.current=engine.resetId
    }
    controls.current.autoRotate=phase==='idle'&&!engine.snapshot.paused&&!engine.snapshot.reduced&&!engine.dragging&&engine.time-engine.lastInteraction>5
    if(phase==='celebration'&&lastPhase.current!=='celebration')celebrationCamera.copy(camera.position).sub(target)
    if(phase==='celebration'||phase==='message')camera.position.copy(celebrationCamera).multiplyScalar(1-engine.motion.camera*.12).add(target)
    lastPhase.current=phase
    engine.stats.rotation=controls.current.object.rotation.toArray().slice(0,3) as number[]
    engine.stats.camera=camera.position.toArray()
    engine.stats.calls=gl.info.render.calls
    engine.stats.points=gl.info.render.points
    engine.stats.geometries=gl.info.memory.geometries;engine.stats.textures=gl.info.memory.textures
    gl.info.reset()
  },-2)
  const active=phase==='idle'||phase==='message'
  return <>
    <color attach="background" args={['#050507']}/>
    <Environment resolution={128} frames={1} environmentIntensity={.6}>
      <Lightformer form="rect" intensity={2} color="#e0e8ff" position={[-3,4,4]} target={[0,0,0]} scale={4}/>
      <Lightformer form="rect" intensity={1.5} color="#bca0ff" position={[4,2,-3]} target={[0,0,0]} scale={3}/>
      <Lightformer form="circle" intensity={.8} color="#ffd8ad" position={[0,5,1]} target={[0,0,0]} scale={3}/>
    </Environment>
    <SoftShadows size={18} samples={tier==='desktop'?16:8} focus={0}/>
    <ambientLight intensity={.15} color="#d5d8ff"/>
    <hemisphereLight args={['#c6d4ff','#302040',.35]}/>
    <directionalLight castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3} shadow-normalBias={.015} shadow-bias={-.0001} shadow-radius={3} position={[-3,5,4]} intensity={2.5} color="#fff2db"/>
    <directionalLight position={[4,2,-3]} intensity={1.15} color="#af9bff"/>
    <directionalLight position={[-4,0,1]} intensity={.3} color="#8aafff"/>
    <Atmosphere engine={engine}/>
    <ParticleLayer engine={engine} layer="far" count={budget.far}/>
    <ParticleLayer engine={engine} layer="near" count={budget.near}/>
    <ParticleLayer engine={engine} layer="dust" count={budget.dust}/>
    <Cake engine={engine}/><CandleGlow engine={engine}/><Flame engine={engine}/><OrbitRings engine={engine}/>
    <ParticleLayer engine={engine} layer="sparks" count={budget.sparks}/>
    <ParticleLayer engine={engine} layer="burst" count={budget.burst}/>
    <OrbitControls ref={controls} target={target} enablePan={false} enableDamping dampingFactor={.065} enabled={active} enableZoom={active} minDistance={distance*.88} maxDistance={distance*1.2} minPolarAngle={.72} maxPolarAngle={1.48} autoRotateSpeed={.18} rotateSpeed={.55} zoomSpeed={.45} onStart={()=>{engine.dragging=true;engine.lastInteraction=engine.time}} onEnd={()=>{engine.dragging=false;engine.lastInteraction=engine.time}}/>
    <EffectComposer multisampling={tier==='desktop'?2:0} resolutionScale={tier==='low'?.5:mobile?.75:1}>
      <N8AO enabled={tier==='desktop'} quality="medium" aoRadius={.05} distanceFalloff={1} intensity={.45} halfRes/>
      <Bloom intensity={.6} luminanceThreshold={1.2} luminanceSmoothing={.22} mipmapBlur resolutionScale={tier==='low'?.4:.7}/>
    </EffectComposer>
  </>
}
function Unavailable({retry}:{retry:()=>void}) {return <div className="unavailable" role="alert"><h1>星河暂时无法点亮</h1><p>需要支持 WebGL 2 的浏览器。请开启硬件加速，或换一个浏览器后重试。</p><button className="primary" onClick={retry}>重新尝试 <span>↻</span></button></div>}
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){return this.state.failed?<Unavailable retry={()=>location.reload()}/>:this.props.children}
}
export function GalaxyScene({engine,phase,tier}:{engine:ExperienceEngine;phase:Phase;tier:Tier}) {
  const [lost,setLost]=useState(false)
  return <SceneBoundary>{lost?<Unavailable retry={()=>location.reload()}/>:<Canvas shadows dpr={[1,budgets[tier].dpr]} camera={{position:[0,3.4,8.2],fov:40,near:.1,far:65}} gl={{alpha:false,antialias:false,powerPreference:'high-performance'}} fallback={<div aria-hidden="true"><Unavailable retry={()=>location.reload()}/></div>}><Scene engine={engine} phase={phase} tier={tier} onLost={()=>setLost(true)}/></Canvas>}</SceneBoundary>
}
