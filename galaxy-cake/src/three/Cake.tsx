import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from 'three'
import type { ExperienceEngine } from '../experience/engine'
import { layerAppearance } from '../store/birthdayStore'
import type { BirthdayConfig } from '../store/birthdayStore'
import { partProgress } from '../utils/cakeTransition'
import { creamFlowerGeometry } from './pastryGeometry'
import { usePastryMaterial } from './pastryMaterials'
import { pastryMorph } from './pastryMorph'
import { PastryDetails } from './PastryDetails'
import { StarSand } from './StarSand'
import { Candles } from './Candles'
import { CakeDecorations } from './CakeDecorations'
import { recipes } from './cakeRecipes'
import { SidePiping } from './SidePiping'

const noiseGLSL=`
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise3(p)*.55+noise3(p*2.03)*.27+noise3(p*4.1)*.13+noise3(p*8.2)*.05;}`

function Plate(){
  const geometry=useMemo(()=>new LatheGeometry([new Vector2(0,-.647),new Vector2(1.59,-.647),new Vector2(1.76,-.616),new Vector2(1.835,-.581),new Vector2(1.846,-.565),new Vector2(1.825,-.555),new Vector2(1.75,-.561),new Vector2(1.5,-.565),new Vector2(0,-.565)],192),[])
  const material=useMemo(()=>{
    const m=new MeshPhysicalMaterial({color:'white',roughness:.27,metalness:.3,clearcoat:.18,clearcoatRoughness:.28,specularIntensity:.45,envMapIntensity:.45})
    m.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPlatePos;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPlatePos=position;')
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vPlatePos;\n${noiseGLSL}`).replace('#include <color_fragment>',`#include <color_fragment>
 float n=fbm(vPlatePos*8.);diffuseColor.rgb=mix(vec3(.008,.006,.018),vec3(.032,.021,.065),n);`).replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 totalEmissiveRadiance+=vec3(.007,.004,.018)*fbm(vPlatePos*8.);`)
    };m.customProgramCacheKey=()=> 'dark-glazed-porcelain-v2';return m
  },[])
  useEffect(()=>()=>{geometry.dispose();material.dispose()},[geometry,material])
  return <mesh receiveShadow geometry={geometry} material={material}/>
}

