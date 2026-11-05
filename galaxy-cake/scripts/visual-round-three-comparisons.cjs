/* Assemble honest screenshot comparisons; never synthesize or repaint model pixels. */
const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path')
const base=path.resolve('../docs/qa-visual-round-three-20261105'),before=path.join(base,'before'),after=path.resolve(process.env.QA_AFTER||path.join(base,'suite-centered/final')),out=path.join(base,'comparisons')
fs.mkdirSync(out,{recursive:true})
const heading=(text,width,height=42)=>Buffer.from(`<svg width="${width}" height="${height}"><rect width="100%" height="100%" fill="#13101c"/><text x="20" y="28" fill="#eadff7" font-size="17" font-family="Microsoft YaHei, sans-serif">${text}</text></svg>`)
async function pair(file,source,width,crop){
 const target=path.join(out,file+'.webp');if(fs.existsSync(target))throw new Error('Comparison already exists: '+target)
 const data=await Promise.all([before,after].map(async folder=>{let img=sharp(path.join(folder,source+'.webp'));if(crop)img=img.extract(crop);return img.resize({width}).png().toBuffer()}))
 const height=(await sharp(data[0]).metadata()).height
 await sharp({create:{width:width*2,height:height+42,channels:3,background:'#08070e'}}).composite([{input:heading('修改前 · 本轮现场截图',width),left:0,top:0},{input:heading('修改后 · 本轮实际渲染',width),left:width,top:0},{input:data[0],left:0,top:42},{input:data[1],left:width,top:42}]).webp({quality:95}).toFile(target)
}
;(async()=>{
 await pair('desktop-before-after','desktop-default',900)
 await pair('mobile-sheet-before-after','mobile-375-cake-panel',375)
 await pair('opening-before-after','opening-390',390)
 await pair('cream-before-after','desktop-default',500,{left:535,top:318,width:520,height:200})
 await pair('fruit-before-after','preset-strawberry',500,{left:555,top:302,width:480,height:180})
 const sheets=await Promise.all([before,after].map(folder=>sharp(path.join(folder,'twelve-cakes.webp')).png().toBuffer()))
 await sharp({create:{width:1600,height:2040,channels:3,background:'#08070e'}}).composite([{input:heading('修改前 · 12 款默认组合',1600),left:0,top:0},{input:sheets[0],left:0,top:42},{input:heading('修改后 · 12 款默认组合',1600),left:0,top:1020},{input:sheets[1],left:0,top:1062}]).webp({quality:95}).toFile(path.join(out,'twelve-before-after.webp'))
 console.log('Saved screenshot comparisons to '+out)
})().catch(e=>{console.error(e);process.exitCode=1})
