import { cakePresets, layerAppearance } from '../store/birthdayStore'
import type { BirthdayConfig } from '../store/birthdayStore'
import { partProgress } from './cakeTransition'
import type { CakeTransition, VisualCake } from './cakeTransition'

// Match Three 0.181 transfer constants without importing its rendering runtime.
const linear=(v:number)=>v<.04045?v*.0773993808:(v*.9478672986+.0521327014)**2.4
const srgb=(v:number)=>v<.0031308?v*12.92:1.055*v**.41666-.055
function rgb(hex:string){return [0,2,4].map(i=>linear(parseInt(hex.slice(i+1,i+3),16)/255))}
function hsl(r:number,g:number,b:number,out:{h:number;s:number;l:number}){
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2
  out.l=l;out.s=d===0?0:d/(l<=.5?max+min:2-max-min)
  out.h=d===0?0:(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)/6
  return out
}
const base=rgb(cakePresets.galaxy.color),baseline=hsl(srgb(base[0]),srgb(base[1]),srgb(base[2]),{h:0,s:0,l:0})
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
  private fromConfig:BirthdayConfig|null=null
  private toConfig:BirthdayConfig|null=null
  private fromColors:number[][]=[]
  private toColors:number[][]=[]
  private mixed=[0,0,0]
  private hsl={h:0,s:0,l:0}

  update(config:BirthdayConfig,transition:CakeTransition|null,visual:VisualCake,time:number,delta:number,reduced:boolean){
    const from=transition?.from??config,progress=partProgress(transition,'body')
    if(this.fromConfig!==from){this.fromConfig=from;this.fromColors=[0,1,2].map(i=>rgb(layerAppearance(from,Math.min(i,from.cakeLayers-1)).cakeColor))}
    if(this.toConfig!==config){this.toConfig=config;this.toColors=[0,1,2].map(i=>rgb(layerAppearance(config,Math.min(i,config.cakeLayers-1)).cakeColor))}
    this.mixed.fill(0)
    let total=0
    for(let i=0;i<3;i++){
      const tier=visual.tiers[i],weight=tier.width*tier.height*tier.active
      if(weight<.0001)continue
      for(let channel=0;channel<3;channel++)this.mixed[channel]+=(this.fromColors[i][channel]+(this.toColors[i][channel]-this.fromColors[i][channel])*progress)*weight
      total+=weight
    }
    for(let channel=0;channel<3;channel++)this.mixed[channel]=srgb(total>.0001?this.mixed[channel]/total:this.toColors[0][channel])
    this.color='#'+this.mixed.map(v=>Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0')).join('')
    hsl(this.mixed[0],this.mixed[1],this.mixed[2],this.hsl)
    const hue=(this.hsl.h-baseline.h)*tau,saturation=Math.max(.16,Math.min(1.15,this.hsl.s/baseline.s))
    const blend=reduced?1:1-Math.exp(-Math.min(delta,.06)*8)
    const difference=Math.atan2(Math.sin(hue-this.hue),Math.cos(hue-this.hue))
    this.hue=Math.abs(difference)<.00001?hue:this.hue+difference*blend
    this.saturation=Math.abs(saturation-this.saturation)<.00001?saturation:this.saturation+(saturation-this.saturation)*blend
    this.time=reduced?0:time
    this.panX=Math.sin(this.time*.052)*.012
    this.panY=(Math.cos(this.time*.043)-1)*.006
    this.rotation=Math.sin(this.time*.035)*.005
    this.zoom=1.055+Math.sin(this.time*.04)*.003
  }

  inspect(){return {hue:this.hue,saturation:this.saturation,time:this.time,panX:this.panX,panY:this.panY,rotation:this.rotation,zoom:this.zoom,color:this.color}}
}
