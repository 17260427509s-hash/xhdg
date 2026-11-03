import type { ExperienceEngine } from '../experience/engine'
import type { SettingsSection } from '../store/birthdayStore'
import { Icon } from './Icons'

export function ControlBar({ engine, onSettings, onEnter=engine.enter }: { engine: ExperienceEngine; onSettings: (section: SettingsSection) => void; onEnter?:()=>void }) {
  const { paused, switching, lighting, config, phase, editing, assembling } = engine.snapshot
  const idle = phase === 'idle'&&!editing
  return <nav className={`control-bar ${idle ? 'shown' : ''}`} aria-label="星河操作" inert={!idle}>
    <span className="brand">星河生日蛋糕</span>
    {!engine.readOnly?<div className="editor-controls">{(['cake', 'galaxy', 'blessing', 'candles'] as const).map((section, i) => <button key={section} className="editor-button" onClick={() => onSettings(section)}><Icon name={(['cake', 'stars', 'heart', 'candle'] as const)[i]}/><span>{['蛋糕', '星河', '祝福', '蜡烛'][i]}</span></button>)}</div>:<span className="viewer-hint"><Icon name="drag"/>拖动旋转</span>}
    <div className="quiet-controls"><button className="quiet" onClick={engine.toggle} aria-label={paused ? '继续' : '暂停'} aria-pressed={paused}><Icon name={paused ? 'play' : 'pause'}/><span>{paused ? '继续' : '暂停'}</span></button><button className="quiet" disabled={switching||assembling} onClick={onEnter}><Icon name="replay"/><span>重播</span></button></div>
    <button className="primary surprise" onClick={config.flameEnabled ? engine.requestWish : () => engine.setFlame(true)} disabled={paused || switching || lighting || assembling}>{lighting ? '星火正在点亮…' : config.flameEnabled ? '开启生日惊喜' : '点燃蜡烛'}<Icon name={config.flameEnabled ? 'arrow' : 'candle'}/></button>
  </nav>
}
