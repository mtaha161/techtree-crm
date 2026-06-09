import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STAGE_COLORS: Record<string, string> = {
  'Prospecting': '#94A3B8', 'Meeting Booked': '#6366F1', 'Proposal Sent': '#F59E0B',
  'Negotiating': '#F97316', 'Contract Signed': '#00BFA5', 'Active Partner': '#10B981',
  'Not Interested': '#EF4444', 'New': '#94A3B8', 'Qualifying': '#6366F1',
  'Proposal': '#F59E0B', 'Won': '#10B981', 'Lost': '#EF4444',
}

const INST_STAGES = ['Prospecting','Meeting Booked','Proposal Sent','Negotiating','Contract Signed','Active Partner','Not Interested']
const INQ_STAGES = ['New','Qualifying','Proposal','Negotiating','Won','Lost']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: institutions },
    { data: inquiries },
    { data: contacts },
    { data: approvedUsers },
  ] = await Promise.all([
    supabase.from('institutions').select('*').order('created_at', { ascending: false }),
    supabase.from('inquiries').select('*').order('created_at', { ascending: false }),
    supabase.from('contacts').select('id, type, created_at').order('created_at', { ascending: false }),
    supabase.from('users').select('id, full_name').eq('status', 'approved').eq('role', 'user').order('full_name'),
  ])

  const insts = institutions ?? []
  const inqs = inquiries ?? []

  // ── Stats ──────────────────────────────────────────────
  const activePartners = insts.filter(i => i.stage === 'Active Partner').length
  const wonInqs = inqs.filter(i => i.stage === 'Won').length
  const lostInqs = inqs.filter(i => i.stage === 'Lost').length
  const winRate = wonInqs + lostInqs > 0 ? Math.round((wonInqs / (wonInqs + lostInqs)) * 100) : 0
  const pipelineValue = inqs.filter(i => !['Won','Lost'].includes(i.stage)).reduce((s, i) => s + (Number(i.value) || 0), 0)
  const wonValue = inqs.filter(i => i.stage === 'Won').reduce((s, i) => s + (Number(i.value) || 0), 0)

  // ── Follow-ups ─────────────────────────────────────────
  const overdueInsts = insts.filter(i => i.follow_up_date && i.follow_up_date < today && !['Active Partner','Not Interested'].includes(i.stage))
  const todayInsts = insts.filter(i => i.follow_up_date === today)
  const overdueInqs = inqs.filter(i => i.follow_up_date && i.follow_up_date < today && !['Won','Lost'].includes(i.stage))
  const todayInqs = inqs.filter(i => i.follow_up_date === today)
  const allFollowUps = [
    ...overdueInsts.map(i => ({ type: 'Institution' as const, name: i.name, stage: i.stage, sub: i.city, date: i.follow_up_date, id: i.id, overdue: true, href: '/dashboard/institutions' })),
    ...todayInsts.map(i => ({ type: 'Institution' as const, name: i.name, stage: i.stage, sub: i.city, date: i.follow_up_date, id: i.id, overdue: false, href: '/dashboard/institutions' })),
    ...overdueInqs.map(i => ({ type: 'Inquiry' as const, name: i.title, stage: i.stage, sub: i.rep, date: i.follow_up_date, id: i.id, overdue: true, href: '/dashboard/inquiries' })),
    ...todayInqs.map(i => ({ type: 'Inquiry' as const, name: i.title, stage: i.stage, sub: i.rep, date: i.follow_up_date, id: i.id, overdue: false, href: '/dashboard/inquiries' })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  // ── Rep stats ──────────────────────────────────────────
  const reps = (approvedUsers ?? []).map(u => u.full_name).filter(Boolean)
  const repStats = reps.map(rep => ({
    name: rep,
    total: inqs.filter(i => i.rep === rep).length,
    won: inqs.filter(i => i.rep === rep && i.stage === 'Won').length,
    active: inqs.filter(i => i.rep === rep && !['Won','Lost'].includes(i.stage)).length,
    value: inqs.filter(i => i.rep === rep && i.stage === 'Won').reduce((s, i) => s + (Number(i.value) || 0), 0),
  }))

  // ── Stage funnels ──────────────────────────────────────
  const instByStage = INST_STAGES.map(s => ({ stage: s, count: insts.filter(i => i.stage === s).length }))
  const inqByStage = INQ_STAGES.map(s => ({ stage: s, count: inqs.filter(i => i.stage === s).length }))
  const maxInst = Math.max(...instByStage.map(s => s.count), 1)
  const maxInq = Math.max(...inqByStage.map(s => s.count), 1)

  // ── Recent activity ─────────────────────────────────────
  const recentActivity = [
    ...insts.slice(0, 6).map(i => ({ type: 'Institution', name: i.name, stage: i.stage, sub: i.city, created_at: i.created_at, href: '/dashboard/institutions' })),
    ...inqs.slice(0, 6).map(i => ({ type: 'Inquiry', name: i.title, stage: i.stage, sub: i.rep, created_at: i.created_at, href: '/dashboard/inquiries' })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)

  const fmt = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : String(n)

  return (
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', height: '100%' }}>

      {/* ── Follow-ups due ── */}
      {allFollowUps.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${overdueInsts.length + overdueInqs.length > 0 ? '#FECACA' : '#FDE68A'}`, borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 16 }}>{overdueInsts.length + overdueInqs.length > 0 ? '🔴' : '📅'}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              Follow-ups
              {overdueInsts.length + overdueInqs.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
                  {overdueInsts.length + overdueInqs.length} overdue
                </span>
              )}
              {todayInsts.length + todayInqs.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#FFFBEB', color: '#F59E0B', border: '1px solid #FDE68A' }}>
                  {todayInsts.length + todayInqs.length} due today
                </span>
              )}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allFollowUps.slice(0, 8).map((f, i) => (
              <Link key={i} href={f.href}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, border: `1px solid ${f.overdue ? '#FECACA' : '#FDE68A'}`, background: f.overdue ? '#FEF2F2' : '#FFFBEB', textDecoration: 'none', transition: '.12s' }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '1px 7px', borderRadius: 100, background: '#fff', border: `1px solid ${STAGE_COLORS[f.stage] ?? '#94A3B8'}44`, color: STAGE_COLORS[f.stage] ?? '#94A3B8', flexShrink: 0 }}>{f.type}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', flex: 1 }}>{f.name}</span>
                {f.sub && <span style={{ fontSize: 11.5, color: '#64748B' }}>{f.sub}</span>}
                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: f.overdue ? '#EF4444' : '#F59E0B', flexShrink: 0 }}>
                  {f.overdue ? `Overdue · ${new Date(f.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}` : 'Today'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Total Institutions', value: insts.length, sub: `${activePartners} active partners`, color: '#00BFA5', pct: activePartners / Math.max(insts.length, 1) },
          { label: 'Pipeline Value', value: `PKR ${fmt(pipelineValue)}`, sub: `PKR ${fmt(wonValue)} won`, color: '#6366F1', pct: wonValue / Math.max(pipelineValue + wonValue, 1) },
          { label: 'Win Rate', value: `${winRate}%`, sub: `${wonInqs} won · ${lostInqs} lost`, color: winRate >= 50 ? '#10B981' : '#F97316', pct: winRate / 100 },
          { label: 'Overdue Follow-ups', value: overdueInsts.length + overdueInqs.length, sub: `${todayInsts.length + todayInqs.length} due today`, color: overdueInsts.length + overdueInqs.length > 0 ? '#EF4444' : '#10B981', pct: 0 },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#64748B', marginBottom: 7 }}>{stat.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>{stat.sub}</div>
            <div style={{ height: 3, background: '#F1F3F7', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round(stat.pct * 100)}%`, background: stat.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Rep performance ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {repStats.map(rep => (
          <div key={rep.name} style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA5,#004D40)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {rep.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{rep.name}</div>
                <div style={{ fontSize: 11.5, color: '#64748B' }}>Sales Rep</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>PKR {fmt(rep.value)} won</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Total', value: rep.total, color: '#6366F1' },
                { label: 'Active', value: rep.active, color: '#F59E0B' },
                { label: 'Won', value: rep.won, color: '#10B981' },
              ].map(s => (
                <div key={s.label} style={{ background: '#F8F9FB', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {rep.total > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Win rate</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>{rep.won + lostInqs > 0 ? Math.round(rep.won / (rep.won + inqs.filter(i => i.rep === rep.name && i.stage === 'Lost').length) * 100) : 0}%</span>
                </div>
                <div style={{ height: 4, background: '#F1F3F7', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${rep.total > 0 ? Math.round((rep.won / rep.total) * 100) : 0}%`, background: '#10B981', borderRadius: 2 }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Funnels ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Institution funnel */}
        <div style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>Institution Pipeline</div>
          {instByStage.map(({ stage, count }) => (
            <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, width: 130, flexShrink: 0, color: '#334155' }}>{stage}</div>
              <div style={{ flex: 1, height: 8, background: '#F1F3F7', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((count / maxInst) * 100)}%`, background: STAGE_COLORS[stage] ?? '#94A3B8', borderRadius: 4, transition: 'width .5s ease' }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B', width: 20, textAlign: 'right', fontWeight: 700 }}>{count}</div>
            </div>
          ))}
        </div>

        {/* Inquiry funnel */}
        <div style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>Inquiry Pipeline</div>
          {inqByStage.map(({ stage, count }) => (
            <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, width: 130, flexShrink: 0, color: '#334155' }}>{stage}</div>
              <div style={{ flex: 1, height: 8, background: '#F1F3F7', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((count / maxInq) * 100)}%`, background: STAGE_COLORS[stage] ?? '#94A3B8', borderRadius: 4, transition: 'width .5s ease' }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B', width: 20, textAlign: 'right', fontWeight: 700 }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent activity ── */}
      <div style={{ background: '#fff', border: '1px solid #E3E7EF', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Recent Activity</div>
        {recentActivity.length === 0 && (
          <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>No records yet.</div>
        )}
        {recentActivity.map((item, i) => (
          <Link key={i} href={item.href}
            style={{ display: 'flex', gap: 9, padding: '7px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid #E3E7EF' : 'none', textDecoration: 'none', cursor: 'pointer', transition: '.12s' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[item.stage] ?? '#94A3B8', marginTop: 5, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{item.name}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                <span style={{ color: '#94A3B8' }}>{item.type}</span>
                {item.sub ? ` · ${item.sub}` : ''}
                {' · '}<span style={{ color: STAGE_COLORS[item.stage] ?? '#94A3B8' }}>{item.stage}</span>
              </div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
              {new Date(item.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
