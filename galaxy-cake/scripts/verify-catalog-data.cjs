const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-cake-catalog-20261105');fs.mkdirSync(out,{recursive:true})
;(async()=>{
 const {createServer}=await import('vite'),server=await createServer({configFile:false,root:process.cwd(),optimizeDeps:{noDiscovery:true,include:[],entries:[]},server:{middlewareMode:true},appType:'custom'})
 try{
 const data=await server.ssrLoadModule('/src/store/birthdayStore.ts'),catalog=await server.ssrLoadModule('/src/store/decorationCatalog.ts'),layouts=await server.ssrLoadModule('/src/utils/decorationLayout.ts'),models=await server.ssrLoadModule('/src/three/decorationModels.ts')
 const {cakePresets,defaultConfig,normalizeConfig,layerAppearance,presetPatch}=data
 const report={testedAt:new Date().toISOString(),checks:{},layouts:[],fixtures:[]}
 assert.equal(Object.keys(cakePresets).length,12);assert.equal(catalog.decorationTypes.length,16)
 for(const style of Object.keys(cakePresets)){
  const config=normalizeConfig(defaultConfig,presetPatch(style))
  for(const tier of ['desktop','mobile','low'])for(let i=0;i<config.cakeLayers;i++){
   const placed=layouts.decorationLayout(config,i,tier);assert(placed.length<=({desktop:16,mobile:12,low:8}[tier]))
   assert.deepEqual(layouts.decorationLayout(config,i,tier),placed)
   for(let j=0;j<placed.length;j++)for(let k=j+1;k<placed.length;k++)assert(Math.hypot(placed[j].x-placed[k].x,placed[j].z-placed[k].z)>placed[j].radius+placed[k].radius)
   if(i===config.cakeLayers-1)for(const type of layerAppearance(config,i).decorations)assert(placed.some(p=>p.type===type),style+' missing default '+type)
   report.layouts.push({style,tier,index:i,placed})
  }
 }
 report.checks.twelvePresetsDefaultPiecesCapsAndDeterministicLayout=true
 for(const type of catalog.decorationTypes){
  const config=normalizeConfig(defaultConfig,{layerOverrides:{0:{decorations:[type]}}}),placed=layouts.decorationLayout(config,0,'desktop')
  assert(placed.some(p=>p.type===type),'Unplaceable '+type)
  const model=models.getDecorationModel(type);assert(model.length>0)
  for(const part of model){
   const p=part.geometry.getAttribute('position'),n=part.geometry.getAttribute('normal'),indices=part.geometry.index;assert(p.count>20);assert([...p.array].every(Number.isFinite))
   for(let i=0;i<(indices?indices.count:p.count);i+=3){
    const a=indices?indices.getX(i):i,b=indices?indices.getX(i+1):i+1,c=indices?indices.getX(i+2):i+2
    const ux=p.getX(b)-p.getX(a),uy=p.getY(b)-p.getY(a),uz=p.getZ(b)-p.getZ(a),vx=p.getX(c)-p.getX(a),vy=p.getY(c)-p.getY(a),vz=p.getZ(c)-p.getZ(a)
    const dot=(uy*vz-uz*vy)*(n.getX(a)+n.getX(b)+n.getX(c))+(uz*vx-ux*vz)*(n.getY(a)+n.getY(b)+n.getY(c))+(ux*vy-uy*vx)*(n.getZ(a)+n.getZ(b)+n.getZ(c))
    assert(dot>=-1e-8,type+' has inside-out mirrored faces')
   }
  }
 }
 report.checks.allSixteenHaveFinite3dGeometryAndCanBePlaced=true
 for(const style of ['galaxy','purple','cream']){
  const config=normalizeConfig(defaultConfig,{...presetPatch(style),cakeLayers:3,layerOverrides:{0:{decorations:['stars','blueberry','pearls']}}})
  const placed=layouts.decorationLayout(config,0,'desktop');for(const type of ['stars','blueberry','pearls'])assert(placed.some(p=>p.type===type),'Lower rim missing '+type)
 }
 for(const style of ['rainbow','moon'])for(const age of [0,22,120]){
  const config=normalizeConfig(defaultConfig,{...presetPatch(style),candleType:'number',age})
  assert(layouts.decorationLayout(config,config.cakeLayers-1,'desktop').some(p=>catalog.decorationCatalog[p.type].hero),'Number candle hides hero')
 }
 report.checks.lowerRimMixAndNumberCandles=true
 for(const [legacy,mapped] of Object.entries(catalog.legacyDecorations)){
  const config=normalizeConfig(defaultConfig,{layerOverrides:{0:{decoration:legacy}}});assert.deepEqual(layerAppearance(config,0).decorations,mapped)
 }
 const cleared=normalizeConfig(defaultConfig,{layerOverrides:{0:{decoration:'strawberry',decorations:[]}}});assert.deepEqual(layerAppearance(cleared,0).decorations,[])
 report.checks.legacyMappingsAndExplicitEmptyPriority=true
 const invalid=normalizeConfig(defaultConfig,{cakeLayers:2,layerOverrides:{0:{decorations:['crown','strawberry','strawberry','bad','pearls'],decorationSeed:-3},1:{decorations:['crescent','crown','rainbow','stars']}}})
 assert.deepEqual(invalid.layerOverrides[0].decorations,['strawberry','pearls']);assert.equal(invalid.layerOverrides[0].decorationSeed,undefined);assert.deepEqual(invalid.layerOverrides[1].decorations,['crescent','stars'])
 report.checks.invalidDuplicatesLowerHeroesAndOverflowNormalized=true
 for(const config of [defaultConfig,normalizeConfig(defaultConfig,{layerOverrides:{0:{decoration:'strawberry'}}}),normalizeConfig(defaultConfig,presetPatch('rainbow')),normalizeConfig(defaultConfig,{layerOverrides:{0:{decorations:['crown','cherry','chocolate'],decorationDensity:'rich',decorationColor:'#b5a1df',decorationSeed:2026}}}),cleared])report.fixtures.push({valid:true,payload:{version:1,config,musicEnabled:true}})
 const bad=JSON.parse(JSON.stringify(report.fixtures[3].payload));bad.config.layerOverrides[0].decorations=['crown','crescent'];report.fixtures.push({valid:false,payload:bad})
 fs.writeFileSync(path.join(out,'payload-fixtures.json'),JSON.stringify(report.fixtures,null,2))
 const sql='-- Run only in an independent test project after both migrations.\nbegin;\ndo $$ begin\n'+report.fixtures.map((f,i)=>`  if public.valid_birthday_payload($payload$${JSON.stringify(f.payload)}$payload$::jsonb) is distinct from ${f.valid} then raise exception 'catalog fixture ${i} failed'; end if;`).join('\n')+'\nend $$;\nrollback;\n'
 fs.writeFileSync(path.join(out,'payload-fixtures.sql'),sql)
 fs.writeFileSync(path.join(out,'data-results.json'),JSON.stringify(report,null,2));console.log('CATALOG DATA PASSED',JSON.stringify(report.checks))
 }finally{await server.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
