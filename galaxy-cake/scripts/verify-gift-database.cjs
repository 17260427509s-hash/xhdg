/* Real PostgreSQL (PGlite/WASM) policy tests; no cloud project or credentials.
   pnpm add --dir ../.qa-tools @electric-sql/pglite
   node scripts/verify-gift-database.cjs
*/
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict')
const {PGlite}=require(path.resolve(__dirname,'../../.qa-tools/node_modules/@electric-sql/pglite'))
const out=path.resolve(process.env.QA_OUTPUT||'../docs/qa-stage-three-database')
fs.mkdirSync(out,{recursive:true})
const report={testedAt:new Date().toISOString(),backend:'PGlite PostgreSQL, isolated in-memory database; Supabase auth.uid is emulated; not a live Supabase project',checks:{}}
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222'
const payload={version:1,musicEnabled:true,config:{cakeStyle:'galaxy',cakeShape:'round',cakeLayers:1,cakeColor:'#3d4192',layerOverrides:{},recipient:'数据库测试',birthday:'2030-11-20',age:22,sender:'测试发送人',message:'愿新的一岁继续闪闪发光。',candleType:'regular',flameEnabled:true,galaxyEnabled:true,galaxyTheme:'dream',galaxyCount:300,galaxySpeed:1}}
const db=new PGlite()
async function role(name,id=''){await db.exec(`reset role;set role ${name};set request.jwt.claim.sub='${id}'`)}
async function denied(action,code){let rejected=false;try{await action()}catch(e){rejected=true;if(code)assert.equal(e.code,code)}assert(rejected,'Expected database rejection')}
;(async()=>{
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`)
 await db.exec(fs.readFileSync(path.resolve(__dirname,'../supabase/migrations/202611030001_birthday_gifts.sql'),'utf8'))
 report.checks.migrationApplies=true
 await role('authenticated',a)
 const inserted=await db.query('insert into public.birthday_gifts(payload) values($1::jsonb) returning id,created_by',[JSON.stringify(payload)])
 const id=inserted.rows[0].id;assert.equal(inserted.rows[0].created_by,a)
 assert.equal((await db.query('select count(*)::int as n from public.birthday_gifts')).rows[0].n,1)
 report.checks.ownerCreateAndRead=true
 await role('authenticated',b)
 assert.equal((await db.query('select * from public.birthday_gifts')).rows.length,0)
 assert.equal((await db.query('delete from public.birthday_gifts where id=$1 returning id',[id])).rows.length,0)
 await denied(()=>db.query('insert into public.birthday_gifts(created_by,payload) values($1,$2::jsonb)',[a,JSON.stringify(payload)]),'42501')
 report.checks.otherOwnerCannotListDeleteOrForge=true
 await denied(()=>db.query('update public.birthday_gifts set payload=$1::jsonb where id=$2',[JSON.stringify(payload),id]),'42501')
 report.checks.publishedSnapshotImmutable=true
 await role('anon')
 await denied(()=>db.query('select * from public.birthday_gifts'),'42501')
 await denied(()=>db.query('insert into public.birthday_gifts(payload) values($1::jsonb)',[JSON.stringify(payload)]),'42501')
 const publicRead=(await db.query('select public.read_birthday_gift($1) as gift',[id])).rows[0].gift
 assert.deepEqual(publicRead,payload);assert(!JSON.stringify(publicRead).includes(a))
 assert.equal((await db.query('select public.read_birthday_gift($1) as gift',['33333333-3333-4333-8333-333333333333'])).rows[0].gift,null)
 report.checks.publicKnownIdReadWithoutListOrOwnerData=true
 await role('authenticated',a)
 const malformed=[{...payload,extra:'discard me'},{...payload,musicEnabled:'true'},{...payload,config:{...payload.config,cakeStyle:'constructor'}},{...payload,config:{...payload.config,birthday:'2030-99-99'}},{...payload,config:{...payload.config,age:121}},{...payload,config:{...payload.config,recipient:'星'.repeat(25)}},{...payload,config:{...payload.config,message:'星'.repeat(301)}},{...payload,config:{...payload.config,layerOverrides:{2:{cakeColor:'#ff0000'}}}},{...payload,config:{...payload.config,layerOverrides:{0:{creamColor:'red'}}}},{...payload,config:{...payload.config,privateKey:'not allowed'}}]
 for(const invalid of malformed)await denied(()=>db.query('insert into public.birthday_gifts(payload) values($1::jsonb)',[JSON.stringify(invalid)]),'23514')
 report.checks.malformedPayloadsRejected=true
 const custom={...payload,config:{...payload.config,cakeLayers:3,layerOverrides:{0:{shape:'heart',cakeColor:'#7793cb',creamColor:'#fff0ed',decoration:'none'},1:{shape:'square',decoration:'strawberry'},2:{decoration:'purple'}}}}
 await db.query('insert into public.birthday_gifts(payload,created_at) values($1::jsonb,$2)',[JSON.stringify(custom),'1970-01-01T00:00:00Z'])
 report.checks.layerOverridesAccepted=true
 for(let i=0;i<18;i++)await db.query('insert into public.birthday_gifts(payload) values($1::jsonb)',[JSON.stringify(payload)])
 await denied(()=>db.query('insert into public.birthday_gifts(payload) values($1::jsonb)',[JSON.stringify(payload)]),'P0001')
 report.checks.ownerQuotaAndTimestampCannotBeBypassed=true
 await db.query('delete from public.birthday_gifts where id=$1',[id])
 await role('anon');assert.equal((await db.query('select public.read_birthday_gift($1) as gift',[id])).rows[0].gift,null)
 report.checks.revokedLinkStopsReading=true
 await db.close();fs.writeFileSync(path.join(out,'database-results.json'),JSON.stringify(report,null,2));console.log('DATABASE POLICIES PASSED',report.checks)
})().catch(async e=>{report.failure=e.stack;fs.writeFileSync(path.join(out,'database-results.json'),JSON.stringify(report,null,2));console.error(e);await db.close();process.exitCode=1})
