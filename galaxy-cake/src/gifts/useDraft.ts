import { useCallback, useEffect, useRef, useState } from 'react'
import type { GiftPayload } from './draft'
import { saveDraft } from './draft'

export function useDraft(gift:GiftPayload,enabled:boolean,initialWarning='') {
  const current=useRef(gift);current.current=gift
  const first=useRef(gift)
  const [status,setStatus]=useState(initialWarning||'草稿会保存在此设备')
  const flush=useCallback(()=>{
    if(!enabled)return false
    try {saveDraft(current.current);setStatus('已保存在此设备');return true}
    catch {setStatus('本机存储不可用，请先导出图片，避免丢失。');return false}
  },[enabled])
  useEffect(()=>{
    if(!enabled||initialWarning&&gift.config===first.current.config&&gift.musicEnabled===first.current.musicEnabled)return
    const timer=window.setTimeout(flush,350)
    return()=>clearTimeout(timer)
  },[gift.config,gift.musicEnabled,enabled,flush,initialWarning])
  useEffect(()=>{
    if(!enabled)return
    const onHide=()=>{
      if(initialWarning&&current.current.config===first.current.config&&current.current.musicEnabled===first.current.musicEnabled)return
      try{saveDraft(current.current)}catch{/* Keep UI storage error recoverable. */}
    }
    window.addEventListener('pagehide',onHide)
    return()=>window.removeEventListener('pagehide',onHide)
  },[enabled,initialWarning])
  return {status,flush}
}
