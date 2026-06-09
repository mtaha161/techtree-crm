import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (user) {
      // Insert new users with pending status; ignore if they already exist
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email,
        role: 'user',
        status: 'pending',
      }, { onConflict: 'id', ignoreDuplicates: true })
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
