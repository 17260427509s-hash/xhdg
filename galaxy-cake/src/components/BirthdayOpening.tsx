import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import gsap from 'gsap'
import type { ExperienceEngine } from '../experience/engine'
import { recipientName } from '../store/birthdayStore'
import { openingCards, createHeartPath, convoyEase, openingLayout } from '../utils/openingCards'
import { openingTiming } from '../utils/openingTiming'
import { Icon } from './Icons'

export function BirthdayOpening({ engine, onEnter, music }: {
  engine: ExperienceEngine; onEnter: () => void; music: { enabled: boolean; toggle: () => void }
}) {
  const root = useRef<HTMLElement>(null!), enterButton = useRef<HTMLButtonElement>(null!), skipButton = useRef<HTMLButtonElement>(null!)
  const [layout,setLayout]=useState(()=>{const mobile=innerWidth<=700;return openingLayout(mobile?innerWidth-24:Math.min(960,innerWidth*.94),mobile?Math.min(520,innerHeight-180):Math.min(680,innerHeight-170),mobile)})
  const cards = useMemo(() => openingCards(layout.count), [layout.count])
  const { config, phase, openingStage, reduced, settings } = engine.snapshot
  const ready = openingStage === 'ready', leaving = phase !== 'intro'
  useLayoutEffect(() => {
    const heart=root.current.querySelector<HTMLElement>('.opening-heart')!
    const observer=new ResizeObserver(([entry])=>{const {width,height}=entry.contentRect;setLayout(current=>Math.abs(current.width-width)<.1&&Math.abs(current.height-height)<.1?current:openingLayout(width,height,innerWidth<=700))})
    observer.observe(heart);return()=>observer.disconnect()
  }, [])
  useLayoutEffect(() => {
    const element = root.current
    let unsubscribe: (() => void) | undefined
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ paused: true })
        .fromTo('.opening-heading', { opacity: .15, y: 15 }, { opacity: 1, y: 0, duration: openingTiming.title, ease: 'power2.out' }, 0)
        .fromTo('.opening-dedication', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .8 }, .35)
      const convoy = { progress: 0 }, point = { x: 0, y: 0 }
      const notes = [...element.querySelectorAll<HTMLElement>('.wish-note')].map((card, index) => {
        gsap.set(card, { x: 0, y: 0, rotation: cards[index].tilt, opacity: 0 })
        return { x: gsap.quickSetter(card, 'x', 'px'), y: gsap.quickSetter(card, 'y', 'px'), opacity: gsap.quickSetter(card, 'opacity') }
      })
      const tilt=4*Math.PI/180,path=createHeartPath(layout.width-layout.cardWidth*Math.cos(tilt)-layout.cardHeight*Math.sin(tilt)-4,layout.height-layout.cardHeight*Math.cos(tilt)-layout.cardWidth*Math.sin(tilt)-4)
      let lastProgress = -1
      const renderCards = () => {
        if (lastProgress === convoy.progress) return
        lastProgress = convoy.progress
        notes.forEach((note, index) => {
          const progress = convoy.progress - cards[index].offset
          path.sample(progress, point)
          note.x(point.x); note.y(point.y)
          note.opacity(Math.max(0, Math.min(1, progress / .015)))
        })
      }
      timeline.to(convoy, { progress: 1, duration: openingTiming.formed-openingTiming.title, ease: convoyEase }, openingTiming.title)
      timeline.to('.opening-heading',{opacity:0,duration:.2},openingTiming.formed)
        .fromTo('.opening-letter', { opacity: 0, y: 15, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'power2.out' }, openingTiming.formed)
        .fromTo('.opening-enter', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .4 }, 5.1)
      const exit = gsap.timeline({ paused: true }).to(element, { opacity: 0, duration: reduced ? .2 : .7, ease: 'power1.inOut' })
      unsubscribe = engine.subscribeOpening(() => {
        timeline.time(Math.min(engine.openingTime, openingTiming.complete), false)
        exit.time(engine.snapshot.phase === 'intro' ? 0 : engine.phaseTime, false)
        renderCards()
      })
    }, element)
    return () => { unsubscribe?.(); context.revert() }
  }, [engine, cards, reduced,layout])
  useLayoutEffect(() => { if (ready && document.activeElement === skipButton.current) enterButton.current.focus() }, [ready])
  return <section ref={root} className="birthday-opening" data-opening-stage={openingStage} aria-label="生日祝福开场" aria-hidden={leaving} inert={leaving || Boolean(settings)}>
    <div className="opening-paper-glow" aria-hidden="true"/>
    <div className="opening-composition">
      <header className="opening-heading"><h1>生日快乐</h1><p className="opening-script" aria-hidden="true">Happy Birthday</p><p className="opening-dedication">给 <span>{recipientName(config)}</span></p></header>
      <div className="opening-heart" aria-hidden="true" style={{'--note-width':`${layout.cardWidth}px`,'--note-height':`${layout.cardHeight}px`} as CSSProperties}>{cards.map((card, index) => <div key={index} data-queue-index={index} className={`wish-note note-color-${card.color}`} style={{ zIndex: cards.length - index }}><span className="note-star">✧</span><p>{card.text}</p><i/></div>)}</div>
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
