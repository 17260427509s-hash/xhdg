import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial } from 'three'
import { random } from '../utils/random'
import { budgets, type ExperienceEngine } from '../experience/engine'

const vertexShader=/* glsl */ `
attribute float aSize,aSeed;
attribute vec3 aFacet;
uniform float uTime,uDpr;
varying vec3 vColor;
varying float vLight,vSeed;
void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.);
  vec3 normal=normalize(normalMatrix*aFacet);
  vec3 halfVector=normalize(normalize(-mv.xyz)+normalize(vec3(-.45,.65,.8)));
  float reflection=pow(max(dot(normal,halfVector),0.),42.);
  float twinkle=pow(.5+.5*sin(uTime*.85+aSeed*87.),10.);
  vLight=.35+twinkle*.5+reflection*.9;
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
  float core=exp(-r2*70.);
  float halo=exp(-r2*17.)*.15;
  float rayWidth=max(fwidth(p.x)*.6,.012);
  float rays=0.;
  if(vSeed>.985)rays=(exp(-abs(p.x)/rayWidth)*exp(-abs(p.y)*8.)
    +exp(-abs(p.y)/rayWidth)*exp(-abs(p.x)*8.))*.45;
  float alpha=(core+halo+rays)*vLight*uReveal;
  if(alpha<.004)discard;
  gl_FragColor=vec4(vColor,alpha);
}`

export function StarSand({engine}:{engine:ExperienceEngine}) {
  const gl=useThree(s=>s.gl)
  const count=budgets[engine.snapshot.tier].surface
  const geometry=useMemo(()=>{
    const rng=random(173)
    const positions=new Float32Array(count*3),colors=new Float32Array(count*3)
    const sizes=new Float32Array(count),seeds=new Float32Array(count),facets=new Float32Array(count*3)
    const palette=['#87afff','#f3e8ff','#ffcf89','#d6a0f0','#9edce9']
    for(let i=0;i<count;i++){
      const angle=rng()*Math.PI*2,top=i%12===0,radius=top?Math.sqrt(rng())*1.24:1.356
      positions.set([Math.cos(angle)*radius,top?.592:-.48+rng()*.85,Math.sin(angle)*radius],i*3)
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
  },[count])
  const material=useMemo(()=>new ShaderMaterial({
    transparent:true,depthWrite:false,vertexColors:true,blending:AdditiveBlending,toneMapped:false,
    uniforms:{uTime:{value:0},uDpr:{value:1},uReveal:{value:0}},vertexShader,fragmentShader,
  }),[])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  useEffect(()=>()=>material.dispose(),[material])
  useFrame(()=>{
    material.uniforms.uTime.value=engine.snapshot.reduced?0:engine.time
    material.uniforms.uDpr.value=gl.getPixelRatio()*(engine.snapshot.tier==='desktop'?1:1.6)
    material.uniforms.uReveal.value=engine.motion.reveal
  })
  return <points geometry={geometry} material={material}/>
}
