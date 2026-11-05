import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, MeshPhysicalMaterial, Object3D } from 'three'
import type { BirthdayConfig } from '../store/birthdayStore'
import { layerAppearance } from '../store/birthdayStore'
import type { DecorationType } from '../store/decorationCatalog'
import { decorationCatalog } from '../store/decorationCatalog'
import { cakeAssembly } from '../utils/cakeAssembly'
import { decorationLayout } from '../utils/decorationLayout'
import type { PlacedDecoration } from '../utils/decorationLayout'
import { getDecorationModel } from './decorationModels'
import type { DecorationPart } from './decorationModels'

function Batch({part,items,accent,scaleY}:{part:DecorationPart;items:PlacedDecoration[];accent:string;scaleY:number}) {
  const mesh=useRef<InstancedMesh>(null!)
  const material=useMemo(()=>new MeshPhysicalMaterial({color:'white',roughness:part.roughness??.36,metalness:part.metalness??0,clearcoat:.24,clearcoatRoughness:.24,envMapIntensity:1}),[part])
  useEffect(()=>{const instance=mesh.current;return()=>{instance.dispose();material.dispose()}},[material])
  useLayoutEffect(()=>{
    const object=new Object3D(),color=new Color(part.accent?accent:part.color)
    items.forEach((item,i)=>{object.position.set(item.x,item.y,item.z);object.scale.set(item.scale,item.scale*scaleY*(decorationCatalog[item.type].hero?1.4:1),item.scale);object.rotation.set(0,item.rotation,0);object.updateMatrix();mesh.current.setMatrixAt(i,object.matrix);mesh.current.setColorAt(i,color)})
    mesh.current.count=items.length;mesh.current.instanceMatrix.needsUpdate=true
    if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true
  },[items,accent,part,scaleY])
  return <instancedMesh ref={mesh} args={[part.geometry,material,16]} castShadow frustumCulled={false} dispose={null}/>
}
function DecorationInstances({type,items,accent,scaleY}:{type:DecorationType;items:PlacedDecoration[];accent:string;scaleY:number}) {
  const parts=useMemo(()=>getDecorationModel(type),[type])
  return <>{parts.map((part,i)=><Batch key={i} part={part} items={items} accent={accent} scaleY={scaleY}/>)}</>
}
export function CakeDecorations({config,index,tier}:{config:BirthdayConfig;index:number;tier:'desktop'|'mobile'|'low'}) {
  const appearance=layerAppearance(config,index)
  const assembly=cakeAssembly(config)[index],scaleY=assembly?assembly.width/assembly.height:1
  const layout=useMemo(()=>decorationLayout(config,index,tier),[config,index,tier])
  const types=appearance.decorations.join(',')
  const grouped=useMemo(()=>layout.reduce((groups,item)=>{const group=groups.find(g=>g.type===item.type);if(group)group.items.push(item);else groups.push({type:item.type,items:[item]});return groups},[] as {type:DecorationType;items:PlacedDecoration[]}[]),[layout,types])
  return <group name={`decorations-layer-${index}`} userData={{logicalCount:layout.length,layout}}>{grouped.map(({type,items})=><DecorationInstances key={type} type={type} items={items} accent={appearance.decorationColor} scaleY={scaleY}/>)}</group>
}
