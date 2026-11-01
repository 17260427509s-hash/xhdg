import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Mesh, ShaderMaterial, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Line } from 'three'
import type { ExperienceEngine } from '../experience/engine'
export function Atmosphere({engine}:{engine:ExperienceEngine}) {
  const mesh=useRef<Mesh>(null!),nebula=useRef<Mesh>(null!)
  const nebulaMaterial=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,toneMapped:false,uniforms:{uPower:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
    varying vec2 vUv;uniform float uPower;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
    void main(){vec2 p=vUv-.5;float n=noise(p*13.)*.55+noise(p*28.)*.28+noise(p*61.)*.17;float a=pow(n,2.)*exp(-dot(p,p)*16.)*.34*uPower;gl_FragColor=vec4(mix(vec3(.09,.1,.5),vec3(.32,.08,.64),n),a);}`}),[])
  useFrame(({camera})=>{nebula.current.quaternion.copy(camera.quaternion);nebulaMaterial.uniforms.uPower.value=engine.motion.reveal})

  const material=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,toneMapped:false,uniforms:{uPower:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float uPower;void main(){vec2 p=vUv-.5;float d=length(p*vec2(1.,1.));float a=exp(-d*d*18.)*.16*uPower*(1.-smoothstep(.36,.5,length(p)));gl_FragColor=vec4(.32,.14,1.1,a);}`}),[])
  useFrame(()=>{material.uniforms.uPower.value=engine.motion.reveal})
  const geo=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(Array.from({length:24},(_,i)=>{const t=i/23;return [4-t*1.3,3-t*.5,-2]}).flat(),3));return g},[])
  const meteor=useMemo(()=>new LineBasicMaterial({color:'#c2c6ff',transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false}),[])
  const meteorLine=useMemo(()=>new Line(geo,meteor),[geo,meteor])
  const streak=useRef<Line>(null!)
  useFrame(()=>{const t=engine.time%13;meteor.opacity=!engine.snapshot.reduced&&t>8&&t<9?Math.sin((t-8)*Math.PI)*.35:0;if(streak.current){streak.current.position.x=-(t-8)*2;streak.current.position.y=-(t-8)*.8}})
  useEffect(()=>()=>{nebulaMaterial.dispose();material.dispose();geo.dispose();meteor.dispose()},[nebulaMaterial,material,geo,meteor])
  return <><mesh ref={nebula} position={[0,.1,-1.8]} material={nebulaMaterial}><planeGeometry args={[7,6]}/></mesh><mesh ref={mesh} position={[0,-.97,0]} rotation={[-Math.PI/2,0,0]} material={material}><planeGeometry args={[4.8,4.8]}/></mesh><primitive ref={streak} object={meteorLine}/></>
}
