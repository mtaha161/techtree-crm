import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import ChatBot from '@/components/ChatBot'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#F1F3F7' }}>
      <Topbar profile={profile} />
      <div className="flex flex-1 overflow-hidden">
        <Suspense fallback={<div style={{ width: 210, flexShrink: 0, background: '#fff', borderRight: '1px solid #E3E7EF' }} />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <ChatBot />
    </div>
  )
}
