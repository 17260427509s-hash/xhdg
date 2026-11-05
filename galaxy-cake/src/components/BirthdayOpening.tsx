import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import gsap from 'gsap'
import type { ExperienceEngine } from '../experience/engine'
import { recipientName } from '../store/birthdayStore'
import { openingCards } from '../utils/openingCards'
import { Icon } from './Icons'

export function BirthdayOpening({ engine, onEnter, music }: {
  engine: ExperienceEngine; onEnter: () => void; music: { enabled: boolean; toggle: () => void }
}) {
  const root = useRef<HTMLElement>(null!), enterButton = useRef<HTMLButtonElement>(null!), skipButton = useRef<HTMLButtonElement>(null!)
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 700px)').matches)
  const cards = useMemo(() => openingCards(mobile ? 32 : 48), [mobile])
  const { config, phase, openingStage, reduced, settings } = engine.snapshot
  const ready = openingStage === 'ready', leaving = phase !== 'intro'
  useLayoutEffect(() => {
    const media = matchMedia('(max-width: 700px)'), update = () => setMobile(media.matches)
    media.addEventListener('change', update); return () => media.removeEventListener('change', update)
  }, [])
  useLayoutEffect(() => {
    const element = root.current, heart = element.querySelector<HTMLElement>('.opening-heart')!
    let unsubscribe: (() => void) | undefined
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ paused: true })
        .fromTo('.opening-heading', { opacity: .15, y: 15 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' }, 0)
        .fromTo('.opening-dedication', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .8 }, .35)
      element.querySelectorAll<HTMLElement>('.wish-note').forEach((card, index) => {
        const data = cards[index]
        timeline.fromTo(card, { opacity: 0, x: data.startX, y: data.startY, rotation: data.tilt - 18, scale: .65 },
          { opacity: 1, x: 0, y: 0, rotation: data.tilt, scale: 1, duration: .55, ease: 'power3.out' }, data.delay)
      })
      timeline.fromTo('.opening-letter', { opacity: 0, y: 15, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .7, ease: 'power2.out' }, 5.8)
        .fromTo('.opening-enter', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .5 }, 6)
      const exit = gsap.timeline({ paused: true }).to(element, { opacity: 0, duration: reduced ? .2 : .7, ease: 'power1.inOut' })
      const breathe = gsap.quickSetter(heart, 'scale')
      unsubscribe = engine.subscribeOpening(() => {
        timeline.time(Math.min(engine.openingTime, 6.5), false)
        exit.time(engine.snapshot.phase === 'intro' ? 0 : engine.phaseTime, false)
        breathe(engine.snapshot.reduced ? 1 : 1 + Math.sin(Math.max(0, engine.openingTime - 6.5) * .7) * .004)
      })
    }, element)
    return () => { unsubscribe?.(); context.revert() }
  }, [engine, cards, reduced])
  useLayoutEffect(() => { if (ready && document.activeElement === skipButton.current) enterButton.current.focus() }, [ready])
  return <section ref={root} className="birthday-opening" data-opening-stage={openingStage} aria-label="生日祝福开场" aria-hidden={leaving} inert={leaving || Boolean(settings)}>
    <div className="opening-paper-glow" aria-hidden="true"/>
    <header className="opening-heading"><p className="opening-script" aria-hidden="true">Happy Birthday</p><h1>生日快乐</h1><p className="opening-dedication">给 <span>{recipientName(config)}</span></p></header>
    <div className="opening-composition">
      <div className="opening-heart" aria-hidden="true">{cards.map((card, index) => <div key={index} className={`wish-note note-color-${card.color}`} style={{ '--note-x': `${50 + card.x * 100}%`, '--note-y': `${50 + card.y * 100}%`, zIndex: index + 1 } as CSSProperties}><span className="note-star">✧</span><p>{card.text}</p><i/></div>)}</div>
      <article className="opening-letter" aria-hidden={!ready} inert={!ready}>
        <span className="letter-heart" aria-hidden="true">♡</span><h2>{recipientName(config)}，生日快乐</h2>
        <div className="opening-wish" tabIndex={ready ? 0 : -1} aria-label="开场祝福内容"><p>{config.message.trim() || '愿新的一岁，继续闪闪发光。'}</p></div>
        {config.sender.trim() ? <p className="opening-from">来自 {config.sender.trim()}</p> : null}
      </article>
    </div>
    <footer className="opening-footer">
      <div className="opening-enter" inert={!ready}><button ref={enterButton} className="opening-primary" disabled={!ready || leaving} onClick={onEnter}>开启星河 <Icon name="arrow"/></button></div>
      <div className="opening-options">{!engine.readOnly ? <button onClick={() => engine.openSettings('blessing')}>定制这份生日祝福</button> : null}<button aria-pressed={music.enabled} onClick={music.toggle}><Icon name={music.enabled ? 'music' : 'muted'}/>{music.enabled ? '背景音乐已开启' : '背景音乐已关闭'}</button></div>
    </footer>
    <button ref={skipButton} className="opening-skip" hidden={ready} onClick={engine.skipOpening}>跳过开场 <span aria-hidden="true">↗</span></button>
    <span className="sr-only" role="status">{ready ? '祝福已汇成爱心，点击开启星河查看生日蛋糕。' : '生日快乐，祝福正在汇成爱心。'}</span>
  </section>
}
