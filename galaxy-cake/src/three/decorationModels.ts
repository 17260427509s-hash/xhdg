import { BoxGeometry, BufferGeometry, CatmullRomCurve3, ExtrudeGeometry, IcosahedronGeometry, LatheGeometry, Shape, SphereGeometry, TubeGeometry, Vector2, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { heartShape, starShape } from '../utils/ornaments'
import type { DecorationType } from '../store/decorationCatalog'
import type { BufferAttribute } from 'three'
export interface DecorationPart { geometry:BufferGeometry; color:string; accent?:boolean; metalness?:number; roughness?:number }
const cache=new Map<DecorationType,DecorationPart[]>() // At most 16 model definitions.
function merge(list:BufferGeometry[]) {
  const plain=list.map(g=>{const p=g.index?g.toNonIndexed():g.clone();p.deleteAttribute('uv');g.dispose();return p})
  const result=mergeGeometries(plain)!;plain.forEach(g=>g.dispose());return result
}
function sphere(x:number,y:number,z:number,sx:number,sy=sx,sz=sx){return new SphereGeometry(1,16,10).scale(sx,sy,sz).translate(x,y,z)}
function extrude(shape:Shape,depth=.035){return new ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,curveSegments:20,steps:1}).translate(0,0,-depth/2)}
function tube(points:Vector3[],radius=.008){return new TubeGeometry(new CatmullRomCurve3(points),28,radius,7,false)}
function rectangle(w:number,h:number){const s=new Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();return s}
/** Mirroring vertices reverses handedness; restore winding to match the normals. */
function mirrorX(g:BufferGeometry) {
  g.scale(-1,1,1)
  if(g.index){for(let i=0;i<g.index.count;i+=3){const b=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,b)}}
  else for(const attribute of Object.values(g.attributes)){
    const a=attribute as BufferAttribute
    for(let i=0;i<a.count;i+=3)for(let k=0;k<a.itemSize;k++){const b=(i+1)*a.itemSize+k,c=(i+2)*a.itemSize+k,value=a.array[b];a.array[b]=a.array[c];a.array[c]=value}
  }
  return g
}
export function getDecorationModel(type:DecorationType):DecorationPart[] {
  const existing=cache.get(type);if(existing)return existing
  const parts:DecorationPart[]=[],add=(g:BufferGeometry,color:string,accent=false,metalness=0,roughness=.36)=>parts.push({geometry:g,color,accent,metalness,roughness})
  if(type==='stars'||type==='hearts') {
    add(extrude(type==='stars'?starShape():heartShape(),.1).scale(type==='stars'?.19:.21,type==='stars'?.19:.21,.24).rotateX(-Math.PI/2+.12),type==='stars'?'#dfb36c':'#eaa1b8',true,type==='stars'?.72:.04)
  } else if(type==='strawberry') {
    const profile=Array.from({length:29},(_,i)=>{const t=i/28;return new Vector2(Math.pow(Math.sin(t*Math.PI),.72)*(.7+t*.35)*.12,t*.25)})
    add(new LatheGeometry(profile,36),'#cf354c',false,0,.3)
    const seeds:BufferGeometry[]=[],leaves:BufferGeometry[]=[]
    for(let i=0;i<28;i++){const t=.12+.74*(i+.5)/28,a=i*2.399963,r=Math.pow(Math.sin(t*Math.PI),.72)*(.7+t*.35)*.1205;seeds.push(sphere(Math.cos(a)*r,t*.25,Math.sin(a)*r,.004,.007,.004))}
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;leaves.push(sphere(0,.239,0,.018,.007,.052).translate(0,0,.032).rotateY(a))}
    add(merge(seeds),'#f4d799');add(merge(leaves),'#527b47')
  } else if(type==='blueberry') {
    add(sphere(0,.085,0,.086,.083,.086),'#555a91',false,0,.5)
    add(extrude(starShape(),.03).scale(.045,.045,.12).rotateX(-Math.PI/2).translate(0,.165,0),'#343953')
  } else if(type==='cherry') {
    add(sphere(0,.085,0,.09,.087,.085),'#b92b44',false,0,.2)
    add(tube([new Vector3(0,.16,0),new Vector3(.015,.25,0),new Vector3(.065,.29,-.02)],.005),'#55733b')
    add(sphere(.045,.26,-.01,.035,.008,.015),'#668a49')
  } else if(type==='mango')add(extrude(rectangle(.16,.13),.14),'#f2b643',false,0,.24)
  else if(type==='chocolate') {
    add(new BoxGeometry(.16,.23,.028).rotateZ(.22).translate(0,.13,0),'#42271f',false,0,.27)
    add(merge([new BoxGeometry(.008,.2,.009).translate(-.034,.13,.02),new BoxGeometry(.008,.2,.009).translate(.034,.13,.02)]),'#765344')
  } else if(type==='crystal')add(new IcosahedronGeometry(.115,0).scale(.85,1.35,.85).translate(0,.13,0),'#c9abe9',true,.08,.13)
  else if(type==='macaron') {
    add(merge([sphere(0,.045,0,.135,.045,.12),sphere(0,.115,0,.135,.045,.12)]),'#c8b1df',true,0,.48)
    add(new LatheGeometry([new Vector2(0,.065),new Vector2(.125,.065),new Vector2(.125,.09),new Vector2(0,.09)],40),'#fff0de')
  } else if(type==='pearls')add(sphere(0,.058,0,.058),'#f2e5d4',true,.13,.23)
  else if(type==='flower') {
    add(merge(Array.from({length:5},(_,i)=>sphere(0,.025,0,.037,.024,.065).translate(0,0,.056).rotateY(i/5*Math.PI*2))),'#e6bbd5',true,0,.45)
    add(sphere(0,.045,0,.028,.022,.028),'#eac77b')
  } else if(type==='butterfly') {
    const wing=new Shape();wing.moveTo(0,0);wing.bezierCurveTo(.16,.03,.2,.24,.1,.22);wing.bezierCurveTo(.02,.21,.02,.13,0,.1);wing.bezierCurveTo(.1,.09,.13,-.01,.05,-.02);wing.closePath()
    add(merge([extrude(wing,.012).rotateY(-.3),mirrorX(extrude(wing,.012)).rotateY(.3)]),'#dcb7ec',true,.06,.3)
    add(merge([sphere(0,.09,0,.012,.09,.012),tube([new Vector3(0,.17,0),new Vector3(.018,.21,0),new Vector3(.03,.22,0)],.003),tube([new Vector3(0,.17,0),new Vector3(-.018,.21,0),new Vector3(-.03,.22,0)],.003)]),'#bb945e')
  } else if(type==='bow') {
    const loop=new Shape();loop.moveTo(0,.1);loop.bezierCurveTo(.1,.23,.22,.2,.17,.09);loop.bezierCurveTo(.12,.03,.05,.08,0,.1)
    add(merge([extrude(loop,.025),mirrorX(extrude(loop,.025)),new BoxGeometry(.065,.095,.02).rotateZ(.25).translate(-.04,.04,0),new BoxGeometry(.065,.095,.02).rotateZ(-.25).translate(.04,.04,0),sphere(0,.105,.012,.035,.035,.03)]),'#d59ab8',true,0,.32)
  } else if(type==='crescent') {
    const moon=new Shape();moon.moveTo(.08,.6);moon.bezierCurveTo(-.38,.58,-.38,.06,.08,.04);moon.bezierCurveTo(-.1,.2,-.1,.44,.08,.6)
    add(merge([extrude(moon,.04).translate(.08,.06,0),new BoxGeometry(.012,.14,.012).translate(0,.07,0)]),'#e7c77d',true,.72,.23)
  } else if(type==='crown') {
    const s=new Shape();s.moveTo(-.25,0);s.lineTo(.25,0);s.lineTo(.29,.27);s.lineTo(.14,.17);s.lineTo(0,.34);s.lineTo(-.14,.17);s.lineTo(-.29,.27);s.closePath()
    add(merge([extrude(s,.045).translate(0,.09,0),new BoxGeometry(.016,.1,.016).translate(-.15,.05,0),new BoxGeometry(.016,.1,.016).translate(.15,.05,0)]),'#e8c478',true,.76,.24)
    add(merge([sphere(0,.29,.03,.025),sphere(-.18,.23,.03,.022),sphere(.18,.23,.03,.022)]),'#e3b0c8')
  } else if(type==='rainbow') {
    ;['#e8a7b4','#efd291','#a7cdb8','#9ebcdd'].forEach((color,i)=>{const r=.29-i*.045;add(tube(Array.from({length:33},(_,j)=>{const a=j/32*Math.PI;return new Vector3(Math.cos(a)*r,.15+Math.sin(a)*r,0)}),.022),color)})
    add(merge([sphere(-.265,.14,0,.085,.045,.045),sphere(.265,.14,0,.085,.045,.045),new BoxGeometry(.014,.15,.014).translate(-.23,.075,0),new BoxGeometry(.014,.15,.014).translate(.23,.075,0)]),'#fff0e3')
  }
  let min=Infinity;for(const p of parts){p.geometry.computeBoundingBox();min=Math.min(min,p.geometry.boundingBox!.min.y)}
  parts.forEach(p=>p.geometry.translate(0,-min,0));cache.set(type,parts);return parts
}
if(import.meta.hot)import.meta.hot.dispose(()=>{for(const parts of cache.values())parts.forEach(p=>p.geometry.dispose());cache.clear()})
