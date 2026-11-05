import { Color, SRGBColorSpace } from 'three'
import { cakePresets, layerAppearance } from '../store/birthdayStore'
import type { BirthdayConfig } from '../store/birthdayStore'
import { partProgress } from './cakeTransition'
import type { CakeTransition, VisualCake } from './cakeTransition'

const baseline=new Color(cakePresets.galaxy.color).getHSL({h:0,s:0,l:0},SRGBColorSpace)
const tau=Math.PI*2

/** Shared visual state. Neither the CSS sky nor the WebGL sky owns a clock. */
export class GalaxyAppearance {
  hue=0
  saturation=1
  time=0
  panX=0
  panY=0
  rotation=0
  zoom=1.055
  color=cakePresets.galaxy.color
  private fromColor=new Color()
  private toColor=new Color()
  private mixed=new Color()
  private hsl={h:0,s:0,l:0}

  update(config:BirthdayConfig,transition:CakeTransition|null,visual:VisualCake,time:number,delta:number,reduced:boolean){
    const from=transition?.from??config,progress=partProgress(transition,'body')
    this.mixed.setRGB(0,0,0)
    let total=0
    for(let i=0;i<3;i++){
      const tier=visual.tiers[i],weight=tier.width*tier.height*tier.active
      if(weight<.0001)continue
      this.fromColor.set(layerAppearance(from,Math.min(i,from.cakeLayers-1)).cakeColor)
      this.toColor.set(layerAppearance(config,Math.min(i,config.cakeLayers-1)).cakeColor)
      this.fromColor.lerp(this.toColor,progress).multiplyScalar(weight)
      this.mixed.add(this.fromColor);total+=weight
    }
    if(total>.0001)this.mixed.multiplyScalar(1/total)
    else this.mixed.set(config.cakeColor)
    this.color='#'+this.mixed.getHexString()
    this.mixed.getHSL(this.hsl,SRGBColorSpace)
    const hue=(this.hsl.h-baseline.h)*tau,saturation=Math.max(.16,Math.min(1.15,this.hsl.s/baseline.s))
    const blend=reduced?1:1-Math.exp(-Math.min(delta,.06)*8)
    const difference=Math.atan2(Math.sin(hue-this.hue),Math.cos(hue-this.hue))
    this.hue=Math.abs(difference)<.00001?hue:this.hue+difference*blend
    this.saturation=Math.abs(saturation-this.saturation)<.00001?saturation:this.saturation+(saturation-this.saturation)*blend
    this.time=reduced?0:time
    this.panX=Math.sin(this.time*.09)*.018
    this.panY=(Math.cos(this.time*.067)-1)*.009
    this.rotation=Math.sin(this.time*.055)*.008
    this.zoom=1.055+Math.sin(this.time*.06)*.005
  }

  inspect(){return {hue:this.hue,saturation:this.saturation,time:this.time,panX:this.panX,panY:this.panY,rotation:this.rotation,zoom:this.zoom,color:this.color}}
}
