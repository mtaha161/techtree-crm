import { createClient } from '@/lib/supabase/server'
import InquiriesClient from './InquiriesClient'

export default async function InquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: inquiries }, { data: institutions }, { data: profile }, { data: approvedUsers }] = await Promise.all([
    supabase.from('inquiries').select('*').order('created_at', { ascending: false }),
    supabase.from('institutions').select('id, name').order('name'),
    supabase.from('users').select('id, full_name, role').eq('id', user!.id).single(),
    supabase.from('users').select('id, full_name').eq('status', 'approved').order('full_name'),
  ])

  return (
    <InquiriesClient
      initialData={inquiries ?? []}
      institutions={institutions ?? []}
      currentUser={profile ?? null}
      approvedUsers={approvedUsers ?? []}
    />
  )
}
