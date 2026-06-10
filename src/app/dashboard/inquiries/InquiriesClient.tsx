'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AddInquiryModal from './AddInquiryModal'
import InquiryDetailPanel from './InquiryDetailPanel'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { waLink } from '@/lib/whatsapp'

export interface Inquiry {
  id: string
  title: string
  type: string
  stage: string
  institution_id: string
  channel: string
  contact_name: string
  contact_info: string
  description: string
  offering: string
  value: number
  rep: string
  follow_up_date: string
  missing_info: string
  notes: string
  owner_id: string
  created_at: string
}

export interface Institution {
  id: string
  name: string
}

export interface UserProfile {
  id: string
  full_name: string
  role: string
}

const STAGES = [
  { label: 'New', color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0' },
  { label: 'Qualifying', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { label: 'Proposal', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { label: 'Negotiating', color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  { label: 'Won', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  { label: 'Lost', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
]

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'Standard': { bg: '#EEF2FF', color: '#6366F1', border: '#C7D2FE' },
  'Custom': { bg: '#FFF7ED', color: '#F97316', border: '#FED7AA' },
  'Novel': { bg: '#ECFDF5', color: '#10B981', border: '#A7F3D0' },
}

export default function InquiriesClient({ initialData, institutions, currentUser, approvedUsers }: { initialData: Inquiry[]; institutions: Institution[]; currentUser: UserProfile | null; approvedUsers: { id: string; full_name: string }[] }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialData)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterChannel, setFilterChannel] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Inquiry | null>(null)
  const supabase = createClient()

  const instMap = useMemo(() => Object.fromEntries(institutions.map(i => [i.id, i.name])), [institutions])

  const filtered = useMemo(() => {
    return inquiries.filter(i => {
      const q = search.toLowerCase()
      if (q && !i.title?.toLowerCase().includes(q) && !i.contact_name?.toLowerCase().includes(q) && !instMap[i.institution_id]?.toLowerCase().includes(q)) return false
      if (filterType && i.type !== filterType) return false
      if (filterStage && i.stage !== filterStage) return false
      if (filterChannel && i.channel !== filterChannel) return false
      return true
    })
  }, [inquiries, search, filterType, filterStage, filterChannel, instMap])

  // sync sidebar filter clicks + auto-open add modal
  useEffect(() => {
    setFilterStage(searchParams.get('stage') ?? '')
    setFilterType(searchParams.get('type') ?? '')
    if (searchParams.get('new') === '1') setShowAdd(true)
  }, [searchParams])

  function exportCSV() {
    const headers = ['Title','Type','Stage','Institution','Contact','Channel','Offering','Value','Rep','Follow-up']
    const rows = filtered.map(i => [i.title, i.type, i.stage, instMap[i.institution_id] ?? '', i.contact_name, i.channel, i.offering, i.value, i.rep, i.follow_up_date])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'inquiries.csv'; a.click()
  }

  // listen for sidebar export trigger
  useEffect(() => {
    function handleExport() { exportCSV() }
    window.addEventListener('inquiries:export', handleExport)
    return () => window.removeEventListener('inquiries:export', handleExport)
  }, [filtered, instMap])

  function handleAdd(inq: Inquiry) { setInquiries(prev => [inq, ...prev]); setShowAdd(false) }
  function handleUpdate(updated: Inquiry) { setInquiries(prev => prev.map(i => i.id === updated.id ? updated : i)); setSelected(updated) }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('inquiries').delete().eq('id', id)
    if (error) { alert('Delete failed: ' + error.message); return }
    setInquiries(prev => prev.filter(i => i.id !== id))
    setSelected(null)
  }

  async function handleStageChange(id: string, stage: string) {
    await supabase.from('inquiries').update({ stage }).eq('id', id)
    setInquiries(prev => prev.map(i => i.id === id ? { ...i, stage } : i))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, stage } : prev)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ padding: '11px 18px', background: '#fff', borderBottom: '1px solid #E3E7EF', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginRight: 4 }}>Inquiries</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#F1F3F7', border: '1px solid #E3E7EF', borderRadius: 100, padding: '2px 8px', color: '#64748B' }}>{filtered.length}</span>

        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94A3B8' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search inquiries…"
            style={{ width: '100%', padding: '6px 10px 6px 30px', border: '1px solid #E3E7EF', borderRadius: 7, background: '#F8F9FB', fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>

          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
            style={{ padding: '5px 22px 5px 10px', borderRadius: 6, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12, fontWeight: 500, color: '#334155', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='%2394A3B8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 7px center' }}>
            <option value="">All channels</option>
            {['WhatsApp','Phone','Email','LinkedIn','Referral','Meeting / In-person','Walk-in','Website','Other'].map(c => <option key={c}>{c}</option>)}
          </select>

          {(filterStage || filterType || filterChannel) && (
            <button onClick={() => { setFilterChannel(''); router.push('/dashboard/inquiries') }}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 12, fontWeight: 600, color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              ✕ Clear filters
            </button>
          )}

          <button onClick={exportCSV}
            style={{ padding: '5px 11px', borderRadius: 6, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12, fontWeight: 500, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
            ↓ CSV
          </button>

          <div style={{ display: 'flex', background: '#F1F3F7', border: '1px solid #E3E7EF', borderRadius: 7, padding: 2, gap: 2 }}>
            {(['kanban','table'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: view === v ? '#fff' : 'none', fontSize: 12, cursor: 'pointer', color: view === v ? '#0F172A' : '#64748B', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.07)' : 'none', fontFamily: 'inherit' }}>
                {v === 'kanban' ? '⊞ Board' : '☰ Table'}
              </button>
            ))}
          </div>

          <button onClick={() => setShowAdd(true)}
            style={{ padding: '6px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: '#6366F1', color: '#fff', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
            + Add Inquiry
          </button>
        </div>
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '14px 18px', display: 'flex', gap: 10 }}>
          {STAGES.map(stage => {
            const cards = filtered.filter(i => i.stage === stage.label)
            return (
              <div key={stage.label} style={{ minWidth: 240, maxWidth: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ padding: '9px 11px', borderRadius: 8, border: `1px solid ${stage.border}`, background: stage.bg, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, flex: 1, color: stage.color }}>{stage.label}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, padding: '1px 6px', borderRadius: 100, border: `1px solid ${stage.border}`, color: stage.color }}>{cards.length}</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cards.length === 0 && (
                    <div style={{ border: '1.5px dashed #CBD2DF', borderRadius: 8, padding: 16, textAlign: 'center', fontSize: 11.5, color: '#94A3B8' }}>Empty</div>
                  )}
                  {cards.map(inq => {
                    const typeStyle = TYPE_COLORS[inq.type] ?? { bg: '#F8F9FB', color: '#64748B', border: '#E3E7EF' }
                    const isOverdue = inq.follow_up_date && new Date(inq.follow_up_date) < new Date()
                    return (
                      <div key={inq.id} onClick={() => setSelected(inq)}
                        style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 8, padding: '11px 12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,.07)', transition: '.14s' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#6366F1'; el.style.boxShadow = '0 4px 16px rgba(0,0,0,.09)'; el.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#E3E7EF'; el.style.boxShadow = '0 1px 3px rgba(0,0,0,.07)'; el.style.transform = 'none' }}>

                        {/* Title */}
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4, lineHeight: 1.3 }}>{inq.title}</div>

                        {/* Institution */}
                        {inq.institution_id && instMap[inq.institution_id] && (
                          <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 8 }}>🏫 {instMap[inq.institution_id]}</div>
                        )}

                        {/* Tags row */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                          {inq.type && (
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 4, border: `1px solid ${typeStyle.border}`, background: typeStyle.bg, color: typeStyle.color }}>
                              {inq.type}
                            </span>
                          )}
                          {inq.offering && (
                            <span style={{ fontSize: 10.5, fontWeight: 500, padding: '2px 8px', borderRadius: 4, border: '1px solid #E3E7EF', background: '#F8F9FB', color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                              🎯 {inq.offering}
                            </span>
                          )}
                          {inq.channel && (
                            <span style={{ fontSize: 10.5, fontWeight: 500, padding: '2px 8px', borderRadius: 4, border: '1px solid #E3E7EF', background: '#F8F9FB', color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                              📱 {inq.channel}
                            </span>
                          )}
                          {inq.value > 0 && (
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 4, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', gap: 3 }}>
                              🔥 PKR {Number(inq.value).toLocaleString()}
                            </span>
                          )}
                          {inq.follow_up_date && (
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 4, border: `1px solid ${isOverdue ? '#FECACA' : '#FDE68A'}`, background: isOverdue ? '#FEF2F2' : '#FFFBEB', color: isOverdue ? '#EF4444' : '#F59E0B', display: 'flex', alignItems: 'center', gap: 3 }}>
                              📅 {new Date(inq.follow_up_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 7, borderTop: '1px solid #E3E7EF' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#94A3B8' }}>
                            {new Date(inq.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {inq.contact_info && inq.contact_info.replace(/\D/g, '').length >= 7 && (
                              <a href={waLink(inq.contact_info)} target="_blank" rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ color: '#10B981', background: '#ECFDF5', borderRadius: 4, padding: '3px 6px', border: '1px solid #A7F3D0', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                <WhatsAppIcon size={14} />
                              </a>
                            )}
                            {inq.rep && (
                              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600, background: '#F1F3F7', borderRadius: 4, padding: '2px 7px', border: '1px solid #E3E7EF' }}>{inq.rep}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      {view === 'table' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
          <div style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Title','Type','Stage','Institution','Contact','Offering','Value','Follow-up'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#64748B', background: '#F8F9FB', borderBottom: '1px solid #E3E7EF', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '24px 14px', textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>No inquiries found</td></tr>
                )}
                {filtered.map(inq => {
                  const stageColor = STAGES.find(s => s.label === inq.stage)?.color ?? '#94A3B8'
                  const typeStyle = TYPE_COLORS[inq.type] ?? { bg: '#F8F9FB', color: '#64748B', border: '#E3E7EF' }
                  return (
                    <tr key={inq.id} onClick={() => setSelected(inq)} style={{ cursor: 'pointer' }}
                      onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => (c.style.background = '#F8F9FB'))}
                      onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => (c.style.background = ''))}>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#0F172A', fontWeight: 700, borderBottom: '1px solid #E3E7EF' }}>{inq.title}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                        {inq.type && <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, border: `1px solid ${typeStyle.border}`, background: typeStyle.bg, color: typeStyle.color }}>{inq.type}</span>}
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, border: `1px solid ${stageColor}33`, background: `${stageColor}18`, color: stageColor }}>{inq.stage}</span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{instMap[inq.institution_id] ?? '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{inq.contact_name ?? '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{inq.offering ?? '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{inq.value ? `PKR ${Number(inq.value).toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#64748B', borderBottom: '1px solid #E3E7EF', fontFamily: 'monospace' }}>
                        {inq.follow_up_date ? new Date(inq.follow_up_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddInquiryModal onClose={() => setShowAdd(false)} onAdd={handleAdd} institutions={institutions} currentUser={currentUser} approvedUsers={approvedUsers} />}
      {selected && (
        <InquiryDetailPanel
          inquiry={selected}
          institutions={institutions}
          instMap={instMap}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onStageChange={handleStageChange}
          isAdmin={currentUser?.role === 'admin'}
          approvedUsers={approvedUsers}
        />
      )}
    </div>
  )
}
