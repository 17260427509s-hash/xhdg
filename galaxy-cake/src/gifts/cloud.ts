import { parseGift } from './draft'
import type { GiftPayload } from './draft'
import type { SupabaseClient } from '@supabase/supabase-js'

const projectUrl=(import.meta.env.VITE_SUPABASE_URL||'').replace(/\/$/,'')
const publicKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||''
export const cloudConfigured=Boolean(projectUrl&&publicKey&&!/YOUR_|PLACEHOLDER/i.test(projectUrl+publicKey))
export const giftIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
let client:Promise<SupabaseClient>|null=null
function getClient(){
  if(!cloudConfigured)throw new Error('云端分享尚未连接，请联系网站管理员。')
  if(publicKey.startsWith('sb_secret_'))throw new Error('分享服务配置有误，请联系网站管理员。')
  if(!client)client=import('@supabase/supabase-js').then(({createClient})=>createClient(projectUrl,publicKey,{
    auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'galaxy-cake:publisher:v1'},
    global:{fetch:(input,init)=>fetch(input,{...init,signal:init?.signal?AbortSignal.any([init.signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)})},
  }))
  return client
}
export function publicSiteUrl(){
  const raw=import.meta.env.VITE_PUBLIC_SITE_URL||location.origin
  const url=new URL(raw)
  if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||/^(localhost|127\.|\[::1\]|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname))throw new Error('当前是本机预览地址，连接正式网站后即可生成分享链接。')
  return url.origin
}
export async function publishGift(payload:GiftPayload):Promise<{id:string;url:string}> {
  const origin=publicSiteUrl(),supabase=await getClient()
  const {data:{session},error:sessionError}=await supabase.auth.getSession()
  if(sessionError)throw new Error('发布身份暂时无法恢复，请稍后重试。')
  if(!session){
    const {error}=await supabase.auth.signInAnonymously()
    if(error)throw new Error('暂时无法建立分享，请稍后重试。')
  }
  const {data,error}=await supabase.from('birthday_gifts').insert({payload:parseGift(payload)}).select('id').single()
  if(error||!data||!giftIdPattern.test(data.id))throw new Error(error?.code==='P0001'?'今天制作的礼物已达到上限，请明天再来。':'分享没有保存成功，请检查网络后重试。')
  return {id:data.id,url:`${origin}/birthday/${data.id}`}
}
export async function loadGift(id:string,signal?:AbortSignal):Promise<GiftPayload> {
  if(!giftIdPattern.test(id))throw new Error('这份礼物的链接不完整。')
  const supabase=await getClient()
  const query=supabase.rpc('read_birthday_gift',{gift_id:id})
  const {data,error}=await (signal?query.abortSignal(signal):query)
  if(error)throw new Error('暂时无法打开这份礼物，请检查网络后重试。')
  if(!data)throw new Error('这份礼物不存在，或已被发布者撤回。')
  return parseGift(data)
}
export async function revokeGift(id:string){
  const supabase=await getClient()
  const {data,error}=await supabase.from('birthday_gifts').delete().eq('id',id).select('id')
  if(error||data?.length!==1)throw new Error('未能撤回链接，请使用生成礼物时的浏览器重试。')
}
