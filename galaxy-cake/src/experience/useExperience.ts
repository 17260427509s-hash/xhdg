import { useEffect, useState, useSyncExternalStore } from 'react'
import { ExperienceEngine, budgets } from './engine'

export function useExperience() {
  const [engine] = useState(() => new ExperienceEngine())
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  useEffect(() => {
    const visibility = () => { engine.hidden = document.hidden }
    document.addEventListener('visibilitychange', visibility)
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const reduced = () => engine.update({ reduced: media.matches })
    media.addEventListener('change', reduced)
    // Read-only inspection for local acceptance. No production control backdoor.
    if (import.meta.env.DEV || new URLSearchParams(location.search).has('qa')) {
      Object.defineProperty(window, '__GALAXY__', { configurable: true, get: () => ({ ...engine.snapshot, time: engine.time, phaseTime: engine.phaseTime, orbitTime: engine.orbitTime, motion: Object.fromEntries(Object.entries(engine.motion).filter(([key]) => key !== '_gsap')), budget: budgets[engine.snapshot.tier], resetId: engine.resetId, stats: { ...engine.stats } }) })
    }
    return () => { document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', reduced); delete (window as Window & { __GALAXY__?: unknown }).__GALAXY__; engine.dispose() }
  }, [engine])
  return { engine, ...state }
}
