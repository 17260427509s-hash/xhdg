import { defaultConfig, normalizeConfig } from '../store/birthdayStore'
import type { BirthdayConfig } from '../store/birthdayStore'

export const DRAFT_KEY='galaxy-cake:draft:v1'
export interface GiftPayload { version:1; config:BirthdayConfig; musicEnabled:boolean }
export interface Draft extends GiftPayload { savedAt:string }
export function parseGift(value:unknown):GiftPayload {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('礼物数据格式不正确')
  const data=value as Record<string,unknown>
  if(data.version!==1||!data.config||typeof data.config!=='object'||Array.isArray(data.config))throw new Error('礼物版本暂不支持')
  return {version:1,config:normalizeConfig(defaultConfig,data.config as Partial<BirthdayConfig>),musicEnabled:typeof data.musicEnabled==='boolean'?data.musicEnabled:true}
}
export function readDraft():{draft:Draft|null;warning:string} {
  try {
    const raw=localStorage.getItem(DRAFT_KEY)
    if(!raw)return {draft:null,warning:''}
    if(raw.length>24000)throw new Error('draft too large')
    const data=JSON.parse(raw),gift=parseGift(data)
    return {draft:{...gift,savedAt:typeof data.savedAt==='string'?data.savedAt:''},warning:''}
  } catch {return {draft:null,warning:'未能读取本机草稿，已打开默认蛋糕。'}}
}
export function saveDraft(gift:GiftPayload):Draft {
  const draft={...parseGift(gift),savedAt:new Date().toISOString()}
  localStorage.setItem(DRAFT_KEY,JSON.stringify(draft));return draft
}
