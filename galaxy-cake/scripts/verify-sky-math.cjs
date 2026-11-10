/* Independent comparison against the former Three.Color calculation. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{Color,SRGBColorSpace}=require('three')
;(async()=>{const {createServer}=await import('vite'),server=await createServer({server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'});try{
 const {GalaxyAppearance}=await server.ssrLoadModule('/src/utils/galaxyAppearance.ts'),store=await server.ssrLoadModule('/src/store/birthdayStore.ts'),motion=await server.ssrLoadModule('/src/utils/cakeTransition.ts')
 const configs=Object.keys(store.cakePresets).map(style=>store.normalizeConfig(store.defaultConfig,store.presetPatch(style))),baseline=new Color(store.cakePresets.galaxy.color).getHSL({h:0,s:0,l:0},SRGBColorSpace)
 let cases=0,maxHueError=0
 for(let i=0;i<configs.length;i++)for(let step=0;step<=20;step++){
  const from=configs[i],to=configs[(i+1)%configs.length],transition={from,to,progress:step/20,mode:'assembled'},t=motion.partProgress(transition,'body'),visual=motion.createVisualCake();motion.updateVisualCake(visual,motion.visualLayout(from),motion.visualLayout(to),to,t,0)
  const expected=new Color(0,0,0);let total=0
  for(let k=0;k<3;k++){const tier=visual.tiers[k],w=tier.width*tier.height*tier.active;if(w<.0001)continue;expected.add(new Color(store.layerAppearance(from,Math.min(k,from.cakeLayers-1)).cakeColor).lerp(new Color(store.layerAppearance(to,Math.min(k,to.cakeLayers-1)).cakeColor),t).multiplyScalar(w));total+=w}
  expected.multiplyScalar(1/total);const hsl=expected.getHSL({h:0,s:0,l:0},SRGBColorSpace),actual=new GalaxyAppearance();actual.update(to,transition,visual,0,1,true)
  assert.equal(actual.color,'#'+expected.getHexString());const hue=(hsl.h-baseline.h)*Math.PI*2,error=Math.abs(Math.atan2(Math.sin(actual.hue-hue),Math.cos(actual.hue-hue)));assert(error<1e-6);maxHueError=Math.max(maxHueError,error);cases++
 }
 const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-optimization-20261110/step04-loading');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'sky-math.json'),JSON.stringify({cases,maxHueError,passed:true},null,2));console.log('SKY MATH PASSED',cases,maxHueError)
 }finally{await server.close()}})().catch(e=>{console.error(e);process.exitCode=1})
