import { cleanDecorations, legacyDecorations } from './decorationCatalog'
import type { DecorationType, DecorationDensity, LegacyDecoration } from './decorationCatalog'
export type CakeStyle = 'galaxy' | 'strawberry' | 'cream' | 'purple' | 'heart' | 'chocolate' | 'matcha' | 'blueberry' | 'mango' | 'rainbow' | 'moon' | 'garden'
export type CakeShape = 'round' | 'square' | 'heart'
export type GalaxyTheme = 'dream' | 'rose' | 'blue' | 'gold' | 'rainbow'
export type SettingsSection = 'cake' | 'galaxy' | 'blessing' | 'candles'
export type CakeLayerIndex = 0 | 1 | 2
export type LayerSelection = 'all' | CakeLayerIndex
export interface LayerAppearance {
  shape: CakeShape
  cakeColor: string
  creamColor: string
  decoration: LegacyDecoration
  decorations: DecorationType[]
  decorationColor: string
  decorationDensity: DecorationDensity
  decorationSeed: number
}
export type LayerOverrides = Partial<Record<CakeLayerIndex, Partial<LayerAppearance>>>

export interface BirthdayConfig {
  cakeStyle: CakeStyle
  cakeShape: CakeShape
  cakeLayers: 1 | 2 | 3
  cakeColor: string
  layerOverrides: LayerOverrides
  recipient: string
  birthday: string
  age: number
  sender: string
  message: string
  candleType: 'regular' | 'number'
  flameEnabled: boolean
  galaxyEnabled: boolean
  galaxyTheme: GalaxyTheme
  galaxyCount: number
  galaxySpeed: .5 | 1 | 1.5
}

export const cakePresets: Record<CakeStyle, { name: string; color: string; cream: string; shape: CakeShape; layers: 1 | 2 | 3; description: string; category:'dessert'|'dream'; decorations:DecorationType[]; accent?:string; layerColors?:string[] }> = {
  galaxy: { name: '星河蓝', color: '#3d4192', cream: '#fff1df', shape: 'round', layers: 1, description: '蓝紫星砂 · 金色小星',category:'dream',decorations:['stars'] },
  strawberry: { name: '草莓粉', color: '#d97c9a', cream: '#fff4e9', shape: 'square', layers: 1, description: '莓果方糕 · 立体草莓',category:'dessert',decorations:['strawberry'] },
  cream: { name: '奶油白', color: '#f0dec4', cream: '#fff3df', shape: 'round', layers: 2, description: '双层奶油 · 金色星饰',category:'dessert',decorations:['stars'] },
  purple: { name: '紫色梦境', color: '#9476ba', cream: '#f2e7ff', shape: 'round', layers: 3, description: '三层梦境 · 水晶糖饰',category:'dream',decorations:['crystal'],accent:'#c2a0e0' },
  heart: { name: '情侣爱心', color: '#e6a3b7', cream: '#fff0ed', shape: 'heart', layers: 1, description: '爱心糕体 · 心形糖饰',category:'dream',decorations:['hearts'],accent:'#e8a1ba' },
  chocolate:{name:'浓巧樱桃',color:'#59362e',cream:'#653b2c',shape:'round',layers:1,description:'可可丝绒 · 浓巧滴边与樱桃',category:'dessert',decorations:['chocolate','cherry'],accent:'#dfb36c'},
  matcha:{name:'抹茶奶霜',color:'#8b9f69',cream:'#f4efd9',shape:'round',layers:2,description:'双层抹茶 · 圆润奶霜与马卡龙',category:'dessert',decorations:['macaron','pearls'],accent:'#9cba81'},
  blueberry:{name:'蓝莓慕斯',color:'#9a96bc',cream:'#faf0e9',shape:'round',layers:1,description:'柔滑蓝莓慕斯 · 薄卷边与花朵',category:'dessert',decorations:['blueberry','flower'],accent:'#d9c2ec'},
  mango:{name:'芒果晴光',color:'#efbc62',cream:'#fff1cd',shape:'square',layers:1,description:'柔亮芒果慕斯 · 果块与珍珠',category:'dessert',decorations:['mango','pearls'],accent:'#fff0ca'},
  rainbow:{name:'彩虹心愿',color:'#95b8dc',cream:'#fff4e9',shape:'round',layers:3,description:'三层柔彩 · 彩虹插牌与珍珠',category:'dream',decorations:['rainbow','pearls'],accent:'#e5a2b4',layerColors:['#95b8dc','#e8aabd','#e8ce8f']},
  moon:{name:'星月夜曲',color:'#283b70',cream:'#e8f0fc',shape:'round',layers:2,description:'双层午夜蓝 · 月牙、金星与珍珠',category:'dream',decorations:['crescent','stars','pearls'],accent:'#e9cb88'},
  garden:{name:'花园来信',color:'#e5b1bc',cream:'#fff0e6',shape:'heart',layers:1,description:'花瓣奶油 · 小花、蝴蝶与缎结',category:'dream',decorations:['flower','butterfly','bow'],accent:'#d3a0bf'},
}

