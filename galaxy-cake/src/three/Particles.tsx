import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Group, ShaderMaterial, Vector3 } from 'three'
import { colorArray, random } from '../utils/random'
import type { ExperienceEngine } from '../experience/engine'
import { galaxyThemes } from '../store/birthdayStore'
import { candleAnchors } from '../utils/candles'
import { candleLift } from '../utils/cakeAssembly'

import { particleVertex as vertexShader, particleFragment as fragmentShader } from './shaders/particleShaders'

type Layer = 'near'|'far'|'sparks'|'burst'|'dust'
export function ParticleLayer({engine,count,layer}:{engine:ExperienceEngine;count:number;layer:Layer}) {
  const group=useRef<Group>(null!), gl=useThree(s=>s.gl),size=useThree(s=>s.size)
  const mode={near:0,far:1,sparks:2,burst:3,dust:4}[layer]
  const theme=engine.snapshot.config.galaxyTheme
  const config=engine.snapshot.config,anchors=useMemo(()=>candleAnchors(config),[config.age,config.candleType,config.cakeLayers])
  const geometry=useMemo(()=>{
    const rng=random(43+mode),p=new Float32Array(count*3),s=new Float32Array(count),seed=new Float32Array(count),velocity=new Float32Array(count*3)
    for(let i=0;i<count;i++) {
      seed[i]=rng(); const a=rng()*Math.PI*2, y=rng()*2-1, r=layer==='far'?8+rng()*8:1.4+Math.pow(rng(),.7)*1.45
      const radial=Math.sqrt(1-y*y)
      const height=layer==='near'?(rng()<.73?-1.05+rng()*2.45:1.05+rng()*1.1):y*1.85+.5
      p.set(layer==='far'?[(rng()-.5)*34,(rng()-.5)*22,-4-rng()*16]:[Math.cos(a)*r*(.7+radial*.3),height,Math.sin(a)*r*(.7+radial*.3)],i*3)
      if(layer==='dust'&&seed[i]<.65){
        const belt=1.5+rng()*.98
        p.set([Math.cos(a)*belt,-.69+(rng()-.5)*.64+Math.sin(a*2)*.14,Math.sin(a)*belt],i*3)
      }
      const speed=.8+rng()*1.6;velocity.set([Math.cos(a)*radial*speed,y*speed+1,Math.sin(a)*radial*speed],i*3)
      s[i]=layer==='far'?1.5+rng()*1.4:layer==='dust'?1.3+rng()*1.7:layer==='sparks'?.9+rng()*1.8:layer==='near'?(seed[i]>.965?16+rng()*7:seed[i]>.84?5+rng()*4:2.5+rng()*3.5):2+rng()*5
      if(layer==='near'&&seed[i]>.995)s[i]=24+rng()*4
    }
    const colors=colorArray(count,rng,layer==='far'?1.3:layer==='near'?3.4:2.2,galaxyThemes[theme].colors)
    if(layer==='sparks')for(let i=0;i<count;i++)colors.set([3.,1.65,.55],i*3)
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('color',new Float32BufferAttribute(colors,3));g.setAttribute('aSize',new Float32BufferAttribute(s,1));g.setAttribute('aSeed',new Float32BufferAttribute(seed,1));g.setAttribute('aVelocity',new Float32BufferAttribute(velocity,3));return g
  },[count,layer,mode,theme])
  const material=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:AdditiveBlending,toneMapped:false,uniforms:{uTime:{value:0},uDpr:{value:1},uMode:{value:mode},uAge:{value:-1},uReduced:{value:1},uOpacity:{value:1},uReveal:{value:0},uGather:{value:0},uCandleCount:{value:1},uCandles:{value:[new Vector3(),new Vector3(),new Vector3()]}},vertexShader,fragmentShader}),[mode])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  useEffect(()=>()=>material.dispose(),[material])
  useFrame(()=>{
    material.uniforms.uTime.value=layer==='sparks'||layer==='burst'?engine.time:engine.orbitTime
    material.uniforms.uDpr.value=gl.getPixelRatio()*(size.width<700&&layer!=='far'?(layer==='near'?1.15:1.65):1)
    material.uniforms.uReduced.value=engine.snapshot.reduced?0:1
    const gather=engine.snapshot.phase==='entering'?Math.max(0,Math.min(1,(engine.phaseTime-2.8)/.7)):1
    material.uniforms.uReveal.value=engine.motion.reveal
    material.uniforms.uGather.value=gather
    material.uniforms.uCandleCount.value=anchors.length
    for(let i=0;i<3;i++){material.uniforms.uCandles.value[i].fromArray(anchors[i%anchors.length]);material.uniforms.uCandles.value[i].y+=candleLift(config,engine.motion.spread)}
    material.uniforms.uOpacity.value=layer==='far'?.8:layer==='sparks'?engine.snapshot.phase==='entering'?Math.max(gather*.8,engine.motion.ignition):engine.motion.ignition:layer==='burst'?(engine.snapshot.reduced?.35:1):engine.snapshot.phase==='intro'?0:Math.min(engine.time*.7,1)
    material.uniforms.uAge.value=engine.snapshot.phase==='celebration'||engine.snapshot.phase==='message'?engine.phaseTime-1.7:-1
    if(layer==='near'||layer==='dust'||layer==='burst')material.uniforms.uOpacity.value*=Math.min(engine.motion.energy,1.6)
    if(layer==='sparks')material.uniforms.uOpacity.value*=engine.motion.decorReveal
    group.current.visible=layer!=='near'&&layer!=='dust'||engine.snapshot.config.galaxyEnabled
    if(layer==='near')group.current.rotation.y=engine.orbitTime*.025
  })
  return <group ref={group}><points geometry={geometry} material={material} frustumCulled={false}/></group>
}
