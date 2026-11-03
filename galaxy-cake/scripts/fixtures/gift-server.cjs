/* Test-only loopback Supabase protocol + real PostgreSQL RLS. No provider account,
   actual Supabase tokens, production data, or external requests. */
const http=require('node:http'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path')
const {PGlite}=require(path.resolve(__dirname,'../../../.qa-tools/node_modules/@electric-sql/pglite'))
exports.startFixture=async function(){
 const db=new PGlite(),tokens=new Map(),requests=[]
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`)
 await db.exec(fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/202611030001_birthday_gifts.sql'),'utf8'))
 let queue=Promise.resolve()
 const api=http.createServer((req,res)=>{
  const origin=req.headers.origin||''
  if(origin&&!['http://127.0.0.1:4174','http://localhost:4174'].includes(origin)){res.writeHead(403);res.end();return}
  res.setHeader('Access-Control-Allow-Origin',origin||'http://127.0.0.1:4174');res.setHeader('Vary','Origin')
  res.setHeader('Access-Control-Allow-Headers',req.headers['access-control-request-headers']||'apikey,authorization,content-type,prefer,x-client-info,x-supabase-api-version')
  res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS')
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
  const u=new URL(req.url,'http://127.0.0.1:4310')
  requests.push({method:req.method,path:u.pathname})
  let body=''
  req.on('data',chunk=>{body+=chunk;if(body.length>32768)req.destroy()})
  req.on('end',()=>{
   queue=queue.then(async()=>{
    const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value))}
    try{
     if(req.headers.apikey!=='local-protocol-test-key'){send(401,{message:'fixture key required'});return}
     const json=body?JSON.parse(body):{}
     if(u.pathname==='/auth/v1/signup'&&req.method==='POST'){
      const id=crypto.randomUUID(),now=Math.floor(Date.now()/1000)
      await db.exec('reset role');await db.query('insert into auth.users(id) values($1)',[id])
      const token=[{alg:'HS256',typ:'JWT'},{sub:id,aud:'authenticated',role:'authenticated',exp:now+3600,iat:now,is_anonymous:true}].map(value=>Buffer.from(JSON.stringify(value)).toString('base64url')).join('.')+'.'+crypto.randomBytes(32).toString('base64url')
      const user={id,aud:'authenticated',role:'authenticated',is_anonymous:true,app_metadata:{provider:'anonymous',providers:[]},user_metadata:{},created_at:new Date().toISOString()}
      tokens.set(token,{id,user});send(200,{access_token:token,refresh_token:crypto.randomUUID(),expires_in:3600,expires_at:now+3600,token_type:'bearer',user});return
     }
     const actor=tokens.get((req.headers.authorization||'').replace(/^Bearer /,''))
     if(u.pathname==='/auth/v1/user'){send(actor?200:401,actor?.user||{message:'not signed in'});return}
     await db.exec('reset role')
     await db.exec(`set role ${actor?'authenticated':'anon'};set request.jwt.claim.sub='${actor?.id||''}'`)
     if(u.pathname==='/rest/v1/birthday_gifts'&&req.method==='POST'){
      const data=Array.isArray(json)?json[0]:json
      const result=await db.query('insert into public.birthday_gifts(payload) values($1::jsonb) returning id',[JSON.stringify(data.payload)])
      send(201,result.rows[0]);return
     }
     if(u.pathname==='/rest/v1/rpc/read_birthday_gift'&&req.method==='POST'){
      const result=await db.query('select public.read_birthday_gift($1) as gift',[json.gift_id]);send(200,result.rows[0].gift);return
     }
     if(u.pathname==='/rest/v1/birthday_gifts'&&req.method==='DELETE'){
      const result=await db.query('delete from public.birthday_gifts where id=$1 returning id',[(u.searchParams.get('id')||'').replace(/^eq\./,'')]);send(200,result.rows);return
     }
     send(404,{message:'unhandled local fixture endpoint'})
    }catch(error){send(error.code==='42501'?403:400,{code:error.code||'fixture_error',message:error.message})}
   }).catch(error=>{if(!res.headersSent)res.writeHead(500);res.end(JSON.stringify({message:String(error)}))})
  })
 })
 const root=path.resolve(__dirname,'../../../.qa-tools/cloud-fixture')
 const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.wav':'audio/wav','.png':'image/png','.svg':'image/svg+xml'}
 const site=http.createServer((req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1:4174').pathname)
   let filename=path.resolve(root,'.'+pathname)
   if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename)||fs.statSync(filename).isDirectory())filename=path.join(root,'index.html')
   res.writeHead(200,{'Content-Type':mime[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(filename).pipe(res)
  }catch{res.writeHead(500);res.end('Local test fixture unavailable')}
 })
 await new Promise((resolve,reject)=>{api.once('error',reject);api.listen(4310,'127.0.0.1',resolve)})
 await new Promise((resolve,reject)=>{site.once('error',reject);site.listen(4174,'127.0.0.1',resolve)})
 return {requests,close:async()=>{await Promise.all([new Promise(resolve=>api.close(resolve)),new Promise(resolve=>site.close(resolve))]);await queue;await db.close()}}
}
