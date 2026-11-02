import { useEffect, useRef } from 'react'
import type { ExperienceEngine } from '../experience/engine'
import { Icon } from './Icons'

export function WishModal({ engine, confirmed }: { engine: ExperienceEngine; confirmed: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null!)
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close() }, [])
  return <dialog ref={dialog} className="wish-dialog" aria-labelledby="wish-title" onCancel={e => { e.preventDefault(); engine.cancelWish() }}>
    <button className="icon-button wish-close" aria-label="关闭许愿" onClick={engine.cancelWish}><Icon name="close"/></button>
    <div className="wish-symbol" aria-hidden="true"><Icon name="heart"/></div>
    <h2 id="wish-title">{confirmed ? '让星河见证你的心愿' : '先许一个愿吧。'}</h2>
    <p>{confirmed ? '轻点吹灭蜡烛，迎接属于你的生日惊喜。' : '闭上眼睛，把这一刻留给心里最珍贵的愿望。'}</p>
    <button className="primary wish-action" onClick={confirmed ? engine.blowOut : engine.confirmWish}>{confirmed ? '吹灭蜡烛' : '我许好愿了'}<Icon name={confirmed ? 'candle' : 'check'}/></button>
    <button className="wish-back" onClick={engine.cancelWish}>{confirmed ? '再想一会儿' : '稍后再许愿'}</button>
  </dialog>
}
