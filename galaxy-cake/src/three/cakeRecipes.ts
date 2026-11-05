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
}
export const recipes: Record<CakeStyle, CakeRecipe> = {
  galaxy: { edge: 'drip', flowers: 14, pearlCount: 22, flowerRadius: 1.075, pearlColor: '#a9bde8', bodyRoughness: .4 },
  strawberry: { edge: 'scallop', flowers: 8, pearlCount: 24, flowerRadius: 1.08, pearlColor: '#f6ded8', bodyRoughness: .56 },
  cream: { edge: 'rolled', flowers: 10, pearlCount: 64, flowerRadius: 1.06, pearlColor: '#f4dec0', bodyRoughness: .54 },
  purple: { edge: 'drip', flowers: 8, pearlCount: 24, flowerRadius: 1.09, pearlColor: '#d3b8ec', bodyRoughness: .58 },
  heart: { edge: 'petal', flowers: 10, pearlCount: 54, flowerRadius: 1.08, pearlColor: '#f9dce6', bodyRoughness: .55 },
  chocolate:{edge:'drip',flowers:8,pearlCount:18,flowerRadius:1.08,pearlColor:'#b68c63',bodyRoughness:.3,bodyCoat:.45,grain:.14},
  matcha:{edge:'rolled',flowers:10,pearlCount:38,flowerRadius:1.09,pearlColor:'#e7e8ce',bodyRoughness:.66,grain:.9},
  blueberry:{edge:'rolled',flowers:8,pearlCount:24,flowerRadius:1.09,pearlColor:'#d7c7e5',bodyRoughness:.32,bodyCoat:.26,grain:.12},
  mango:{edge:'scallop',flowers:8,pearlCount:24,flowerRadius:1.09,pearlColor:'#fff1c2',bodyRoughness:.24,bodyCoat:.5,grain:.06},
  rainbow:{edge:'petal',flowers:10,pearlCount:40,flowerRadius:1.08,pearlColor:'#f7e2e0',bodyRoughness:.48,grain:.35},
  moon:{edge:'drip',flowers:10,pearlCount:32,flowerRadius:1.08,pearlColor:'#cbd9f2',bodyRoughness:.4,nebula:.7},
  garden:{edge:'petal',flowers:14,pearlCount:42,flowerRadius:1.08,pearlColor:'#eacbd5',bodyRoughness:.53,grain:.3},
}