export function presetLayerDefaults(style:CakeStyle,layers:number):LayerOverrides {
  const colors=cakePresets[style].layerColors, result:LayerOverrides={}
  if(colors)for(let i=0;i<layers;i++)result[i as CakeLayerIndex]={cakeColor:colors[i%colors.length]}
  return result
}
export function presetPatch(style:CakeStyle):Partial<BirthdayConfig> {
  const p=cakePresets[style]
  return {cakeStyle:style,cakeColor:p.color,cakeShape:p.shape,cakeLayers:p.layers,layerOverrides:presetLayerDefaults(style,p.layers)}
}

export const galaxyThemes: Record<GalaxyTheme, { name: string; colors: string[] }> = {
  dream: { name: '梦幻星河', colors: ['#6eacff', '#b68cff', '#f3a0db', '#a1d9f5', '#ffe3ba', '#f2edff'] },
  rose: { name: '浪漫粉河', colors: ['#ff99c1', '#ffbfce', '#e9a1e6', '#ffd88c', '#fff1dd'] },
  blue: { name: '银河蓝', colors: ['#77b8ff', '#a9e4ff', '#c0b2ff', '#f0f7ff', '#7b91df'] },
  gold: { name: '金色生日', colors: ['#ffe3a1', '#f4c770', '#fff4d8', '#fffdf5', '#eeb488'] },
  rainbow: { name: '彩虹星河', colors: ['#4ca9ff', '#c88aff', '#ff7eb6', '#69dfce', '#ffd978', '#f2edff'] },
}

export const defaultConfig: BirthdayConfig = {
  cakeStyle: 'galaxy', cakeShape: 'round', cakeLayers: 1, cakeColor: cakePresets.galaxy.color,
  layerOverrides: {},
  recipient: '小雨', birthday: '2026-11-20', age: 22, sender: '小李',
  message: '生日快乐，希望新的一岁继续闪闪发光。',
  candleType: 'regular', flameEnabled: true,
  galaxyEnabled: true, galaxyTheme: 'dream', galaxyCount: 300, galaxySpeed: 1,
}

