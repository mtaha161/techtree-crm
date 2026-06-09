'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Institution } from './InstitutionsClient'

const STAGES = ['Prospecting','Meeting Booked','Proposal Sent','Negotiating','Contract Signed','Active Partner','Not Interested']
const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Hyderabad','Other']
const OFFERINGS = [
  'STEAM Innovators Program','STEAM Explorers Program','Extended Day Learning Program',
  'Summer Camps','Robotics, AI & IoT Workshops','Makers Learning Program',
  'Teacher Upskilling Bootcamp','STEAM Lab Setup & Training','TechTree Olympics','Other',
]
const SOURCES = ['Cold Call','Referral','WhatsApp','LinkedIn','Website','Event','Other']

const sectionHd: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase',
  color: '#64748B', margin: '18px 0 10px', paddingBottom: 6, borderBottom: '1px solid #E3E7EF',
}

export default function AddInstitutionModal({ onClose, onAdd, currentUser, approvedUsers }: {
  onClose: () => void
  onAdd: (i: Institution) => void
  currentUser: { full_name: string; role: string } | null
  approvedUsers: { id: string; full_name: string }[]
}) {
  const supabase = createClient()
  const isAdmin = currentUser?.role === 'admin'
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', city: '', campuses: '', students: '', grades: '', website: '',
    principal: '', steam_lead: '', email: '', phone: '',
    stage: '', offering: '', source: '', follow_up_date: '', notes: '',
    rep: isAdmin ? '' : (currentUser?.full_name ?? ''),
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.stage || !form.principal.trim() || !form.phone.trim() || (isAdmin && !form.rep)) return
    setSaving(true)
    const { data, error } = await supabase.from('institutions').insert({
      ...form,
      phone: form.phone.trim().replace(/^\.+/, ''),
      campuses: form.campuses ? parseInt(form.campuses) : null,
      follow_up_date: form.follow_up_date || null,
    }).select().single()
    setSaving(false)
    if (!error && data) onAdd(data)
  }

  const input: React.CSSProperties = { padding: '8px 10px', border: '1px solid #E3E7EF', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none', width: '100%', transition: '.14s' }
  const lbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.13)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #E3E7EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderRadius: '14px 14px 0 0' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Add Institution</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E3E7EF', background: 'none', cursor: 'pointer', fontSize: 14, color: '#64748B', display: 'grid', placeItems: 'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '4px 24px 10px' }}>

            {/* Institution Details */}
            <div style={sectionHd}>Institution Details</div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Institution Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} style={input} placeholder="e.g. Beacon Light Academy" />
            </div>

            <div style={grid2}>
              <div>
                <label style={lbl}>City</label>
                <select value={form.city} onChange={e => set('city', e.target.value)} style={input}>
                  <option value="">Select...</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Campuses</label>
                <input type="number" value={form.campuses} onChange={e => set('campuses', e.target.value)} style={input} placeholder="1" />
              </div>
            </div>

            <div style={grid2}>
              <div>
                <label style={lbl}>Student Count</label>
                <input value={form.students} onChange={e => set('students', e.target.value)} style={input} placeholder="~500" />
              </div>
              <div>
                <label style={lbl}>Grade Levels</label>
                <input value={form.grades} onChange={e => set('grades', e.target.value)} style={input} placeholder="Grades 4–8" />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Website</label>
              <input value={form.website} onChange={e => set('website', e.target.value)} style={input} placeholder="https://..." />
            </div>

            {/* Key Contacts */}
            <div style={sectionHd}>Key Contacts</div>

            <div style={grid2}>
              <div>
                <label style={lbl}>Principal / Head *</label>
                <input required value={form.principal} onChange={e => set('principal', e.target.value)} style={input} placeholder="Full name" />
              </div>
              <div>
                <label style={lbl}>STEAM / ICT Lead</label>
                <input value={form.steam_lead} onChange={e => set('steam_lead', e.target.value)} style={input} placeholder="Full name" />
              </div>
            </div>

            <div style={grid2}>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={input} placeholder="school@email.com" />
              </div>
              <div>
                <label style={lbl}>WhatsApp / Phone *</label>
                <input required value={form.phone} onChange={e => set('phone', e.target.value)} style={input} placeholder="0300 0000000" />
              </div>
            </div>

            {/* Pipeline */}
            <div style={sectionHd}>Pipeline</div>

            <div style={grid2}>
              <div>
                <label style={lbl}>Stage *</label>
                <select required value={form.stage} onChange={e => set('stage', e.target.value)} style={input}>
                  <option value="">Select...</option>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Offering Interest</label>
                <select value={form.offering} onChange={e => set('offering', e.target.value)} style={input}>
                  <option value="">Select...</option>
                  {OFFERINGS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div style={grid2}>
              <div>
                <label style={lbl}>Lead Source</label>
                <select value={form.source} onChange={e => set('source', e.target.value)} style={input}>
                  <option value="">Select...</option>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Follow-up Date</label>
                <input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} style={input} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Sales Rep {isAdmin ? '*' : ''}</label>
              {isAdmin ? (
                <select required value={form.rep} onChange={e => set('rep', e.target.value)} style={input}>
                  <option value="">Select rep...</option>
                  {approvedUsers.map(u => <option key={u.id} value={u.full_name}>{u.full_name}</option>)}
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid #E3E7EF', borderRadius: 7, background: '#F8F9FB' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA5,#004D40)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {form.rep?.[0] ?? '?'}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{form.rep || '—'}</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...input, resize: 'vertical', minHeight: 80 }} placeholder="Context, next steps..." />
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid #E3E7EF', display: 'flex', justifyContent: 'flex-end', gap: 8, position: 'sticky', bottom: 0, background: '#fff', borderRadius: '0 0 14px 14px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid #E3E7EF', background: '#fff', color: '#334155', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit"
              disabled={saving || !form.name.trim() || !form.stage || !form.principal.trim() || !form.phone.trim() || (isAdmin && !form.rep)}
              style={{ padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 700, border: 'none', background: '#00897B', color: '#fff', fontFamily: 'inherit', opacity: (saving || !form.name.trim() || !form.stage || !form.principal.trim() || !form.phone.trim() || (isAdmin && !form.rep)) ? .45 : 1, cursor: (!form.name.trim() || !form.stage || !form.principal.trim() || !form.phone.trim() || (isAdmin && !form.rep)) ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
