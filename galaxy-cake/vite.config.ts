import { defineConfig, loadEnv } from 'vite'
import { Buffer } from 'node:buffer'
import { cwd } from 'node:process'
import react from '@vitejs/plugin-react'
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,cwd(),'VITE_'),key=env.VITE_SUPABASE_PUBLISHABLE_KEY||''
  let origin=''
  try{const value=env.VITE_PUBLIC_SITE_URL||'',url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password&&url.pathname==='/'&&!/YOUR_|PLACEHOLDER/i.test(value))origin=url.origin}catch{/* Local builds deliberately keep relative preview URLs. */}
  const title='星河生日蛋糕 · 一份专属的生日惊喜',description='让祝福汇成爱心，点亮立体生日蛋糕，在星河里许愿。'
  const preview={
    'og:title':title,'og:description':description,'og:type':'website','og:locale':'zh_CN','og:url':origin+'/',
    'og:image':origin+'/share/galaxy-cake.jpg','og:image:width':'1200','og:image:height':'630','og:image:alt':'星河中的立体生日蛋糕与温暖烛光',
    'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':origin+'/share/galaxy-cake.jpg','twitter:image:alt':'星河中的立体生日蛋糕与温暖烛光',
  }
  let privateKey=key.startsWith('sb_secret_')
  try{privateKey=privateKey||JSON.parse(Buffer.from(key.split('.')[1]||'','base64url').toString()).role==='service_role'}catch{/* Publishable keys are not JWTs. */}
  if(privateKey)throw new Error('Never put Supabase secret/service_role keys in VITE_ environment variables.')
  return {plugins:[react(),{name:'generic-share-preview',transformIndexHtml(){return Object.entries(preview).map(([name,content])=>({tag:'meta',attrs:{[name.startsWith('og:')?'property':'name']:name,content},injectTo:'head' as const}))}}],optimizeDeps:{include:['@supabase/supabase-js','qrcode']},server:{port:5173,strictPort:true},preview:{port:4173,strictPort:true},build:{rollupOptions:{output:{onlyExplicitManualChunks:true,manualChunks(id){
    const path=id.replaceAll('\\','/')
    if(/\/node_modules\/(react|react-dom|scheduler)\//.test(path)||path.includes('vite/preload-helper'))return 'ui'
    if(path.includes('/node_modules/three/'))return 'three'
    if(path.includes('/node_modules/@react-three/')||path.includes('/node_modules/postprocessing/')||path.includes('/node_modules/n8ao/'))return 'renderer'
  }}}}}
})
