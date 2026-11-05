import { layerAppearance } from '../store/birthdayStore'
import type { BirthdayConfig } from '../store/birthdayStore'
import { decorationCatalog } from '../store/decorationCatalog'
import type { DecorationType } from '../store/decorationCatalog'
import { cakeOutline } from './cakeShape'
import { cakeAssembly, candlePlacement } from './cakeAssembly'
import { candleAnchors } from './candles'
import { recipes } from '../three/cakeRecipes'
import { random } from './random'
export interface PlacedDecoration { type:DecorationType;x:number;y:number;z:number;rotation:number;radius:number;scale:number }
function footprint(shape:BirthdayConfig['cakeShape'],scale=1) {
  const polygon=Array.from({length:96},(_,i)=>cakeOutline(i/96*Math.PI*2,1.35*scale,shape))
  return (x:number,z:number)=>{
    let inside=false,distance=Infinity
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const [ax,az]=polygon[i],[bx,bz]=polygon[j]
      if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside
      const dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)))
      distance=Math.min(distance,Math.hypot(x-ax-t*dx,z-az-t*dz))
    }
    return inside?distance:-distance
  }
}
export function decorationLayout(config:BirthdayConfig,index:number,tier:'desktop'|'mobile'|'low'):PlacedDecoration[] {
  const appearance=layerAppearance(config,index),tiers=cakeAssembly(config),current=tiers[index]
  if(!current)return []
  const top=index===config.cakeLayers-1,types=appearance.decorations
  const cap=tier==='low'?8:tier==='mobile'?12:16,target=Math.min(cap,{sparse:8,standard:12,rich:16}[appearance.decorationDensity])
  const rng=random(appearance.decorationSeed),within=footprint(appearance.shape)
  const upper=!top?footprint(layerAppearance(config,index+1).shape,tiers[index+1].width/current.width):null
  const anchors=top?candleAnchors(config).map(a=>[a[0]/current.width,a[2]/current.width]):[]
  const candleRadius=.12*candlePlacement(config).scale/current.width
  const recipe=recipes[config.cakeStyle],flowers=Array.from({length:recipe.flowers},(_,i)=>cakeOutline(i/recipe.flowers*Math.PI*2+.12,recipe.flowerRadius,appearance.shape))
  const result:PlacedDecoration[]=[]
  const safe=(x:number,z:number,r:number)=>within(x,z)>r+.035&&(!upper||upper(x,z)<-r-.045)&&anchors.every(([cx,cz])=>Math.hypot(x-cx,z-cz)>r+candleRadius)&&flowers.every(([fx,fz])=>Math.hypot(x-fx,z-fz)>r+.17)&&result.every(p=>Math.hypot(x-p.x,z-p.z)>r+p.radius+.035)
  const hero=types.find(t=>decorationCatalog[t].hero)
  if(hero&&top){const radius=decorationCatalog[hero].radius;for(const [x,z] of [[-.32,-.46],[.32,-.46],[0,-.55],[0,-.53],[0,-.57],[0,-.63],[-.4,-.52],[.4,-.52]])if(safe(x,z,radius)){result.push({type:hero,x,y:.593,z,rotation:0,radius,scale:1});break}}
  const small=types.filter(t=>!decorationCatalog[t].hero)
  for(let n=0;n<target-(hero?1:0)&&small.length;n++) {
    const type=small[n%small.length],scale=top?1:.6,radius=decorationCatalog[type].radius*scale
    for(let attempt=0;attempt<160;attempt++) {
      const angle=rng()*Math.PI*2,r=top?.36+Math.sqrt(rng())*.53:.95+rng()*.24
      const [x,z]=cakeOutline(angle,r,appearance.shape)
      if(safe(x,z,radius)){result.push({type,x,y:.593,z,rotation:rng()*Math.PI*2,radius,scale});break}
    }
  }
  return result
}
