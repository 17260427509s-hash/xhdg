import { useEffect, useState, useSyncExternalStore } from 'react'
import { ExperienceEngine } from './engine'
import type { BirthdayConfig } from '../store/birthdayStore'

export function useExperience(initialConfig?:BirthdayConfig,readOnly=false) {
  const [engine] = useState(() => new ExperienceEngine(initialConfig,readOnly))
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  useEffect(() => {
    const visibility = () => { engine.hidden = document.hidden }
    document.addEventListener('visibilitychange', visibility)
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const reduced = () => engine.update({ reduced: media.matches })
    media.addEventListener('change', reduced)
    // Read-only inspection for local acceptance. No production control backdoor.
    if (import.meta.env.DEV || new URLSearchParams(location.search).has('qa')) {
      Object.defineProperty(window, '__GALAXY__', { configurable: true, get: () => ({ ...engine.snapshot, time: engine.time, phaseTime: engine.phaseTime, orbitTime: engine.orbitTime, blownAt: engine.blownAt, motion: Object.fromEntries(Object.entries(engine.motion).filter(([key]) => key !== '_gsap')), budget: engine.getBudget(), transition: engine.transition ? { progress: engine.transition.progress, mode: engine.transition.mode, from: engine.transition.from.cakeStyle, to: engine.transition.to.cakeStyle } : null, visualCake: engine.visualCake, resetId: engine.resetId, stats: { ...engine.stats } }) })
    }
    return () => { document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', reduced); delete (window as Window & { __GALAXY__?: unknown }).__GALAXY__; engine.dispose() }
  }, [engine])
  return { engine, ...state }
}
