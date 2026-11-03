import type { ExperienceEngine } from '../experience/engine'
import type { BirthdayConfig } from '../store/birthdayStore'
import { recipientName } from '../store/birthdayStore'

function lines(ctx:CanvasRenderingContext2D,text:string,width:number){
  const result:string[]=[]
  for(const paragraph of text.split('\n')){
    let line=''
    for(const char of Array.from(paragraph)){
      if(line&&ctx.measureText(line+char).width>width){result.push(line);line=char}else line+=char
    }
    result.push(line)
  }
  return result
}
function blob(canvas:HTMLCanvasElement){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('图片导出失败，请重试。')),'image/png'))}
export async function exportImage(engine:ExperienceEngine,kind:'scene'|'card',shareUrl?:string):Promise<Blob>{
  if(!engine.captureScene)throw new Error('画面还没有准备好，请稍候。')
  const config:BirthdayConfig=structuredClone(engine.snapshot.config),phase=engine.snapshot.phase
  const scene=await engine.captureScene(3200),image=await createImageBitmap(scene)
  try {
    const canvas=document.createElement('canvas');canvas.width=kind==='card'?1200:image.width;canvas.height=kind==='card'?1800:image.height
    const ctx=canvas.getContext('2d')
    if(!ctx)throw new Error('当前浏览器无法生成图片。')
    ctx.fillStyle='#050507';ctx.fillRect(0,0,canvas.width,canvas.height)
    const name=recipientName(config)
    if(kind==='scene'){
      ctx.drawImage(image,0,0);ctx.textAlign='center';ctx.fillStyle='#f0e6ff';ctx.font=`300 ${Math.round(canvas.width*.018+14)}px "Microsoft YaHei",sans-serif`
      ctx.fillText(`给 ${name}`,canvas.width/2,canvas.height*.065,canvas.width*.85)
      if(phase==='message'){
        ctx.font=`italic ${canvas.width*.042}px Georgia,serif`;ctx.fillStyle='#fff1dc';ctx.fillText('Happy Birthday',canvas.width/2,canvas.height*.14)
        ctx.font=`${canvas.width*.017+5}px "Microsoft YaHei",sans-serif`
        lines(ctx,config.message,canvas.width*.75).slice(0,5).forEach((line,i)=>ctx.fillText(line,canvas.width/2,canvas.height*.19+i*canvas.width*.025))
      }
      return await blob(canvas)
    }
    ctx.textAlign='center';ctx.fillStyle='#bfa6ef';ctx.font='italic 35px Georgia,serif';ctx.fillText('Happy Birthday',600,68)
    ctx.fillStyle='#fff0e2';ctx.font='300 54px "Microsoft YaHei",sans-serif'
    lines(ctx,`给 ${name}`,1040).slice(0,2).forEach((line,i)=>ctx.fillText(line,600,145+i*67))
    if(image.width>=image.height){const crop=Math.min(image.width,image.height*1.12);ctx.drawImage(image,(image.width-crop)/2,0,crop,image.height,40,240,1120,1000)}
    else {const h=1000,w=h*image.width/image.height;ctx.drawImage(image,(1200-w)/2,240,w,h)}
    const fade=ctx.createLinearGradient(0,1110,0,1250);fade.addColorStop(0,'#05050700');fade.addColorStop(1,'#050507');ctx.fillStyle=fade;ctx.fillRect(0,1110,1200,140)
    ctx.font='28px "Microsoft YaHei",sans-serif';ctx.fillStyle='#e3d5ef';ctx.textAlign='left'
    const wish=lines(ctx,config.message.trim()||'愿新的一岁，继续闪闪发光。',1020)
    wish.slice(0,9).forEach((line,i)=>ctx.fillText(line,90,1260+i*35))
    ctx.fillStyle='#b7a3ca';ctx.font='25px "Microsoft YaHei",sans-serif'
    if(config.sender.trim())ctx.fillText(`来自 ${config.sender.trim()}`,90,1650,740)
    if(config.birthday)ctx.fillText(config.birthday.replaceAll('-','.'),90,1695)
    if(shareUrl){
      const QRCode=await import('qrcode'),qr=document.createElement('canvas')
      await QRCode.toCanvas(qr,shareUrl,{width:224,margin:4,errorCorrectionLevel:'M',color:{dark:'#21132f',light:'#fff4ed'}})
      ctx.drawImage(qr,886,1510,224,224);ctx.textAlign='center';ctx.fillStyle='#b7a3ca';ctx.font='20px "Microsoft YaHei",sans-serif';ctx.fillText('扫码打开生日星河',998,1763)
    }else {ctx.fillStyle='#80708d';ctx.font='22px "Microsoft YaHei",sans-serif';ctx.fillText('愿每一份心意，都如星光抵达。',90,1752)}
    return await blob(canvas)
  }finally {image.close()}
}
export function downloadImage(value:Blob,filename:string){
  const url=URL.createObjectURL(value),a=document.createElement('a');a.href=url;a.download=filename;a.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
