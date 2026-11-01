export function Icon({name}:{name:'pause'|'play'|'replay'|'drag'|'arrow'}) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name==='pause'?<><circle cx="12" cy="12" r="9"/><path d="M9 8v8M15 8v8"/></>:name==='play'?<><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></>:name==='replay'?<><path d="M21 11a9 9 0 0 0-16-5L2 9m0-6v6h6M3 13a9 9 0 0 0 16 5l3-3m0 6v-6h-6"/></>:name==='arrow'?<path d="M4 12h15m-6-6 6 6-6 6"/>:<><path d="M9 12V5a2 2 0 0 1 4 0v6-2a1.6 1.6 0 0 1 3 0v3-1a1.5 1.5 0 0 1 3 0v5c0 4-3 6-6 6-2 0-4-1-5-3l-4-5a1.8 1.8 0 0 1 2-3Z"/></>}
  </svg>
}
