export type CakeStyle = 'galaxy' | 'strawberry' | 'cream' | 'purple' | 'heart'
export type CakeShape = 'round' | 'square' | 'heart'
export type GalaxyTheme = 'dream' | 'rose' | 'blue' | 'gold' | 'rainbow'
export type SettingsSection = 'cake' | 'galaxy' | 'blessing' | 'candles'

export interface BirthdayConfig {
  cakeStyle: CakeStyle
  cakeShape: CakeShape
  cakeLayers: 1 | 2 | 3
  cakeColor: string
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

export const cakePresets: Record<CakeStyle, { name: string; color: string; cream: string; shape: CakeShape; layers: 1 | 2 | 3; description: string }> = {
  galaxy: { name: '星河蓝', color: '#3d4192', cream: '#fff1df', shape: 'round', layers: 1, description: '蓝紫星砂 · 金色小星' },
  strawberry: { name: '草莓粉', color: '#d97c9a', cream: '#fff4e9', shape: 'square', layers: 1, description: '莓果方糕 · 立体草莓' },
  cream: { name: '奶油白', color: '#f0dec4', cream: '#fff3df', shape: 'round', layers: 2, description: '双层奶油 · 金色星饰' },
  purple: { name: '紫色梦境', color: '#9476ba', cream: '#f2e7ff', shape: 'round', layers: 3, description: '三层梦境 · 水晶糖饰' },
  heart: { name: '情侣爱心', color: '#e6a3b7', cream: '#fff0ed', shape: 'heart', layers: 1, description: '爱心糕体 · 心形糖饰' },
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
  recipient: '小雨', birthday: '2026-11-20', age: 22, sender: '小李',
  message: '生日快乐，希望新的一岁继续闪闪发光。',
  candleType: 'regular', flameEnabled: true,
  galaxyEnabled: true, galaxyTheme: 'dream', galaxyCount: 300, galaxySpeed: 1,
}

export function normalizeConfig(current: BirthdayConfig, patch: Partial<BirthdayConfig>): BirthdayConfig {
  const next = { ...current, ...patch }
  if (!['round', 'square', 'heart'].includes(next.cakeShape)) next.cakeShape = current.cakeShape
  if (![1, 2, 3].includes(next.cakeLayers)) next.cakeLayers = current.cakeLayers
  next.age = Number.isFinite(next.age) ? Math.max(0, Math.min(120, Math.round(next.age))) : current.age
  next.galaxyCount = Number.isFinite(next.galaxyCount) ? Math.max(100, Math.min(600, Math.round(next.galaxyCount))) : current.galaxyCount
  next.recipient = next.recipient.slice(0, 24)
  next.sender = next.sender.slice(0, 24)
  next.message = next.message.slice(0, 300)
  if (!/^#[0-9a-f]{6}$/i.test(next.cakeColor)) next.cakeColor = current.cakeColor
  return next
}

export const recipientName = (config: BirthdayConfig) => config.recipient.trim() || '亲爱的你'
