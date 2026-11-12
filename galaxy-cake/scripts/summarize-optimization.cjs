/* Build comparison artifacts from actual browser captures; never synthesize UI. */
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp')
const base=path.resolve('../docs/qa-optimization-20261110'),latest=path.resolve(process.env.QA_INPUT||path.join(base,'final-recheck-20261112')),out=path.join(base,'delivery')
fs.mkdirSync(out,{recursive:true})
const label=(width,text)=>Buffer.from(`<svg width="${width}" height="28"><rect width="100%" height="100%" fill="#101019"/><text x="16" y="19" fill="#eee5ff" font-family="Arial,sans-serif" font-size="13">${text}</text></svg>`)
async function compare(name,before,after,width,height){
 const buffers=await Promise.all([before,after].map(file=>sharp(file).resize(width,height,{fit:'contain',background:'#050507'}).toBuffer()))
 await sharp({create:{width:width*2,height:height+28,channels:3,background:'#050507'}}).composite([{input:label(width,'BEFORE 141d579'),left:0,top:0},{input:label(width,'AFTER 06eb345'),left:width,top:0},{input:buffers[0],left:0,top:28},{input:buffers[1],left:width,top:28}]).webp({quality:94}).toFile(path.join(out,name+'.webp'))
}
;(async()=>{
 await compare('desktop-before-after',path.join(base,'before/optimization-plan-idle-1440.png'),path.join(latest,'visual/visual-1440-idle.webp'),720,450)
 await compare('mobile-before-after',path.join(base,'before/optimization-plan-idle-390.png'),path.join(latest,'visual/visual-390-idle.webp'),390,844)
 await compare('celebration-before-after',path.join(base,'before/optimization-plan-celebration-390.png'),path.join(base,'composition-recheck-20261112-r2/seam/seam-390-celebration.webp'),390,844)
 const report={source:latest,generatedAt:new Date().toISOString(),images:['desktop-before-after.webp','mobile-before-after.webp','celebration-before-after.webp'],note:'Actual browser screenshots. Idle before/after are captured after entry and pause; automatic orbit elapsed time can vary slightly. Celebration phase is approximately 3.7 seconds. No concept image is used as a rendered result.'}
 fs.writeFileSync(path.join(out,'comparison-sources.json'),JSON.stringify(report,null,2));console.log('Comparison artifacts saved',out)
})().catch(e=>{console.error(e);process.exitCode=1})
