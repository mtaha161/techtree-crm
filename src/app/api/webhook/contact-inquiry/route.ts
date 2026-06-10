import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function nextDayDate(): string {
  // Use Pakistan timezone (UTC+5) so follow-up is always "tomorrow" in local time
  const now = new Date()
  const pk = new Date(now.getTime() + (5 * 60 + now.getTimezoneOffset()) * 60000)
  pk.setDate(pk.getDate() + 1)
  const yyyy = pk.getFullYear()
  const mm = String(pk.getMonth() + 1).padStart(2, '0')
  const dd = String(pk.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, email, phone, offering, school, city, role, grade_levels, message } = body

  if (!name || !email || !school) {
    return NextResponse.json({ error: 'name, email and school are required' }, { status: 400 })
  }

  // get Tarib's full name from users table (for institution rep which uses full name)
  const { data: tarib } = await supabase
    .from('users')
    .select('full_name')
    .ilike('full_name', '%tarib%')
    .maybeSingle()
  const repFullName = tarib?.full_name ?? 'Tarib'
  const repName = 'Tarib' // inquiry rep dropdown only accepts 'Tarib' or 'Shaheer'

  const followUp = nextDayDate()

  // role mapping: Principal → principal field, anything else → steam_lead
  const isPrincipal = role?.toLowerCase().includes('principal') || role?.toLowerCase().includes('head')
  const principalVal = isPrincipal ? name : ''
  const steamLeadVal = !isPrincipal ? name : ''

  // 1 — find existing institution or create new one
  let institution_id: string | null = null

  const { data: existing } = await supabase
    .from('institutions')
    .select('id')
    .ilike('name', school.trim())
    .maybeSingle()

  if (existing) {
    institution_id = existing.id
  } else {
    const { data: newInst, error: instError } = await supabase
      .from('institutions')
      .insert({
        name: school.trim(),
        city: city ?? '',
        stage: 'Prospecting',
        email: email ?? '',
        phone: phone ?? '',
        grades: grade_levels ?? '',
        principal: principalVal,
        steam_lead: steamLeadVal,
        offering: offering ?? '',
        source: 'Website',
        follow_up_date: followUp,
        rep: repFullName,
      })
      .select('id')
      .single()

    if (instError) {
      return NextResponse.json({ error: instError.message }, { status: 500 })
    }
    institution_id = newInst.id
  }

  // 2 — create inquiry
  const title = offering ? `${school} — ${offering}` : school

  const { error: inqError } = await supabase.from('inquiries').insert({
    title,
    type: 'Standard',
    stage: 'New',
    institution_id,
    offering: offering ?? '',
    channel: 'Website',
    contact_name: name,
    contact_info: phone ?? email,
    rep: repName,
    description: message ?? '',
    follow_up_date: followUp,
  })

  if (inqError) {
    return NextResponse.json({ error: inqError.message }, { status: 500 })
  }

  // 3 — create contact
  await supabase.from('contacts').insert({
    name,
    email,
    phone: phone ?? '',
    role: role ?? '',
    city: city ?? '',
    school: school ?? '',
    type: 'Other',
    source: 'Website',
  })

  return NextResponse.json({ success: true })
}
