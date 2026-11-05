import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Group, LatheGeometry, MathUtils, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace, Vector2 } from 'three'
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

function servingPlateColor(config:BirthdayConfig) {
  const color=new Color(layerAppearance(config,0).cakeColor),hsl=color.getHSL({h:0,s:0,l:0},SRGBColorSpace)
  const softness=MathUtils.smoothstep(hsl.l,.42,.6)
  return color.setHSL(hsl.h,hsl.s*MathUtils.lerp(.62,.42,softness),MathUtils.lerp(Math.max(.09,hsl.l*.7),.72+hsl.l*.14,softness),SRGBColorSpace)
}

function Plate({engine,from,to}:{engine:ExperienceEngine;from:BirthdayConfig;to:BirthdayConfig}){
  const colors=useMemo(()=>({from:servingPlateColor(from),to:servingPlateColor(to)}),[from,to])
  const geometry=useMemo(()=>new LatheGeometry([new Vector2(0,-.647),new Vector2(1.59,-.647),new Vector2(1.76,-.616),new Vector2(1.835,-.581),new Vector2(1.846,-.565),new Vector2(1.825,-.555),new Vector2(1.75,-.561),new Vector2(1.5,-.565),new Vector2(0,-.565)],192),[])
  const material=useMemo(()=>new MeshPhysicalMaterial({roughness:.58,metalness:0,clearcoat:.12,clearcoatRoughness:.5,specularIntensity:.28,envMapIntensity:.22}),[])
  useFrame(()=>{material.color.copy(colors.from).lerp(colors.to,partProgress(engine.transition,'body'))})
  useEffect(()=>()=>{geometry.dispose();material.dispose()},[geometry,material])
  return <mesh name="cake-serving-plate" receiveShadow geometry={geometry} material={material}/>
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
    if(kind==='cream')material.color.multiplyScalar(.96)
    if(kind==='body'){
      material.roughness=recipes[from.cakeStyle].bodyRoughness+(recipes[to.cakeStyle].bodyRoughness-recipes[from.cakeStyle].bodyRoughness)*t
      material.clearcoat=(recipes[from.cakeStyle].bodyCoat??.06)*(1-t)+(recipes[to.cakeStyle].bodyCoat??.06)*t
      material.userData.grain.value=(recipes[from.cakeStyle].grain??1)*(1-t)+(recipes[to.cakeStyle].grain??1)*t
      const source=from.cakeStyle==='galaxy'?1:recipes[from.cakeStyle].nebula??0,target=to.cakeStyle==='galaxy'?1:recipes[to.cakeStyle].nebula??0
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
      <SidePiping engine={engine} index={index} from={from} to={to}/><PastryDetails {...detailProps} kind="foot"/><PastryDetails {...detailProps} kind="gold-body"/><PastryDetails {...detailProps} kind="stars"/><PastryDetails {...detailProps} kind="sugar"/>
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
  const same=JSON.stringify([a,index<from.cakeLayers-1])===JSON.stringify([b,index<to.cakeLayers-1])&&from.candleType===to.candleType&&from.age===to.age
  useFrame(()=>{
    const t=partProgress(engine.transition,'decor')
    const previous=same?0:Math.max(0,1-t*2.2),next=same?1:Math.max(0,(t-.35)/.65)
    oldGroup.current.visible=previous>.001;oldGroup.current.scale.setScalar(Math.max(previous,.001))
    newGroup.current.visible=next>.001;newGroup.current.scale.setScalar(Math.max(next,.001))
  })
  return <>
    <group ref={oldGroup}>{!same&&index<from.cakeLayers&&a.decorations.length?<CakeDecorations config={from} index={index} tier={engine.snapshot.tier}/>:null}</group>
    <group ref={newGroup}>{index<to.cakeLayers&&b.decorations.length?<CakeDecorations config={to} index={index} tier={engine.snapshot.tier}/>:null}</group>
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
    <StarSand engine={engine}/><Candles engine={engine}/>
    <group scale={[1,1,.87]}><Plate engine={engine} from={from} to={to}/>
      <mesh position={[0,-.559,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.834,.006,12,192]}/><meshStandardMaterial color="#edc785" metalness={.7} roughness={.22}/></mesh>
    </group>
  </group>
}
