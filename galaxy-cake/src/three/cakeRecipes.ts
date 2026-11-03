import type { CakeStyle } from '../store/birthdayStore'

export interface CakeRecipe {
  edge: 'drip' | 'scallop' | 'rolled' | 'petal'
  flowers: number
  pearlCount: number
  flowerRadius: number
  pearlColor: string
  bodyRoughness: number
}
export const recipes: Record<CakeStyle, CakeRecipe> = {
  galaxy: { edge: 'drip', flowers: 10, pearlCount: 18, flowerRadius: 1.07, pearlColor: '#a9bde8', bodyRoughness: .57 },
  strawberry: { edge: 'scallop', flowers: 8, pearlCount: 24, flowerRadius: 1.08, pearlColor: '#f6ded8', bodyRoughness: .56 },
  cream: { edge: 'rolled', flowers: 10, pearlCount: 64, flowerRadius: 1.06, pearlColor: '#f4dec0', bodyRoughness: .54 },
  purple: { edge: 'drip', flowers: 8, pearlCount: 24, flowerRadius: 1.09, pearlColor: '#d3b8ec', bodyRoughness: .58 },
  heart: { edge: 'petal', flowers: 10, pearlCount: 54, flowerRadius: 1.08, pearlColor: '#f9dce6', bodyRoughness: .55 },
}
