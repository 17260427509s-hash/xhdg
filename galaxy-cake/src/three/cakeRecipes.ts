import type { CakeStyle } from '../store/birthdayStore'

export interface CakeRecipe {
  edge: 'drip' | 'scallop' | 'rolled' | 'petal'
  flowers: number
  pearlCount: number
  flowerRadius: number
  pearlColor: string
  bodyRoughness: number
  bodyCoat?: number
  grain?: number
  nebula?: number
  creamRoughness?: number
  creamCoat?: number
}
export const recipes: Record<CakeStyle, CakeRecipe> = {
  galaxy: { edge: 'drip', flowers: 14, pearlCount: 22, flowerRadius: 1.075, pearlColor: '#a9bde8', bodyRoughness: .46, grain:.32 },
  strawberry: { edge: 'scallop', flowers: 8, pearlCount: 24, flowerRadius: 1.08, pearlColor: '#f6ded8', bodyRoughness: .55,grain:.42 },
  cream: { edge: 'rolled', flowers: 10, pearlCount: 64, flowerRadius: 1.06, pearlColor: '#f4dec0', bodyRoughness: .59,grain:.52,creamRoughness:.43 },
  purple: { edge: 'drip', flowers: 8, pearlCount: 24, flowerRadius: 1.09, pearlColor: '#d3b8ec', bodyRoughness: .55,grain:.3 },
  heart: { edge: 'petal', flowers: 10, pearlCount: 54, flowerRadius: 1.08, pearlColor: '#f9dce6', bodyRoughness: .56,grain:.35 },
  chocolate:{edge:'drip',flowers:8,pearlCount:18,flowerRadius:1.08,pearlColor:'#b68c63',bodyRoughness:.32,bodyCoat:.22,grain:.08,creamRoughness:.3,creamCoat:.2},
  matcha:{edge:'rolled',flowers:10,pearlCount:38,flowerRadius:1.09,pearlColor:'#e7e8ce',bodyRoughness:.68,grain:.72,creamRoughness:.44},
  blueberry:{edge:'rolled',flowers:8,pearlCount:24,flowerRadius:1.09,pearlColor:'#d7c7e5',bodyRoughness:.4,bodyCoat:.12,grain:.18},
  mango:{edge:'scallop',flowers:8,pearlCount:24,flowerRadius:1.09,pearlColor:'#fff1c2',bodyRoughness:.32,bodyCoat:.22,grain:.1,creamRoughness:.34,creamCoat:.14},
  rainbow:{edge:'petal',flowers:10,pearlCount:40,flowerRadius:1.08,pearlColor:'#f7e2e0',bodyRoughness:.48,grain:.35},
  moon:{edge:'drip',flowers:10,pearlCount:32,flowerRadius:1.08,pearlColor:'#cbd9f2',bodyRoughness:.4,nebula:.7},
  garden:{edge:'petal',flowers:14,pearlCount:42,flowerRadius:1.08,pearlColor:'#eacbd5',bodyRoughness:.53,grain:.3},
}
