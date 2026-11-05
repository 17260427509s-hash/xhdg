import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { ExperienceEngine } from '../experience/engine'
import { cakePresets, galaxyThemes } from '../store/birthdayStore'
import type { BirthdayConfig, CakeStyle, GalaxyTheme, SettingsSection } from '../store/birthdayStore'
import { AgeField } from './AgeField'
import { Icon } from './Icons'
import { LayerEditor } from './LayerEditor'

const sections: { id: SettingsSection; label: string }[] = [
  { id: 'cake', label: '蛋糕' }, { id: 'galaxy', label: '星河' },
  { id: 'blessing', label: '祝福' }, { id: 'candles', label: '蜡烛' },
]

export function SettingsPanel({ section, onSection, onClose, engine, config }: {
  section: SettingsSection; onSection: (section: SettingsSection) => void; onClose: () => void; engine: ExperienceEngine; config: BirthdayConfig
}) {
  const dialog = useRef<HTMLDialogElement>(null!)
  const [category,setCategory]=useState<'all'|'dessert'|'dream'>('all')
  const live=engine.snapshot.phase==='idle'
  useEffect(() => { const element = dialog.current,previous=document.activeElement; if(live)element.show();else element.showModal();return () => {element.close();if(previous instanceof HTMLElement)previous.focus()} }, [live])
  useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(live&&e.key==='Escape'){e.preventDefault();onClose()}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[live,onClose])
  useEffect(()=>{
    const history=(event:KeyboardEvent)=>{
      const target=event.target
      if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target instanceof HTMLElement&&target.isContentEditable)return
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();if(event.shiftKey)engine.redo();else engine.undo()}
      else if(event.ctrlKey&&event.key.toLowerCase()==='y'){event.preventDefault();engine.redo()}
    }
    window.addEventListener('keydown',history);return()=>window.removeEventListener('keydown',history)
  },[engine])
  const edit = engine.configure
  return <dialog id="cake-settings" ref={dialog} className={`settings-dialog ${live?'live-editor':''}`} aria-labelledby="settings-title" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();onClose()}}} onCancel={e => { e.preventDefault(); onClose() }}>
    <header className="settings-header"><div><p className="panel-caption">为你定制</p><h2 id="settings-title">一份专属的生日星河</h2></div><button className="icon-button" aria-label="关闭设置" onClick={onClose}><Icon name="close"/></button></header>
    <div className="settings-tabs" role="tablist" aria-label="设置分类">{sections.map((item,index) => <button key={item.id} role="tab" tabIndex={section === item.id ? 0 : -1} id={`tab-${item.id}`} aria-controls="settings-content" aria-selected={section === item.id} onClick={() => onSection(item.id)} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const next=(index+(e.key==='ArrowRight'?1:3))%4;onSection(sections[next].id);e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next].focus()}}}>{item.label}</button>)}</div>
    <div className="settings-scroll" role="tabpanel" id="settings-content" aria-labelledby={`tab-${section}`}>
      <fieldset>
        {section === 'cake' ? <>
          <div className="setting-field"><span>蛋糕款式 <small className="selection-count">12 款</small></span><div className="segmented catalog-filter" role="group" aria-label="蛋糕分类">{(['all','dessert','dream'] as const).map((value,i)=><button key={value} aria-pressed={category===value} onClick={()=>setCategory(value)}>{['全部','甜品','梦幻'][i]}</button>)}</div><div className="cake-preset-grid">{(Object.entries(cakePresets) as [CakeStyle, typeof cakePresets[CakeStyle]][]).filter(([,preset])=>category==='all'||preset.category===category).map(([id, preset]) => <button key={id} data-cake-style={id} aria-label={preset.name} className={`cake-choice ${config.cakeStyle === id ? 'selected' : ''}`} aria-pressed={config.cakeStyle === id} onClick={() => engine.selectCake(id)}>
            <span className={`cake-mini cake-mini-${id}`} style={{ '--cake-swatch': preset.color } as CSSProperties}><span/></span><span>{preset.name}</span>
          </button>)}</div><span className="field-note">{engine.snapshot.switching ? '星光正在换上新的模样…' : cakePresets[config.cakeStyle].description}</span></div>
          <button className="inspiration-button" aria-label="换一组灵感" onClick={engine.randomizeCake}><Icon name="replay"/><span>换一组灵感</span><small>造型 · 层数 · 装饰</small></button>
          <div className="setting-field"><span>蛋糕层数</span><div className="segmented">{([1,2,3] as const).map((layers,i)=><button key={layers} aria-pressed={config.cakeLayers===layers} onClick={()=>edit({cakeLayers:layers})}>{['单层','双层','三层'][i]}</button>)}</div></div>
          <LayerEditor engine={engine} config={config}/>
          <p className="panel-note">每款都保留圆润的花瓣奶油，和一点恰到好处的星光。</p>
        </> : section === 'galaxy' ? <>
          <label className="setting-toggle"><span>漂浮星点</span><input type="checkbox" checked={config.galaxyEnabled} onChange={e => edit({ galaxyEnabled: e.target.checked })}/></label>
          <div className="setting-field"><span>星河配色</span><div className="theme-options">{(Object.entries(galaxyThemes) as [GalaxyTheme, typeof galaxyThemes[GalaxyTheme]][]).map(([id, theme]) => <button key={id} className={config.galaxyTheme === id ? 'selected' : ''} aria-pressed={config.galaxyTheme === id} onClick={() => edit({ galaxyTheme: id })}><span className="theme-dots" aria-hidden="true">{theme.colors.slice(0, 4).map(color => <i key={color} style={{ background: color }}/>)}</span>{theme.name}</button>)}</div></div>
          <label className="setting-field">星河强度 <span className="range-value">{config.galaxyCount <= 150 ? '少' : config.galaxyCount <= 350 ? '标准' : '丰富'}</span><input aria-label="星河强度" type="range" min="100" max="600" step="100" value={config.galaxyCount} onChange={e => edit({ galaxyCount: Number(e.target.value) })}/><span className="range-labels"><span>少</span><span>标准</span><span>丰富</span></span><span className="field-note">手机与低性能设备会自动限制实际粒子数量。</span></label>
          <div className="setting-field"><span>星河速度</span><div className="segmented">{([.5, 1, 1.5] as const).map(speed => <button key={speed} aria-pressed={config.galaxySpeed === speed} onClick={() => edit({ galaxySpeed: speed })}>{speed}×</button>)}</div></div>
        </> : section === 'blessing' ? <>
          <label className="setting-field">寿星昵称<input aria-label="寿星昵称" maxLength={24} value={config.recipient} placeholder="想把这份惊喜送给谁？" onChange={e => edit({ recipient: e.target.value })}/></label>
          <div className="form-pair"><label className="setting-field">生日<input aria-label="生日" type="date" value={config.birthday} onChange={e => edit({ birthday: e.target.value })}/></label><AgeField age={config.age} onChange={age => edit({ age })}/></div>
          <label className="setting-field">发送人<input aria-label="发送人" maxLength={24} value={config.sender} placeholder="你的名字" onChange={e => edit({ sender: e.target.value })}/></label>
          <label className="setting-field">生日祝福<textarea aria-label="生日祝福" maxLength={300} rows={4} value={config.message} onChange={e => edit({ message: e.target.value })} placeholder="写下想对 TA 说的话…"/><span className="field-note">{config.message.length} / 300</span></label>
        </> : <>
          <div className="setting-field"><span>蜡烛类型</span><div className="segmented"><button aria-pressed={config.candleType === 'regular'} onClick={() => edit({ candleType: 'regular' })}>普通蜡烛</button><button aria-pressed={config.candleType === 'number'} onClick={() => edit({ candleType: 'number' })}>数字蜡烛</button></div></div>
          <AgeField age={config.age} onChange={age => edit({ age })}/>
          <div className="setting-field"><span>蜡烛火焰</span><div className="segmented"><button disabled={engine.snapshot.lighting} aria-pressed={config.flameEnabled} onClick={() => engine.setFlame(true)}>点燃蜡烛</button><button disabled={engine.snapshot.lighting} aria-pressed={!config.flameEnabled} onClick={() => engine.setFlame(false)}>关闭火焰</button></div></div>
          <p className="panel-note">准备好后，关闭设置并开启生日惊喜。先许愿，再轻点吹灭蜡烛。</p>
        </>}
      </fieldset>
    </div>
    <footer className="settings-footer"><div className="edit-history" role="group" aria-label="编辑历史"><button onClick={engine.undo} disabled={!engine.snapshot.canUndo||engine.snapshot.switching||engine.snapshot.lighting} title="撤销（Ctrl+Z）">撤销</button><button onClick={engine.redo} disabled={!engine.snapshot.canRedo||engine.snapshot.switching||engine.snapshot.lighting} title="重做（Ctrl+Shift+Z）">重做</button></div><button className="primary" onClick={onClose}>完成 <Icon name="check"/></button></footer>
  </dialog>
}
