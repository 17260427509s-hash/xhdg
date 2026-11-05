const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-visual-round-three-20261105/geometry');fs.mkdirSync(out,{recursive:true})
;(async()=>{
 const {createServer}=await import('vite'),{Vector3,Euler}=await import('three')
 const server=await createServer({configFile:false,root:process.cwd(),optimizeDeps:{noDiscovery:true,include:[],entries:[]},server:{middlewareMode:true},appType:'custom'})
 const report={testedAt:new Date().toISOString(),checks:{},orbits:[],flowers:[],geometries:[]}
 try{
  const {orbitPaths}=await server.ssrLoadModule('/src/utils/orbitLayout.ts'),{cakePresets}=await server.ssrLoadModule('/src/store/birthdayStore.ts'),{pastryMorph}=await server.ssrLoadModule('/src/three/pastryMorph.ts'),{creamFlowerGeometry}=await server.ssrLoadModule('/src/three/pastryGeometry.ts')
  assert.equal(orbitPaths.length,3)
  for(const [index,o] of orbitPaths.entries()){
   const rotation=new Euler(...o.rotation),point=new Vector3();let radius=Infinity
   for(let i=0;i<4096;i++){const a=i/4096*Math.PI*2;point.set(Math.cos(a)*o.r,0,Math.sin(a)*o.z).applyEuler(rotation);radius=Math.min(radius,Math.hypot(point.x,point.z))}
   // A conservative cylinder encloses every round/square/heart body and icing,
   // at every layer height, including an extra .02 for the orbit's bead radius.
   assert(radius-.061>1.56,`Orbit ${index} intersects the conservative cake cylinder`)
   report.orbits.push({index,minHorizontalRadius:radius,clearanceAfterLargestBead:radius-.061-1.56})
  }
  report.checks.threeOrbitsClearAllAssembledCakeSilhouettes=true
  for(const detail of [1,.75,.5]){
   const g=creamFlowerGeometry(detail),p=g.getAttribute('position'),n=g.getAttribute('normal'),rows=Math.round(64*detail),cols=Math.round(160*detail),row=Math.round(rows*.4),r=[]
   g.computeBoundingBox();const b=g.boundingBox,height=b.max.y-b.min.y,width=b.max.x-b.min.x;assert(height/width<.5)
   assert([...p.array,...n.array].every(Number.isFinite))
   for(let j=0;j<cols;j++)r.push(Math.hypot(p.getX(row*(cols+1)+j),p.getZ(row*(cols+1)+j)))
   const lobes=r.filter((v,i)=>v>r[(i+cols-1)%cols]&&v>=r[(i+1)%cols]).length;assert.equal(lobes,5)
   report.flowers.push({detail,height,width,lobes});g.dispose()
  }
  report.checks.fiveRoundedLowPetalsAtAllQualityLevels=true
  const counts={}
  for(const style of Object.keys(cakePresets))for(const shape of ['round','square','heart'])for(const kind of ['body','cream']){
   const g=pastryMorph(kind,'round',shape,'galaxy',style),p=g.getAttribute('position'),n=g.getAttribute('normal'),target=g.morphAttributes.position[0]
   assert.equal(target.count,p.count);assert.equal(g.morphAttributes.normal[0].count,n.count)
   assert([...p.array,...n.array,...target.array,...g.morphAttributes.normal[0].array].every(Number.isFinite))
   if(counts[kind])assert.equal(counts[kind],p.count);else counts[kind]=p.count
   report.geometries.push({style,shape,kind,vertices:p.count});g.dispose()
  }
  report.checks.twelveStylesThreeShapesKeepFiniteCompatibleMorphs=true
  const {budgets}=await server.ssrLoadModule('/src/experience/engine.ts')
  assert.deepEqual(Object.fromEntries(Object.entries(budgets).map(([k,v])=>[k,v.dpr])),{desktop:2,mobile:1.5,low:1})
  report.checks.qualityDprCapsPreserved=true
  console.log('VISUAL GEOMETRY PASSED',JSON.stringify(report.checks))
 }catch(e){report.failure=e.stack;throw e}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
