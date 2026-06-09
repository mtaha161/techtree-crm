'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const INST_STAGES = [
  { label: 'Prospecting', color: '#94A3B8' },
  { label: 'Meeting Booked', color: '#6366F1' },
  { label: 'Proposal Sent', color: '#F59E0B' },
  { label: 'Negotiating', color: '#F97316' },
  { label: 'Contract Signed', color: '#00BFA5' },
  { label: 'Active Partner', color: '#10B981' },
  { label: 'Not Interested', color: '#EF4444' },
]

const INQ_STAGES = [
  { label: 'New', color: '#94A3B8' },
  { label: 'Qualifying', color: '#6366F1' },
  { label: 'Proposal', color: '#F59E0B' },
  { label: 'Negotiating', color: '#F97316' },
  { label: 'Won', color: '#10B981' },
  { label: 'Lost', color: '#EF4444' },
]

const INQ_TYPES = [
  { label: 'Standard', icon: '📦' },
  { label: 'Custom', icon: '🔧' },
  { label: 'Novel', icon: '💡' },
]

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '◈', exact: true },
  { href: '/dashboard/institutions', label: 'Institutions', icon: '🏫' },
  { href: '/dashboard/inquiries', label: 'Inquiries', icon: '📋' },
  { href: '/dashboard/contacts', label: 'Contacts', icon: '👥' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const isInstitutions = pathname.startsWith('/dashboard/institutions')
  const isInquiries = pathname.startsWith('/dashboard/inquiries')
  const isContacts = pathname.startsWith('/dashboard/contacts')

  const [instCounts, setInstCounts] = useState<Record<string, number>>({})
  const [inqStageCounts, setInqStageCounts] = useState<Record<string, number>>({})
  const [inqTypeCounts, setInqTypeCounts] = useState<Record<string, number>>({})
  const [inqTotal, setInqTotal] = useState(0)
  const [contactTypeCounts, setContactTypeCounts] = useState<Record<string, number>>({})
  const [contactTotal, setContactTotal] = useState(0)

  useEffect(() => {
    supabase.from('contacts').select('type').then(({ data }) => {
      const counts: Record<string, number> = {}
      data?.forEach(c => { counts[c.type] = (counts[c.type] ?? 0) + 1 })
      setContactTypeCounts(counts)
      setContactTotal(data?.length ?? 0)
    })
    supabase.from('institutions').select('stage').then(({ data }) => {
      const counts: Record<string, number> = {}
      data?.forEach(i => { counts[i.stage] = (counts[i.stage] ?? 0) + 1 })
      setInstCounts(counts)
    })
    supabase.from('inquiries').select('stage, type').then(({ data }) => {
      const stageCounts: Record<string, number> = {}
      const typeCounts: Record<string, number> = {}
      data?.forEach(i => {
        stageCounts[i.stage] = (stageCounts[i.stage] ?? 0) + 1
        typeCounts[i.type] = (typeCounts[i.type] ?? 0) + 1
        })
        setInqStageCounts(stageCounts)
        setInqTypeCounts(typeCounts)
        setInqTotal(data?.length ?? 0)
      })
  }, [pathname])

  const activeStage = searchParams.get('stage') ?? ''
  const activeType = searchParams.get('type') ?? ''

  function filterStage(stage: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('stage') === stage) { params.delete('stage') } else { params.set('stage', stage); params.delete('type') }
    router.push(`${pathname}?${params.toString()}`)
  }

  function filterType(type: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get('type') === type) { params.delete('type') } else { params.set('type', type); params.delete('stage') }
    router.push(`${pathname}?${params.toString()}`)
  }

  const sidebarItem = (label: string, color: string, count: number, active: boolean, onClick: () => void) => (
    <div key={label} onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', background: active ? '#E0F2F1' : 'transparent', transition: '.12s' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: active ? '#00897B' : '#334155' }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 10, color: active ? '#00897B' : '#94A3B8' }}>{count}</span>
    </div>
  )

  return (
    <aside style={{ width: 210, flexShrink: 0, background: '#fff', borderRight: '1px solid #E3E7EF', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '12px 8px' }}>

      {/* Main nav */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '6px 8px 5px' }}>Navigation</div>
      {NAV_ITEMS.map(item => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link key={item.href} href={item.href}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, textDecoration: 'none', transition: '.12s', color: active ? '#00897B' : '#334155', background: active ? '#E0F2F1' : 'transparent' }}>
            <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}

      {/* Institution pipeline stages */}
      {isInstitutions && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>Pipeline Stage</div>

          {/* All */}
          <div onClick={() => router.push('/dashboard/institutions')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', background: !activeStage ? '#E0F2F1' : 'transparent', transition: '.12s' }}
            onMouseEnter={e => { if (activeStage) (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB' }}
            onMouseLeave={e => { if (activeStage) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
            <span style={{ fontSize: 13 }}>🌐</span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: !activeStage ? '#00897B' : '#334155' }}>All Institutions</span>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: !activeStage ? '#00897B' : '#94A3B8' }}>{Object.values(instCounts).reduce((a, b) => a + b, 0)}</span>
          </div>

          {INST_STAGES.map(s => sidebarItem(s.label, s.color, instCounts[s.label] ?? 0, activeStage === s.label, () => filterStage(s.label)))}

          {/* Other Contacts */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>Other Contacts</div>
          {[
            { label: 'All Contacts', icon: '🌐', href: '/dashboard/contacts' },
            { label: 'Maker Parents', icon: '⚡', href: '/dashboard/contacts?type=Maker+Parent' },
            { label: 'Connectors', icon: '🤝', href: '/dashboard/contacts?type=Connector' },
            { label: 'Advisors', icon: '🔭', href: '/dashboard/contacts?type=Advisor' },
            { label: 'Maker Students', icon: '🔬', href: '/dashboard/contacts?type=Maker+Student' },
          ].map(item => (
            <Link key={item.label} href={item.href}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, fontSize: 12, fontWeight: 500, textDecoration: 'none', color: '#334155', transition: '.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#F8F9FB'}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}>
              <span style={{ fontSize: 13 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          ))}

          {/* Actions */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>Actions</div>
          <div onClick={() => { const event = new CustomEvent('institutions:export'); window.dispatchEvent(event) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', transition: '.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
            <span style={{ fontSize: 13 }}>↓</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>Export CSV</span>
          </div>
          {activeStage && (
            <div onClick={() => router.push('/dashboard/institutions')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', transition: '.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FEF2F2'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
              <span style={{ fontSize: 13 }}>✕</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#EF4444' }}>Clear filters</span>
            </div>
          )}
        </>
      )}

      {/* Inquiry stages + types */}
      {isInquiries && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>Inquiry Stage</div>

          {/* All */}
          <div onClick={() => router.push('/dashboard/inquiries')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', background: !activeStage && !activeType ? '#E0F2F1' : 'transparent', transition: '.12s' }}
            onMouseEnter={e => { if (activeStage || activeType) (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB' }}
            onMouseLeave={e => { if (activeStage || activeType) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
            <span style={{ fontSize: 13 }}>🌐</span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: !activeStage && !activeType ? '#00897B' : '#334155' }}>All Inquiries</span>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: !activeStage && !activeType ? '#00897B' : '#94A3B8' }}>{inqTotal}</span>
          </div>

          {INQ_STAGES.map(s => sidebarItem(s.label, s.color, inqStageCounts[s.label] ?? 0, activeStage === s.label, () => filterStage(s.label)))}

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>By Type</div>

          {INQ_TYPES.map(t => (
            <div key={t.label} onClick={() => filterType(t.label)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', background: activeType === t.label ? '#E0F2F1' : 'transparent', transition: '.12s' }}
              onMouseEnter={e => { if (activeType !== t.label) (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB' }}
              onMouseLeave={e => { if (activeType !== t.label) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: activeType === t.label ? '#00897B' : '#334155' }}>{t.label}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: activeType === t.label ? '#00897B' : '#94A3B8' }}>{inqTypeCounts[t.label] ?? 0}</span>
            </div>
          ))}

          {/* Actions */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>Actions</div>

          <div onClick={() => {
            const params = new URLSearchParams()
            // build CSV from page — navigate to trigger export via query param
            const event = new CustomEvent('inquiries:export')
            window.dispatchEvent(event)
          }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', transition: '.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
            <span style={{ fontSize: 13 }}>↓</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>Export CSV</span>
          </div>

          {(activeStage || activeType) && (
            <div onClick={() => router.push('/dashboard/inquiries')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', transition: '.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FEF2F2'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
              <span style={{ fontSize: 13 }}>✕</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#EF4444' }}>Clear filters</span>
            </div>
          )}
        </>
      )}

      {/* Contacts sidebar */}
      {isContacts && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>Contact Type</div>

          <div onClick={() => router.push('/dashboard/contacts')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', background: !activeType ? '#E0F2F1' : 'transparent', transition: '.12s' }}
            onMouseEnter={e => { if (activeType) (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB' }}
            onMouseLeave={e => { if (activeType) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
            <span style={{ fontSize: 13 }}>🌐</span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: !activeType ? '#00897B' : '#334155' }}>All Contacts</span>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: !activeType ? '#00897B' : '#94A3B8' }}>{contactTotal}</span>
          </div>

          {[
            { label: 'Maker Parent', icon: '⚡' },
            { label: 'Maker Student', icon: '🔬' },
            { label: 'Advisor', icon: '🔭' },
            { label: 'Connector', icon: '🤝' },
            { label: 'Trainer', icon: '🎓' },
            { label: 'Community', icon: '🌍' },
            { label: 'Other', icon: '👤' },
          ].map(t => (
            <div key={t.label}
              onClick={() => router.push(`/dashboard/contacts?type=${encodeURIComponent(t.label)}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', background: activeType === t.label ? '#E0F2F1' : 'transparent', transition: '.12s' }}
              onMouseEnter={e => { if (activeType !== t.label) (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB' }}
              onMouseLeave={e => { if (activeType !== t.label) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: activeType === t.label ? '#00897B' : '#334155' }}>{t.label}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#94A3B8' }}>{contactTypeCounts[t.label] ?? 0}</span>
            </div>
          ))}

          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>Actions</div>
          <div onClick={() => { const e = new CustomEvent('contacts:export'); window.dispatchEvent(e) }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', transition: '.12s' }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F8F9FB'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
            <span style={{ fontSize: 13 }}>↓</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>Export CSV</span>
          </div>
          {activeType && (
            <div onClick={() => router.push('/dashboard/contacts')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 7, cursor: 'pointer', transition: '.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FEF2F2'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
              <span style={{ fontSize: 13 }}>✕</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#EF4444' }}>Clear filters</span>
            </div>
          )}
        </>
      )}

      {/* Default: show both stage lists when not on a specific module */}
      {!isInstitutions && !isInquiries && !isContacts && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>Pipeline Stages</div>
          {INST_STAGES.map(s => (
            <Link key={s.label} href={`/dashboard/institutions?stage=${encodeURIComponent(s.label)}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: 'none', color: '#334155' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ flex: 1 }}>{s.label}</span>
            </Link>
          ))}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', padding: '14px 8px 5px' }}>Inquiry Stages</div>
          {INQ_STAGES.map(s => (
            <Link key={s.label} href={`/dashboard/inquiries?stage=${encodeURIComponent(s.label)}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: 'none', color: '#334155' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ flex: 1 }}>{s.label}</span>
            </Link>
          ))}
        </>
      )}
    </aside>
  )
}
