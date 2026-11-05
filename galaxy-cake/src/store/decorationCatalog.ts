export type DecorationType = 'stars' | 'strawberry' | 'crystal' | 'hearts' | 'blueberry' | 'cherry' | 'mango' | 'chocolate' | 'macaron' | 'pearls' | 'crescent' | 'butterfly' | 'bow' | 'crown' | 'flower' | 'rainbow'
export type DecorationDensity = 'sparse' | 'standard' | 'rich'
export type LegacyDecoration = 'galaxy' | 'strawberry' | 'cream' | 'purple' | 'heart' | 'none'
export const decorationCatalog: Record<DecorationType, { label: string; icon: string; radius: number; hero?: boolean; natural?: boolean }> = {
  stars:{label:'金色星星',icon:'✧',radius:.085}, strawberry:{label:'小草莓',icon:'莓',radius:.14,natural:true},
  crystal:{label:'水晶糖',icon:'◇',radius:.11}, hearts:{label:'小爱心',icon:'♡',radius:.12},
  blueberry:{label:'蓝莓',icon:'蓝',radius:.10,natural:true}, cherry:{label:'樱桃',icon:'樱',radius:.13,natural:true},
  mango:{label:'芒果块',icon:'芒',radius:.12,natural:true}, chocolate:{label:'巧克力片',icon:'▱',radius:.13,natural:true},
  macaron:{label:'马卡龙',icon:'◒',radius:.16}, pearls:{label:'珍珠',icon:'○',radius:.07},
  crescent:{label:'月牙',icon:'☾',radius:.28,hero:true}, butterfly:{label:'蝴蝶',icon:'蝶',radius:.19},
  bow:{label:'蝴蝶结',icon:'结',radius:.19}, crown:{label:'皇冠',icon:'♔',radius:.31,hero:true},
  flower:{label:'小花',icon:'❀',radius:.13}, rainbow:{label:'彩虹插牌',icon:'⌒',radius:.36,hero:true},
}
export const decorationTypes = Object.keys(decorationCatalog) as DecorationType[]
export const legacyDecorations: Record<LegacyDecoration, DecorationType[]> = {
  galaxy:['stars'],cream:['stars'],strawberry:['strawberry'],purple:['crystal'],heart:['hearts'],none:[],
}
export function cleanDecorations(value: unknown, top: boolean): DecorationType[] {
  if (!Array.isArray(value)) return []
  const result: DecorationType[] = []
  for (const item of value) {
    if (typeof item !== 'string' || !Object.hasOwn(decorationCatalog,item) || result.includes(item as DecorationType)) continue
    const type = item as DecorationType
    if (decorationCatalog[type].hero && (!top || result.some(t=>decorationCatalog[t].hero))) continue
    result.push(type); if (result.length===3) break
  }
  return result
}
