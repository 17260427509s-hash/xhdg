import { defineConfig, loadEnv } from 'vite'
import { Buffer } from 'node:buffer'
import { cwd } from 'node:process'
import react from '@vitejs/plugin-react'
export default defineConfig(({mode})=>{
  const key=loadEnv(mode,cwd(),'VITE_').VITE_SUPABASE_PUBLISHABLE_KEY||''
  let privateKey=key.startsWith('sb_secret_')
  try{privateKey=privateKey||JSON.parse(Buffer.from(key.split('.')[1]||'','base64url').toString()).role==='service_role'}catch{/* Publishable keys are not JWTs. */}
  if(privateKey)throw new Error('Never put Supabase secret/service_role keys in VITE_ environment variables.')
  return {plugins:[react()],optimizeDeps:{include:['@supabase/supabase-js','qrcode']},server:{port:5173,strictPort:true},preview:{port:4173,strictPort:true},build:{rollupOptions:{output:{onlyExplicitManualChunks:true,manualChunks(id){
    const path=id.replaceAll('\\','/')
    if(/\/node_modules\/(react|react-dom|scheduler)\//.test(path)||path.includes('vite/preload-helper'))return 'ui'
    if(path.includes('/node_modules/three/'))return 'three'
    if(path.includes('/node_modules/@react-three/')||path.includes('/node_modules/postprocessing/')||path.includes('/node_modules/n8ao/'))return 'renderer'
  }}}}}
})
