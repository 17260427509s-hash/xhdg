import { BufferGeometry, Float32BufferAttribute, LatheGeometry, Vector2, Vector3 } from 'three'
import type { CakeShape, CakeStyle } from '../store/birthdayStore'
import { shapeCakeGeometry } from '../utils/cakeShape'
import { frostingGeometry } from './pastryGeometry'
import { recipes } from './cakeRecipes'

function bodyGeometry() {
  const profile = [new Vector2(0, -.54), new Vector2(1.3, -.54)]
  for (let i = 0; i <= 8; i++) {
    const a = i / 8 * Math.PI / 2
    profile.push(new Vector2(1.3 + .05 * Math.sin(a), -.49 - .05 * Math.cos(a)))
  }
  for (let i=1;i<=64;i++) profile.push(new Vector2(1.35, -.49+i/64*.975))
  for (let i = 1; i <= 8; i++) {
    const a = i / 8 * Math.PI / 2
    profile.push(new Vector2(1.3 + .05 * Math.cos(a), .485 + .05 * Math.sin(a)))
  }
  profile.push(new Vector2(0, .535))
  const g = new LatheGeometry(profile, 192), uv = g.getAttribute('uv'), p = g.getAttribute('position')
  for (let i = 0; i < uv.count; i++) uv.setY(i, (p.getY(i) + .54) / 1.075)
  for(let i=0;i<p.count;i++){
    const y=p.getY(i),x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z)
    if(r>1.34&&y>-.485&&y<.48){
      const a=Math.atan2(z,x),envelope=Math.sin((y+.49)/.975*Math.PI)
      const grain=(Math.sin(a*43+Math.sin(y*45))*.0011+Math.sin(a*71-y*83)*.0007)*envelope
      p.setXYZ(i,x*(1+grain/r),y,z*(1+grain/r))
    }
  }
  g.computeVertexNormals()
  return g
}

function weldNormals(g: BufferGeometry) {
  const p = g.getAttribute('position'), n = g.getAttribute('normal'), sums = new Map<string, Vector3>()
  const keys: string[] = []
  for (let i = 0; i < p.count; i++) {
    const key = `${Math.round(p.getX(i) * 100000)},${Math.round(p.getY(i) * 100000)},${Math.round(p.getZ(i) * 100000)}`
    keys.push(key)
    const sum = sums.get(key) ?? new Vector3()
    sum.x += n.getX(i); sum.y += n.getY(i); sum.z += n.getZ(i); sums.set(key, sum)
  }
  for (const sum of sums.values()) sum.normalize()
  for (let i = 0; i < p.count; i++) { const sum = sums.get(keys[i])!; n.setXYZ(i, sum.x, sum.y, sum.z) }
}

const baseCache=new Map<string,BufferGeometry>()
function pastryBase(kind:'body'|'cream',shape:CakeShape,style:CakeStyle){
  const key=kind+':'+shape+(kind==='cream'?':'+recipes[style].edge:'')
  let geometry=baseCache.get(key)
  if(!geometry){geometry=shapeCakeGeometry(kind==='body'?bodyGeometry():frostingGeometry(style),shape);weldNormals(geometry);baseCache.set(key,geometry)}
  return geometry
}
if(import.meta.hot)import.meta.hot.dispose(()=>{for(const geometry of baseCache.values())geometry.dispose();baseCache.clear()})

export function pastryMorph(kind: 'body' | 'cream', fromShape: CakeShape, toShape: CakeShape, fromStyle: CakeStyle, toStyle: CakeStyle) {
  const geometry=pastryBase(kind,fromShape,fromStyle).clone(),target=pastryBase(kind,toShape,toStyle)
  geometry.morphAttributes.position = [new Float32BufferAttribute(target.getAttribute('position').array.slice(), 3)]
  geometry.morphAttributes.normal = [new Float32BufferAttribute(target.getAttribute('normal').array.slice(), 3)]
  geometry.computeBoundingSphere()
  return geometry
}
