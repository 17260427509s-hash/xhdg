/* Optional asset regeneration using the existing QA Sharp installation.
   Runtime and pnpm build consume the committed assets without Sharp. */
const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path')
;(async()=>{
 const root=path.resolve('public'),icons=path.join(root,'icons'),share=path.join(root,'share');fs.mkdirSync(icons,{recursive:true});fs.mkdirSync(share,{recursive:true})
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="space" x2="1" y2="1"><stop stop-color="#21142f"/><stop offset="1" stop-color="#09070d"/></linearGradient><linearGradient id="cake" x2="0" y2="1"><stop stop-color="#cbb7ee"/><stop offset="1" stop-color="#71649c"/></linearGradient></defs><rect width="512" height="512" rx="108" fill="url(#space)"/><ellipse cx="256" cy="349" rx="174" ry="49" fill="none" stroke="#d2b6f0" stroke-width="7" transform="rotate(-14 256 349)"/><rect x="142" y="239" width="228" height="119" rx="34" fill="url(#cake)"/><path d="M142 258Q142 229 171 229H341Q370 229 370 258V273Q358 294 345 269Q332 261 322 277Q306 300 292 273Q280 259 267 277Q252 297 238 273Q225 259 212 276Q194 296 181 271Q166 260 152 277Z" fill="#fff0da"/><rect x="245" y="160" width="22" height="76" rx="7" fill="#efc789"/><path d="M256 91C228 126 237 153 256 153C278 153 280 131 256 91Z" fill="#ffe4a0"/><circle cx="135" cy="174" r="6" fill="#c8b4ea"/><circle cx="386" cy="201" r="5" fill="#efcc90"/><path d="M367 105L372 122L389 127L372 132L367 149L362 132L345 127L362 122Z" fill="#d9c2ef"/></svg>'
 fs.writeFileSync(path.join(icons,'cake.svg'),svg)
 for(const [size,name] of [[32,'favicon-32.png'],[180,'apple-touch-icon.png'],[192,'icon-192.png'],[512,'icon-512.png']])await sharp(Buffer.from(svg)).resize(size,size).png().toFile(path.join(icons,name))
 const source=process.env.SHARE_SOURCE||'../docs/qa-optimization-20261110/merge-final-visual/visual-1440-idle.webp'
 await sharp(source).extract({left:100,top:80,width:1240,height:651}).resize(1200,630).jpeg({quality:90,mozjpeg:true}).toFile(path.join(share,'galaxy-cake.jpg'))
 fs.writeFileSync(path.join(root,'site.webmanifest'),JSON.stringify({name:'星河生日蛋糕',short_name:'星河蛋糕',lang:'zh-CN',start_url:'/create',display:'standalone',background_color:'#050507',theme_color:'#050507',icons:[{src:'/icons/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icons/icon-512.png',sizes:'512x512',type:'image/png'}]},null,2))
 console.log('Share image and original cake icons generated')
})().catch(e=>{console.error(e);process.exitCode=1})
