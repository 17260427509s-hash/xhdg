import { useEffect, useId, useState } from 'react'

export function AgeField({ age, onChange }: { age: number; onChange: (age: number) => void }) {
  const [draft, setDraft] = useState(String(age)), id = useId()
  useEffect(() => setDraft(String(age)), [age])
  const valid = /^\d{1,3}$/.test(draft) && Number(draft) <= 120
  return <label className="setting-field">年龄
    <input type="text" aria-label="年龄" inputMode="numeric" value={draft} maxLength={3} aria-describedby={id} aria-invalid={!valid}
      onChange={e => { const value = e.target.value.replace(/\D/g, ''); setDraft(value); if (value && Number(value) <= 120) onChange(Number(value)) }}
      onBlur={() => { if (!valid) setDraft(String(age)) }}/>
    <span id={id} className={`field-note ${valid ? '' : 'field-error'}`}>{valid ? '0–120 岁，数字蜡烛会同步更新' : '请输入 0–120 之间的年龄'}</span>
  </label>
}
