import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Color, DataTexture, Group, InstancedMesh, LatheGeometry, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, RepeatWrapping, RGBAFormat, Vector2 } from 'three'
import { random } from '../utils/random'
import type { ExperienceEngine } from '../experience/engine'
import { StarSand } from './StarSand'
import { frostingGeometry, creamFlowerGeometry } from './pastryGeometry'
import { cakePresets } from '../store/birthdayStore'
import type { CakeShape } from '../store/birthdayStore'
import { cakeOutline, shapeCakeGeometry } from '../utils/cakeShape'
import { Candles } from './Candles'
import { CakeDecorations } from './CakeDecorations'
import { cakeAssembly, tierLift, candleLift } from '../utils/cakeAssembly'

const noiseGLSL=`
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise3(p)*.55+noise3(p*2.03)*.27+noise3(p*4.1)*.13+noise3(p*8.2)*.05;}`

function useBodyMaterial(bodyColor:string){
  const material=useMemo(()=>{
    const rng=random(89),width=512,height=256,pixels=new Uint8Array(width*height*4)
    // Buttercream pores have both soft irregular grains and tiny air bubbles.
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const grain=rng(),v=119+grain*39+Math.sin(x*.35+Math.sin(y*.23))*8
      const value=grain>.992?82:v;pixels.set([value,value,value,255],(y*width+x)*4)
    }
    const bump=new DataTexture(pixels,width,height,RGBAFormat);bump.wrapS=bump.wrapT=RepeatWrapping
    bump.magFilter=LinearFilter;bump.minFilter=LinearMipmapLinearFilter;bump.generateMipmaps=true;bump.anisotropy=4;bump.needsUpdate=true
    const mat=new MeshPhysicalMaterial({color:'white',roughness:.62,metalness:0,clearcoat:.04,bumpMap:bump,bumpScale:.013,envMapIntensity:.55})
    mat.onBeforeCompile=shader=>{
      shader.uniforms.uCakeColor={value:new Color(bodyColor)}
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCakePos;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCakePos=position;')
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vCakePos;\nuniform vec3 uCakeColor;\n${noiseGLSL}`)
        .replace('#include <color_fragment>',`#include <color_fragment>
          vec3 p=vCakePos*vec3(2.2,2.5,2.2);float cloud=fbm(p);
          diffuseColor.rgb=uCakeColor*(.68+.36*smoothstep(.23,.79,cloud));
          float grain=noise3(vCakePos*145.);
          diffuseColor.rgb*=.91+grain*.18;`)
    }
    mat.customProgramCacheKey=()=> 'fine-buttercream-v2';return mat
  },[bodyColor])
  useEffect(()=>()=>{material.bumpMap?.dispose();material.dispose()},[material]);return material
}
function CakeBase({color,shape}:{color:string;shape:CakeShape}){
  const material=useBodyMaterial(color)
  const geometry=useMemo(()=>{
    const g=new LatheGeometry([new Vector2(0,-.54),new Vector2(1.29,-.54),new Vector2(1.337,-.519),new Vector2(1.35,-.48),new Vector2(1.35,.48),new Vector2(1.33,.54),new Vector2(0,.54)],192)
    const uv=g.getAttribute('uv'),p=g.getAttribute('position');for(let i=0;i<uv.count;i++)uv.setY(i,(p.getY(i)+.54)/1.08);return shapeCakeGeometry(g,shape)
  },[shape])
  useEffect(()=>()=>geometry.dispose(),[geometry]);return <mesh castShadow receiveShadow geometry={geometry} material={material}/>
}
function Cream({color,shape}:{color:string;shape:CakeShape}){
  const frosting=useMemo(()=>shapeCakeGeometry(frostingGeometry(),shape),[shape]),flower=useMemo(creamFlowerGeometry,[]),flowers=useRef<InstancedMesh>(null!)
  const material=useMemo(()=>{
    const rng=random(52),pixels=new Uint8Array(128*128*4)
    for(let i=0;i<pixels.length;i+=4){const v=110+rng()*60;pixels.set([v,v,v,255],i)}
    const bump=new DataTexture(pixels,128,128,RGBAFormat);bump.wrapS=bump.wrapT=RepeatWrapping;bump.repeat.set(3,3)
    bump.magFilter=LinearFilter;bump.minFilter=LinearMipmapLinearFilter;bump.generateMipmaps=true;bump.needsUpdate=true
    const cream=new MeshPhysicalMaterial({color,roughness:.35,metalness:0,sheen:.22,sheenColor:'#ffe6ce',sheenRoughness:.65,clearcoat:.045,specularIntensity:.4,envMapIntensity:.65,bumpMap:bump,bumpScale:.0007})
    // A subtle warm wrap approximates shallow cream scattering without glass transmission.
    cream.onBeforeCompile=shader=>{
      shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
        float creamEdge=pow(1.-saturate(dot(geometryNormal,geometryViewDir)),2.);
        reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.065,.035,.016)*(.35+creamEdge);
        #if NUM_DIR_LIGHTS > 0
          float creamWrap=pow(clamp((dot(geometryNormal,directionalLights[0].direction)+.5)/1.5,0.,1.),2.);
          reflectedLight.directDiffuse+=diffuseColor.rgb*directionalLights[0].color*vec3(.07,.045,.025)*creamWrap;
        #endif
      `)
    }
    cream.customProgramCacheKey=()=> 'cream-soft-wrap-v2';return cream
  },[color])
  useLayoutEffect(()=>{const d=new Object3D(),rng=random(88);for(let i=0;i<10;i++){
    const a=(i+(rng()-.5)*.18)/10*Math.PI*2+.12,r=1.045+(rng()-.5)*.025,s=.93+rng()*.14
    const [x,z]=cakeOutline(a,r,shape)
    d.position.set(x,.584,z);d.rotation.set((rng()-.5)*.09,a+rng()*2,(rng()-.5)*.07)
    d.scale.set(s*(.96+rng()*.08),s*(.92+rng()*.15),s);d.updateMatrix();flowers.current.setMatrixAt(i,d.matrix)
  }flowers.current.instanceMatrix.needsUpdate=true},[shape])
  useEffect(()=>()=>frosting.dispose(),[frosting])
  useEffect(()=>()=>flower.dispose(),[flower])
  useEffect(()=>()=>{material.bumpMap?.dispose();material.dispose()},[material])
  return <><mesh castShadow receiveShadow geometry={frosting} material={material}/><instancedMesh castShadow receiveShadow ref={flowers} args={[flower,undefined,10]} material={material}/></>
}
function Jewels({shape,part,layers}:{shape:CakeShape;part:'body'|'top';layers:number}){
  const foot=useRef<InstancedMesh>(null!),pearls=useRef<InstancedMesh>(null!),flakes=useRef<InstancedMesh>(null!)
  const count=Math.floor((part==='body'?880:370)/layers)
  useLayoutEffect(()=>{
    const d=new Object3D(),rng=random(76)
    if(part==='body')for(let i=0;i<84;i++){const a=i/84*Math.PI*2;d.position.set(Math.cos(a)*1.325,-.509,Math.sin(a)*1.325);d.scale.setScalar(.024+rng()*.018);d.updateMatrix();foot.current.setMatrixAt(i,d.matrix)}
    if(part==='top')for(let i=0;i<20;i++){const a=(i%10+.5)/10*Math.PI*2+.12,r=i<10?1.13:.91,s=i<10?.043+rng()*.014:.019+rng()*.009;d.position.set(Math.cos(a)*r,.586+s*.8,Math.sin(a)*r);d.scale.setScalar(s);d.updateMatrix();pearls.current.setMatrixAt(i,d.matrix);pearls.current.setColorAt(i,new Color(i%3?'#bd8edd':'#84a9eb'))}
    for(let i=0;i<count;i++){
      const a=rng()*Math.PI*2,top=part==='top',r=top?Math.sqrt(rng())*1.29:1.354
      d.position.set(Math.cos(a)*r,top?.59:-.47+rng()*.85,Math.sin(a)*r);d.rotation.set(rng()*Math.PI,rng()*Math.PI,rng()*Math.PI)
      const s=.003+Math.pow(rng(),2)*.013;d.scale.set(s,s*(.7+rng()*1.2),s*.38);d.updateMatrix();flakes.current.setMatrixAt(i,d.matrix);flakes.current.setColorAt(i,new Color(i%5?'#e9bd77':'#f5e8dd'))
    }
    const meshes=[part==='body'?foot.current:pearls.current,flakes.current]
    if(shape!=='round')for(const mesh of meshes){
      for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,d.matrix);d.matrix.decompose(d.position,d.quaternion,d.scale)
        const [x,z]=cakeOutline(Math.atan2(d.position.z,d.position.x),Math.hypot(d.position.x,d.position.z),shape)
        d.position.set(x,d.position.y,z);d.updateMatrix();mesh.setMatrixAt(i,d.matrix)
      }
    }
    for(const m of meshes){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
  },[shape,part,count])
  return <>
    {part==='body'?<instancedMesh castShadow receiveShadow ref={foot} args={[undefined,undefined,84]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#eed4b8" roughness={.4}/></instancedMesh>:<instancedMesh castShadow receiveShadow ref={pearls} args={[undefined,undefined,20]}><sphereGeometry args={[1,32,24]}/><meshPhysicalMaterial roughness={.2} metalness={.22} clearcoat={.7} envMapIntensity={1.2}/></instancedMesh>}
    <instancedMesh ref={flakes} args={[undefined,undefined,count]}><octahedronGeometry args={[1,0]}/><meshStandardMaterial roughness={.34} metalness={.55} envMapIntensity={1.35}/></instancedMesh>
  </>
}
function Plate(){
  const geometry=useMemo(()=>new LatheGeometry([new Vector2(0,-.647),new Vector2(1.59,-.647),new Vector2(1.76,-.616),new Vector2(1.835,-.581),new Vector2(1.846,-.565),new Vector2(1.825,-.555),new Vector2(1.75,-.561),new Vector2(1.5,-.565),new Vector2(0,-.565)],192),[])
  const material=useMemo(()=>{
    const m=new MeshPhysicalMaterial({color:'white',roughness:.18,metalness:.3,clearcoat:.8,envMapIntensity:1.1})
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
function CakePart({engine,kind,index=0,y=0,width=1,height=1,children}:{engine:ExperienceEngine;kind:'body'|'cream'|'decor'|'candle';index?:number;y?:number;width?:number;height?:number;children:ReactNode}){
  const group=useRef<Group>(null!)
  useFrame(()=>{
    const motion=engine.motion
    const change=kind==='body'?motion.cakeReveal:kind==='cream'?motion.creamReveal:motion.decorReveal
    const lift=kind==='candle'?candleLift(engine.snapshot.config,motion.spread):tierLift(index,motion.spread)+(kind==='cream'?.36:kind==='decor'?.66:0)*motion.spread
    group.current.position.y=y+lift+(1-change)*.16
    const scale=.86+.14*change
    group.current.scale.set(width*scale,height*scale,width*scale)
    const opacity=change*motion.reveal
    group.current.visible=opacity>.001
    group.current.traverse(o=>{if('material'in o)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof MeshStandardMaterial){m.transparent=opacity<1;m.opacity=opacity}})
  })
  return <group ref={group}>{children}</group>
}
export function Cake({engine}:{engine:ExperienceEngine}){
  const group=useRef<Group>(null!)
  const config=engine.snapshot.config,preset=cakePresets[config.cakeStyle]
  const tiers=useMemo(()=>cakeAssembly(config),[config.cakeLayers])
  const labels=engine.snapshot.editing&&engine.snapshot.expanded
  useFrame(()=>{
    const r=engine.motion.reveal;group.current.visible=r>.001;group.current.scale.setScalar(.75+.25*r);group.current.position.y=-.15*(1-r);group.current.rotation.y=-.14*(1-r)
  })
  return <group ref={group}>
    {tiers.map((tier,i)=><group key={i}>
      <CakePart engine={engine} kind="body" index={i} y={tier.y} width={tier.width} height={tier.height}>
        <CakeBase color={i%2?new Color(config.cakeColor).lerp(new Color(preset.cream),.2).getStyle():config.cakeColor} shape={config.cakeShape}/><Jewels shape={config.cakeShape} part="body" layers={config.cakeLayers}/><StarSand engine={engine} layers={config.cakeLayers} tierIndex={i}/>
        {labels?<Html position={[1.55,.03,0]} className="cake-part-label" zIndexRange={[6,0]}><span>{tiers.length>1?`第 ${i+1} 层糕体`:'糕体'}</span></Html>:null}
      </CakePart>
      <CakePart engine={engine} kind="cream" index={i} y={tier.y} width={tier.width} height={tier.height}>
        <Cream color={preset.cream} shape={config.cakeShape}/>
        {labels&&i===tiers.length-1?<Html position={[1.6,.58,0]} className="cake-part-label" zIndexRange={[6,0]}><span>花瓣奶油</span></Html>:null}
      </CakePart>
      <CakePart engine={engine} kind="decor" index={i} y={tier.y} width={tier.width} height={tier.height}>
        <Jewels shape={config.cakeShape} part="top" layers={config.cakeLayers}/>{i===tiers.length-1?<CakeDecorations style={config.cakeStyle} shape={config.cakeShape}/>:null}
      </CakePart>
    </group>)}
    <CakePart engine={engine} kind="candle"><Candles config={config}/>{labels?<Html position={[.3,tiers[tiers.length-1].surface+.46,0]} className="cake-part-label candle-part-label" zIndexRange={[6,0]}><span>生日蜡烛</span></Html>:null}</CakePart>
    <Plate/>
    <mesh position={[0,-.559,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.834,.006,12,192]}/><meshStandardMaterial color="#ddb77b" metalness={.8} roughness={.24}/></mesh>
  </group>
}
