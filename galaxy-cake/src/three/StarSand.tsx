import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial, Vector3 } from 'three'
import { random } from '../utils/random'
import type { ExperienceEngine } from '../experience/engine'
import { galaxyThemes, layerAppearance } from '../store/birthdayStore'
import { partProgress } from '../utils/cakeTransition'

const vertexShader=/* glsl */ `
attribute float aSize,aSeed,aRank;
attribute vec3 aFacet;
uniform float uTime,uDpr,uProgress,uSpread;
uniform vec3 uKeyLight,uTierY,uTierWidth,uTierHeight,uCuts,uFromShape,uToShape;
varying vec3 vColor;
varying float vLight,vSeed;
vec2 outline(float a,float r,float shape){
  if(shape<.5)return vec2(cos(a),sin(a))*r;
  if(shape<1.5){vec2 c=vec2(cos(a),sin(a));return c*r*.87/pow(pow(abs(c.x),6.)+pow(abs(c.y),6.),1./6.);}
  float t=a+1.57079632679;return vec2(pow(sin(t),3.),-(13.*cos(t)-5.*cos(2.*t)-2.*cos(3.*t)-cos(4.*t))/17.)*r;
}
void main(){
  int layer=aRank<uCuts.x?0:aRank<uCuts.y?1:2;
  float w=max(uTierWidth[layer],.001),h=max(uTierHeight[layer],.001),a=position.x,r=position.z;
  vec2 xz=mix(outline(a,r,uFromShape[layer]),outline(a,r,uToShape[layer]),uProgress);
  vec2 tangent=mix(outline(a+.01,1.,uFromShape[layer])-outline(a-.01,1.,uFromShape[layer]),outline(a+.01,1.,uToShape[layer])-outline(a-.01,1.,uToShape[layer]),uProgress);
  bool top=position.y>.59;
  vec3 p=vec3(xz.x*w,position.y*h+uTierY[layer]+(float(layer)*.38+(top?.36:0.))*uSpread,xz.y*w);
  vec3 facet=top?vec3(aFacet.x,1.,aFacet.z):normalize(vec3(tangent.y,aFacet.y,-tangent.x)+vec3(aFacet.x,0.,aFacet.z)*.05);
  vec4 mv=modelViewMatrix*vec4(p,1.);
  vec3 normal=normalize(normalMatrix*(facet/vec3(w,h,w)));
  vec3 lightDirection=normalize(mat3(viewMatrix)*uKeyLight);
  vec3 halfVector=normalize(normalize(-mv.xyz)+lightDirection);
  float reflection=pow(max(dot(normal,halfVector),0.),64.);
  float boundary=1.;
  if(uCuts.x>.002&&uCuts.x<.998)boundary=min(boundary,smoothstep(0.,.012,abs(aRank-uCuts.x)));
  if(uCuts.y>.002&&uCuts.y<.998)boundary=min(boundary,smoothstep(0.,.012,abs(aRank-uCuts.y)));
  float twinkle=pow(.5+.5*sin(uTime*.85+aSeed*87.),10.);
  vLight=(.08+twinkle*.1+reflection*1.8)*boundary;
  vColor=color;vSeed=aSeed;
  gl_PointSize=clamp(aSize*uDpr*8.7/-mv.z,1.,8.);
  gl_Position=projectionMatrix*mv;
}`

const fragmentShader=/* glsl */ `
varying vec3 vColor;
varying float vLight,vSeed;
uniform float uReveal;
void main(){
  vec2 p=gl_PointCoord-.5;
  float r2=dot(p,p);
  float core=exp(-r2*80.);
  float halo=exp(-r2*25.)*.065;
  float rayWidth=max(fwidth(p.x)*.6,.012);
  float rays=0.;
  if(vSeed>.995)rays=(exp(-abs(p.x)/rayWidth)*exp(-abs(p.y)*8.)
    +exp(-abs(p.y)/rayWidth)*exp(-abs(p.x)*8.))*.45;
  float alpha=(core+halo+rays)*vLight*uReveal;
  if(alpha<.004)discard;
  gl_FragColor=vec4(vColor,alpha);
}`

export function StarSand({engine}:{engine:ExperienceEngine}) {
  const gl=useThree(s=>s.gl),count=engine.getBudget().surface,theme=engine.snapshot.config.galaxyTheme
  const geometry=useMemo(()=>{
    const rng=random(173),positions=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count),seeds=new Float32Array(count),rank=new Float32Array(count),facets=new Float32Array(count*3)
    const palette=galaxyThemes[theme].colors
    for(let i=0;i<count;i++){
      const top=i%20===0
      positions.set([rng()*Math.PI*2,top?.594:-.48+rng()*.85,top?Math.sqrt(rng())*1.24:1.353],i*3)
      facets.set([(rng()-.5)*.6,(rng()-.5)*.5,(rng()-.5)*.6],i*3)
      new Color(palette[Math.floor(rng()*palette.length)]).multiplyScalar(i%67===0?2.6:1.2).toArray(colors,i*3)
      sizes[i]=i%67===0?3.5+rng():.8+rng()*1.2;seeds[i]=rng();rank[i]=(i+.5)/count
    }
    const g=new BufferGeometry()
    for(const [name,array,components]of[['position',positions,3],['color',colors,3],['aSize',sizes,1],['aSeed',seeds,1],['aRank',rank,1],['aFacet',facets,3]]as const)g.setAttribute(name,new Float32BufferAttribute(array,components))
    return g
  },[count,theme])
  const material=useMemo(()=>new ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:AdditiveBlending,toneMapped:false,
    uniforms:{uTime:{value:0},uDpr:{value:1},uReveal:{value:0},uProgress:{value:1},uSpread:{value:0},uKeyLight:{value:new Vector3(-3,5,4).normalize()},uTierY:{value:new Vector3()},uTierWidth:{value:new Vector3()},uTierHeight:{value:new Vector3()},uCuts:{value:new Vector3(1,1,1)},uFromShape:{value:new Vector3()},uToShape:{value:new Vector3()}},vertexShader,fragmentShader}),[])
  useEffect(()=>()=>geometry.dispose(),[geometry]);useEffect(()=>()=>material.dispose(),[material])
  useFrame(()=>{
    const config=engine.snapshot.config,from=engine.transition?.from??config,tiers=engine.visualCake.tiers
    const sum=tiers.reduce((n,tier)=>n+tier.active,0),shapeIds={round:0,square:1,heart:2}
    for(let i=0;i<3;i++){
      material.uniforms.uTierY.value.setComponent(i,tiers[i].y);material.uniforms.uTierWidth.value.setComponent(i,tiers[i].width);material.uniforms.uTierHeight.value.setComponent(i,tiers[i].height)
      material.uniforms.uFromShape.value.setComponent(i,shapeIds[layerAppearance(from,Math.min(i,from.cakeLayers-1)).shape]);material.uniforms.uToShape.value.setComponent(i,shapeIds[layerAppearance(config,Math.min(i,config.cakeLayers-1)).shape])
    }
    material.uniforms.uCuts.value.set(tiers[0].active/sum,(tiers[0].active+tiers[1].active)/sum,1)
    material.uniforms.uProgress.value=partProgress(engine.transition,'body');material.uniforms.uSpread.value=engine.motion.spread
    material.uniforms.uTime.value=engine.snapshot.reduced?0:engine.time;material.uniforms.uDpr.value=gl.getPixelRatio()*(engine.snapshot.tier==='desktop'?1:1.4)
    material.uniforms.uReveal.value=engine.motion.reveal*(config.galaxyEnabled?1:0)
  })
  return <points geometry={geometry} material={material} frustumCulled={false}/>
}
