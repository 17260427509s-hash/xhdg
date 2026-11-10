import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from 'three'
import { random } from '../utils/random'
import type { CakeStyle } from '../store/birthdayStore'
import { recipes } from './cakeRecipes'

/** Duplicate UV seam vertices must share normals, including the piped cream. */
function smoothSeam(geometry: BufferGeometry, rows: number, columns: number) {
  geometry.computeVertexNormals()
  const normal = geometry.getAttribute('normal')
  const average = new Vector3(), other = new Vector3()
  for (let row = 0; row < rows; row++) {
    const first = row * columns, last = first + columns - 1
    average.fromBufferAttribute(normal, first).add(other.fromBufferAttribute(normal, last)).normalize()
    normal.setXYZ(first, average.x, average.y, average.z)
    normal.setXYZ(last, average.x, average.y, average.z)
  }
}

export function frostingGeometry(style: CakeStyle = 'galaxy') {
  const edge = recipes[style].edge
  const rng = random(451), segments = 512
  const drips = Array.from({ length: 18 }, (_, i) => {
    const angle=(i+(rng()-.5)*.66)/18*Math.PI*2
    const depth=.2*(.6+.8*rng())
    // Deeper drops keep the same rounded tip curvature instead of becoming cones.
    return {angle,depth,width:.15+rng()*.065,lean:(rng()-.5)*.028}
  })
  const radius = [0, .3, .7, 1.05, 1.23, 1.32, 1.365, 1.388, 1.397, 1.399, 1.396, 1.389, 1.375, 1.358, 1.343, 1.338]
  const height = [.584, .587, .588, .586, .582, .575, .563, .548, .532, .518, .501, .489, .487, .497, .519, .54]
  const weight = [0, 0, 0, 0, 0, 0, 0, .015, .09, .32, .65, .94, 1, .94, .7, .35]
  const profile=new CatmullRomCurve3(radius.map((r,i)=>new Vector3(r,height[i],weight[i])),false,'centripetal').getPoints(64)
  const vertices: number[] = [], uvs: number[] = [], indices: number[] = []
  for (let j = 0; j < profile.length; j++) {
    const row=profile[j],w=Math.max(0,Math.min(1,row.z))
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2
      let drip = 0, lean = 0
      for (const d of drips) {
        const delta = Math.atan2(Math.sin(angle - d.angle), Math.cos(angle - d.angle))
        const influence = Math.abs(delta)<d.width?Math.pow(Math.max(0,.5+.5*Math.cos(Math.PI*delta/d.width)),.82):0
        drip += d.depth * influence
        lean += d.lean * influence * w
      }
      if (edge === 'scallop') drip = .038 + .025 * (.5 + .5 * Math.cos(angle * 20))
      if (edge === 'rolled') drip = .018 + .014 * Math.sin(angle * 16) ** 2
      if (edge === 'petal') drip = .03 + .035 * (.5 + .5 * Math.cos(angle * 24))
      const r = row.x + (edge === 'rolled' ? .012 * Math.sin(j / (profile.length - 1) * Math.PI) ** 4 : 0) + (.003 * Math.sin(angle * 7 + .8)+.022*drip/.3)*w
      vertices.push(Math.cos(angle + lean) * r, row.y - drip * w, Math.sin(angle + lean) * r)
      uvs.push(Math.cos(angle) * row.x * .5 + .5, Math.sin(angle) * row.x * .5 + .5)
    }
  }
  const columns = segments + 1
  for (let j = 0; j < profile.length - 1; j++) for (let i = 0; i < segments; i++) {
    const a = j * columns + i, b = a + columns
    indices.push(a, a + 1, b, b, a + 1, b + 1)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  smoothSeam(geometry, profile.length, columns)
  return geometry
}

/** Low five-petal blossom with fine folded nozzle ridges, without a stacked coil. */
export function creamFlowerGeometry(detail = 1) {
  const vertices:number[]=[],uvs:number[]=[],indices:number[]=[]
  const rows=Math.round(64*detail),columns=Math.round(160*detail)
  for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){
    const v=i/rows,angle=j/columns*Math.PI*2
    const profile=.17*Math.pow(Math.sin(Math.PI*v),.49)*(1-.48*v)
    const fold=angle*5-1.15*v
    const lobes=1+.27*Math.cos(fold)+.012*Math.cos(fold*3)
    const radius=profile*lobes
    const y=.008+.12*v-.018*Math.max(0,(v-.7)/.3)**2
    vertices.push(Math.cos(angle)*radius+.028*v*v,y,Math.sin(angle)*radius+.01*v*v)
    uvs.push(j/columns,v)
  }
  for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){
    const a=i*(columns+1)+j,b=a+columns+1
    indices.push(a,b,a+1,b,b+1,a+1)
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setIndex(indices)
  smoothSeam(g,rows+1,columns+1)
  const n=g.getAttribute('normal')
  for(let j=0;j<=columns;j++){n.setXYZ(j,0,-1,0);n.setXYZ(rows*(columns+1)+j,0,1,0)}
  return g
}
