import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Color, DataTexture, Group, InstancedMesh, LatheGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, RepeatWrapping, RGBAFormat, TubeGeometry, Vector2, Vector3 } from 'three'
import { random } from '../utils/random'
import type { ExperienceEngine } from '../experience/engine'
import { StarSand } from './StarSand'
import { frostingGeometry, rosetteGeometry } from './pastryGeometry'

export const cakePresets = { galaxy: { radius: 1.35, height: 1.08, body: '#3d4192', cream: '#fff0db' } }
const noiseGLSL=`
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise3(p)*.55+noise3(p*2.03)*.27+noise3(p*4.1)*.13+noise3(p*8.2)*.05;}`

function useBodyMaterial(){
  const material=useMemo(()=>{
    const rng=random(89),width=512,height=256,pixels=new Uint8Array(width*height*4)
    // Buttercream pores have both soft irregular grains and tiny air bubbles.
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const grain=rng(),v=105+grain*70+Math.sin(x*.65+Math.sin(y*.31)*2)*18
      const value=grain>.978?35:v;pixels.set([value,value,value,255],(y*width+x)*4)
    }
    const bump=new DataTexture(pixels,width,height,RGBAFormat);bump.wrapS=bump.wrapT=RepeatWrapping;bump.needsUpdate=true
    const mat=new MeshPhysicalMaterial({color:'white',roughness:.68,metalness:0,clearcoat:.035,bumpMap:bump,bumpScale:.035,envMapIntensity:.35})
    mat.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCakePos;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCakePos=position;')
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vCakePos;\n${noiseGLSL}`)
        .replace('#include <color_fragment>',`#include <color_fragment>
          vec3 p=vCakePos*vec3(1.8,2.4,1.8);float cloud=fbm(p+fbm(p*1.3)*1.7);
          diffuseColor.rgb=mix(vec3(.004,.009,.055),vec3(.08,.075,.38),smoothstep(.32,.75,cloud));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.025,.065,.24),smoothstep(.57,.76,fbm(p*1.9))*.6);
          diffuseColor.rgb*=.85+noise3(vCakePos*180.)*.3;`)
    }
    mat.customProgramCacheKey=()=> 'matte-galaxy-buttercream-v1';return mat
  },[])
  useEffect(()=>()=>{material.bumpMap?.dispose();material.dispose()},[material]);return material
}
function CakeBase(){
  const material=useBodyMaterial()
  const geometry=useMemo(()=>{
    const g=new LatheGeometry([new Vector2(0,-.54),new Vector2(1.29,-.54),new Vector2(1.337,-.519),new Vector2(1.35,-.48),new Vector2(1.35,.48),new Vector2(1.33,.54),new Vector2(0,.54)],192)
    const uv=g.getAttribute('uv'),p=g.getAttribute('position');for(let i=0;i<uv.count;i++)uv.setY(i,(p.getY(i)+.54)/1.08);return g
  },[])
  useEffect(()=>()=>geometry.dispose(),[geometry]);return <mesh castShadow receiveShadow geometry={geometry} material={material}/>
}
function Cream(){
  const frosting=useMemo(frostingGeometry,[]),rosette=useMemo(rosetteGeometry,[]),flowers=useRef<InstancedMesh>(null!)
  const material=useMemo(()=>{
    const rng=random(52),pixels=new Uint8Array(128*128*4)
    for(let i=0;i<pixels.length;i+=4){const v=110+rng()*60;pixels.set([v,v,v,255],i)}
    const bump=new DataTexture(pixels,128,128,RGBAFormat);bump.wrapS=bump.wrapT=RepeatWrapping;bump.repeat.set(2,2);bump.needsUpdate=true
    return new MeshPhysicalMaterial({color: cakePresets.galaxy.cream,roughness:.43,metalness:0,sheen:.3,sheenColor:'#ffe5c6',sheenRoughness:.7,clearcoat:.035,specularIntensity:.32,envMapIntensity:.5,bumpMap:bump,bumpScale:.0015})
  },[])
  useLayoutEffect(()=>{const d=new Object3D(),rng=random(88);for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.12;d.position.set(Math.cos(a)*1.055,.583,Math.sin(a)*1.055);d.rotation.set(0,a+rng(),0);d.scale.setScalar(.95+rng()*.12);d.updateMatrix();flowers.current.setMatrixAt(i,d.matrix)}flowers.current.instanceMatrix.needsUpdate=true},[])
  useEffect(()=>()=>{frosting.dispose();rosette.dispose();material.bumpMap?.dispose();material.dispose()},[frosting,rosette,material])
  return <><mesh castShadow receiveShadow geometry={frosting} material={material}/><instancedMesh castShadow receiveShadow ref={flowers} args={[rosette,material,10]}/></>
}
function Jewels(){
  const foot=useRef<InstancedMesh>(null!),pearls=useRef<InstancedMesh>(null!),flakes=useRef<InstancedMesh>(null!)
  useLayoutEffect(()=>{
    const d=new Object3D(),rng=random(76)
    for(let i=0;i<84;i++){const a=i/84*Math.PI*2;d.position.set(Math.cos(a)*1.325,-.509,Math.sin(a)*1.325);d.scale.setScalar(.024+rng()*.018);d.updateMatrix();foot.current.setMatrixAt(i,d.matrix)}
    for(let i=0;i<20;i++){const a=(i%10+.5)/10*Math.PI*2+.12,r=i<10?1.13:.91,s=i<10?.043+rng()*.014:.019+rng()*.009;d.position.set(Math.cos(a)*r,.586+s*.8,Math.sin(a)*r);d.scale.setScalar(s);d.updateMatrix();pearls.current.setMatrixAt(i,d.matrix);pearls.current.setColorAt(i,new Color(i%3?'#bd8edd':'#84a9eb'))}
    for(let i=0;i<1250;i++){
      const a=rng()*Math.PI*2,top=i>880,r=top?Math.sqrt(rng())*1.29:1.354
      d.position.set(Math.cos(a)*r,top?.59:-.47+rng()*.85,Math.sin(a)*r);d.rotation.set(rng()*Math.PI,rng()*Math.PI,rng()*Math.PI)
      const s=.003+rng()*.005;d.scale.set(s,s*(1+rng()*1.4),s*.45);d.updateMatrix();flakes.current.setMatrixAt(i,d.matrix);flakes.current.setColorAt(i,new Color(i%5?'#e8b169':'#f5dfd4'))
    }
    for(const m of [foot.current,pearls.current,flakes.current]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
  },[])
  return <>
    <instancedMesh castShadow receiveShadow ref={foot} args={[undefined,undefined,84]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#eed4b8" roughness={.4}/></instancedMesh>
    <instancedMesh castShadow receiveShadow ref={pearls} args={[undefined,undefined,20]}><sphereGeometry args={[1,32,24]}/><meshPhysicalMaterial roughness={.2} metalness={.22} clearcoat={.7} envMapIntensity={1.2}/></instancedMesh>
    <instancedMesh ref={flakes} args={[undefined,undefined,1250]}><octahedronGeometry args={[1,0]}/><meshStandardMaterial roughness={.32} metalness={.65}/></instancedMesh>
  </>
}
function Plate(){
  const geometry=useMemo(()=>new LatheGeometry([new Vector2(0,-.66),new Vector2(1.7,-.66),new Vector2(1.82,-.62),new Vector2(1.86,-.57),new Vector2(1.85,-.555),new Vector2(1.78,-.56),new Vector2(1.5,-.565),new Vector2(0,-.565)],192),[])
  const material=useMemo(()=>{
    const m=new MeshPhysicalMaterial({color:'white',roughness:.22,metalness:.55,clearcoat:.65,envMapIntensity:1.2})
    m.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPlatePos;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPlatePos=position;')
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vPlatePos;\n${noiseGLSL}`).replace('#include <color_fragment>',`#include <color_fragment>
 float n=fbm(vPlatePos*6.);diffuseColor.rgb=mix(vec3(.012,.008,.03),vec3(.085,.045,.17),n);`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 totalEmissiveRadiance+=vec3(.018,.008,.05)*fbm(vPlatePos*8.);`)
    };m.customProgramCacheKey=()=> 'nebula-porcelain-plate';return m
  },[])
  useEffect(()=>()=>{geometry.dispose();material.dispose()},[geometry,material])
  return <mesh receiveShadow geometry={geometry} material={material}/>
}
export function Cake({engine}:{engine:ExperienceEngine}){
  const group=useRef<Group>(null!)
  const coil=useMemo(()=>new TubeGeometry(new CatmullRomCurve3(Array.from({length:240},(_,i)=>{const t=i/239;return new Vector3(Math.cos(t*Math.PI*15)*.047,.605+t*.78,Math.sin(t*Math.PI*15)*.047)})),240,.006,10,false),[])
  useEffect(()=>()=>coil.dispose(),[coil])
  useFrame(()=>{
    const r=engine.motion.reveal;group.current.visible=r>.001;group.current.scale.setScalar(.75+.25*r);group.current.position.y=-.15*(1-r);group.current.rotation.y=-.14*(1-r)
    group.current.traverse(o=>{if('material'in o)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof MeshStandardMaterial){m.transparent=r<1;m.opacity=r}})
  })
  return <group ref={group}>
    <CakeBase/><Cream/><Jewels/><StarSand engine={engine}/>
    <Plate/>
    <mesh position={[0,-.559,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.834,.006,12,192]}/><meshStandardMaterial color="#ddb77b" metalness={.8} roughness={.24}/></mesh>
    <mesh castShadow position={[0,.994,0]}><cylinderGeometry args={[.046,.05,.8,48]}/><meshPhysicalMaterial color="#ffebcb" roughness={.4} sheen={.3}/></mesh>
    <mesh geometry={coil}><meshStandardMaterial color="#ffebcb" roughness={.4}/></mesh>
    <mesh position={[0,.601,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.073,.009,12,48]}/><meshStandardMaterial color="#c49242" metalness={.8} roughness={.25}/></mesh>
    <mesh position={[0,1.407,0]}><cylinderGeometry args={[.003,.005,.035,10]}/><meshStandardMaterial color="#382016"/></mesh>
  </group>
}
