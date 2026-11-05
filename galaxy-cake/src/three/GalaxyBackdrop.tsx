import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { ShaderMaterial, SRGBColorSpace, Vector2, Vector4 } from 'three'
import type { ExperienceEngine } from '../experience/engine'
import { galaxyColorGLSL } from './shaders/galaxyColor'

/** A clean photographic sky plate, with live 3D stars rendered in front of it.
 * The asset contains no cake, flame, orbit, text or controls. It is also part of
 * the WebGL render so high resolution exports include exactly the same sky. */
export function GalaxyBackdrop({engine}:{engine:ExperienceEngine}) {
  const map=useTexture('/textures/galaxy-backdrop.webp')
  const {gl,size}=useThree()
  const owner=useRef<HTMLElement|null>(null),lastStyle=useRef({filter:'',transform:'',reveal:''})
  const material=useMemo(()=>{
    map.colorSpace=SRGBColorSpace
    return new ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,
      uniforms:{uMap:{value:map},uReveal:{value:0},uRect:{value:new Vector4(0,0,1,1)},uCrop:{value:new Vector4(0,0,1,1)},uViewport:{value:new Vector2(1,1)},uCamera:{value:new Vector4(0,0,0,1.055)},uHue:{value:0},uSaturation:{value:1}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}',
      fragmentShader:`varying vec2 vUv;uniform sampler2D uMap;uniform float uReveal,uHue,uSaturation;uniform vec4 uRect,uCrop,uCamera;uniform vec2 uViewport;
        ${galaxyColorGLSL}
        void main(){vec2 pageUv=vUv*uRect.zw+uRect.xy;
          vec2 p=(pageUv-.5)*uViewport-vec2(uCamera.x,-uCamera.y)*uViewport;
          float co=cos(uCamera.z),si=sin(uCamera.z);
          p=mat2(co,si,-si,co)*p/uCamera.w;
          vec2 sourceUv=(p/uViewport+.5)*uCrop.zw+uCrop.xy;
          vec3 sky=galaxyColor(texture2D(uMap,sourceUv).rgb,uHue,uSaturation);
          gl_FragColor=vec4(mix(vec3(.0012,.0012,.0021),sky,uReveal),1.);
          #include <colorspace_fragment>
        }`,
    })
  },[map])
  useLayoutEffect(()=>{
    const element=gl.domElement.closest('main'),bounds=gl.domElement.getBoundingClientRect(),viewport=element?.getBoundingClientRect()
    owner.current=element
    if(viewport){
      material.uniforms.uRect.value.set((bounds.left-viewport.left)/viewport.width,1-(bounds.bottom-viewport.top)/viewport.height,bounds.width/viewport.width,bounds.height/viewport.height)
      material.uniforms.uViewport.value.set(viewport.width,viewport.height)
      const image=map.image as HTMLImageElement
      const aspect=(viewport.width/viewport.height)/(image.width/image.height)
      // Match CSS cover, retaining the left spiral in portrait without stretching stars.
      material.uniforms.uCrop.value.set(aspect<1?(1-aspect)*.12:0,aspect>1?(1-1/aspect)*.5:0,Math.min(1,aspect),Math.min(1,1/aspect))
    }
  },[gl,size.width,size.height,material,map])
  useEffect(()=>()=>{material.dispose();for(const property of ['--sky-reveal','--sky-filter','--sky-transform'])owner.current?.style.removeProperty(property)},[material])
  useFrame(()=>{
    const sky=engine.sky,viewport=material.uniforms.uViewport.value,reveal=.07+.93*engine.motion.reveal
    material.uniforms.uReveal.value=reveal
    material.uniforms.uHue.value=sky.hue;material.uniforms.uSaturation.value=sky.saturation
    material.uniforms.uCamera.value.set(sky.panX,sky.panY,sky.rotation,sky.zoom)
    const filter=`hue-rotate(${sky.hue.toFixed(6)}rad) saturate(${sky.saturation.toFixed(6)})`
    const transform=`translate3d(${(sky.panX*viewport.x).toFixed(4)}px,${(sky.panY*viewport.y).toFixed(4)}px,0) rotate(${sky.rotation.toFixed(6)}rad) scale(${sky.zoom.toFixed(6)})`
    const opacity=reveal.toFixed(5),style=owner.current?.style
    if(style){
      if(lastStyle.current.filter!==filter){style.setProperty('--sky-filter',filter);lastStyle.current.filter=filter}
      if(lastStyle.current.transform!==transform){style.setProperty('--sky-transform',transform);lastStyle.current.transform=transform}
      if(lastStyle.current.reveal!==opacity){style.setProperty('--sky-reveal',opacity);lastStyle.current.reveal=opacity}
    }
  })
  return <mesh renderOrder={-10000} frustumCulled={false} material={material}><planeGeometry args={[2,2]}/></mesh>
}
