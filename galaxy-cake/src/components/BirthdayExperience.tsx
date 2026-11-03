import { useExperience } from '../experience/useExperience'
import { GalaxyScene } from '../three/GalaxyScene'
import { Icon } from './Icons'
import { recipientName } from '../store/birthdayStore'
import { ControlBar } from './ControlBar'
import { SettingsPanel } from './SettingsPanel'
import { WishModal } from './WishModal'

export function BirthdayExperience() {
  const {engine,phase,paused,tier,config,wishConfirmed,settings}=useExperience()
  const editing=settings!==null&&phase==='idle'
  const name=recipientName(config),wish=config.message.trim()||'愿新的一岁，继续闪闪发光。'
  const idle=phase==='idle',message=phase==='message'
  return <main className={`experience stage-two phase-${phase} ${editing?'is-editing':''}`} data-phase={phase} data-quality={tier}>
    <div className="scene" aria-label="实时三维星河生日蛋糕，可用鼠标或手指拖动旋转"><GalaxyScene engine={engine} phase={phase} tier={tier}/></div>
    {phase==='intro'?<section className="intro" aria-labelledby="intro-title"><div className="intro-star" aria-hidden="true">✧</div><p id="intro-title">有一份来自星河的生日惊喜</p><h1>给 <span>{name}</span></h1><button className="primary intro-button" onClick={engine.enter}>开启星河 <Icon name="arrow"/></button><button className="intro-edit" onClick={()=>engine.openSettings('blessing')}>定制这份生日祝福</button></section>:<p className={`recipient ${message||phase==='celebration'?'recipient-hidden':''}`}>给 {name}</p>}
    {phase==='entering'?<p className="entering-status" role="status">星光正在为你汇聚</p>:null}
    <div id="birthday-message" className="birthday-message" aria-hidden={phase!=='celebration'&&!message}>
      <h1 lang="en">Happy Birthday</h1><p className="birthday-name">{name}</p><p className="birthday-wish">{wish}</p>{config.sender.trim()||config.birthday?<p className="birthday-from">{[config.sender.trim()?`来自 ${config.sender.trim()}`:'',config.birthday.replaceAll('-','.')].filter(Boolean).join(' · ')}</p>:null}
    </div>
    <div className={`drag-hint ${idle?'shown':''}`}><Icon name="drag"/><span>拖动旋转</span></div>
    <ControlBar engine={engine} onSettings={engine.openSettings}/>
    {settings&&(phase==='intro'||idle)?<SettingsPanel section={settings} onSection={engine.openSettings} onClose={engine.closeSettings} engine={engine} config={config}/>:null}
    {phase==='wishing'?<WishModal engine={engine} confirmed={wishConfirmed}/>:null}
    {phase==='blowout'?<p className="blowout-status" role="status">愿你的心愿，随星光抵达。</p>:null}
    {message?<button className="again" onClick={engine.enter}><Icon name="replay"/>再看一次</button>:null}
    <span className="sr-only" role="status" aria-live="polite">{idle?paused?'星河已暂停':'星河已点亮，可拖动查看':message?`Happy Birthday，${name}。${wish}`:''}</span>
  </main>
}
