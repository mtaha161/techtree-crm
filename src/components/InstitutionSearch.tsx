'use client'

import { useState, useRef, useEffect } from 'react'

interface Institution {
  id: string
  name: string
}

export default function InstitutionSearch({
  institutions,
  value,
  onChange,
}: {
  institutions: Institution[]
  value: string
  onChange: (id: string) => void
}) {
  const selected = institutions.find(i => i.id === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? institutions.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    : institutions

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(id: string) {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ padding: '7px 10px', border: `1px solid ${open ? '#6366F1' : '#E3E7EF'}`, borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: open ? '0 0 0 3px rgba(99,102,241,.1)' : 'none', transition: '.14s', minHeight: 36 }}>
        {selected ? (
          <>
            <span style={{ fontSize: 13 }}>🏫</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{selected.name}</span>
            <span onClick={clear} style={{ fontSize: 14, color: '#94A3B8', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>✕</span>
          </>
        ) : (
          <>
            <span style={{ flex: 1, color: '#94A3B8' }}>Search institution…</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>▾</span>
          </>
        )}
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #E3E7EF', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #E3E7EF' }}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Type school name…"
              style={{ width: '100%', padding: '6px 8px', border: '1px solid #E3E7EF', borderRadius: 6, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8F9FB' }} />
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <div onClick={() => select('')}
              style={{ padding: '9px 12px', fontSize: 12.5, color: '#94A3B8', cursor: 'pointer', borderBottom: '1px solid #F1F3F7' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              None
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 12.5, color: '#94A3B8', marginBottom: 4 }}>No institution found</div>
                <div style={{ fontSize: 11.5, color: '#CBD2DF' }}>Add it first from Institution Sales</div>
              </div>
            ) : (
              filtered.map(inst => (
                <div key={inst.id} onClick={() => select(inst.id)}
                  style={{ padding: '9px 12px', fontSize: 12.5, color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F1F3F7', background: inst.id === value ? '#EEF2FF' : '' }}
                  onMouseEnter={e => { if (inst.id !== value) e.currentTarget.style.background = '#F8F9FB' }}
                  onMouseLeave={e => { if (inst.id !== value) e.currentTarget.style.background = '' }}>
                  <span style={{ fontSize: 13 }}>🏫</span>
                  <span style={{ flex: 1, fontWeight: inst.id === value ? 700 : 400 }}>{inst.name}</span>
                  {inst.id === value && <span style={{ fontSize: 12, color: '#6366F1' }}>✓</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
