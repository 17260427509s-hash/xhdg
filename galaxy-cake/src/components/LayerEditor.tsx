import type { ExperienceEngine } from '../experience/engine'
import { layerAppearance } from '../store/birthdayStore'
import type { BirthdayConfig, CakeLayerIndex } from '../store/birthdayStore'
import { DecorationEditor } from './DecorationEditor'

const bodyColors = ['#3d4192', '#7793cb', '#d97c9a', '#f0dec4', '#9476ba', '#e6a3b7', '#75b8ad', '#b98968']
const creamColors = ['#fff1df', '#fff0ed', '#f2e7ff', '#f7dce6', '#e8f0fa', '#e8d2b8']

export function LayerEditor({ engine, config }: { engine: ExperienceEngine; config: BirthdayConfig }) {
  const selected = engine.snapshot.selectedLayer
  const index = selected === 'all' ? config.cakeLayers - 1 : selected
  const appearance = layerAppearance(config, index)
  const shape = selected === 'all' ? config.cakeShape : appearance.shape
  const color = selected === 'all' ? config.cakeColor : appearance.cakeColor
  return <>
    <div className="setting-field layer-scope"><span>编辑范围</span>
      <div className="segmented" role="group" aria-label="编辑范围">
        <button aria-pressed={selected === 'all'} onClick={() => engine.selectLayer('all')}>整体</button>
        {Array.from({ length: config.cakeLayers }, (_, i) => <button key={i} aria-pressed={selected === i} onClick={() => engine.selectLayer(i as CakeLayerIndex)}>第 {i + 1} 层</button>)}
      </div>
      <span className="field-note">{selected === 'all' ? '整体改色或改造型会同步各层；糖饰用于顶层。' : `正在定制第 ${selected + 1} 层，其他层保持当前设计。`}</span>
    </div>
    <div className="setting-field"><span>蛋糕造型</span><div className="segmented">{([['round', '圆形'], ['square', '方形'], ['heart', '爱心']] as const).map(([value, label]) => <button key={value} aria-pressed={shape === value} onClick={() => engine.editLayer({ shape: value })}>{label}</button>)}</div></div>
    <div className="setting-field"><span>蛋糕颜色</span><div className="color-options">
      {bodyColors.map(value => <button key={value} className="color-swatch" style={{ background: value }} aria-label={`选择蛋糕颜色 ${value}`} aria-pressed={color.toLowerCase() === value} onClick={() => engine.editLayer({ cakeColor: value })}/>)}
      <label className="custom-color"><input aria-label="自定义蛋糕颜色" type="color" value={color} onChange={e => engine.editLayer({ cakeColor: e.target.value })}/><span>自选</span></label>
    </div></div>
    <div className="setting-field"><span>奶油颜色</span><div className="color-options">
      {creamColors.map(value => <button key={value} className="color-swatch" style={{ background: value }} aria-label={`选择奶油颜色 ${value}`} aria-pressed={appearance.creamColor.toLowerCase() === value} onClick={() => engine.editLayer({ creamColor: value })}/>)}
      <label className="custom-color"><input aria-label="自定义奶油颜色" type="color" value={appearance.creamColor} onChange={e => engine.editLayer({ creamColor: e.target.value })}/><span>自选</span></label>
    </div></div>
    <DecorationEditor engine={engine}/>
    <button className="reset-layer" onClick={engine.resetLayer}>{selected === 'all' ? '恢复各层默认搭配' : '恢复这一层默认搭配'}</button>
  </>
}
