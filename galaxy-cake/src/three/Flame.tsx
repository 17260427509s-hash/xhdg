import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Mesh, NormalBlending, PointLight, ShaderMaterial, Vector3 } from 'three'
import type { ExperienceEngine } from '../experience/engine'

const vertexShader = /* glsl */ `
varying vec3 vLocal;
void main(){vLocal=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`

const fragmentShader = /* glsl */ `
precision highp float;
varying vec3 vLocal;
uniform vec3 uCamera;
uniform float uTime,uPower;
uniform int uSteps;

float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){
  vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),
    mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),
    mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);
}
vec2 intersectBox(vec3 ro,vec3 rd){
  vec3 inv=1./rd;
  vec3 a=(-vec3(.18,.32,.18)-ro)*inv;
  vec3 b=(vec3(.18,.32,.18)-ro)*inv;
  vec3 lo=min(a,b),hi=max(a,b);
  return vec2(max(max(lo.x,lo.y),lo.z),min(min(hi.x,hi.y),hi.z));
}
vec4 sampleFlame(vec3 p){
  float h=p.y/.56+.5;
  if(h<=0.||h>=1.)return vec4(0.);
  float flicker=noise3(p*38.+vec3(0.,-uTime*1.5,0.));
  vec2 bend=vec2(sin(uTime*2.7-h*3.)*.018,cos(uTime*2.2-h*4.)*.011)*h*h;
  float width=.09*pow(sin(h*3.14159265),.62)*(1.-h*.6);
  width*=.91+flicker*.18;
  float radial=length(p.xz-bend)/max(width,.001);
  float density=(1.-smoothstep(.28,1.12,radial))
    *smoothstep(0.,.07,h)*(1.-smoothstep(.82,1.,h));
  float heat=(1.-smoothstep(.08,.67,radial))*(1.-smoothstep(.55,.94,h));
  vec3 emission=mix(vec3(2.8,.5,.035),vec3(4.,3.1,1.15),heat);
  emission=mix(emission,vec3(.15,.32,1.2),exp(-h*35.)*.8);
  return vec4(emission,density*(.88+flicker*.12));
}
void main(){
  vec3 direction=normalize(vLocal-uCamera);
  vec2 hit=intersectBox(uCamera,direction);
  float start=max(hit.x,0.);
  if(hit.y<=start)discard;
  float stepLength=(hit.y-start)/float(uSteps);
  vec4 accumulated=vec4(0.);
  for(int i=0;i<48;i++){
    if(i>=uSteps||accumulated.a>.985)break;
    vec3 p=uCamera+direction*(start+(float(i)+.5)*stepLength);
    vec4 fire=sampleFlame(p);
    float a=1.-exp(-fire.a*stepLength*24.);
    accumulated.rgb+=(1.-accumulated.a)*a*fire.rgb;
    accumulated.a+=(1.-accumulated.a)*a;
  }
  float opacity=accumulated.a*uPower;
  if(opacity<.008)discard;
  gl_FragColor=vec4(accumulated.rgb/max(accumulated.a,.001),opacity);
}`

/** A procedural density volume: its interior changes with the viewing angle. */
export function Flame({engine}:{engine:ExperienceEngine}) {
  const mesh=useRef<Mesh>(null!),light=useRef<PointLight>(null!)
  const cameraLocal=useMemo(()=>new Vector3(),[])
  const material=useMemo(()=>new ShaderMaterial({
    transparent:true,depthWrite:false,side:BackSide,blending:NormalBlending,toneMapped:false,
    uniforms:{uCamera:{value:new Vector3()},uTime:{value:0},uPower:{value:0},uSteps:{value:40}},
    vertexShader,fragmentShader,
  }),[])
  useEffect(()=>()=>material.dispose(),[material])
  useFrame(({camera})=>{
    const ignition=engine.motion.ignition
    const t=engine.snapshot.reduced?0:engine.time
    mesh.current.visible=ignition>.015
    const height=.72*(1+Math.min(engine.motion.energy-1,.8)*.12)*Math.max(ignition,.001)
    mesh.current.scale.set(1,height,1)
    mesh.current.updateWorldMatrix(true,false)
    camera.getWorldPosition(cameraLocal)
    mesh.current.worldToLocal(cameraLocal)
    material.uniforms.uCamera.value.copy(cameraLocal)
    material.uniforms.uTime.value=t
    material.uniforms.uPower.value=Math.min(ignition,1)
    material.uniforms.uSteps.value=engine.snapshot.tier==='low'?20:engine.snapshot.tier==='mobile'?30:40
    light.current.intensity=ignition*(.85+Math.sin(t*7.3)*.045)*engine.motion.energy
  })
  return <>
    <mesh ref={mesh} position={[0,1.61,0]} material={material}><boxGeometry args={[.36,.64,.36]}/></mesh>
    <pointLight ref={light} position={[0,1.56,.04]} color="#ffc16e" distance={3.5} decay={2}/>
  </>
}
