/* Sequential GPU runs keep frame timings independent and preserve previous QA. */
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path')
const root=process.env.QA_URL||'http://localhost:4174',out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-visual-round-three-20261105/suite')
const tasks=[
 ['final','verify-visual-round-three.cjs'],['decoration-faces','verify-decoration-faces.cjs'],
 ['catalog','verify-cake-catalog.cjs'],['layers','verify-layer-editor.cjs',true],
 ['heart','verify-heart-convoy.cjs'],['stage-three','verify-stage-three.cjs'],
 ['core','verify-browser.cjs',true],['geometry','verify-visual-geometry.cjs'],['catalog-data','verify-catalog-data.cjs'],
].filter(([name])=>!process.env.QA_TESTS||process.env.QA_TESTS.split(',').includes(name))
fs.mkdirSync(out,{recursive:true});const file=path.join(out,'suite-results.json')
if(fs.existsSync(file))throw new Error('Choose a new QA_OUTPUT: this evidence directory already contains a suite result.')
const report={startedAt:new Date().toISOString(),url:root,runs:[]}
for(const [name,script,query] of tasks){
 console.log('Running '+name+' on the production build')
 const start=Date.now(),r=spawnSync(process.execPath,[path.join(__dirname,script)],{env:{...process.env,QA_URL:query?root+'/?qa=1':root,QA_OUTPUT:path.join(out,name)},stdio:'inherit'})
 report.runs.push({name,script,exitCode:r.status,seconds:Math.round((Date.now()-start)/1000)})
 fs.writeFileSync(file,JSON.stringify(report,null,2));if(r.status!==0)process.exitCode=1
}
report.finishedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(report,null,2))
console.log('Suite finished',JSON.stringify(report.runs))
