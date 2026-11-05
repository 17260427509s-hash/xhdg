import type { ExperienceEngine } from '../experience/engine'
import { layerAppearance } from '../store/birthdayStore'
import { decorationCatalog, decorationTypes } from '../store/decorationCatalog'
export function DecorationEditor({engine}:{engine:ExperienceEngine}) {
  const {config,selectedLayer,switching}=engine.snapshot,index=selectedLayer==='all'?config.cakeLayers-1:selectedLayer
  const appearance=layerAppearance(config,index),selected=appearance.decorations,top=index===config.cakeLayers-1
  return <fieldset className="decoration-editor" disabled={switching}>
    <div className="setting-field"><span>{selectedLayer==='all'?'顶部糖饰':'本层糖饰'} <small className="selection-count">{selected.length} / 3 类</small></span>
      <div className="decoration-options">{decorationTypes.map(type=>{
        const item=decorationCatalog[type],active=selected.includes(type),replaceHero=item.hero&&selected.some(t=>decorationCatalog[t].hero)
        return <button key={type} aria-pressed={active} disabled={!active&&((item.hero&&!top)||(selected.length>=3&&!replaceHero))} title={item.hero&&!top?'大件装饰放在顶层':item.label} onClick={()=>engine.toggleDecoration(type)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>
      })}</div>
      <span className="field-note">最多混搭三类；月牙、皇冠和彩虹放在顶层，彼此替换。小件会自动避让蜡烛与奶油。</span>
    </div>
    <div className="setting-field"><span>装饰疏密</span><div className="segmented" role="group" aria-label="装饰疏密">{(['sparse','standard','rich'] as const).map((density,i)=><button key={density} aria-pressed={appearance.decorationDensity===density} onClick={()=>engine.editLayer({decorationDensity:density})}>{['少','标准','丰富'][i]}</button>)}</div></div>
    <label className="custom-color decoration-accent"><input aria-label="装饰点缀色" type="color" value={appearance.decorationColor} onChange={e=>engine.editLayer({decorationColor:e.target.value})}/><span>装饰点缀色</span><small>水果和巧克力保留自然色</small></label>
    <div className="decoration-actions"><button onClick={engine.randomizeDecorations}>换一组装饰</button><button aria-pressed={selected.length===0} onClick={()=>engine.editLayer({decorations:[]})}>不放糖饰</button></div>
  </fieldset>
}
