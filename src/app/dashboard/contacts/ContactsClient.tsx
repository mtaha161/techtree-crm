'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AddContactModal from './AddContactModal'
import ContactDetailPanel from './ContactDetailPanel'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { waLink } from '@/lib/whatsapp'

export interface Contact {
  id: string
  name: string
  type: string
  org: string
  city: string
  email: string
  phone: string
  role: string
  school: string
  interests: string
  stage: string
  source: string
  notes: string
  owner_id: string
  created_at: string
}

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string; icon: string }> = {
  'Maker Parent':   { bg: '#FFF7ED', color: '#F97316', border: '#FED7AA', icon: '⚡' },
  'Maker Student':  { bg: '#EEF2FF', color: '#6366F1', border: '#C7D2FE', icon: '🔬' },
  'Advisor':        { bg: '#E0F2F1', color: '#00897B', border: '#99F6E4', icon: '🔭' },
  'Connector':      { bg: '#ECFDF5', color: '#10B981', border: '#A7F3D0', icon: '🤝' },
  'Trainer':        { bg: '#FFFBEB', color: '#F59E0B', border: '#FDE68A', icon: '🎓' },
  'Community':      { bg: '#F5F3FF', color: '#8B5CF6', border: '#DDD6FE', icon: '🌍' },
  'Other':          { bg: '#F8F9FB', color: '#64748B', border: '#E3E7EF', icon: '👤' },
}

const TYPES = ['Maker Parent','Maker Student','Advisor','Connector','Trainer','Community','Other']
const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Other']

