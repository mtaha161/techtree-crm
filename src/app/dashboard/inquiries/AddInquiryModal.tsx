'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Inquiry, Institution, UserProfile } from './InquiriesClient'
import InstitutionSearch from '@/components/InstitutionSearch'
import ContactSuggest from '@/components/ContactSuggest'

const STAGES = ['New','Qualifying','Proposal','Negotiating','Won','Lost']
const TYPES = [
  { value: 'Standard', label: 'Standard — existing product/service' },
  { value: 'Custom', label: 'Custom — variation of existing offering' },
  { value: 'Novel', label: 'Novel — something completely new' },
]
const CHANNELS = ['WhatsApp','Phone','Email','LinkedIn','Referral','Meeting / In-person','Walk-in','Website','Other']
const REPS = ['Tarib', 'Shaheer']
const OFFERINGS = [
  'STEAM Innovators Program',
  'STEAM Explorers Program',
  'Extended Day Learning Program',
  'Summer Camps',
  'Robotics, AI & IoT Workshops',
  'Makers Learning Program',
  'Teacher Upskilling Bootcamp',
  'STEAM Lab Setup & Training',
  'TechTree Olympics',
  'Other',
]

export default function AddInquiryModal({ onClose, onAdd, institutions, currentUser, approvedUsers }: {
  onClose: () => void
  onAdd: (i: Inquiry) => void
  institutions: Institution[]
  currentUser: UserProfile | null
  approvedUsers: { id: string; full_name: string }[]
}) {
  const supabase = createClient()
  const isAdmin = currentUser?.role === 'admin'
  const [saving, setSaving] = useState(false)
  const [contactSuggestions, setContactSuggestions] = useState<{ name: string; info: string }[]>([])
  const [form, setForm] = useState({
    title: '', type: '', stage: 'New', institution_id: '',
    channel: '', contact_name: '', contact_info: '', description: '',
    offering: '', value: '', rep: isAdmin ? '' : (currentUser?.full_name ?? ''), follow_up_date: '', missing_info: '', notes: '',
  })

  // fetch previous contacts when institution changes
  useEffect(() => {
    if (!form.institution_id) { setContactSuggestions([]); return }
    supabase.from('inquiries')
      .select('contact_name, contact_info')
      .eq('institution_id', form.institution_id)
      .not('contact_name', 'is', null)
      .then(({ data }) => {
        const seen = new Set<string>()
        const unique = (data ?? []).filter(d => {
          if (!d.contact_name || seen.has(d.contact_name)) return false
          seen.add(d.contact_name); return true
        }).map(d => ({ name: d.contact_name.trim(), info: (d.contact_info ?? '').trim().replace(/^\.+/, '') }))
        setContactSuggestions(unique)
      })
  }, [form.institution_id])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.type || !form.description.trim() || !form.institution_id) return
    if (isAdmin && !form.rep) return
    setSaving(true)
    const { data, error } = await supabase.from('inquiries').insert({
      ...form,
      value: form.value ? parseFloat(form.value) : null,
      institution_id: form.institution_id || null,
      follow_up_date: form.follow_up_date || null,
    }).select().single()
    setSaving(false)
    if (!error && data) onAdd(data)
  }

  const inputStyle = { padding: '7px 10px', border: '1px solid #E3E7EF', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none', width: '100%' }
  const labelStyle: React.CSSProperties = { fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.13)' }}>

        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #E3E7EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderRadius: '14px 14px 0 0' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Add Inquiry</span>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E3E7EF', background: 'none', cursor: 'pointer', fontSize: 14, color: '#64748B', display: 'grid', placeItems: 'center' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '18px 22px 10px' }}>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #E3E7EF' }}>Inquiry Details</div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Inquiry Title / Summary *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} placeholder="e.g. Robotics Program — Beacon Light" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Inquiry Type *</label>
                <select required value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Stage</label>
                <select value={form.stage} onChange={e => set('stage', e.target.value)} style={inputStyle}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Channel Received On</label>
                <select value={form.channel} onChange={e => set('channel', e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  {CHANNELS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Description of Request *</label>
              <textarea required value={form.description} onChange={e => set('description', e.target.value)} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Describe what the school is asking for…" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Linked Institution *</label>
              <InstitutionSearch institutions={institutions} value={form.institution_id} onChange={v => set('institution_id', v)} />
              {!form.institution_id && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>Required — add the institution first if it doesn't exist</div>}
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', margin: '14px 0 8px', paddingBottom: 6, borderBottom: '1px solid #E3E7EF' }}>Contact</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Contact Name</label>
                <ContactSuggest
                  label="Contact Name"
                  value={form.contact_name}
                  onChange={v => set('contact_name', v)}
                  suggestions={contactSuggestions}
                  placeholder="Name"
                  onPairSelect={(name, info) => setForm(f => ({ ...f, contact_name: name, contact_info: info }))}
                />
              </div>
              <div>
                <label style={labelStyle}>Contact's Phone / Email</label>
                <ContactSuggest
                  label="Contact Info"
                  value={form.contact_info}
                  onChange={v => set('contact_info', v)}
                  suggestions={contactSuggestions.map(s => ({ name: s.info, info: s.name }))}
                  placeholder="Direct number or email"
                  onPairSelect={(info, name) => setForm(f => ({ ...f, contact_info: info, contact_name: name }))}
                />
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748B', margin: '14px 0 8px', paddingBottom: 6, borderBottom: '1px solid #E3E7EF' }}>Pipeline</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Offering</label>
                <select value={form.offering} onChange={e => set('offering', e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  {OFFERINGS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Value (PKR)</label>
                <input type="number" value={form.value} onChange={e => set('value', e.target.value)} style={inputStyle} placeholder="0" />
              </div>
              <div>
                <label style={labelStyle}>Rep {isAdmin ? '*' : ''}</label>
                {isAdmin ? (
                  <select required value={form.rep} onChange={e => set('rep', e.target.value)} style={inputStyle}>
                    <option value="">Select rep</option>
                    {approvedUsers.map(u => <option key={u.id} value={u.full_name}>{u.full_name}</option>)}
                  </select>
                ) : (
                  <div style={{ ...inputStyle, background: '#F8F9FB', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA5,#004D40)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {currentUser?.full_name?.[0]?.toUpperCase()}
                    </span>
                    {currentUser?.full_name}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Follow-up Date</label>
              <input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Missing Info</label>
              <textarea value={form.missing_info} onChange={e => set('missing_info', e.target.value)} style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} placeholder="What info is still needed?" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} placeholder="Any notes…" />
            </div>
          </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid #E3E7EF', display: 'flex', justifyContent: 'flex-end', gap: 7, position: 'sticky', bottom: 0, background: '#fff', borderRadius: '0 0 14px 14px' }}>
            <button type="button" onClick={onClose} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', border: '1px solid #E3E7EF', background: '#fff', color: '#334155', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={saving || !form.institution_id || !form.type || !form.title.trim() || !form.description.trim()}
              style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: (!form.institution_id || !form.type || !form.title.trim() || !form.description.trim()) ? 'not-allowed' : 'pointer', border: 'none', background: '#6366F1', color: '#fff', fontFamily: 'inherit', opacity: (saving || !form.institution_id || !form.type || !form.title.trim() || !form.description.trim()) ? .45 : 1 }}>
              {saving ? 'Saving…' : 'Add Inquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
