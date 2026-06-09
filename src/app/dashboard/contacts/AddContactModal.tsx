'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Contact } from './ContactsClient'

const TYPES = ['Maker Parent','Maker Student','Advisor','Connector','Trainer','Community','Other']
const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Other']
const SOURCES = ['Referral','WhatsApp','LinkedIn','Event','Cold Outreach','Website','Other']

export default function AddContactModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Contact) => void }) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', type: '', org: '', city: '', email: '', phone: '',
    role: '', school: '', interests: '', source: '', notes: '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.type || !form.phone.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('contacts').insert(form).select().single()
    setSaving(false)
    if (!error && data) onAdd(data)
  }

  const input: React.CSSProperties = { padding: '7px 10px', border: '1px solid #E3E7EF', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none', width: '100%' }
  const lbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }
  const sectionHd: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', margin: '16px 0 10px', paddingBottom: 6, borderBottom: '1px solid #E3E7EF' }

  const canSave = form.name.trim() && form.type && form.phone.trim()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.13)' }}>

        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #E3E7EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderRadius: '14px 14px 0 0' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Add Contact</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E3E7EF', background: 'none', cursor: 'pointer', fontSize: 14, color: '#64748B', display: 'grid', placeItems: 'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '4px 22px 10px' }}>

            <div style={sectionHd}>Record Type</div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Type *</label>
              <select required value={form.type} onChange={e => set('type', e.target.value)} style={input}>
                <option value="">Select...</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div style={sectionHd}>Contact Details</div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Full Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} style={input} placeholder="e.g. Ahmed Khan" />
            </div>

            <div style={grid2}>
              <div>
                <label style={lbl}>Organisation / School</label>
                <input value={form.org} onChange={e => set('org', e.target.value)} style={input} placeholder="Company or school name" />
              </div>
              <div>
                <label style={lbl}>Role / Title</label>
                <input value={form.role} onChange={e => set('role', e.target.value)} style={input} placeholder="e.g. Head of Academics" />
              </div>
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
                <label style={lbl}>Source</label>
                <select value={form.source} onChange={e => set('source', e.target.value)} style={input}>
                  <option value="">Select...</option>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={grid2}>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={input} placeholder="email@example.com" />
              </div>
              <div>
                <label style={lbl}>WhatsApp / Phone *</label>
                <input required value={form.phone} onChange={e => set('phone', e.target.value)} style={input} placeholder="0300 0000000" />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Interests</label>
              <input value={form.interests} onChange={e => set('interests', e.target.value)} style={input} placeholder="e.g. Robotics, AI, STEAM education" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...input, resize: 'vertical', minHeight: 72 }} placeholder="Any relevant notes..." />
            </div>
          </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid #E3E7EF', display: 'flex', justifyContent: 'flex-end', gap: 8, position: 'sticky', bottom: 0, background: '#fff', borderRadius: '0 0 14px 14px' }}>
            <button type="button" onClick={onClose} style={{ padding: '7px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid #E3E7EF', background: '#fff', color: '#334155', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={saving || !canSave}
              style={{ padding: '7px 18px', borderRadius: 7, fontSize: 13, fontWeight: 700, border: 'none', background: '#00BFA5', color: '#0C1A2E', fontFamily: 'inherit', opacity: (!canSave || saving) ? .45 : 1, cursor: !canSave ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