export default function ContactsClient({ initialData }: { initialData: Contact[] }) {
  const [contacts, setContacts] = useState<Contact[]>(initialData)
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Contact | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('users').select('role').eq('id', user.id).single()
        .then(({ data }) => { if (data?.role === 'admin') setIsAdmin(true) })
    })
  }, [])

  useEffect(() => {
    setFilterType(searchParams.get('type') ?? '')
  }, [searchParams])

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      const q = search.toLowerCase()
      if (q && !c.name?.toLowerCase().includes(q) && !c.org?.toLowerCase().includes(q) && !c.city?.toLowerCase().includes(q)) return false
      if (filterType && c.type !== filterType) return false
      if (filterCity && c.city !== filterCity) return false
      return true
    })
  }, [contacts, search, filterType, filterCity])

  function handleAdd(c: Contact) { setContacts(prev => [c, ...prev]); setShowAdd(false) }
  function handleUpdate(updated: Contact) { setContacts(prev => prev.map(c => c.id === updated.id ? updated : c)); setSelected(updated) }

  async function handleDelete(id: string) {
    await supabase.from('contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
    setSelected(null)
  }

  function exportCSV() {
    const headers = ['Name','Type','Org','City','Email','Phone','Role','Source','Created']
    const rows = filtered.map(c => [c.name,c.type,c.org,c.city,c.email,c.phone,c.role,c.source,new Date(c.created_at).toLocaleDateString()])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'contacts.csv'; a.click()
  }

  const isFiltered = filterType || filterCity || search

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ padding: '11px 18px', background: '#fff', borderBottom: '1px solid #E3E7EF', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginRight: 2 }}>Contacts</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#F1F3F7', border: '1px solid #E3E7EF', borderRadius: 100, padding: '2px 8px', color: '#64748B' }}>{filtered.length}</span>

        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94A3B8' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts…"
            style={{ width: '100%', padding: '6px 10px 6px 30px', border: '1px solid #E3E7EF', borderRadius: 7, background: '#F8F9FB', fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ padding: '5px 22px 5px 10px', borderRadius: 6, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12, fontWeight: 500, color: filterType ? '#0F172A' : '#64748B', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='%2394A3B8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 7px center' }}>
            <option value="">All types</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>

          <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
            style={{ padding: '5px 22px 5px 10px', borderRadius: 6, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12, fontWeight: 500, color: filterCity ? '#0F172A' : '#64748B', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='%2394A3B8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 7px center' }}>
            <option value="">All cities</option>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>

          {isFiltered && (
            <button onClick={() => { setFilterType(''); setFilterCity(''); setSearch(''); router.push('/dashboard/contacts') }}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 12, fontWeight: 600, color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit' }}>
              ✕ Clear
            </button>
          )}

          <div style={{ display: 'flex', background: '#F1F3F7', border: '1px solid #E3E7EF', borderRadius: 7, padding: 2, gap: 2 }}>
            {(['table','cards'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: view === v ? '#fff' : 'none', fontSize: 12, cursor: 'pointer', color: view === v ? '#0F172A' : '#64748B', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.07)' : 'none', fontFamily: 'inherit' }}>
                {v === 'table' ? '☰ Table' : '⊞ Cards'}
              </button>
            ))}
          </div>

          <button onClick={exportCSV}
            style={{ padding: '5px 11px', borderRadius: 6, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12, fontWeight: 500, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
            ↓ CSV
          </button>

          <button onClick={() => setShowAdd(true)}
            style={{ padding: '6px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: '#00BFA5', color: '#0C1A2E', fontFamily: 'inherit' }}>
            + Add Contact
          </button>
        </div>
      </div>

      {/* Table view */}
      {view === 'table' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
          <div style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name / Org','Type','City','Email','Phone','Role','Source','Added'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#64748B', background: '#F8F9FB', borderBottom: '1px solid #E3E7EF', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '28px 14px', textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>No contacts found</td></tr>
                )}
                {filtered.map(c => {
                  const ts = TYPE_COLORS[c.type] ?? TYPE_COLORS['Other']
                  return (
                    <tr key={c.id} onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}
                      onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(td => (td.style.background = '#F8F9FB'))}
                      onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(td => (td.style.background = ''))}>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{c.name}</div>
                        {c.org && <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{c.org}</div>}
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, border: `1px solid ${ts.border}`, background: ts.bg, color: ts.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {ts.icon} {c.type}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{c.city || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{c.email || '—'}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                        {c.phone ? (
                          <a href={waLink(c.phone)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ color: '#10B981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                            <WhatsAppIcon size={13} /> {c.phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{c.role || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{c.source || '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: '#94A3B8', borderBottom: '1px solid #E3E7EF', fontFamily: 'monospace' }}>
                        {new Date(c.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards view */}
      {view === 'cards' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', fontSize: 13, color: '#94A3B8' }}>No contacts found</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {filtered.map(c => {
              const ts = TYPE_COLORS[c.type] ?? TYPE_COLORS['Other']
              return (
                <div key={c.id} onClick={() => setSelected(c)}
                  style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 10, padding: '14px 14px 12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,.07)', transition: '.14s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#00BFA5'; el.style.boxShadow = '0 4px 16px rgba(0,0,0,.09)'; el.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#E3E7EF'; el.style.boxShadow = '0 1px 3px rgba(0,0,0,.07)'; el.style.transform = 'none' }}>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: ts.bg, border: `1px solid ${ts.border}`, display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>{ts.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{c.name}</div>
                      {c.org && <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.org}</div>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 100, border: `1px solid ${ts.border}`, background: ts.bg, color: ts.color }}>{c.type}</span>
                    {c.city && <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 100, border: '1px solid #E3E7EF', background: '#F8F9FB', color: '#64748B' }}>📍 {c.city}</span>}
                    {c.role && <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 100, border: '1px solid #E3E7EF', background: '#F8F9FB', color: '#64748B' }}>{c.role}</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #E3E7EF' }}>
                    <span style={{ fontSize: 11.5, color: '#64748B' }}>{c.email || ''}</span>
                    {c.phone && (
                      <a href={waLink(c.phone)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        style={{ color: '#10B981', background: '#ECFDF5', borderRadius: 4, padding: '3px 6px', border: '1px solid #A7F3D0', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        <WhatsAppIcon size={13} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showAdd && <AddContactModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {selected && <ContactDetailPanel contact={selected} onClose={() => setSelected(null)} onUpdate={handleUpdate} onDelete={handleDelete} isAdmin={isAdmin} />}
    </div>
  )
}
