'use client'

import { useState, useRef, useEffect } from 'react'

interface Suggestion {
  name: string
  info: string
}

export default function ContactSuggest({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  pairedValue,
  onPairSelect,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  suggestions: Suggestion[]
  placeholder?: string
  pairedValue?: string
  onPairSelect?: (name: string, info: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = suggestions.filter(s =>
    !value || s.name.toLowerCase().includes(value.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={{ padding: '7px 10px', border: '1px solid #E3E7EF', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none', width: '100%' }}
      />

      {open && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 3, background: '#fff', border: '1px solid #E3E7EF', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,.1)', zIndex: 300, overflow: 'hidden' }}>
          <div style={{ padding: '6px 10px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#94A3B8', borderBottom: '1px solid #F1F3F7' }}>
            Previous contacts for this school
          </div>
          {filtered.map((s, i) => (
            <div key={i}
              onClick={() => { onPairSelect ? onPairSelect(s.name, s.info) : onChange(s.name); setOpen(false) }}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F1F3F7', transition: '.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{s.name}</div>
              {s.info && <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{s.info}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
