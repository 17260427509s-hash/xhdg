import { useEffect, useState, useSyncExternalStore } from 'react'
import { ExperienceEngine } from './engine'
import type { BirthdayConfig } from '../store/birthdayStore'
import type { PlacedDecoration } from '../utils/decorationLayout'

export function useExperience(initialConfig?:BirthdayConfig,readOnly=false) {
  const [engine] = useState(() => new ExperienceEngine(initialConfig,readOnly))
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  useEffect(() => {
    let frame=0,previous=performance.now(),alive=true
    const cleanups:(()=>void)[]=[]
    const tick=(now:number)=>{const delta=(now-previous)/1000;previous=now;engine.tick(delta);frame=requestAnimationFrame(tick)}
    frame=requestAnimationFrame(tick)
    const visibility = () => { engine.hidden = document.hidden;previous=performance.now() }
    document.addEventListener('visibilitychange', visibility)
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const reduced = () => engine.update({ reduced: media.matches })
    media.addEventListener('change', reduced)
    // Read-only inspection for local acceptance. No production control backdoor.
    if (import.meta.env.DEV || new URLSearchParams(location.search).has('qa')) {
      let cachedConfig=engine.snapshot.config,cachedTier=engine.snapshot.tier,layout:typeof import('../utils/decorationLayout').decorationLayout|undefined,requested=false
      let placements:PlacedDecoration[][]=[[],[],[]]
      const load=()=>{if(requested||engine.snapshot.phase==='intro')return;requested=true;void import('../utils/decorationLayout').then(module=>{if(!alive)return;layout=module.decorationLayout;placements=[0,1,2].map(i=>layout!(engine.snapshot.config,i,engine.snapshot.tier))})}
      const unsubscribe=engine.subscribe(load);load()
      Object.defineProperty(window, '__GALAXY__', { configurable: true, get: () => {
        if(layout&&(cachedConfig!==engine.snapshot.config||cachedTier!==engine.snapshot.tier)){cachedConfig=engine.snapshot.config;cachedTier=engine.snapshot.tier;placements=[0,1,2].map(i=>layout!(cachedConfig,i,cachedTier))}
        return { ...engine.snapshot, decorations:placements, openingTime: engine.openingTime, time: engine.time, phaseTime: engine.phaseTime, orbitTime: engine.orbitTime, blownAt: engine.blownAt, motion: Object.fromEntries(Object.entries(engine.motion).filter(([key]) => key !== '_gsap')), sky: engine.sky.inspect(), budget: engine.getBudget(), transition: engine.transition ? { progress: engine.transition.progress, mode: engine.transition.mode, from: engine.transition.from.cakeStyle, to: engine.transition.to.cakeStyle } : null, visualCake: engine.visualCake, resetId: engine.resetId, renderSuspended:engine.renderSuspended,stats: { ...engine.stats,subject:{...engine.stats.subject} } }
      } })
      const cleanup=()=>unsubscribe();cleanups.push(cleanup)
    }
    return () => { alive=false;cancelAnimationFrame(frame);cleanups.forEach(cleanup=>cleanup());document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', reduced); delete (window as Window & { __GALAXY__?: unknown }).__GALAXY__; engine.dispose() }
  }, [engine])
  return { engine, ...state }
}
