import { useEffect, useMemo } from 'react'
import { DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalMaterial, RepeatWrapping, RGBAFormat, SRGBColorSpace } from 'three'
import { useTexture } from '@react-three/drei'
import { random } from '../utils/random'

function pastryTexture(cream: boolean) {
  const width = cream ? 128 : 1024, height = cream ? 128 : 512
  const rng = random(cream ? 52 : 89), data = new Uint8Array(width * height * 4)
  const cellsX=cream?64:256,cellsY=64,stride=cellsX+1
  const grid = Float32Array.from({ length: stride * (cellsY+1) }, () => rng())
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const u = x / width * cellsX, v = y / height * cellsY, ix = Math.floor(u), iy = Math.floor(v)
    const fx = u - ix, fy = v - iy
    const n = (grid[iy * stride + ix] * (1 - fx) + grid[iy * stride + ix + 1] * fx) * (1 - fy)
      + (grid[(iy + 1) * stride + ix] * (1 - fx) + grid[(iy + 1) * stride + ix + 1] * fx) * fy
    const value = 123 + n * 25 + (rng() - .5) * 7
    data.set([value, value, value, 255], (y * width + x) * 4)
  }
  const texture = new DataTexture(data, width, height, RGBAFormat)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.magFilter = LinearFilter; texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true; texture.anisotropy = 4; texture.needsUpdate = true
  return texture
}

export function usePastryMaterial(cream: boolean) {
  const galaxyMap=useTexture('/textures/galaxy-icing.webp')
  const material = useMemo(() => {
    galaxyMap.colorSpace=SRGBColorSpace;galaxyMap.wrapS=RepeatWrapping;galaxyMap.anisotropy=8
    const bump = pastryTexture(cream)
    const mat = new MeshPhysicalMaterial({ color: 'white', roughness: cream ? .22 : .57, metalness: 0,
      bumpMap: bump, bumpScale: cream ? .004 : .035, clearcoat: cream ? .5 : .06,
      clearcoatRoughness: cream?.18:.4, sheen: cream ? .3 : .08, sheenColor: '#fff0df', sheenRoughness: .65,
      specularIntensity: cream ? .8 : .32, envMapIntensity: cream ? 1.1 : .65 })
    const nebula={value:0}
    mat.userData.nebula=nebula
    if (cream) {
      mat.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
          float creamEdge=pow(1.-saturate(dot(geometryNormal,geometryViewDir)),2.);
          reflectedLight.indirectDiffuse+=diffuseColor.rgb*vec3(.055,.029,.014)*(.4+creamEdge);
          #if NUM_DIR_LIGHTS > 0
            float creamWrap=pow(clamp((dot(geometryNormal,directionalLights[0].direction)+.45)/1.45,0.,1.),2.);
            reflectedLight.directDiffuse+=diffuseColor.rgb*directionalLights[0].color*vec3(.045,.03,.016)*creamWrap;
            float creamThrough=pow(clamp(dot(-geometryNormal,directionalLights[0].direction)+.35,0.,1.),3.);
            reflectedLight.directDiffuse+=diffuseColor.rgb*directionalLights[0].color*vec3(.055,.028,.012)*creamThrough;
          #endif
        `)
      }
    }
    if(!cream)mat.onBeforeCompile=shader=>{
      shader.uniforms.uPastryNebula=nebula
      shader.uniforms.uGalaxyMap={value:galaxyMap}
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPastryPosition;varying vec2 vPastryUv;').replace('#include <morphtarget_vertex>','#include <morphtarget_vertex>\nvPastryPosition=transformed;vPastryUv=uv;')
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 vPastryPosition;
        varying vec2 vPastryUv;
        uniform sampler2D uGalaxyMap;
        uniform float uPastryNebula;
        float pastryHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float pastryNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(pastryHash(i),pastryHash(i+vec3(1,0,0)),f.x),mix(pastryHash(i+vec3(0,1,0)),pastryHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(pastryHash(i+vec3(0,0,1)),pastryHash(i+vec3(1,0,1)),f.x),mix(pastryHash(i+vec3(0,1,1)),pastryHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      `).replace('#include <color_fragment>',`#include <color_fragment>
        float pastryFootprint=max(length(dFdx(vPastryPosition)),length(dFdy(vPastryPosition)))*55.;
        float pastryPore=pastryNoise(vPastryPosition*55.);
        // Four metres of circumference must not stretch a two-to-one texture
        // into horizontal stripes. Keep nebula features near their texel aspect.
        float pastryU=abs(fract(vPastryUv.x*2.+.115)*2.-1.);
        vec3 pastryInk=texture2D(uGalaxyMap,vec2(pastryU,vPastryUv.y*.9+.05)).rgb;
        vec3 pastryTint=clamp(diffuseColor.rgb/vec3(.0467,.0529,.287),vec3(.12),vec3(5.));
        diffuseColor.rgb=mix(diffuseColor.rgb,pastryInk*pastryTint*1.65,uPastryNebula);
        diffuseColor.rgb*=1.+(pastryPore-.5)*.14*(1.-smoothstep(.65,1.3,pastryFootprint));
      `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        float pastryMicro=pastryNoise(vPastryPosition*125.);
        float pastryMicroFootprint=max(length(dFdx(vPastryPosition)),length(dFdy(vPastryPosition)))*125.;
        float pastryGrainStrength=.65*(1.-smoothstep(.7,1.5,pastryMicroFootprint));
        normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(pastryMicro),dFdy(pastryMicro))*pastryGrainStrength,faceDirection);
      `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        roughnessFactor*=.93+pastryPore*.14;
      `)
    }
    mat.customProgramCacheKey = () => cream ? 'soft-cream-v8' : 'photographic-galaxy-icing-v1'
    return mat
  }, [cream,galaxyMap])
  useEffect(() => () => { material.bumpMap?.dispose(); material.dispose() }, [material])
  return material
}
