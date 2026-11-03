import { useEffect, useRef, useState } from 'react'
import type { ExperienceEngine } from '../experience/engine'
import type { GiftPayload } from '../gifts/draft'
import { cloudConfigured, giftIdPattern, publicSiteUrl, publishGift, revokeGift } from '../gifts/cloud'
import { downloadImage, exportImage } from '../gifts/exportImage'
import { Icon } from './Icons'

const SHARE_KEY='galaxy-cake:last-share:v1'
interface Published {id:string;url:string;fingerprint:string}
function readPublished():Published|null {
  try {
    const saved=JSON.parse(localStorage.getItem(SHARE_KEY)||'null')
    if(saved&&giftIdPattern.test(saved.id)&&typeof saved.fingerprint==='string')return {id:saved.id,fingerprint:saved.fingerprint,url:`${publicSiteUrl()}/birthday/${saved.id}`}
  }catch{/* A missing public origin or local storage must not block local editing. */}
  return null
}
export function GiftDialog({engine,gift,draftStatus,onSave,onClose,music}:{
  engine:ExperienceEngine;gift:GiftPayload;draftStatus:string;onSave:()=>boolean;onClose:()=>void;
  music:{enabled:boolean;playing:boolean;error:string;toggle:()=>void;begin:()=>void}
}){
  const dialog=useRef<HTMLDialogElement>(null!),alive=useRef(true)
  const [busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[published,setPublished]=useState<Published|null>(readPublished)
  const [image,setImage]=useState<{url:string;blob:Blob;filename:string}|null>(null),[revokeConfirm,setRevokeConfirm]=useState(false)
  const fingerprint=JSON.stringify(gift),same=published?.fingerprint===fingerprint
  useEffect(()=>{
    const element=dialog.current,previous=document.activeElement;alive.current=true;element.showModal()
    return()=>{alive.current=false;element.close();if(previous instanceof HTMLElement)previous.focus()}
  },[])
  useEffect(()=>()=>{if(image)URL.revokeObjectURL(image.url)},[image])
  async function run(label:string,action:()=>Promise<void>){
    setBusy(label);setNotice('')
    try{await action()}catch(error){if(alive.current)setNotice(error instanceof Error?error.message:'操作没有完成，请重试。')}
    finally{if(alive.current)setBusy('')}
  }
  function exportPicture(kind:'scene'|'card'){
    void run(kind==='scene'?'正在渲染高清画面…':'正在制作分享卡片…',async()=>{
      const value=await exportImage(engine,kind,same?published!.url:undefined)
      if(!alive.current)return
      const filename=kind==='scene'?'星河生日蛋糕.png':'星河生日祝福卡.png'
      setImage({url:URL.createObjectURL(value),blob:value,filename});downloadImage(value,filename)
      setNotice('图片已生成，可下载或长按下方预览保存。')
    })
  }
  return <dialog ref={dialog} className="gift-dialog" aria-labelledby="gift-title" onCancel={event=>{event.preventDefault();onClose()}}>
    <header className="settings-header"><div><p className="panel-caption">把心意，送到星河的另一端</p><h2 id="gift-title">保存与分享</h2></div><button className="icon-button" aria-label="关闭保存与分享" onClick={onClose}><Icon name="close"/></button></header>
    <div className="gift-scroll">
      <section className="gift-section"><h3>这份礼物，留在此刻</h3><p className="gift-caption">{draftStatus}{/[。！？]$/.test(draftStatus)?'':'。'}换电脑后，本机草稿不会自动同步。</p><div className="gift-actions"><button disabled={Boolean(busy)} onClick={()=>{if(onSave())setNotice('当前蛋糕与祝福已保存在此设备。')}}><Icon name="save"/>保存草稿</button><a href="/preview" target="_blank" rel="noopener" onClick={event=>{if(!onSave())event.preventDefault()}}><Icon name="play"/>本机观看预览</a></div></section>
      <section className="gift-section"><div className="gift-section-heading"><h3>星河轻笺</h3><button className="icon-button" aria-label={music.enabled?'关闭背景音乐':'开启背景音乐'} aria-pressed={music.enabled} onClick={music.toggle}><Icon name={music.enabled?'music':'muted'}/></button></div><p className="gift-caption">项目原创轻音乐 · {music.playing?'正在播放':music.enabled?engine.snapshot.paused?'随场景暂停':'等待播放':'已关闭'}</p>{music.error?<p className="gift-caption field-error">{music.error}<button className="text-button" onClick={music.begin}>重试播放</button></p>:null}</section>
      <section className="gift-section"><h3>留下一张星河</h3><p className="gift-caption">从当前实时场景渲染图片。分享卡片会写上寿星、祝福和发送人。</p><div className="gift-actions"><button disabled={Boolean(busy)} onClick={()=>exportPicture('scene')}><Icon name="camera"/>导出高清 PNG</button><button disabled={Boolean(busy)} onClick={()=>exportPicture('card')}><Icon name="card"/>生成分享卡片</button></div>{image?<figure className="export-preview"><img src={image.url} alt="刚生成的生日礼物图片预览"/><a href={image.url} download={image.filename}>下载图片</a></figure>:null}</section>
      <section className="gift-section"><h3>专属观看链接</h3><p className="gift-caption">链接会公开寿星信息、生日、祝福和蛋糕设置。收到的人只能观看和许愿，不会看到编辑器；后续修改草稿不会改变已经发出的礼物。</p>
        {!cloudConfigured?<p className="cloud-note">云端分享尚未连接。本机预览、保存草稿和图片导出已可使用。</p>:null}
        {published?<div className="published-gift"><label htmlFor="gift-link">{same?'这份礼物的观看链接':'上次分享的链接（与当前草稿不同）'}</label><input id="gift-link" value={published.url} readOnly onFocus={event=>event.target.select()}/><div className="gift-actions"><button disabled={Boolean(busy)} onClick={()=>void run('正在复制…',async()=>{try{await navigator.clipboard.writeText(published.url);setNotice('观看链接已复制。')}catch{setNotice('请选中上方链接，手动复制。')}})}>复制链接</button><a href={published.url} target="_blank" rel="noopener">打开观看页</a></div><button className="text-button" disabled={Boolean(busy)} onClick={()=>{
          if(!revokeConfirm){setRevokeConfirm(true);return}
          void run('正在撤回…',async()=>{await revokeGift(published.id);try{localStorage.removeItem(SHARE_KEY)}catch{/* Link is still revoked on the server. */}if(alive.current){setPublished(null);setRevokeConfirm(false);setNotice('链接已撤回，收到的人将无法继续打开。')}})
        }}>{revokeConfirm?'确认撤回此链接，收到的人将无法再打开':'撤回此分享链接'}</button>{revokeConfirm?<button className="text-button" onClick={()=>setRevokeConfirm(false)}>保留链接</button>:null}</div>:null}
        <button className="primary publish-gift" disabled={Boolean(busy)||!cloudConfigured||Boolean(same)} onClick={()=>void run('正在保存专属礼物…',async()=>{
          const result=await publishGift(gift),record={...result,fingerprint}
          try{localStorage.setItem(SHARE_KEY,JSON.stringify(record))}catch{/* The cloud gift is saved; keep its link in this dialog. */}
          if(alive.current){setPublished(record);setNotice('礼物已保存在云端。分享链接或重新生成带二维码的卡片，即可送出。')}
        })}>{same?'当前礼物已生成链接':published?'为当前草稿生成新链接':'生成专属观看链接'}<Icon name="arrow"/></button>
        <p className="gift-caption">生成正式链接后，分享卡片会附上可扫码查看的二维码。</p>
      </section>
    </div>
    <footer className="gift-footer"><p role="status" aria-live="polite">{busy||notice||'心意准备好了，再送出。'}</p><button className="primary" onClick={onClose}>完成 <Icon name="check"/></button></footer>
  </dialog>
}
