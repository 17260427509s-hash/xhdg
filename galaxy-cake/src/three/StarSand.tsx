import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import { random } from '../utils/random'
import type { ExperienceEngine } from '../experience/engine'
import { galaxyThemes } from '../store/birthdayStore'
import { cakeOutline } from '../utils/cakeShape'

const vertexShader=/* glsl */ `
attribute float aSize,aSeed;
attribute vec3 aFacet;
uniform float uTime,uDpr;
uniform vec3 uKeyLight;
varying vec3 vColor;
varying float vLight,vSeed;
void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.);
  vec3 normal=normalize(normalMatrix*aFacet);
  vec3 lightDirection=normalize(mat3(viewMatrix)*uKeyLight);
  vec3 halfVector=normalize(normalize(-mv.xyz)+lightDirection);
  float reflection=pow(max(dot(normal,halfVector),0.),64.);
  float twinkle=pow(.5+.5*sin(uTime*.85+aSeed*87.),10.);
  vLight=.12+twinkle*.12+reflection*2.4;
  vColor=color;
  vSeed=aSeed;
  gl_PointSize=clamp(aSize*uDpr*8.7/-mv.z,1.,9.);
  gl_Position=projectionMatrix*mv;
}`

const fragmentShader=/* glsl */ `
varying vec3 vColor;
varying float vLight,vSeed;
uniform float uReveal;
void main(){
  vec2 p=gl_PointCoord-.5;
  float r2=dot(p,p);
  float core=exp(-r2*80.);
  float halo=exp(-r2*25.)*.065;
  float rayWidth=max(fwidth(p.x)*.6,.012);
  float rays=0.;
  if(vSeed>.995)rays=(exp(-abs(p.x)/rayWidth)*exp(-abs(p.y)*8.)
    +exp(-abs(p.y)/rayWidth)*exp(-abs(p.x)*8.))*.45;
  float alpha=(core+halo+rays)*vLight*uReveal;
  if(alpha<.004)discard;
  gl_FragColor=vec4(vColor,alpha);
}`

export function StarSand({engine,layers=1,tierIndex=0}:{engine:ExperienceEngine;layers?:number;tierIndex?:number}) {
  const gl=useThree(s=>s.gl)
  const total=engine.getBudget().surface,count=Math.floor(total/layers)+(tierIndex===0?total%layers:0),shape=engine.snapshot.config.cakeShape,theme=engine.snapshot.config.galaxyTheme
  const geometry=useMemo(()=>{
    const rng=random(173)
    const positions=new Float32Array(count*3),colors=new Float32Array(count*3)
    const sizes=new Float32Array(count),seeds=new Float32Array(count),facets=new Float32Array(count*3)
    const palette=galaxyThemes[theme].colors
    for(let i=0;i<count;i++){
      const angle=rng()*Math.PI*2,top=i%12===0,radius=top?Math.sqrt(rng())*1.24:1.356
      const [x,z]=cakeOutline(angle,radius,shape)
      positions.set([x,top?.592:-.48+rng()*.85,z],i*3)
      facets.set(top?[(rng()-.5)*.7,1,(rng()-.5)*.7]
        :[Math.cos(angle)+(rng()-.5)*.5,(rng()-.5)*.7,Math.sin(angle)+(rng()-.5)*.5],i*3)
      new Color(palette[Math.floor(rng()*palette.length)]).multiplyScalar(i%37===0?2.8:1.25).toArray(colors,i*3)
      sizes[i]=i%47===0?4+rng()*2:1+rng()*1.4
      seeds[i]=rng()
    }
    const g=new BufferGeometry()
    for(const [name,array,components]of[
      ['position',positions,3],['color',colors,3],['aSize',sizes,1],['aSeed',seeds,1],['aFacet',facets,3],
    ]as const)g.setAttribute(name,new Float32BufferAttribute(array,components))
    return g
  },[count,shape,theme])
  const material=useMemo(()=>new ShaderMaterial({
    transparent:true,depthWrite:false,vertexColors:true,blending:AdditiveBlending,toneMapped:false,
    uniforms:{uTime:{value:0},uDpr:{value:1},uReveal:{value:0},uKeyLight:{value:new Vector3(-3,5,4).normalize()}},vertexShader,fragmentShader,
  }),[])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  useEffect(()=>()=>material.dispose(),[material])
  useFrame(()=>{
    material.uniforms.uTime.value=engine.snapshot.reduced?0:engine.time
    material.uniforms.uDpr.value=gl.getPixelRatio()*(engine.snapshot.tier==='desktop'?1:1.6)
    material.uniforms.uReveal.value=engine.motion.reveal*engine.motion.cakeReveal*(engine.snapshot.config.galaxyEnabled?1:0)
  })
  return <points geometry={geometry} material={material}/>
}
