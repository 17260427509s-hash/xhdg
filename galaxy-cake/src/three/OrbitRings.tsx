import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, Group, InstancedMesh, Object3D, ShaderMaterial } from 'three'
import type { ExperienceEngine } from '../experience/engine'
import { random } from '../utils/random'
import { galaxyThemes } from '../store/birthdayStore'

const configs = [
  {r:2.85,z:1.85,rotation:[.12,0,.16] as [number,number,number],speed:.11,color:'#e1c9f9'},
  {r:2.65,z:1.75,rotation:[.51,.2,.53] as [number,number,number],speed:-.08,color:'#ffe1a8'},
  {r:2.6,z:1.65,rotation:[.14,-.12,-.2] as [number,number,number],speed:.065,color:'#b9d7ff'},
]

function OrbitDust({engine,index}:{engine:ExperienceEngine;index:number}) {
  const {r,z,speed}=configs[index]
  const count=engine.getBudget().orbitDust,theme=engine.snapshot.config.galaxyTheme
  const geometry=useMemo(()=>{
    const rng=random(index+81),positions=new Float32Array(count*3),seeds=new Float32Array(count)
    for(let i=0;i<count;i++){positions.set([i/count*Math.PI*2,(rng()-.5)*.038,(rng()-.5)*.05],i*3);seeds[i]=rng()}
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('aSeed',new Float32BufferAttribute(seeds,1));return g
  },[count,index])
  const material=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,toneMapped:false,blending:AdditiveBlending,uniforms:{uTime:{value:0},uDpr:{value:1},uColor:{value:new Color(configs[index].color).multiplyScalar(2)}},
    vertexShader:`attribute float aSeed;uniform float uTime;uniform float uDpr;varying float vLight;void main(){float a=position.x+uTime*${speed.toFixed(3)};vec3 p=vec3(cos(a)*${r.toFixed(2)}+position.y,position.z,sin(a)*${z.toFixed(2)}+position.y);vLight=.4+.6*pow(.5+.5*sin(uTime+aSeed*60.),2.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(.9+aSeed*1.3)*uDpr*8.7/-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:'varying float vLight;uniform vec3 uColor;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*32.)*vLight;if(a<.02)discard;gl_FragColor=vec4(uColor,a);}',
  }),[r,z,speed,index])
  useEffect(()=>()=>geometry.dispose(),[geometry]);useEffect(()=>()=>material.dispose(),[material])
  useFrame(({gl,size})=>{material.uniforms.uTime.value=engine.orbitTime;material.uniforms.uDpr.value=gl.getPixelRatio()*(size.width<700?1.5:1);material.uniforms.uColor.value.set(galaxyThemes[theme].colors[index%galaxyThemes[theme].colors.length]).multiplyScalar(2)})
  return <points geometry={geometry} material={material}/>
}
function Orbit({engine,index}:{engine:ExperienceEngine;index:number}) {
  const {r,z,rotation,speed,color}=configs[index],beads=useRef<InstancedMesh>(null!)
  const dummy=useMemo(()=>new Object3D(),[])
  const theme=engine.snapshot.config.galaxyTheme,palette=galaxyThemes[theme].colors
  const geometry=useMemo(()=>{const p=[];for(let i=0;i<256;i++){const t=i/256*Math.PI*2;p.push(Math.cos(t)*r,0,Math.sin(t)*z)}const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));return g},[r,z])
  useLayoutEffect(()=>{const rng=random(index+3);for(let i=0;i<180;i++)beads.current.setColorAt(i,new Color(i%11===0?palette[Math.floor(rng()*palette.length)]:palette[index%palette.length]).multiplyScalar(i%11===0?1.15:1.2));beads.current.instanceColor!.needsUpdate=true},[color,index,palette])
  useFrame(()=>{
    for(let i=0;i<180;i++){
      const a=i/180*Math.PI*2+engine.orbitTime*speed
      dummy.position.set(Math.cos(a)*r,Math.sin(i*39.2)*.005,Math.sin(a)*z)
      dummy.scale.setScalar(i%47===0?.042:i%11===0?.016:.003+(i%5)*.001)
      dummy.updateMatrix();beads.current.setMatrixAt(i,dummy.matrix)
    }beads.current.instanceMatrix.needsUpdate=true
  })
  return <group rotation={rotation} position={[0,index===0?.25:index===2?-.72:.5,0]}>
    <lineLoop geometry={geometry}><lineBasicMaterial color={color} transparent opacity={.045}/></lineLoop>
    <instancedMesh ref={beads} args={[undefined,undefined,180]}><sphereGeometry args={[1,24,16]}/><meshPhysicalMaterial roughness={.18} metalness={.22} clearcoat={.8} envMapIntensity={1.5}/></instancedMesh>
    <OrbitDust engine={engine} index={index}/>
  </group>
}
export function OrbitRings({engine}:{engine:ExperienceEngine}) {
  const group=useRef<Group>(null!),halo=useRef<Group>(null!)
  useFrame(()=>{
    group.current.visible=engine.motion.rings>.001;group.current.scale.setScalar(engine.motion.rings)
    halo.current.visible=engine.motion.rings>.1
    halo.current.scale.setScalar(engine.visualCake.topWidth*(1+(engine.snapshot.reduced?0:Math.sin(engine.time*1.2)*.004)))
    halo.current.position.y=engine.visualCake.topSurface+(engine.visualCake.topIndex*.38+.36)*engine.motion.spread+.002
  })
  return <><group ref={group}>{configs.map((_,i)=><Orbit engine={engine} index={i} key={i}/>)}</group>
    <group ref={halo}>
      <mesh position={[0,0,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.367,.0025,10,192]}/><meshBasicMaterial color={[2.2,.9,3.2]} toneMapped={false}/></mesh>

    </group>
  </>
}
