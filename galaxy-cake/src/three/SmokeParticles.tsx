import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, Vector3 } from 'three'
import type { ExperienceEngine } from '../experience/engine'
import { candleAnchors } from '../utils/candles'
import { random } from '../utils/random'

export function SmokeParticles({ engine }: { engine: ExperienceEngine }) {
  const points = useRef<Points>(null!), gl = useThree(s => s.gl)
  const { config, tier } = engine.snapshot
  const anchors = useMemo(() => candleAnchors(config), [config.age, config.candleType, config.cakeLayers])
  const count = tier === 'desktop' ? 48 : tier === 'mobile' ? 30 : 18
  const geometry = useMemo(() => {
    const rng = random(701), positions = new Float32Array(count * 3), seed = new Float32Array(count)
    for (let i = 0; i < count; i++) seed[i] = rng()
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new Float32BufferAttribute(seed, 1))
    return g
  }, [count])
  const material = useMemo(() => new ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uAge: { value: -1 }, uDpr: { value: 1 }, uCount: { value: 1 }, uAnchors: { value: [new Vector3(), new Vector3(), new Vector3()] } },
    vertexShader: `attribute float aSeed;uniform float uAge,uDpr;uniform int uCount;uniform vec3 uAnchors[3];varying float vAlpha;
      void main(){float age=uAge-aSeed*.35;vec3 p=uAnchors[int(mod(floor(aSeed*100.),float(uCount)))];
      p+=vec3(sin(aSeed*70.+age*2.)*age*.075,age*.43,cos(aSeed*38.+age)*age*.06);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(14.+aSeed*15.+max(age,0.)*13.)*uDpr*8.5/-mv.z;
      vAlpha=age<0.?0.:smoothstep(0.,.2,age)*pow(max(0.,1.-age/2.3),2.)*.2;}`,
    fragmentShader: `varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float alpha=exp(-dot(p,p)*25.)*vAlpha;if(alpha<.002)discard;gl_FragColor=vec4(.67,.65,.75,alpha);}`,
  }), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])
  useFrame(() => {
    const age = engine.blownAt < 0 ? -1 : engine.time - engine.blownAt
    points.current.visible = age >= 0 && age < 2.7
    engine.stats.smoke = points.current.visible ? count : 0
    material.uniforms.uAge.value = age
    material.uniforms.uDpr.value = gl.getPixelRatio()
    material.uniforms.uCount.value = anchors.length
    for (let i = 0; i < 3; i++) material.uniforms.uAnchors.value[i].fromArray(anchors[i % anchors.length])
  })
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false}/>
}
