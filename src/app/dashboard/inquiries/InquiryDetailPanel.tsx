'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Inquiry, Institution } from './InquiriesClient'
import InstitutionSearch from '@/components/InstitutionSearch'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { waLink } from '@/lib/whatsapp'
import LinkifyText from '@/components/LinkifyText'

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
  'Custom':   { bg: '#FFF7ED', color: '#F97316', border: '#FED7AA' },
  'Novel':    { bg: '#ECFDF5', color: '#10B981', border: '#A7F3D0' },
}

interface Comment {
  id: string
  user_name: string
  body: string
  created_at: string
}

interface Attachment {
  name: string
  url: string
  size: number
  created_at: string
}

export default function InquiryDetailPanel({ inquiry, institutions, instMap, onClose, onUpdate, onDelete, onStageChange, isAdmin }: {
  inquiry: Inquiry
  institutions: Institution[]
  instMap: Record<string, string>
  onClose: () => void
  onUpdate: (i: Inquiry) => void
  onDelete: (id: string) => void
  onStageChange: (id: string, stage: string) => void
  isAdmin?: boolean
}) {
  const supabase = createClient()
  const [notes, setNotes] = useState(inquiry.notes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ ...inquiry })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<string | null>(null)

  // Comments
  const [comments, setComments] = useState<Comment[]>([])
  const [comment, setComment] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [loadingComments, setLoadingComments] = useState(true)
  const [currentUserName, setCurrentUserName] = useState('')

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const typeStyle = TYPE_COLORS[inquiry.type] ?? { bg: '#F8F9FB', color: '#64748B', border: '#E3E7EF' }
  const currentStage = STAGES.find(s => s.label === inquiry.stage)
  const inputStyle = { padding: '7px 10px', border: '1px solid #E3E7EF', borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none', width: '100%' }

  // Load current user name
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('users').select('full_name').eq('id', user.id).single()
        setCurrentUserName(profile?.full_name ?? user.email ?? 'User')
      }
    }
    loadUser()
  }, [])

  // Load comments
  useEffect(() => {
    async function load() {
      setLoadingComments(true)
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('inquiry_id', inquiry.id)
        .order('created_at', { ascending: true })
      setComments(data ?? [])
      setLoadingComments(false)
    }
    load()
  }, [inquiry.id])

  // Load attachments
  useEffect(() => {
    async function load() {
      const { data } = await supabase.storage
        .from('inquiry-attachments')
        .list(`${inquiry.id}/`, { sortBy: { column: 'created_at', order: 'asc' } })
      if (data) {
        const files = data.map(f => ({
          name: f.name,
          size: f.metadata?.size ?? 0,
          created_at: f.created_at ?? '',
          url: supabase.storage.from('inquiry-attachments').getPublicUrl(`${inquiry.id}/${f.name}`).data.publicUrl,
        }))
        setAttachments(files)
      }
    }
    load()
  }, [inquiry.id])

  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from('inquiries').update({ notes }).eq('id', inquiry.id)
    onUpdate({ ...inquiry, notes })
    setSavingNotes(false)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('inquiries').update({
      ...editForm,
      value: editForm.value ? parseFloat(String(editForm.value)) : null,
      institution_id: editForm.institution_id || null,
      follow_up_date: editForm.follow_up_date || null,
    }).eq('id', inquiry.id).select().single()
    setSaving(false)
    if (data) { onUpdate(data); setEditing(false) }
  }

  async function postComment() {
    if (!comment.trim() || postingComment) return
    setPostingComment(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('full_name').eq('id', user!.id).single()
    const { data } = await supabase.from('comments').insert({
      inquiry_id: inquiry.id,
      user_id: user!.id,
      user_name: profile?.full_name ?? user!.email ?? 'Unknown',
      body: comment.trim(),
    }).select().single()
    if (data) setComments(prev => [...prev, data])
    setComment('')
    setPostingComment(false)
  }

  async function deleteComment(id: string) {
    await supabase.from('comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${inquiry.id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('inquiry-attachments').upload(path, file)
    if (!error) {
      const url = supabase.storage.from('inquiry-attachments').getPublicUrl(path).data.publicUrl
      setAttachments(prev => [...prev, { name: file.name, size: file.size, created_at: new Date().toISOString(), url }])
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function deleteAttachment(name: string, path: string) {
    await supabase.storage.from('inquiry-attachments').remove([`${inquiry.id}/${path}`])
    setAttachments(prev => prev.filter(a => a.name !== name))
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 110, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 16px', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div style={{ background: '#F1F3F7', borderRadius: 14, width: '100%', maxWidth: 860, boxShadow: '0 16px 48px rgba(0,0,0,.18)', animation: 'mIn .2s ease', position: 'relative' }}>

        {/* Header */}
        <div style={{ background: '#fff', borderRadius: '14px 14px 0 0', padding: '20px 22px 16px', borderBottom: '1px solid #E3E7EF', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF2FF', border: '1px solid #C7D2FE', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0, marginTop: 2 }}>📋</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', lineHeight: 1.25, marginBottom: 6 }}>{inquiry.title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {inquiry.type && <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 100, border: `1px solid ${typeStyle.border}`, background: typeStyle.bg, color: typeStyle.color }}>{inquiry.type}</span>}
              {currentStage && <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 100, border: `1px solid ${currentStage.border}`, background: currentStage.bg, color: currentStage.color }}>{inquiry.stage}</span>}
              {instMap[inquiry.institution_id] && <span style={{ fontSize: 11, color: '#64748B' }}>🏫 {instMap[inquiry.institution_id]}</span>}
              {inquiry.channel && <span style={{ fontSize: 11, color: '#64748B' }}>📧 {inquiry.channel}</span>}
            </div>
          </div>
          {inquiry.contact_info && inquiry.contact_info.replace(/\D/g, '').length >= 7 && (
            <a href={waLink(inquiry.contact_info)} target="_blank" rel="noreferrer"
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#10B981', textDecoration: 'none', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <WhatsAppIcon size={15} /> WhatsApp
            </a>
          )}
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid #E3E7EF', background: 'none', cursor: 'pointer', fontSize: 16, color: '#64748B', display: 'grid', placeItems: 'center', flexShrink: 0 }}>✕</button>
        </div>

        {/* Two-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: 400 }}>

          {/* LEFT */}
          <div style={{ padding: '20px 20px 20px 22px', borderRight: '1px solid #E3E7EF', overflowY: 'auto', maxHeight: '70vh' }}>

            {!editing ? (
              <>
                {/* Description */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>≡</span> Description
                  </div>
                  {inquiry.description ? (
                    <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.7, background: '#fff', border: '1px solid #E3E7EF', borderRadius: 8, padding: '12px 14px', whiteSpace: 'pre-wrap' }}>
                      <LinkifyText text={inquiry.description} />
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#94A3B8', fontStyle: 'italic' }}>No description added.</div>
                  )}
                </div>

                {/* Missing info */}
                {inquiry.missing_info && (
                  <div style={{ marginBottom: 22 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#EF4444' }}>?</span> Missing Information Needed
                    </div>
                    <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.65, background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, padding: '12px 14px', whiteSpace: 'pre-wrap' }}>
                      <LinkifyText text={inquiry.missing_info} />
                    </div>
                  </div>
                )}

                {/* Attachments */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📎</span> Attachments
                  </div>

                  {attachments.length === 0 && (
                    <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 8 }}>No attachments yet.</div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 8 }}>
                    {attachments.map(att => {
                      const ext = att.name.split('.').pop()?.toUpperCase() ?? 'FILE'
                      const storageName = att.url.split(`${inquiry.id}/`)[1]
                      return (
                        <div key={att.name} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #E3E7EF', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ width: 38, height: 38, borderRadius: 6, background: '#F1F3F7', border: '1px solid #E3E7EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#64748B', flexShrink: 0 }}>{ext}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <a href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.name}</a>
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{formatSize(att.size)}</div>
                          </div>
                          <button onClick={() => deleteAttachment(att.name, storageName)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 16, padding: '2px 4px', borderRadius: 4 }}
                            title="Remove">✕</button>
                        </div>
                      )
                    })}
                  </div>

                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={uploadFile} />
                  <div onClick={() => fileInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: '1.5px dashed #CBD2DF', borderRadius: 8, cursor: uploading ? 'not-allowed' : 'pointer', background: 'transparent', transition: '.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00BFA5'; (e.currentTarget as HTMLDivElement).style.background = '#E0F2F1' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#CBD2DF'; (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
                    <span style={{ fontSize: 14 }}>{uploading ? '⏳' : '+'}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>{uploading ? 'Uploading…' : 'Attach a file'}</span>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>💬</span> Comments & Activity
                  </div>

                  {loadingComments ? (
                    <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading…</div>
                  ) : comments.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 14 }}>No activity yet. Add the first comment below.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                      {comments.map(c => (
                        <div key={c.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #E3E7EF' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA5,#004D40)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 1 }}>
                            {getInitials(c.user_name)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{c.user_name}</span>
                              <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                                {new Date(c.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} {new Date(c.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#334155', marginTop: 5, lineHeight: 1.6, background: '#fff', border: '1px solid #E3E7EF', borderRadius: 8, padding: '9px 11px', whiteSpace: 'pre-wrap' }}>
                              <LinkifyText text={c.body} />
                            </div>
                            {(isAdmin || c.user_name === currentUserName) && (
                              <div style={{ marginTop: 4 }}>
                                <button onClick={() => setConfirmDeleteComment(c.id)} style={{ fontSize: 11, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>Delete</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment input */}
                  <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid #E3E7EF' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA5,#004D40)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 1 }}>{getInitials(currentUserName)}</div>
                    <div style={{ flex: 1 }}>
                      <textarea value={comment} onChange={e => setComment(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment() }}
                        placeholder="Write a comment or note about this inquiry…"
                        style={{ width: '100%', padding: '9px 11px', border: '1px solid #E3E7EF', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none', resize: 'vertical', minHeight: 40, transition: '.14s' }} />
                      {comment && (
                        <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
                          <button onClick={postComment} disabled={postingComment}
                            style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#6366F1', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: postingComment ? .7 : 1 }}>
                            {postingComment ? 'Posting…' : 'Save'}
                          </button>
                          <button onClick={() => setComment('')} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #E3E7EF', background: '#fff', color: '#334155', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={saveEdit}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 12 }}>Edit Inquiry</div>
                {[
                  { k: 'title', label: 'Title', type: 'text' },
                  { k: 'contact_name', label: 'Contact Name', type: 'text' },
                  { k: 'contact_info', label: 'Contact Info', type: 'text' },
                  { k: 'offering', label: 'Offering', type: 'text' },
                  { k: 'value', label: 'Value (PKR)', type: 'number' },
                  { k: 'rep', label: 'Rep', type: 'rep' },
                  { k: 'follow_up_date', label: 'Follow-up Date', type: 'date' },
                ].map(({ k, label, type }) => (
                  <div key={k} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>{label}</label>
                    {type === 'rep' ? (
                      <select value={(editForm as Record<string, unknown>)[k] as string ?? ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} style={inputStyle}>
                        <option value="">Select rep</option>
                        <option>Tarib</option>
                        <option>Shaheer</option>
                      </select>
                    ) : (
                      <input type={type} value={(editForm as Record<string, string>)[k] ?? ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} style={inputStyle} />
                    )}
                  </div>
                ))}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Institution</label>
                  <InstitutionSearch institutions={institutions} value={editForm.institution_id ?? ''} onChange={v => setEditForm(f => ({ ...f, institution_id: v }))} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Description</label>
                  <textarea value={editForm.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: '#334155', marginBottom: 4, display: 'block' }}>Missing Info</label>
                  <textarea value={editForm.missing_info ?? ''} onChange={e => setEditForm(f => ({ ...f, missing_info: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }} />
                </div>
                <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
                  <button type="button" onClick={() => setEditing(false)} style={{ flex: 1, padding: 8, borderRadius: 7, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#334155' }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ flex: 1, padding: 8, borderRadius: 7, border: 'none', background: '#6366F1', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ padding: '20px 20px 20px 18px', background: '#F8F9FB', borderRadius: '0 0 14px 0', overflowY: 'auto', maxHeight: '70vh' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 8 }}>Stage</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {STAGES.map(s => (
                  <button key={s.label} onClick={() => onStageChange(inquiry.id, s.label)}
                    style={{ padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${s.border}`, background: inquiry.stage === s.label ? s.color : s.bg, color: inquiry.stage === s.label ? '#fff' : s.color, textAlign: 'left', transition: '.13s', width: '100%', fontFamily: 'inherit' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {inquiry.offering && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 3 }}>Offering / Ask</div>
                <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{inquiry.offering}</div>
              </div>
            )}
            {inquiry.value > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 3 }}>Est. Value</div>
                <div style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>PKR {Number(inquiry.value).toLocaleString()}</div>
              </div>
            )}
            {(inquiry.contact_name || inquiry.contact_info) && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 3 }}>Contact Person</div>
                {inquiry.contact_name && <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{inquiry.contact_name}</div>}
                {inquiry.contact_info && <div style={{ fontSize: 12, color: '#64748B' }}>{inquiry.contact_info}</div>}
              </div>
            )}
            {inquiry.follow_up_date && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 3 }}>Follow-up</div>
                <div style={{ fontSize: 13, color: '#F97316', fontWeight: 700 }}>
                  {new Date(inquiry.follow_up_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 3 }}>Created</div>
              <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>
                {new Date(inquiry.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 6 }}>Internal Notes</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E3E7EF', borderRadius: 8, fontSize: 12.5, fontFamily: 'inherit', color: '#0F172A', background: '#fff', outline: 'none', resize: 'vertical', minHeight: 80 }}
                placeholder="Internal notes…" />
              <button onClick={saveNotes} disabled={savingNotes}
                style={{ marginTop: 5, padding: '5px 12px', borderRadius: 6, background: '#EEF2FF', color: '#6366F1', border: 'none', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                {savingNotes ? 'Saving…' : 'Save Notes'}
              </button>
            </div>

            <button onClick={() => setEditing(!editing)}
              style={{ width: '100%', padding: 8, borderRadius: 7, background: '#fff', border: '1px solid #E3E7EF', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6 }}>
              ✏️ Edit Inquiry
            </button>
            {isAdmin && (
              <button onClick={() => setConfirmDelete(true)}
                style={{ width: '100%', padding: 8, borderRadius: 7, background: '#fff', border: '1px solid #FECACA', fontSize: 12.5, fontWeight: 600, color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                🗑 Delete
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes mIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:none}}`}</style>

      {confirmDeleteComment && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px 22px', width: 320, boxShadow: '0 16px 48px rgba(0,0,0,.18)', animation: 'mIn .15s ease', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 14px' }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Delete Comment?</div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 22, lineHeight: 1.5 }}>
              Are you sure you want to delete this comment? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDeleteComment(null)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #E3E7EF', background: '#fff', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={() => { deleteComment(confirmDeleteComment); setConfirmDeleteComment(null) }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px 22px', width: 340, boxShadow: '0 16px 48px rgba(0,0,0,.18)', animation: 'mIn .15s ease', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 14px' }}>🗑</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Delete Inquiry?</div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 22, lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{inquiry.title}"</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #E3E7EF', background: '#fff', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={() => onDelete(inquiry.id)}
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
