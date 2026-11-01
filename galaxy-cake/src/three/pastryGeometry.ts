import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'
import { random } from '../utils/random'

// A continuous rolled lip, varying drips and a rounded underside, rather than
// separate intersecting spheres. The angular seam shares the same normal.
export function frostingGeometry() {
  const rng=random(451),segments=512
  const drips=Array.from({length:15},(_,i)=>({angle:(i+.15+rng()*.2)/15*Math.PI*2,width:.085+rng()*.035,depth:.13+rng()*.15}))
  const radius=[0,.3,.7,1.05,1.23,1.32,1.365,1.388,1.397,1.399,1.396,1.389,1.375,1.358,1.343,1.338]
  const height=[.584,.585,.586,.585,.581,.568,.548,.521,.482,.431,.387,.362,.354,.369,.401,.46]
  const weight=[0,0,0,0,0,0,0,.02,.13,.4,.73,.96,1,.94,.77,.5]
  const vertices:number[]=[],uvs:number[]=[],indices:number[]=[]
  for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2
    let drip=0
    for(const d of drips){const delta=Math.atan2(Math.sin(a-d.angle),Math.cos(a-d.angle));drip+=d.depth*Math.exp(-.5*(delta/d.width)**2)}
    for(let j=0;j<radius.length;j++){vertices.push(Math.cos(a)*radius[j],height[j]-drip*weight[j],Math.sin(a)*radius[j]);uvs.push(Math.cos(a)*radius[j]*.5+.5,Math.sin(a)*radius[j]*.5+.5)}
  }
  const stride=radius.length
  for(let i=0;i<segments;i++)for(let j=0;j<stride-1;j++){
    const a=i*stride+j,b=a+stride;indices.push(a,b,a+1,b,b+1,a+1)
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals()
  const normal=geometry.getAttribute('normal')
  for(let j=0;j<stride;j++){
    const n=new Vector3().fromBufferAttribute(normal,j).add(new Vector3().fromBufferAttribute(normal,segments*stride+j)).normalize()
    normal.setXYZ(j,n.x,n.y,n.z);normal.setXYZ(segments*stride+j,n.x,n.y,n.z)
  }
  return geometry
}

// A continuous piped cream surface. Twisted nozzle flutes and a shallow
// helical ridge avoid the dark gaps created by intersecting torus-like turns.
export function rosetteGeometry() {
  const steps=100,sides=96,vertices:number[]=[],uvs:number[]=[],indices:number[]=[]
  for(let i=0;i<=steps;i++){
    const t=Math.min(i/steps,.99998)
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2,flute=1+.12*Math.cos(8*(a-t*2.1))
      const radius=.184*Math.pow(Math.cos(t*Math.PI*.5),.82)*flute*(1+.075*Math.sin(t*24-a))
      vertices.push(Math.cos(a)*radius+.055*t**4,.012+t*.18,Math.sin(a)*radius+.018*t**3);uvs.push(j/sides,t)
    }
  }
  for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1)}
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry
}
