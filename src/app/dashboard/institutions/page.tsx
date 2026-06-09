import { createClient } from '@/lib/supabase/server'
import InstitutionsClient from './InstitutionsClient'

export default async function InstitutionsPage() {
  const supabase = await createClient()
  const [{ data: institutions }, { data: inquiries }] = await Promise.all([
    supabase.from('institutions').select('*').order('created_at', { ascending: false }),
    supabase.from('inquiries').select('id, institution_id'),
  ])

  // count inquiries per institution
  const inqCounts: Record<string, number> = {}
  inquiries?.forEach(i => {
    if (i.institution_id) inqCounts[i.institution_id] = (inqCounts[i.institution_id] ?? 0) + 1
  })

  return <InstitutionsClient initialData={institutions ?? []} inqCounts={inqCounts} />
}