export function normalizeConfig(current: BirthdayConfig, patch: Partial<BirthdayConfig>): BirthdayConfig {
  // Drafts and published records are untrusted JSON. Only copy known, typed fields.
  const next:BirthdayConfig={...current,layerOverrides:{...current.layerOverrides}}
  if(!patch||typeof patch!=='object'||Array.isArray(patch))return next
  if(typeof patch.cakeStyle==='string'&&Object.hasOwn(cakePresets,patch.cakeStyle))next.cakeStyle=patch.cakeStyle
  if(['round','square','heart'].includes(patch.cakeShape!))next.cakeShape=patch.cakeShape!
  if([1,2,3].includes(patch.cakeLayers!))next.cakeLayers=patch.cakeLayers!
  if(typeof patch.cakeColor==='string'&&/^#[0-9a-f]{6}$/i.test(patch.cakeColor))next.cakeColor=patch.cakeColor
  for(const key of ['recipient','sender','message'] as const)if(typeof patch[key]==='string')next[key]=patch[key].slice(0,key==='message'?300:24)
  if(typeof patch.birthday==='string'){
    const date=new Date(patch.birthday)
    if(patch.birthday===''||/^\d{4}-\d{2}-\d{2}$/.test(patch.birthday)&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===patch.birthday)next.birthday=patch.birthday
  }
  for(const key of ['flameEnabled','galaxyEnabled'] as const)if(typeof patch[key]==='boolean')next[key]=patch[key]
  if(patch.candleType==='regular'||patch.candleType==='number')next.candleType=patch.candleType
  if(typeof patch.galaxyTheme==='string'&&Object.hasOwn(galaxyThemes,patch.galaxyTheme))next.galaxyTheme=patch.galaxyTheme
  if([.5,1,1.5].includes(patch.galaxySpeed!))next.galaxySpeed=patch.galaxySpeed!
  if(typeof patch.age==='number')next.age=patch.age
  if(typeof patch.galaxyCount==='number')next.galaxyCount=patch.galaxyCount
  if(patch.layerOverrides&&typeof patch.layerOverrides==='object'&&!Array.isArray(patch.layerOverrides))next.layerOverrides=patch.layerOverrides
  next.age = Number.isFinite(next.age) ? Math.max(0, Math.min(120, Math.round(next.age))) : current.age
  next.galaxyCount = Number.isFinite(next.galaxyCount) ? Math.max(100, Math.min(600, Math.round(next.galaxyCount))) : current.galaxyCount
  if (!/^#[0-9a-f]{6}$/i.test(next.cakeColor)) next.cakeColor = current.cakeColor
  const overrides: LayerOverrides = {}
  for (const i of [0, 1, 2] as const) {
    const source = next.layerOverrides[i]
    if (!source || typeof source!=='object'||Array.isArray(source)|| i >= next.cakeLayers) continue
    const layer: Partial<LayerAppearance> = {}
    if (source.shape && ['round', 'square', 'heart'].includes(source.shape)) layer.shape = source.shape
    if (source.cakeColor && /^#[0-9a-f]{6}$/i.test(source.cakeColor)) layer.cakeColor = source.cakeColor
    if (source.creamColor && /^#[0-9a-f]{6}$/i.test(source.creamColor)) layer.creamColor = source.creamColor
    if (typeof source.decoration==='string' && Object.hasOwn(legacyDecorations,source.decoration)) layer.decoration = source.decoration
    if(Array.isArray(source.decorations))layer.decorations=cleanDecorations(source.decorations,i===next.cakeLayers-1)
    if(typeof source.decorationColor==='string'&&/^#[0-9a-f]{6}$/i.test(source.decorationColor))layer.decorationColor=source.decorationColor
    if(['sparse','standard','rich'].includes(source.decorationDensity!))layer.decorationDensity=source.decorationDensity
    if(typeof source.decorationSeed==='number'&&Number.isInteger(source.decorationSeed)&&source.decorationSeed>=0&&source.decorationSeed<=2147483647)layer.decorationSeed=source.decorationSeed
    if (Object.keys(layer).length) overrides[i] = layer
  }
  next.layerOverrides = overrides
  return next
}

export function layerAppearance(config: BirthdayConfig, index: number): LayerAppearance {
  const preset=cakePresets[config.cakeStyle],override=config.layerOverrides[index as CakeLayerIndex],top=index===config.cakeLayers-1
  const legacy:LegacyDecoration=top&&Object.hasOwn(legacyDecorations,config.cakeStyle)?config.cakeStyle as LegacyDecoration:'none'
  const decorations=override?.decorations??(override?.decoration?legacyDecorations[override.decoration]:top?preset.decorations:[])
  return {
    shape: config.cakeShape, cakeColor: config.cakeColor,
    creamColor: cakePresets[config.cakeStyle].cream,
    decoration: legacy, decorationColor:preset.accent??'#dfb36c',decorationDensity:'standard',decorationSeed:173+index*53,
    ...override,decorations:cleanDecorations(decorations,top),
  }
}

export const recipientName = (config: BirthdayConfig) => config.recipient.trim() || '亲爱的你'
