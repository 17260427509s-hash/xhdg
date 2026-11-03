import { useEffect, useState } from 'react'
import { BirthdayExperience } from './components/BirthdayExperience'
import { readDraft } from './gifts/draft'
import type { GiftPayload } from './gifts/draft'
import { loadGift } from './gifts/cloud'

function SharedGift({id}:{id:string}){
  const [gift,setGift]=useState<GiftPayload|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
  useEffect(()=>{
    const abort=new AbortController();setError('')
    loadGift(id,abort.signal).then(value=>{if(!abort.signal.aborted)setGift(value)}).catch(reason=>{if(!abort.signal.aborted)setError(reason instanceof Error?reason.message:'暂时无法打开礼物。')})
    return()=>abort.abort()
  },[id,attempt])
  if(gift)return <BirthdayExperience initialGift={gift} readOnly/>
  return <main className="route-state"><span aria-hidden="true">✧</span><h1>{error?'星河暂时没有抵达':'正在打开这份生日星河'}</h1><p role={error?'alert':'status'}>{error||'请稍候，属于你的惊喜正在路上。'}</p>{error?<button className="primary" onClick={()=>setAttempt(n=>n+1)}>重新尝试</button>:null}</main>
}
export default function App(){
  const [saved]=useState(readDraft),path=location.pathname.replace(/\/$/,'')||'/'
  if(path.startsWith('/birthday/'))return <SharedGift id={path.slice(10)}/>
  if(path==='/preview')return <BirthdayExperience initialGift={saved.draft??undefined} readOnly preview/>
  if(path==='/'||path==='/create')return <BirthdayExperience initialGift={saved.draft??undefined} draftWarning={saved.warning}/>
  return <main className="route-state"><h1>这片星河还没有故事</h1><a className="primary" href="/create">制作生日礼物</a></main>
}
