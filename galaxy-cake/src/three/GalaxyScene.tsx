import { Component, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, ElementRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO } from '@react-three/postprocessing'
import { Color, Vector2, Vector3 } from 'three'
import type { EffectComposer as Composer } from 'postprocessing'
import type { ExperienceEngine, Phase, Tier } from '../experience/engine'
import { budgets } from '../experience/engine'
import { Cake } from './Cake'
import { Flame } from './Flame'
import { ParticleLayer } from './Particles'
import { OrbitRings } from './OrbitRings'
import { Atmosphere } from './Atmosphere'
import { CandleGlow } from './CandleGlow'
import { SmokeParticles } from './SmokeParticles'
import { ConfettiExplosion } from './ConfettiExplosion'

function Scene({engine,phase,tier,onLost}:{engine:ExperienceEngine;phase:Phase;tier:Tier;onLost:()=>void}) {
  const controls=useRef<ElementRef<typeof OrbitControls>>(null!),lastReset=useRef(-1),lastPhase=useRef<Phase>('intro'),celebrationCamera=useMemo(()=>new Vector3(),[]),focusY=useRef(0),focusZoom=useRef(1)
  const {camera,size,gl,scene}=useThree(),mobile=size.width<700
  const introBackground=useMemo(()=>new Color('#050507'),[])
  const litBackground=useMemo(()=>new Color('#050507'),[])
  const distance=mobile?3.3/(Math.tan(20*Math.PI/180)*(size.width/size.height)):9.2
  const target=useMemo(()=>new Vector3(0,mobile?.42:-.08,0),[mobile])
  const budget=engine.getBudget()
  const composer=useRef<Composer>(null!)
  const capture=useRef<{longEdge:number;resolve:(blob:Blob)=>void;reject:(error:Error)=>void}|null>(null)
  useEffect(()=>{
    engine.captureScene=(longEdge)=>new Promise((resolve,reject)=>{
      if(capture.current||document.hidden||!['idle','message'].includes(engine.snapshot.phase)||engine.snapshot.editing||engine.snapshot.switching||engine.snapshot.assembling){reject(new Error('请等待蛋糕合拢后再导出。'));return}
      capture.current={longEdge,resolve,reject}
    })
    return()=>{engine.captureScene=null;capture.current?.reject(new Error('画面已关闭，请重新尝试。'));capture.current=null}
  },[engine])
  useFrame(()=>{
    const request=capture.current
    if(!request||!composer.current)return
    capture.current=null
    const original=gl.getSize(new Vector2()),dpr=gl.getPixelRatio(),autoClear=gl.autoClear
    try {
      const edge=Math.min(request.longEdge,tier==='low'?1600:tier==='mobile'?2400:3200,gl.capabilities.maxTextureSize)
      const scale=edge/Math.max(original.x,original.y),width=Math.round(original.x*scale),height=Math.round(original.y*scale)
      gl.setPixelRatio(1);gl.setSize(width,height,false);composer.current.setSize(width,height)
      gl.autoClear=true;composer.current.render(0)
      const data=gl.domElement.toDataURL('image/png')
      void fetch(data).then(response=>response.blob()).then(request.resolve).catch(()=>request.reject(new Error('图片未能生成，请重试。')))
    } catch {request.reject(new Error('当前设备无法导出此分辨率，请稍后重试。'))}
    finally {gl.setPixelRatio(dpr);gl.setSize(original.x,original.y,false);composer.current.setSize(original.x,original.y);gl.autoClear=autoClear;gl.info.reset()}
  },2)
  const shadowState=useRef({config:engine.snapshot.config,tier,moving:false})
  useEffect(()=>{
    const canvas=gl.domElement
    gl.info.autoReset=false
    gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true
    const lost=(e:Event)=>{e.preventDefault();onLost()}
    canvas.addEventListener('webglcontextlost',lost)
    return()=>{canvas.removeEventListener('webglcontextlost',lost);gl.shadowMap.autoUpdate=true}
  },[gl,onLost])
  useEffect(()=>{lastReset.current=-1},[size.width,size.height])
  useFrame((_,delta)=>{
    engine.tick(delta)
    const shadowMoving=phase==='entering'||engine.snapshot.switching||engine.snapshot.assembling
    if(shadowMoving||shadowState.current.moving||shadowState.current.config!==engine.snapshot.config||shadowState.current.tier!==tier){
      gl.shadowMap.needsUpdate=true
      shadowState.current={config:engine.snapshot.config,tier,moving:shadowMoving}
    }
    if(scene.background instanceof Color)scene.background.copy(introBackground).lerp(litBackground,engine.motion.reveal)
    document.documentElement.style.setProperty('--message',String(engine.motion.messageReveal))
    if(lastReset.current!==engine.resetId){
      focusY.current=0;focusZoom.current=1
      camera.position.set(0,target.y+distance*.3,distance*.954)
      controls.current.target.copy(target);controls.current.update();lastReset.current=engine.resetId
    }
    const focus=engine.motion.editorFocus*(.78+(engine.snapshot.config.cakeLayers-1)*.23)
    const shift=(focus-focusY.current)*(1-Math.exp(-Math.min(delta,.06)*10))
    focusY.current+=shift;camera.position.y+=shift;controls.current.target.y+=shift
    // The short phone preview needs space above an exploded three-tier candle.
    // Adjust the user's current orbit distance proportionally, preserving rotation.
    const zoom=1+(mobile?.11:0)*engine.motion.editorFocus
    const nextZoom=focusZoom.current+(zoom-focusZoom.current)*(1-Math.exp(-Math.min(delta,.06)*10))
    camera.position.sub(controls.current.target).multiplyScalar(nextZoom/focusZoom.current).add(controls.current.target)
    focusZoom.current=nextZoom
    controls.current.autoRotate=phase==='idle'&&!engine.snapshot.editing&&!engine.snapshot.assembling&&!engine.snapshot.paused&&!engine.snapshot.reduced&&!engine.dragging&&engine.time-engine.lastInteraction>5
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
    <Environment resolution={tier==='desktop'?256:128} frames={1} environmentIntensity={.72}>
      <Lightformer form="rect" intensity={2} color="#e0e8ff" position={[-3,4,4]} target={[0,0,0]} scale={4}/>
      <Lightformer form="rect" intensity={1.5} color="#bca0ff" position={[4,2,-3]} target={[0,0,0]} scale={3}/>
      <Lightformer form="circle" intensity={.8} color="#ffd8ad" position={[0,5,1]} target={[0,0,0]} scale={3}/>
    </Environment>
    <ambientLight intensity={.13} color="#d5d8ff"/>
    <hemisphereLight args={['#d6dfff','#392941',.3]}/>
    <directionalLight castShadow shadow-mapSize={tier==='desktop'?[2048,2048]:[1024,1024]} shadow-camera-left={-3} shadow-camera-right={3} shadow-camera-top={3} shadow-camera-bottom={-3} shadow-normalBias={.002} shadow-bias={-.0001} shadow-radius={4} shadow-blurSamples={8} position={[-3,3.8,5]} intensity={2.3} color="#fff2db"/>
    <directionalLight position={[4,2,-3]} intensity={.95} color="#c1afff"/>
    <directionalLight position={[-4,0,1]} intensity={.65} color="#b3c4ff"/>
    <Atmosphere engine={engine}/>
    <ParticleLayer engine={engine} layer="far" count={budget.far}/>
    <ParticleLayer engine={engine} layer="near" count={budget.near}/>
    <ParticleLayer engine={engine} layer="dust" count={budget.dust}/>
    <Cake engine={engine}/><CandleGlow engine={engine}/><Flame engine={engine}/><OrbitRings engine={engine}/>
    <ParticleLayer engine={engine} layer="sparks" count={budget.sparks}/>
    <ParticleLayer engine={engine} layer="burst" count={budget.burst}/>
    <SmokeParticles engine={engine}/><ConfettiExplosion engine={engine}/>
    <OrbitControls ref={controls} target={target} enablePan={false} enableDamping dampingFactor={.065} enabled={active} enableZoom={active} minDistance={distance*.88} maxDistance={distance*1.2} minPolarAngle={.72} maxPolarAngle={1.48} autoRotateSpeed={.18} rotateSpeed={.55} zoomSpeed={.45} onStart={()=>{engine.dragging=true;engine.lastInteraction=engine.time}} onEnd={()=>{engine.dragging=false;engine.lastInteraction=engine.time}}/>
    <EffectComposer ref={composer} multisampling={tier==='desktop'?2:0} resolutionScale={tier==='low'?.5:mobile?.75:1}>
      <N8AO enabled={tier==='desktop'} quality="medium" aoRadius={.055} distanceFalloff={1} intensity={.65} halfRes/>
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
  return <SceneBoundary>{lost?<Unavailable retry={()=>location.reload()}/>:<Canvas shadows="variance" dpr={[1,budgets[tier].dpr]} camera={{position:[0,3.4,8.2],fov:40,near:.1,far:65}} gl={{alpha:false,antialias:false,powerPreference:'high-performance'}} fallback={<div aria-hidden="true"><Unavailable retry={()=>location.reload()}/></div>}><Scene engine={engine} phase={phase} tier={tier} onLost={()=>setLost(true)}/></Canvas>}</SceneBoundary>
}
