'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'

interface Profile {
  full_name: string
  email: string
  role: string
}

export default function Topbar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const tabs = [
    { href: '/dashboard/institutions', label: 'Institution Sales', icon: '🏫' },
    { href: '/dashboard/inquiries', label: 'Inquiries', icon: '📋' },
    { href: '/dashboard', label: 'Dashboard', icon: '◈', exact: true },
  ]

  return (
    <nav style={{ height: 54, background: '#0C1A2E', borderBottom: '1px solid rgba(255,255,255,.05)', flexShrink: 0 }}
      className="flex items-center px-4 gap-2">

      {/* Logo */}
      <div className="flex items-center mr-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logott-whitenew.png" alt="TechTree" style={{ height: 28, width: 'auto', objectFit: 'contain', display: 'block' }} />
        <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,.3)', letterSpacing: '.08em', textTransform: 'uppercase', marginLeft: 6 }}>· CRM</span>
      </div>

      {/* Nav tabs */}
      {tabs.map(tab => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        return (
          <Link key={tab.href} href={tab.href}
            style={{ padding: '5px 13px', borderRadius: 6, fontSize: 12.5, fontWeight: 600, color: active ? '#fff' : 'rgba(255,255,255,.45)', background: active ? 'rgba(255,255,255,.11)' : 'none', display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '.01em', textDecoration: 'none', transition: '.15s' }}>
            <span style={{ fontSize: 13 }}>{tab.icon}</span>
            {tab.label}
          </Link>
        )
      })}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">

        {/* Avatar + dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button onClick={() => setOpen(o => !o)}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA5,#004D40)', border: open ? '2px solid #00BFA5' : '2px solid transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', display: 'grid', placeItems: 'center', transition: '.15s' }}>
            {initials}
          </button>

          {open && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.15)', border: '1px solid #E3E7EF', zIndex: 200, overflow: 'hidden', animation: 'fadeDown .15s ease' }}>

              {/* Profile header */}
              <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #E3E7EF', background: '#F8F9FB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#00BFA5,#004D40)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'User'}</div>
                    <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.email}</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: profile?.role === 'admin' ? '#EEF2FF' : '#F8F9FB', color: profile?.role === 'admin' ? '#6366F1' : '#64748B', border: `1px solid ${profile?.role === 'admin' ? '#C7D2FE' : '#E3E7EF'}` }}>
                    {profile?.role === 'admin' ? '⚡ Admin' : '👤 User'}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              {profile?.role === 'admin' && (
                <Link href="/dashboard/admin" onClick={() => setOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', fontSize: 13, color: '#334155', textDecoration: 'none', transition: '.12s', borderBottom: '1px solid #F1F3F7' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FB')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <span style={{ fontSize: 15 }}>🛡</span>
                  <span style={{ fontWeight: 500 }}>Admin Panel</span>
                  {/* pending count would go here */}
                </Link>
              )}

              <button onClick={signOut}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', fontSize: 13, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit', transition: '.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <span style={{ fontSize: 15 }}>→</span>
                <span style={{ fontWeight: 500 }}>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
    </nav>
  )
}
