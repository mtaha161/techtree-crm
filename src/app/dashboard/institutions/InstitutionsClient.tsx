'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddInstitutionModal from './AddInstitutionModal'
import InstitutionDetailPanel from './InstitutionDetailPanel'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { waLink } from '@/lib/whatsapp'
import { useRouter, useSearchParams } from 'next/navigation'

export interface Institution {
  id: string
  name: string
  city: string
  campuses: number
  students: string
  grades: string
  website: string
  principal: string
  steam_lead: string
  email: string
  phone: string
  stage: string
  offering: string
  source: string
  follow_up_date: string
  notes: string
  rep: string
  owner_id: string
  created_at: string
}

const STAGES = [
  { label: 'Prospecting', color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0' },
  { label: 'Meeting Booked', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  { label: 'Proposal Sent', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { label: 'Negotiating', color: '#F97316', bg: '#FFF7ED', border: '#FED7AA' },
  { label: 'Contract Signed', color: '#00BFA5', bg: '#E0F2F1', border: '#99F6E4' },
  { label: 'Active Partner', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
  { label: 'Not Interested', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
]

const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Hyderabad','Other']
const OFFERINGS = [
  'STEAM Innovators Program','STEAM Explorers Program','Extended Day Learning Program',
  'Summer Camps','Robotics, AI & IoT Workshops','Makers Learning Program',
  'Teacher Upskilling Bootcamp','STEAM Lab Setup & Training','TechTree Olympics','Other',
]

export default function InstitutionsClient({ initialData, inqCounts }: { initialData: Institution[]; inqCounts: Record<string, number> }) {
  const [institutions, setInstitutions] = useState<Institution[]>(initialData)
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterOffering, setFilterOffering] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Institution | null>(null)
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>(inqCounts)
  const [currentUser, setCurrentUser] = useState<{ id: string; full_name: string; role: string } | null>(null)
  const [approvedUsers, setApprovedUsers] = useState<{ id: string; full_name: string }[]>([])
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: profile }, { data: users }] = await Promise.all([
        supabase.from('users').select('id, full_name, role').eq('id', user.id).single(),
        supabase.from('users').select('id, full_name').eq('status', 'approved').eq('role', 'user').order('full_name'),
      ])
      if (profile) setCurrentUser(profile)
      setApprovedUsers(users ?? [])
    }
    loadUser()
  }, [])

  useEffect(() => {
    setFilterStage(searchParams.get('stage') ?? '')
  }, [searchParams])

  const filtered = useMemo(() => {
    return institutions.filter(i => {
      const q = search.toLowerCase()
      if (q && !i.name?.toLowerCase().includes(q) && !i.city?.toLowerCase().includes(q) && !i.principal?.toLowerCase().includes(q)) return false
      if (filterCity && i.city !== filterCity) return false
      if (filterStage && i.stage !== filterStage) return false
      if (filterOffering && i.offering !== filterOffering) return false
      return true
    })
  }, [institutions, search, filterCity, filterStage, filterOffering])

  async function handleAdd(inst: Institution) {
    setInstitutions(prev => [inst, ...prev])
    setShowAdd(false)
  }

  async function handleUpdate(updated: Institution) {
    setInstitutions(prev => prev.map(i => i.id === updated.id ? updated : i))
    setSelected(updated)
  }

  async function handleDelete(id: string) {
    await supabase.from('institutions').delete().eq('id', id)
    setInstitutions(prev => prev.filter(i => i.id !== id))
    setSelected(null)
  }

  async function handleStageChange(id: string, stage: string) {
    await supabase.from('institutions').update({ stage }).eq('id', id)
    setInstitutions(prev => prev.map(i => i.id === id ? { ...i, stage } : i))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, stage } : prev)
  }

  useEffect(() => {
    function handle() { exportCSV() }
    window.addEventListener('institutions:export', handle)
    return () => window.removeEventListener('institutions:export', handle)
  }, [filtered])

  function exportCSV() {
    const headers = ['Name','City','Stage','Offering','Principal','Phone','Email','Follow-up','Created']
    const rows = filtered.map(i => [i.name,i.city,i.stage,i.offering,i.principal,i.phone,i.email,i.follow_up_date,new Date(i.created_at).toLocaleDateString()])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'institutions.csv'; a.click()
  }

  const isFiltered = filterCity || filterOffering || filterStage || search

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ padding: '11px 18px', background: '#fff', borderBottom: '1px solid #E3E7EF', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginRight: 2 }}>Institution Pipeline</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#F1F3F7', border: '1px solid #E3E7EF', borderRadius: 100, padding: '2px 8px', color: '#64748B' }}>{filtered.length}</span>

        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94A3B8' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ width: '100%', padding: '6px 10px 6px 30px', border: '1px solid #E3E7EF', borderRadius: 7, background: '#F8F9FB', fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
          {/* City filter */}
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
            style={{ padding: '5px 22px 5px 10px', borderRadius: 6, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12, fontWeight: 500, color: filterCity ? '#0F172A' : '#64748B', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='%2394A3B8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 7px center' }}>
            <option value="">All cities</option>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>

          {/* Offering filter */}
          <select value={filterOffering} onChange={e => setFilterOffering(e.target.value)}
            style={{ padding: '5px 22px 5px 10px', borderRadius: 6, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12, fontWeight: 500, color: filterOffering ? '#0F172A' : '#64748B', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='%2394A3B8'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 7px center' }}>
            <option value="">All offerings</option>
            {OFFERINGS.map(o => <option key={o}>{o}</option>)}
          </select>

          {isFiltered && (
            <button onClick={() => { setFilterCity(''); setFilterOffering(''); setFilterStage(''); setSearch('') }}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 12, fontWeight: 600, color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit' }}>
              ✕ Clear
            </button>
          )}

          {/* View toggle */}
          <div style={{ display: 'flex', background: '#F1F3F7', border: '1px solid #E3E7EF', borderRadius: 7, padding: 2, gap: 2 }}>
            {(['kanban','table'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: view === v ? '#fff' : 'none', fontSize: 12, cursor: 'pointer', color: view === v ? '#0F172A' : '#64748B', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.07)' : 'none', fontFamily: 'inherit' }}>
                {v === 'kanban' ? '⊞ Board' : '☰ Table'}
              </button>
            ))}
          </div>

          <button onClick={() => setShowAdd(true)}
            style={{ padding: '6px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: '#00BFA5', color: '#0C1A2E', fontFamily: 'inherit' }}>
            + Add Institution
          </button>

          <button onClick={() => router.push('/dashboard/inquiries?new=1')}
            style={{ padding: '6px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, background: '#6366F1', color: '#fff', fontFamily: 'inherit' }}>
            + Add Inquiry
          </button>
        </div>
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'stretch' }}>
          {STAGES.map(stage => {
            const cards = filtered.filter(i => i.stage === stage.label)
            return (
              <div key={stage.label} style={{ minWidth: 238, maxWidth: 238, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Column header */}
                <div style={{ padding: '8px 11px', borderRadius: 8, border: `1px solid ${stage.border}`, background: stage.bg, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, flex: 1, color: stage.color }}>{stage.label}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, padding: '1px 6px', borderRadius: 100, border: `1px solid ${stage.border}`, color: stage.color }}>{cards.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1, paddingRight: 2 }}>
                  {cards.length === 0 && (
                    <div style={{ border: '1.5px dashed #CBD2DF', borderRadius: 8, padding: '16px 12px', textAlign: 'center', fontSize: 11.5, color: '#94A3B8' }}>No institutions</div>
                  )}
                  {cards.map(inst => {
                    const inqCount = inquiryCounts[inst.id] ?? 0
                    const isOverdue = inst.follow_up_date && new Date(inst.follow_up_date) < new Date()
                    return (
                      <div key={inst.id} onClick={() => setSelected(inst)}
                        style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 8, padding: '11px 12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,.07)', transition: '.14s' }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#00BFA5'; el.style.boxShadow = '0 4px 16px rgba(0,0,0,.09)'; el.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = '#E3E7EF'; el.style.boxShadow = '0 1px 3px rgba(0,0,0,.07)'; el.style.transform = 'none' }}>

                        {/* Name */}
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3, lineHeight: 1.3 }}>{inst.name}</div>

                        {/* City */}
                        {inst.city && (
                          <div style={{ fontSize: 11.5, color: '#64748B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
                            📍 {inst.city}
                          </div>
                        )}

                        {/* Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                          {inst.offering && (
                            <span style={{ fontSize: 10.5, fontWeight: 500, padding: '2px 7px', borderRadius: 4, border: '1px solid #C7D2FE', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', gap: 3 }}>
                              🎯 {inst.offering.length > 18 ? inst.offering.slice(0, 18) + '…' : inst.offering}
                            </span>
                          )}
                          {inst.students && (
                            <span style={{ fontSize: 10.5, fontWeight: 500, padding: '2px 7px', borderRadius: 4, border: '1px solid #E3E7EF', background: '#F8F9FB', color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                              👥 {inst.students}
                            </span>
                          )}
                          {inst.campuses > 0 && (
                            <span style={{ fontSize: 10.5, fontWeight: 500, padding: '2px 7px', borderRadius: 4, border: '1px solid #E3E7EF', background: '#F8F9FB', color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                              🏢 {inst.campuses} campus{inst.campuses > 1 ? 'es' : ''}
                            </span>
                          )}
                          {inst.grades && (
                            <span style={{ fontSize: 10.5, fontWeight: 500, padding: '2px 7px', borderRadius: 4, border: '1px solid #E3E7EF', background: '#F8F9FB', color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                              📚 {inst.grades}
                            </span>
                          )}
                          {inst.follow_up_date && (
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4, border: `1px solid ${isOverdue ? '#FECACA' : '#FDE68A'}`, background: isOverdue ? '#FEF2F2' : '#FFFBEB', color: isOverdue ? '#EF4444' : '#F59E0B', display: 'flex', alignItems: 'center', gap: 3 }}>
                              📅 {new Date(inst.follow_up_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </span>
                          )}
                          {inqCount > 0 && (
                            <span onClick={e => { e.stopPropagation(); router.push(`/dashboard/inquiries?institution=${inst.id}`) }}
                              style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#10B981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                              📋 {inqCount} {inqCount === 1 ? 'inquiry' : 'inquiries'}
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 7, borderTop: '1px solid #E3E7EF' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#94A3B8' }}>
                            {new Date(inst.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {inst.rep && (
                              <span style={{ fontSize: 11, color: '#00897B', fontWeight: 600, background: '#E0F2F1', borderRadius: 4, padding: '2px 6px', border: '1px solid #99F6E4' }}>{inst.rep}</span>
                            )}
                            {inst.principal && (
                              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500, background: '#F1F3F7', borderRadius: 4, padding: '2px 6px', border: '1px solid #E3E7EF' }}>{inst.principal}</span>
                            )}
                            {inst.phone && (
                              <a href={waLink(inst.phone)} target="_blank" rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ color: '#10B981', background: '#ECFDF5', borderRadius: 4, padding: '3px 6px', border: '1px solid #A7F3D0', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                <WhatsAppIcon size={13} />
                              </a>
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
                  {['Institution','City','Stage','Rep','Offering','Principal','STEAM Lead','Phone','Students','Follow-up','Added'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#64748B', background: '#F8F9FB', borderBottom: '1px solid #E3E7EF', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: '24px 14px', textAlign: 'center', fontSize: 13, color: '#94A3B8' }}>No institutions found</td></tr>
                )}
                {filtered.map(inst => {
                  const stageColor = STAGES.find(s => s.label === inst.stage)?.color ?? '#94A3B8'
                  return (
                    <tr key={inst.id} onClick={() => setSelected(inst)} style={{ cursor: 'pointer' }}
                      onMouseEnter={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => (c.style.background = '#F8F9FB'))}
                      onMouseLeave={e => Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(c => (c.style.background = ''))}>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#0F172A', fontWeight: 700, borderBottom: '1px solid #E3E7EF' }}>
                        {inst.name}
                        {(inquiryCounts[inst.id] ?? 0) > 0 && (
                          <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 100, background: '#ECFDF5', color: '#10B981', border: '1px solid #A7F3D0' }}>
                            {inquiryCounts[inst.id]} inq
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{inst.city}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, border: `1px solid ${stageColor}33`, background: `${stageColor}18`, color: stageColor }}>{inst.stage}</span>
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                        {inst.rep && (
                          <span style={{ fontSize: 11, color: '#00897B', fontWeight: 600, background: '#E0F2F1', borderRadius: 4, padding: '2px 8px', border: '1px solid #99F6E4' }}>{inst.rep}</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#334155', borderBottom: '1px solid #E3E7EF', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inst.offering}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{inst.principal}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{inst.steam_lead}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                        {inst.phone && (
                          <a href={waLink(inst.phone)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            style={{ fontSize: 12, color: '#10B981', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <WhatsAppIcon size={13} /> {inst.phone}
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{inst.students}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#64748B', borderBottom: '1px solid #E3E7EF', fontFamily: 'monospace' }}>
                        {inst.follow_up_date ? new Date(inst.follow_up_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: '#94A3B8', borderBottom: '1px solid #E3E7EF', fontFamily: 'monospace' }}>
                        {new Date(inst.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddInstitutionModal onClose={() => setShowAdd(false)} onAdd={handleAdd} currentUser={currentUser} approvedUsers={approvedUsers} />}
      {selected && (
        <InstitutionDetailPanel
          institution={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onStageChange={handleStageChange}
          approvedUsers={approvedUsers}
          onInquiryDelete={instId => setInquiryCounts(prev => ({ ...prev, [instId]: Math.max((prev[instId] ?? 1) - 1, 0) }))}
          isAdmin={currentUser?.role === 'admin'}
        />
      )}
    </div>
  )
}