function CakePart({engine,index,kind,children}:{engine:ExperienceEngine;index:number;kind:'body'|'cream'|'decor';children:ReactNode}) {
  const group=useRef<Group>(null!)
  useFrame(()=>{
    const tier=engine.visualCake.tiers[index],r=engine.motion.reveal
    const lift=(index*.38+(kind==='cream'?.36:kind==='decor'?.66:0))*engine.motion.spread
    group.current.position.y=tier.y+lift
    group.current.scale.set(tier.width,tier.height,tier.width)
    group.current.visible=r>.001&&tier.active>.0001&&tier.width>.0015
    group.current.traverse(o=>{if('material'in o)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof MeshStandardMaterial){m.transparent=r<.999;m.opacity=r}})
  })
  return <group ref={group}>{children}</group>
}
function PastryMesh({engine,kind,from,to,index,material}:{engine:ExperienceEngine;kind:'body'|'cream';from:BirthdayConfig;to:BirthdayConfig;index:number;material:MeshPhysicalMaterial}) {
  const a=layerAppearance(from,Math.min(index,from.cakeLayers-1)),b=layerAppearance(to,Math.min(index,to.cakeLayers-1))
  const geometry=useMemo(()=>pastryMorph(kind,a.shape,b.shape,from.cakeStyle,to.cakeStyle),[kind,a.shape,b.shape,from.cakeStyle,to.cakeStyle])
  const mesh=useRef<Mesh>(null!),sourceColor=useMemo(()=>new Color(),[]),targetColor=useMemo(()=>new Color(),[])
  useLayoutEffect(()=>{mesh.current.updateMorphTargets()},[geometry])
  useFrame(()=>{
    const t=partProgress(engine.transition,kind)
    if(mesh.current.morphTargetInfluences)mesh.current.morphTargetInfluences[0]=t
    sourceColor.set(kind==='body'?a.cakeColor:a.creamColor);targetColor.set(kind==='body'?b.cakeColor:b.creamColor)
    material.color.copy(sourceColor).lerp(targetColor,t)
    if(kind==='cream')material.color.multiplyScalar(.86)
    if(kind==='body'){
      material.roughness=recipes[from.cakeStyle].bodyRoughness+(recipes[to.cakeStyle].bodyRoughness-recipes[from.cakeStyle].bodyRoughness)*t
      const source=from.cakeStyle==='galaxy'?1:0,target=to.cakeStyle==='galaxy'?1:0
      material.userData.nebula.value=source+(target-source)*t
    }
  })
  useEffect(()=>()=>geometry.dispose(),[geometry])
  return <mesh ref={mesh} castShadow receiveShadow geometry={geometry} material={material} frustumCulled={false}/>
}
function CakeLayer({engine,index,from,to,flower}:{engine:ExperienceEngine;index:number;from:BirthdayConfig;to:BirthdayConfig;flower:ReturnType<typeof creamFlowerGeometry>}) {
  const bodyMaterial=usePastryMaterial(false),creamMaterial=usePastryMaterial(true)
  const a=layerAppearance(from,Math.min(index,from.cakeLayers-1)),b=layerAppearance(to,Math.min(index,to.cakeLayers-1))
  const detailProps={engine,index,fromShape:a.shape,toShape:b.shape,fromStyle:from.cakeStyle,toStyle:to.cakeStyle,fromCakeColor:a.cakeColor,toCakeColor:b.cakeColor}
  return <>
    <CakePart engine={engine} index={index} kind="body">
      <PastryMesh engine={engine} kind="body" from={from} to={to} index={index} material={bodyMaterial}/>
      <SidePiping engine={engine} index={index} from={from} to={to}/><PastryDetails {...detailProps} kind="foot"/><PastryDetails {...detailProps} kind="gold-body"/><PastryDetails {...detailProps} kind="sugar"/>
    </CakePart>
    <CakePart engine={engine} index={index} kind="cream">
      <PastryMesh engine={engine} kind="cream" from={from} to={to} index={index} material={creamMaterial}/>
      <PastryDetails {...detailProps} kind="flowers" flower={flower} creamMaterial={creamMaterial}/>
    </CakePart>
    <CakePart engine={engine} index={index} kind="decor">
      <PastryDetails {...detailProps} kind="pearls"/><PastryDetails {...detailProps} kind="gold-top"/>
      <ChangingDecorations engine={engine} index={index} from={from} to={to}/>
    </CakePart>
  </>
}
function ChangingDecorations({engine,index,from,to}:{engine:ExperienceEngine;index:number;from:BirthdayConfig;to:BirthdayConfig}) {
  const a=layerAppearance(from,Math.min(index,from.cakeLayers-1)),b=layerAppearance(to,Math.min(index,to.cakeLayers-1))
  const oldGroup=useRef<Group>(null!),newGroup=useRef<Group>(null!)
  const same=a.decoration===b.decoration&&a.shape===b.shape
  useFrame(()=>{
    const t=partProgress(engine.transition,'decor')
    const previous=same?0:Math.max(0,1-t*2.2),next=same?1:Math.max(0,(t-.35)/.65)
    oldGroup.current.visible=previous>.001;oldGroup.current.scale.setScalar(Math.max(previous,.001))
    newGroup.current.visible=next>.001;newGroup.current.scale.setScalar(Math.max(next,.001))
  })
  return <>
    <group ref={oldGroup}>{!same&&a.decoration!=='none'?<CakeDecorations style={a.decoration} shape={a.shape} rim={index<from.cakeLayers-1}/>:null}</group>
    <group ref={newGroup}>{b.decoration!=='none'?<CakeDecorations style={b.decoration} shape={b.shape} rim={index<to.cakeLayers-1}/>:null}</group>
  </>
}
export function Cake({engine}:{engine:ExperienceEngine}) {
  const group=useRef<Group>(null!),tier=engine.snapshot.tier
  const flower=useMemo(()=>creamFlowerGeometry(tier==='desktop'?1:tier==='mobile'?.75:.5),[tier])
  const to=engine.snapshot.config,from=engine.transition?.from??to
  useEffect(()=>()=>flower.dispose(),[flower])
  useFrame(()=>{
    const r=engine.motion.reveal;group.current.visible=r>.001;group.current.scale.setScalar(.75+.25*r);group.current.position.y=-.15*(1-r);group.current.rotation.y=-.14*(1-r)
  })
  return <group ref={group}>
    {[0,1,2].map(index=><CakeLayer key={index} engine={engine} index={index} from={from} to={to} flower={flower}/>)}
    <StarSand engine={engine}/><Candles engine={engine}/><Plate/>
    <mesh position={[0,-.559,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.834,.006,12,192]}/><meshStandardMaterial color="#ddb77b" metalness={.8} roughness={.24}/></mesh>
  </group>
}
