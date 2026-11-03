import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useExperience } from '../experience/useExperience'
import { GalaxyScene } from '../three/GalaxyScene'
import { Icon } from './Icons'
import { recipientName } from '../store/birthdayStore'
import { ControlBar } from './ControlBar'
import { SettingsPanel } from './SettingsPanel'
import { WishModal } from './WishModal'
import type { GiftPayload } from '../gifts/draft'
import { useDraft } from '../gifts/useDraft'
import { useMusic } from '../gifts/useMusic'
const GiftDialog=lazy(()=>import('./GiftDialog').then(module=>({default:module.GiftDialog})))

export function BirthdayExperience({initialGift,readOnly=false,preview=false,draftWarning=''}:{initialGift?:GiftPayload;readOnly?:boolean;preview?:boolean;draftWarning?:string}) {
  const {engine,phase,paused,tier,config,wishConfirmed,settings,switching,assembling,lighting}=useExperience(initialGift?.config,readOnly)
  const music=useMusic(initialGift?.musicEnabled??true,paused),[giftOpen,setGiftOpen]=useState(false)
  const gift=useMemo<GiftPayload>(()=>({version:1,config,musicEnabled:music.enabled}),[config,music.enabled])
  const draft=useDraft(gift,!readOnly,draftWarning)
  const editing=settings!==null&&phase==='idle'
  const name=recipientName(config),wish=config.message.trim()||'愿新的一岁，继续闪闪发光。'
  const idle=phase==='idle',message=phase==='message'
  const enter=()=>{music.begin();engine.enter()}
  useEffect(()=>{
    const viewport=window.visualViewport,root=document.documentElement
    let frame=0
    const layout=()=>{
      const height=viewport?.height??innerHeight,offset=viewport?.offsetTop??0
      root.style.setProperty('--visual-height',`${Math.round(height)}px`)
      root.style.setProperty('--keyboard-inset',`${Math.max(0,Math.round(innerHeight-height-offset))}px`)
    }
    const resized=()=>{layout();cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const active=document.activeElement;if(active instanceof HTMLElement&&active.closest('.settings-scroll'))active.scrollIntoView({block:'nearest'})})}
    layout();viewport?.addEventListener('resize',resized);viewport?.addEventListener('scroll',layout);window.addEventListener('resize',resized)
    return()=>{cancelAnimationFrame(frame);viewport?.removeEventListener('resize',resized);viewport?.removeEventListener('scroll',layout);window.removeEventListener('resize',resized);root.style.removeProperty('--visual-height');root.style.removeProperty('--keyboard-inset')}
  },[])
  useEffect(()=>{document.title=`星河生日蛋糕 · 给${name}`;document.querySelector('meta[name="description"]')?.setAttribute('content',`给${name}的一份星河生日惊喜。`)},[name])
  return <main className={`experience stage-two stage-three ${readOnly?'viewer-mode':''} phase-${phase} ${editing?'is-editing':''}`} data-phase={phase} data-quality={tier}>
    <div className="scene" aria-label="实时三维星河生日蛋糕，可用鼠标或手指拖动旋转"><GalaxyScene engine={engine} phase={phase} tier={tier}/></div>
    {phase==='intro'?<section className="intro" aria-labelledby="intro-title"><div className="intro-star" aria-hidden="true">✧</div><p id="intro-title">有一份来自星河的生日惊喜</p><h1>给 <span>{name}</span></h1><button className="primary intro-button" onClick={enter}>开启星河 <Icon name="arrow"/></button>{!readOnly?<button className="intro-edit" onClick={()=>engine.openSettings('blessing')}>定制这份生日祝福</button>:null}<button className="intro-music" aria-pressed={music.enabled} onClick={music.toggle}><Icon name={music.enabled?'music':'muted'}/>{music.enabled?'背景音乐已开启':'背景音乐已关闭'}</button></section>:<p className={`recipient ${message||phase==='celebration'?'recipient-hidden':''}`}>给 {name}</p>}
    {phase==='entering'?<p className="entering-status" role="status">星光正在为你汇聚</p>:null}
    <div id="birthday-message" className="birthday-message" aria-hidden={phase!=='celebration'&&!message}>
      <h1 lang="en">Happy Birthday</h1><p className="birthday-name">{name}</p><p className="birthday-wish">{wish}</p>{config.sender.trim()||config.birthday?<p className="birthday-from">{[config.sender.trim()?`来自 ${config.sender.trim()}`:'',config.birthday.replaceAll('-','.')].filter(Boolean).join(' · ')}</p>:null}
    </div>
    <div className={`drag-hint ${idle?'shown':''}`}><Icon name="drag"/><span>拖动旋转</span></div>
    <ControlBar engine={engine} onSettings={engine.openSettings} onEnter={enter}/>
    {!readOnly&&settings&&(phase==='intro'||idle)?<SettingsPanel section={settings} onSection={engine.openSettings} onClose={engine.closeSettings} engine={engine} config={config}/>:null}
    <aside className={`gift-tools ${(idle||message)&&!settings&&!giftOpen?'shown':''}`} aria-label="礼物工具" inert={!(idle||message)||Boolean(settings)||giftOpen}><button aria-label={music.enabled?'关闭背景音乐':'开启背景音乐'} aria-pressed={music.enabled} onClick={music.toggle}><Icon name={music.enabled?'music':'muted'}/><span>音乐</span></button>{!readOnly?<button aria-label="保存与分享" disabled={switching||assembling||lighting} onClick={()=>setGiftOpen(true)}><Icon name="share"/><span>保存与分享</span></button>:null}</aside>
    {giftOpen&&!readOnly?<Suspense fallback={<p className="gift-loading" role="status">正在准备礼物工具…</p>}><GiftDialog engine={engine} gift={gift} draftStatus={draft.status} onSave={draft.flush} onClose={()=>setGiftOpen(false)} music={music}/></Suspense>:null}
    {preview?<a className="preview-back" href="/create">← 返回制作 <span>本机预览 · 尚未发布</span></a>:null}
    {music.error&&!giftOpen?<p className="audio-status" role="status">{music.error}</p>:null}
    {phase==='wishing'?<WishModal engine={engine} confirmed={wishConfirmed}/>:null}
    {phase==='blowout'?<p className="blowout-status" role="status">愿你的心愿，随星光抵达。</p>:null}
    {message?<button className="again" onClick={enter}><Icon name="replay"/>再看一次</button>:null}
    <span className="sr-only" role="status" aria-live="polite">{idle?paused?'星河已暂停':'星河已点亮，可拖动查看':message?`Happy Birthday，${name}。${wish}`:''}</span>
  </main>
}
