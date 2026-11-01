import { useExperience } from '../experience/useExperience'
import { GalaxyScene } from '../three/GalaxyScene'
import { Icon } from './Icons'

export function BirthdayExperience() {
  const {engine,phase,paused,tier}=useExperience()
  const idle=phase==='idle',message=phase==='message'
  return <main className={`experience phase-${phase}`} data-phase={phase} data-quality={tier}>
    <div className="scene" aria-label="实时三维星河生日蛋糕，可用鼠标或手指拖动旋转"><GalaxyScene engine={engine} phase={phase} tier={tier}/></div>
    {phase==='intro'?<section className="intro" aria-labelledby="intro-title"><div className="intro-star" aria-hidden="true">✧</div><p id="intro-title">有一份来自星河的生日惊喜</p><h1>给 <span>小雨</span></h1><button className="primary intro-button" onClick={engine.enter}>开启星河 <Icon name="arrow"/></button></section>:<p className={`recipient ${message||phase==='celebration'?'recipient-hidden':''}`}>给 小雨</p>}
    {phase==='entering'?<p className="entering-status" role="status">星光正在为你汇聚</p>:null}
    <div id="birthday-message" className="birthday-message" aria-hidden={phase!=='celebration'&&!message}>
      <h1 lang="en">Happy Birthday</h1><p className="birthday-name">小雨</p><p className="birthday-wish">生日快乐，希望新的一岁<br className="mobile-break"/>继续闪闪发光。</p>
    </div>
    <div className={`drag-hint ${idle?'shown':''}`}><Icon name="drag"/><span>拖动旋转</span></div>
    <nav className={`control-bar ${idle?'shown':''}`} aria-label="星河操作" inert={!idle}>
      <span className="brand">星河生日蛋糕</span>
      <span className="desktop-hint"><Icon name="drag"/>拖动旋转</span>
      <div className="quiet-controls"><button className="quiet" onClick={engine.toggle} aria-label={paused?'继续':'暂停'} aria-pressed={paused}><Icon name={paused?'play':'pause'}/><span>{paused?'继续':'暂停'}</span></button><button className="quiet" onClick={engine.enter}><Icon name="replay"/><span>重播</span></button></div>
      <button className="primary surprise" onClick={engine.celebrate} disabled={paused}>开启生日惊喜 <Icon name="arrow"/></button>
    </nav>
    {message?<button className="again" onClick={engine.enter}><Icon name="replay"/>再看一次</button>:null}
    <span className="sr-only" role="status" aria-live="polite">{idle?paused?'星河已暂停':'星河已点亮，可拖动查看':message?'Happy Birthday，小雨。生日快乐，希望新的一岁继续闪闪发光。':''}</span>
  </main>
}
