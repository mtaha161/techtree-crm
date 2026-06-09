'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  created_at: string
}

export default function AdminClient({ users: initialUsers, currentUserId }: { users: User[]; currentUserId: string }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const supabase = createClient()

  const pending = users.filter(u => u.status === 'pending')
  const approved = users.filter(u => u.status === 'approved')

  async function approve(id: string) {
    setLoading(id)
    await supabase.from('users').update({ status: 'approved' }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'approved' } : u))
    setLoading(null)
  }

  async function reject(id: string) {
    setLoading(id)
    await supabase.from('users').update({ status: 'rejected' }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'rejected' } : u))
    setLoading(null)
  }

  async function setRole(id: string, role: string) {
    await supabase.from('users').update({ role }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  async function deleteUser(id: string) {
    setLoading(id)
    await supabase.from('users').delete().eq('id', id)
    setUsers(prev => prev.filter(u => u.id !== id))
    setConfirmDelete(null)
    setLoading(null)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      approved: { bg: '#ECFDF5', color: '#10B981', border: '#A7F3D0' },
      pending:  { bg: '#FFFBEB', color: '#F59E0B', border: '#FDE68A' },
      rejected: { bg: '#FEF2F2', color: '#EF4444', border: '#FECACA' },
    }
    const s = map[status] ?? map.pending
    return (
      <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, border: `1px solid ${s.border}`, background: s.bg, color: s.color }}>
        {status}
      </span>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>Pending Approval</h2>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#FFFBEB', color: '#F59E0B', border: '1px solid #FDE68A' }}>{pending.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map(u => (
              <div key={u.id} style={{ background: '#fff', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {(u.full_name || u.email).charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{u.full_name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{u.email}</div>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                  {new Date(u.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => approve(u.id)} disabled={loading === u.id}
                    style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#10B981', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: loading === u.id ? .6 : 1 }}>
                    ✓ Approve
                  </button>
                  <button onClick={() => reject(u.id)} disabled={loading === u.id}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #FECACA', background: '#fff', color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '14px 18px', marginBottom: 28, fontSize: 13, color: '#10B981', fontWeight: 600 }}>
          ✓ No pending approvals
        </div>
      )}

      {/* All users */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>All Users ({users.length})</h2>
        <div style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['User','Email','Role','Status','Joined',''].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#64748B', background: '#F8F9FB', borderBottom: '1px solid #E3E7EF' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA5,#004D40)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {(u.full_name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                        {u.full_name || '—'}
                        {u.id === currentUserId && <span style={{ marginLeft: 6, fontSize: 10, color: '#94A3B8' }}>(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#334155', borderBottom: '1px solid #E3E7EF' }}>{u.email}</td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                    {u.id === currentUserId ? (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE' }}>{u.role}</span>
                    ) : (
                      <select value={u.role} onChange={e => setRole(u.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #E3E7EF', background: '#fff', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {statusBadge(u.status)}
                      {u.status === 'pending' && u.id !== currentUserId && (
                        <button onClick={() => approve(u.id)}
                          style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5, border: 'none', background: '#10B981', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: '#94A3B8', borderBottom: '1px solid #E3E7EF', fontFamily: 'monospace' }}>
                    {new Date(u.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td style={{ padding: '11px 14px', borderBottom: '1px solid #E3E7EF' }}>
                    {u.id !== currentUserId && (
                      <button onClick={() => setConfirmDelete({ id: u.id, name: u.full_name || u.email })}
                        style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', fontSize: 11.5, fontWeight: 600, color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit' }}>
                        🗑 Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 28px 22px', width: 340, boxShadow: '0 16px 48px rgba(0,0,0,.18)', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', border: '1px solid #FECACA', display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 14px' }}>🗑</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Delete User?</div>
            <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 22, lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>? They will immediately lose access. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid #E3E7EF', background: '#fff', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={() => deleteUser(confirmDelete.id)} disabled={loading === confirmDelete.id}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: loading === confirmDelete.id ? .6 : 1 }}>
                {loading === confirmDelete.id ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
