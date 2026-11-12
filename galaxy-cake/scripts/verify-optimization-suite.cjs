/* Serial GPU/browser checks against one immutable production build. */
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto')
const root=path.resolve(process.env.QA_OUTPUT||'../docs/qa-optimization-20261110/final'),url=(process.env.QA_URL||'http://localhost:4174').replace(/\/$/,''),file=path.join(root,'suite-results.json')
if(fs.existsSync(file))throw new Error('Choose a new QA_OUTPUT directory; historical evidence is never overwritten.')
fs.mkdirSync(root,{recursive:true})
const build=()=>crypto.createHash('sha256').update(fs.readFileSync('dist/index.html')).digest('hex'),fingerprint=build()
const report={startedAt:new Date().toISOString(),url,build:fingerprint,runs:[]},save=()=>fs.writeFileSync(file,JSON.stringify(report,null,2))
const tests=[['core','verify-browser.cjs'],['opening','verify-birthday-opening.cjs'],['heart','verify-heart-convoy.cjs'],['sky','verify-living-sky.cjs'],['stage-three','verify-stage-three.cjs'],...['seam','framing','accessibility','loading','mobile-modal','meta','visual'].map(task=>[task,'verify-optimization.cjs',task]),['catalog','verify-cake-catalog.cjs'],['layers','verify-layer-editor.cjs']]
for(const [name,script,task] of tests){
 if(process.env.QA_ONLY&&!process.env.QA_ONLY.split(',').includes(name))continue
 console.log('\nVERIFY',name)
 const startedAt=new Date().toISOString(),result=spawnSync(process.execPath,[path.join('scripts',script)],{stdio:'inherit',env:{...process.env,QA_URL:['core','layers'].includes(name)?url+'/?qa=1':url,QA_OUTPUT:path.join(root,name),QA_RECORD_VIDEO:'0',QA_TASK:task||''}})
 report.runs.push({name,script,startedAt,finishedAt:new Date().toISOString(),exit:result.status,error:result.error?.message});save()
 if(build()!==fingerprint)throw new Error('Production artifacts changed during QA; this suite is invalid.')
}
report.finishedAt=new Date().toISOString();report.passed=report.runs.every(r=>r.exit===0);save();if(!report.passed)process.exitCode=1
