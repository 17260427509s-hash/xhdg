import { useCallback, useEffect, useRef, useState } from 'react'

export function useMusic(initialEnabled:boolean,paused:boolean) {
  const [enabled,setEnabled]=useState(initialEnabled),[playing,setPlaying]=useState(false),[error,setError]=useState('')
  const audio=useRef<HTMLAudioElement|null>(null),armed=useRef(false),pending=useRef<Promise<void>|null>(null)
  const preferences=useRef({enabled,paused});preferences.current={enabled,paused}
  const play=useCallback(()=>{
    if(!armed.current||!preferences.current.enabled||preferences.current.paused||document.hidden)return
    if(!audio.current){
      const element=new Audio('/audio/starlight-letter.m4a');element.loop=true;element.volume=.32;element.preload='metadata'
      element.onplay=()=>{setPlaying(true);setError('')};element.onpause=()=>setPlaying(false)
      element.onerror=()=>{setPlaying(false);setError('音乐暂时无法播放，可稍后重试。')}
      audio.current=element
    }
    if(!audio.current.paused||pending.current)return
    pending.current=audio.current.play().catch(()=>{setPlaying(false);if(preferences.current.enabled&&!preferences.current.paused&&!document.hidden)setError('轻点音乐按钮，即可再次尝试播放。')}).finally(()=>{pending.current=null})
  },[])
  const begin=useCallback(()=>{armed.current=true;play()},[play])
  const toggle=useCallback(()=>{
    const next=!preferences.current.enabled;preferences.current.enabled=next;setEnabled(next)
    if(next)play();else audio.current?.pause()
  },[play])
  useEffect(()=>{if(!enabled||paused)audio.current?.pause();else play()},[enabled,paused,play])
  useEffect(()=>{
    const visibility=()=>{if(document.hidden)audio.current?.pause();else play()}
    document.addEventListener('visibilitychange',visibility)
    return()=>{document.removeEventListener('visibilitychange',visibility);if(audio.current){audio.current.pause();audio.current.src='';audio.current=null}}
  },[play])
  return {enabled,playing,error,begin,toggle}
}
