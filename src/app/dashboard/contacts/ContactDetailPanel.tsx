'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Contact } from './ContactsClient'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { waLink } from '@/lib/whatsapp'

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
const SOURCES = ['Referral','WhatsApp','LinkedIn','Event','Cold Outreach','Website','Other']

export default function ContactDetailPanel({ contact, onClose, onUpdate, onDelete, isAdmin }: {
  contact: Contact
  onClose: () => void
  onUpdate: (c: Contact) => void
  onDelete: (id: string) => void
  isAdmin?: boolean
}) {
  const supabase = createClient()
  const [notes, setNotes] = useState(contact.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ ...contact })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const ts = TYPE_COLORS[contact.type] ?? TYPE_COLORS['Other']
  const inputStyle = { padding: '7px 10px', border: '1px solid #E3E7EF', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none', width: '100%' }

  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from('contacts').update({ notes }).eq('id', contact.id)
    onUpdate({ ...contact, notes })
    setSavingNotes(false)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('contacts').update(editForm).eq('id', contact.id).select().single()
    setSaving(false)
    if (data) { onUpdate(data); setEditing(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.18)' }} onClick={onClose} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 440, background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,.13)', display: 'flex', flexDirection: 'column', animation: 'dpIn .17s ease' }}>

        {/* Header */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #E3E7EF', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: ts.bg, border: `1px solid ${ts.border}`, display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{ts.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginBottom: 4 }}>{contact.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, border: `1px solid ${ts.border}`, background: ts.bg, color: ts.color }}>{ts.icon} {contact.type}</span>
              {contact.city && <span style={{ fontSize: 11.5, color: '#64748B' }}>📍 {contact.city}</span>}
              {contact.org && <span style={{ fontSize: 11.5, color: '#64748B' }}>{contact.org}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {contact.phone && (
              <a href={waLink(contact.phone)} target="_blank" rel="noreferrer"
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #A7F3D0', background: '#ECFDF5', fontSize: 12, color: '#10B981', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <WhatsAppIcon size={14} /> WhatsApp
              </a>
            )}
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E3E7EF', background: 'none', cursor: 'pointer', fontSize: 14, color: '#64748B', display: 'grid', placeItems: 'center' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

          {!editing ? (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #E3E7EF' }}>Details</div>
              {[
                ['Type', contact.type],
                ['Role', contact.role],
                ['Organisation', contact.org],
                ['City', contact.city],
                ['Email', contact.email],
                ['Phone', contact.phone],
                ['Interests', contact.interests],
                ['Source', contact.source],
                ['Added', new Date(contact.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={String(k)} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', width: 100, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12.5, color: '#334155', flex: 1 }}>
                    {k === 'Phone' && contact.phone ? (
                      <a href={waLink(contact.phone)} target="_blank" rel="noreferrer"
                        style={{ color: '#10B981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <WhatsAppIcon size={12} /> {String(v)}
                      </a>
                    ) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={saveEdit} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #E3E7EF' }}>Edit Contact</div>
              {[
                { k: 'name', label: 'Full Name', type: 'text' },
                { k: 'role', label: 'Role / Title', type: 'text' },
                { k: 'org', label: 'Organisation', type: 'text' },
                { k: 'email', label: 'Email', type: 'email' },
                { k: 'phone', label: 'Phone', type: 'text' },
                { k: 'interests', label: 'Interests', type: 'text' },
              ].map(({ k, label, type }) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>{label}</label>
                  <input type={type} value={(editForm as Record<string, string>)[k] ?? ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Type</label>
                <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>City</label>
                <select value={editForm.city ?? ''} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} style={inputStyle}>
                  <option value="">Select...</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Source</label>
                <select value={editForm.source ?? ''} onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))} style={inputStyle}>
                  <option value="">Select...</option>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, padding: 8, borderRadius: 7, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#334155' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: 8, borderRadius: 7, border: 'none', background: '#00BFA5', color: '#0C1A2E', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #E3E7EF' }}>Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', padding: 9, border: '1px solid #E3E7EF', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', minHeight: 90, resize: 'vertical', outline: 'none' }}
              placeholder="Notes about this contact..." />
            <button onClick={saveNotes} disabled={savingNotes}
              style={{ marginTop: 6, padding: '5px 14px', borderRadius: 6, background: '#E0F2F1', color: '#00897B', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {savingNotes ? 'Saving…' : 'Save notes'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid #E3E7EF', display: 'flex', gap: 7 }}>
          <button onClick={() => setEditing(!editing)}
            style={{ flex: 1, padding: 8, borderRadius: 7, background: '#fff', border: '1px solid #E3E7EF', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
            ✏️ Edit
          </button>
          {isAdmin && (
            <button onClick={() => setConfirmDelete(true)}
              style={{ flex: 1, padding: 8, borderRadius: 7, background: '#DC2626', border: 'none', fontSize: 12.5, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              🗑 Delete
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes dpIn{from{transform:translateX(16px);opacity:0}to{transform:none;opacity:1}}`}</style>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px 22px', width: 340, boxShadow: '0 16px 48px rgba(0,0,0,.18)', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 14px' }}>🗑</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Delete Contact?</div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 22, lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{contact.name}"</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #E3E7EF', background: '#fff', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={() => onDelete(contact.id)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
