import { useEffect, useMemo } from 'react'
import { DataTexture, LinearFilter, LinearMipmapLinearFilter, MeshPhysicalMaterial, RepeatWrapping, RGBAFormat } from 'three'
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
  const material = useMemo(() => {
    const bump = pastryTexture(cream)
    const mat = new MeshPhysicalMaterial({ color: 'white', roughness: cream ? .28 : .57, metalness: 0,
      bumpMap: bump, bumpScale: cream ? .025 : .12, clearcoat: cream ? .12 : .025,
      clearcoatRoughness: .4, sheen: cream ? .3 : .08, sheenColor: '#fff0df', sheenRoughness: .65,
      specularIntensity: cream ? .48 : .26, envMapIntensity: cream ? 1.05 : .55 })
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
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPastryPosition;').replace('#include <morphtarget_vertex>','#include <morphtarget_vertex>\nvPastryPosition=transformed;')
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 vPastryPosition;
        uniform float uPastryNebula;
        float pastryHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float pastryNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(pastryHash(i),pastryHash(i+vec3(1,0,0)),f.x),mix(pastryHash(i+vec3(0,1,0)),pastryHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(pastryHash(i+vec3(0,0,1)),pastryHash(i+vec3(1,0,1)),f.x),mix(pastryHash(i+vec3(0,1,1)),pastryHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      `).replace('#include <color_fragment>',`#include <color_fragment>
        float pastryFootprint=max(length(dFdx(vPastryPosition)),length(dFdy(vPastryPosition)))*55.;
        float pastryPore=pastryNoise(vPastryPosition*55.);
        float pastryCloud=pastryNoise(vPastryPosition*2.7+vec3(pastryNoise(vPastryPosition*5.4)*.8));
        vec3 pastryInk=mix(vec3(.16,.24,.46),vec3(1.18,.85,1.29),smoothstep(.22,.76,pastryCloud));
        diffuseColor.rgb*=mix(vec3(1.),pastryInk,uPastryNebula);
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
    mat.customProgramCacheKey = () => cream ? 'soft-cream-v7' : 'satin-buttercream-v8'
    return mat
  }, [cream])
  useEffect(() => () => { material.bumpMap?.dispose(); material.dispose() }, [material])
  return material
}
