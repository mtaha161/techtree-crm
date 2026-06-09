'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Institution } from './InstitutionsClient'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { waLink } from '@/lib/whatsapp'
import { useRouter } from 'next/navigation'
import LinkifyText from '@/components/LinkifyText'
import InquiryDetailPanel from '@/app/dashboard/inquiries/InquiryDetailPanel'
import type { Inquiry } from '@/app/dashboard/inquiries/InquiriesClient'

const STAGES = [
  { label: 'Prospecting', color: '#94A3B8' },
  { label: 'Meeting Booked', color: '#6366F1' },
  { label: 'Proposal Sent', color: '#F59E0B' },
  { label: 'Negotiating', color: '#F97316' },
  { label: 'Contract Signed', color: '#00BFA5' },
  { label: 'Active Partner', color: '#10B981' },
  { label: 'Not Interested', color: '#EF4444' },
]

const INQ_STAGE_COLORS: Record<string, string> = {
  'New': '#94A3B8', 'Qualifying': '#6366F1', 'Proposal': '#F59E0B',
  'Negotiating': '#F97316', 'Won': '#10B981', 'Lost': '#EF4444',
}

interface LinkedInquiry {
  id: string
  title: string
  stage: string
  channel: string
  created_at: string
  offering: string
}

export default function InstitutionDetailPanel({ institution, onClose, onUpdate, onDelete, onStageChange, approvedUsers, onInquiryDelete, isAdmin }: {
  institution: Institution
  onClose: () => void
  onUpdate: (i: Institution) => void
  onDelete: (id: string) => void
  onStageChange: (id: string, stage: string) => void
  approvedUsers: { id: string; full_name: string }[]
  onInquiryDelete?: (institutionId: string) => void
  isAdmin?: boolean
}) {
  const supabase = createClient()
  const router = useRouter()
  const [notes, setNotes] = useState(institution.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ ...institution })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [inquiries, setInquiries] = useState<LinkedInquiry[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [allInstitutions, setAllInstitutions] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    supabase.from('inquiries')
      .select('id, title, stage, channel, created_at, offering')
      .eq('institution_id', institution.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setInquiries(data ?? []))
    supabase.from('institutions').select('id, name').order('name')
      .then(({ data }) => setAllInstitutions(data ?? []))
  }, [institution.id])

  async function openInquiry(id: string) {
    const { data } = await supabase.from('inquiries').select('*').eq('id', id).single()
    if (data) setSelectedInquiry(data)
  }

  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from('institutions').update({ notes }).eq('id', institution.id)
    onUpdate({ ...institution, notes })
    setSavingNotes(false)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('institutions').update({
      ...editForm,
      phone: editForm.phone?.trim().replace(/^\.+/, ''),
    }).eq('id', institution.id).select().single()
    setSaving(false)
    if (data) { onUpdate(data); setEditing(false) }
  }

  const inputStyle = { padding: '7px 10px', border: '1px solid #E3E7EF', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none', width: '100%' }
  const stageColor = STAGES.find(s => s.label === institution.stage)?.color ?? '#94A3B8'

  return (
    <>
    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.18)' }} onClick={onClose} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 460, background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,.13)', display: 'flex', flexDirection: 'column', animation: 'dpIn .17s ease' }}>

        {/* Header */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #E3E7EF', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginBottom: 6 }}>{institution.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, border: `1px solid ${stageColor}44`, background: `${stageColor}18`, color: stageColor }}>{institution.stage}</span>
              {institution.city && <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>📍 {institution.city}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setEditing(!editing)}
              style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
              Edit
            </button>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #E3E7EF', background: 'none', cursor: 'pointer', fontSize: 14, color: '#64748B', display: 'grid', placeItems: 'center' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

          {/* Stage pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
            {STAGES.map(s => (
              <button key={s.label} onClick={() => onStageChange(institution.id, s.label)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${s.color}`, background: institution.stage === s.label ? s.color : 'transparent', color: institution.stage === s.label ? '#fff' : s.color, transition: '.13s', fontFamily: 'inherit' }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Details */}
          {!editing ? (
            <div style={{ marginBottom: 18 }}>
              {[
                ['Campuses', institution.campuses],
                ['Students', institution.students],
                ['Grades', institution.grades],
                ['Website', institution.website],
                ['Principal', institution.principal],
                ['STEAM Lead', institution.steam_lead],
                ['Email', institution.email],
                ['Phone', institution.phone],
                ['Sales Rep', institution.rep],
                ['Offering', institution.offering],
                ['Source', institution.source],
                ['Follow-up', institution.follow_up_date ? new Date(institution.follow_up_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : null],
                ['Added', new Date(institution.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={String(k)} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', width: 90, flexShrink: 0, paddingTop: 1 }}>{k}</span>
                  <span style={{ fontSize: 12.5, color: '#334155', flex: 1 }}>
                    {k === 'Phone' && institution.phone ? (
                      <a href={waLink(institution.phone)} target="_blank" rel="noreferrer"
                        style={{ color: '#10B981', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <WhatsAppIcon size={13} /> {String(v)}
                      </a>
                    ) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={saveEdit} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #E3E7EF' }}>Edit Details</div>
              {[
                { k: 'name', label: 'Name', type: 'text' },
                { k: 'city', label: 'City', type: 'text' },
                { k: 'campuses', label: 'Campuses', type: 'number' },
                { k: 'students', label: 'Students', type: 'text' },
                { k: 'grades', label: 'Grades', type: 'text' },
                { k: 'principal', label: 'Principal', type: 'text' },
                { k: 'steam_lead', label: 'STEAM Lead', type: 'text' },
                { k: 'email', label: 'Email', type: 'email' },
                { k: 'phone', label: 'Phone', type: 'text' },
                { k: 'offering', label: 'Offering', type: 'text' },
                { k: 'website', label: 'Website', type: 'text' },
                { k: 'source', label: 'Source', type: 'text' },
                { k: 'follow_up_date', label: 'Follow-up', type: 'date' },
              ].map(({ k, label, type }) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>{label}</label>
                  <input type={type} value={(editForm as Record<string, string>)[k] ?? ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Sales Rep</label>
                <select value={editForm.rep ?? ''} onChange={e => setEditForm(f => ({ ...f, rep: e.target.value }))} style={inputStyle}>
                  <option value="">Unassigned</option>
                  {approvedUsers.map(u => <option key={u.id} value={u.full_name}>{u.full_name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
                <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, padding: 8, borderRadius: 7, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#334155' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: 8, borderRadius: 7, border: 'none', background: '#00897B', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          )}

          {/* Linked Inquiries */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #E3E7EF' }}>
              Inquiries ({inquiries.length})
            </div>
            {inquiries.length === 0 ? (
              <div style={{ fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic' }}>No inquiries yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {inquiries.map(inq => (
                  <div key={inq.id}
                    onClick={() => openInquiry(inq.id)}
                    style={{ padding: '10px 12px', border: '1px solid #E3E7EF', borderRadius: 8, background: '#F8F9FB', cursor: 'pointer', transition: '.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00897B'; (e.currentTarget as HTMLDivElement).style.background = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E3E7EF'; (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 3 }}>{inq.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B' }}>
                      <span style={{ color: INQ_STAGE_COLORS[inq.stage] ?? '#94A3B8', fontWeight: 600 }}>{inq.stage}</span>
                      {inq.channel && <><span>·</span><span>{inq.channel}</span></>}
                      {inq.offering && <><span>·</span><span>{inq.offering}</span></>}
                      <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, color: '#94A3B8' }}>
                        {new Date(inq.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => router.push(`/dashboard/inquiries?new=1`)}
              style={{ marginTop: 8, width: '100%', padding: '7px', borderRadius: 7, border: '1.5px dashed #CBD2DF', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit', transition: '.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#00BFA5'; (e.currentTarget as HTMLButtonElement).style.color = '#00897B' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#CBD2DF'; (e.currentTarget as HTMLButtonElement).style.color = '#64748B' }}>
              + Add Inquiry
            </button>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #E3E7EF' }}>Notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', padding: 9, border: '1px solid #E3E7EF', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', minHeight: 90, resize: 'vertical', outline: 'none' }}
              placeholder="Context, next steps..." />
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
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Delete Institution?</div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 22, lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{institution.name}"</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #E3E7EF', background: '#fff', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={() => onDelete(institution.id)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {selectedInquiry && (
      <InquiryDetailPanel
        inquiry={selectedInquiry}
        institutions={allInstitutions}
        instMap={Object.fromEntries(allInstitutions.map(i => [i.id, i.name]))}
        onClose={() => setSelectedInquiry(null)}
        onUpdate={updated => {
          setSelectedInquiry(updated)
          setInquiries(prev => prev.map(i => i.id === updated.id ? { ...i, stage: updated.stage, title: updated.title } : i))
        }}
        onDelete={id => {
          setInquiries(prev => prev.filter(i => i.id !== id))
          setSelectedInquiry(null)
          onInquiryDelete?.(institution.id)
        }}
        onStageChange={async (id, stage) => {
          await supabase.from('inquiries').update({ stage }).eq('id', id)
          setSelectedInquiry(prev => prev ? { ...prev, stage } : prev)
          setInquiries(prev => prev.map(i => i.id === id ? { ...i, stage } : i))
        }}
      />
    )}
    </>
  )
}
