import { Vector3 } from 'three'
import type { Camera } from 'three'
import type { ExperienceEngine } from '../experience/engine'
import type { BirthdayConfig } from '../store/birthdayStore'
import { layerAppearance } from '../store/birthdayStore'
import { cakeOutline } from '../utils/cakeShape'

/** Project the physical gift, excluding independent orbit/particle effects.
 * Reuse all scratch state; this is also the read-only responsive QA measurement. */
export class SubjectFraming {
  readonly bounds={left:0,top:0,right:0,bottom:0,width:0,height:0,occupancy:0}
  private point=new Vector3()
  private config:BirthdayConfig|null=null
  private outlines=new Float32Array(3*24*2)
  private plate=Float32Array.from({length:48},(_,i)=>i%2?Math.sin(Math.floor(i/2)/24*Math.PI*2)*1.846*.87:Math.cos(i/2/24*Math.PI*2)*1.846)
  private plot(x:number,y:number,z:number,camera:Camera,width:number,height:number){
    this.point.set(x,y,z).project(camera)
    const px=(this.point.x*.5+.5)*width,py=(-this.point.y*.5+.5)*height,b=this.bounds
    b.left=Math.min(b.left,px);b.right=Math.max(b.right,px);b.top=Math.min(b.top,py);b.bottom=Math.max(b.bottom,py)
  }
  update(engine:ExperienceEngine,camera:Camera,width:number,height:number){
    const b=this.bounds;b.left=b.top=Infinity;b.right=b.bottom=-Infinity
    if(this.config!==engine.snapshot.config){
      this.config=engine.snapshot.config
      for(let tier=0;tier<3;tier++)for(let i=0;i<24;i++){const p=cakeOutline(i/24*Math.PI*2,1.4,layerAppearance(this.config,Math.min(tier,this.config.cakeLayers-1)).shape);this.outlines.set(p,(tier*24+i)*2)}
    }
    for(let i=0;i<24;i++){
      this.plot(this.plate[i*2],-.647,this.plate[i*2+1],camera,width,height)
      for(let tier=0;tier<engine.snapshot.config.cakeLayers;tier++){
        const t=engine.visualCake.tiers[tier],offset=(tier*24+i)*2,x=this.outlines[offset]*t.width,z=this.outlines[offset+1]*t.width
        this.plot(x,t.y+.61*t.height,z,camera,width,height);this.plot(x,t.y-.54*t.height,z,camera,width,height)
      }
    }
    const candle=engine.visualCake.candle
    for(let i=0;i<candle.count;i++){
      const anchor=candle.anchors[i],top=anchor[1]+(engine.motion.ignition>.01?.49:.02)*candle.scale
      this.plot(anchor[0]-.12*candle.scale,top,anchor[2],camera,width,height);this.plot(anchor[0]+.12*candle.scale,top,anchor[2],camera,width,height)
    }
    b.width=b.right-b.left;b.height=b.bottom-b.top;b.occupancy=b.height/height
    return b
  }
}
