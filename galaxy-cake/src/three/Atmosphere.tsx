import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { AdditiveBlending, Mesh, ShaderMaterial, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, Line } from 'three'
import type { ExperienceEngine } from '../experience/engine'
import { galaxyColorGLSL } from './shaders/galaxyColor'
export function Atmosphere({engine}:{engine:ExperienceEngine}) {
  const mesh=useRef<Mesh>(null!),nebula=useRef<Mesh>(null!)
  const cloudMap=useTexture('/textures/galaxy-icing.webp')
  const nebulaMaterial=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,toneMapped:false,uniforms:{uPower:{value:0},uCloud:{value:cloudMap},uHue:{value:0},uSaturation:{value:1},uTime:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
    varying vec2 vUv;uniform float uPower,uHue,uSaturation,uTime;uniform sampler2D uCloud;
    ${galaxyColorGLSL}
    void main(){vec2 p=vUv-.5;vec2 drift=vec2(sin(uTime*.11)*.018,sin(uTime*.09)*.012);vec3 cloud=galaxyColor(texture2D(uCloud,vUv+drift).rgb,uHue,uSaturation);
      float envelope=exp(-p.x*p.x*9.-p.y*p.y*18.)*(1.-smoothstep(.34,.5,length(p)));
      gl_FragColor=vec4(cloud*1.75,envelope*.44*uPower);}`}),[cloudMap])
  useFrame(({camera})=>{nebula.current.quaternion.copy(camera.quaternion);nebulaMaterial.uniforms.uPower.value=engine.motion.reveal;nebulaMaterial.uniforms.uHue.value=engine.sky.hue;nebulaMaterial.uniforms.uSaturation.value=engine.sky.saturation;nebulaMaterial.uniforms.uTime.value=engine.sky.time})

  const material=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,toneMapped:false,uniforms:{uPower:{value:0},uHue:{value:0},uSaturation:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 vUv;uniform float uPower,uHue,uSaturation;${galaxyColorGLSL} void main(){vec2 p=vUv-.5;float d=length(p*vec2(1.,1.));float a=exp(-d*d*18.)*.16*uPower*(1.-smoothstep(.36,.5,length(p)));gl_FragColor=vec4(galaxyColor(vec3(.32,.14,.95),uHue,uSaturation)*1.1,a);}`}),[])
  useFrame(()=>{material.uniforms.uPower.value=engine.motion.reveal;material.uniforms.uHue.value=engine.sky.hue;material.uniforms.uSaturation.value=engine.sky.saturation})
  const geo=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(Array.from({length:24},(_,i)=>{const t=i/23;return [4-t*1.3,3-t*.5,-2]}).flat(),3));return g},[])
  const meteor=useMemo(()=>new LineBasicMaterial({color:'#c2c6ff',transparent:true,opacity:0,blending:AdditiveBlending,depthWrite:false}),[])
  const meteorLine=useMemo(()=>new Line(geo,meteor),[geo,meteor])
  const streak=useRef<Line>(null!)
  useFrame(()=>{const t=engine.time%13;meteor.opacity=!engine.snapshot.reduced&&t>8&&t<9?Math.sin((t-8)*Math.PI)*.35:0;if(streak.current){streak.current.position.x=-(t-8)*2;streak.current.position.y=-(t-8)*.8}})
  useEffect(()=>()=>{nebulaMaterial.dispose();material.dispose();geo.dispose();meteor.dispose()},[nebulaMaterial,material,geo,meteor])
  return <><mesh ref={nebula} position={[0,-.98,-.6]} material={nebulaMaterial}><planeGeometry args={[5.5,2.3]}/></mesh><mesh ref={mesh} position={[0,-.97,0]} rotation={[-Math.PI/2,0,0]} material={material}><planeGeometry args={[4.8,4.8]}/></mesh><primitive ref={streak} object={meteorLine}/></>
}
