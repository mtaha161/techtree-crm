import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { message, history } = await request.json()

  const supabase = await createClient()

  const [
    { data: institutions },
    { data: inquiries },
    { data: contacts },
  ] = await Promise.all([
    supabase.from('institutions').select('name, city, stage, offering, principal, phone, follow_up_date, rep, students, campuses, source, notes').order('created_at', { ascending: false }),
    supabase.from('inquiries').select('title, type, stage, channel, offering, value, rep, follow_up_date, description, contact_name').order('created_at', { ascending: false }),
    supabase.from('contacts').select('name, type, org, city, phone, email').order('created_at', { ascending: false }),
  ])

  const today = new Date().toISOString().split('T')[0]

  const systemPrompt = `You are TechTree CRM AI Assistant. You help the sales team at TechTree — a Pakistani EdTech company that provides STEAM programs to schools.

Today's date: ${today}

## INSTITUTIONS (${institutions?.length ?? 0} total)
${institutions?.map(i => `- ${i.name} | City: ${i.city || 'N/A'} | Stage: ${i.stage} | Rep: ${i.rep || 'Unassigned'} | Offering: ${i.offering || 'N/A'} | Principal: ${i.principal || 'N/A'} | Students: ${i.students || 'N/A'} | Follow-up: ${i.follow_up_date || 'None'}`).join('\n') ?? 'No institutions yet'}

## INQUIRIES (${inquiries?.length ?? 0} total)
${inquiries?.map(i => `- ${i.title} | Type: ${i.type} | Stage: ${i.stage} | Rep: ${i.rep || 'N/A'} | Value: PKR ${i.value || 0} | Channel: ${i.channel || 'N/A'} | Offering: ${i.offering || 'N/A'} | Follow-up: ${i.follow_up_date || 'None'}`).join('\n') ?? 'No inquiries yet'}

## CONTACTS (${contacts?.length ?? 0} total)
${contacts?.map(c => `- ${c.name} | Type: ${c.type} | Org: ${c.org || 'N/A'} | City: ${c.city || 'N/A'}`).join('\n') ?? 'No contacts yet'}

## INSTRUCTIONS
- Answer questions about the CRM data above only
- Be concise — you are in a chat interface, keep replies short and scannable
- Use bullet points for lists
- Prefix monetary values with PKR
- For pipeline value questions, sum up inquiry values
- For follow-up questions, compare follow_up_date fields against today (${today})
- If something is not in the data, say so honestly — do not make up data`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(history ?? []).map((h: { role: string; content: string }) => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.content,
    })),
    { role: 'user', content: message },
  ]

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.4,
      max_tokens: 800,
    }),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('Groq error:', JSON.stringify(data))
    return NextResponse.json({ response: `API Error: ${data.error?.message ?? JSON.stringify(data)}` })
  }

  const text = data.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response. Please try again.'

  return NextResponse.json({ response: text })
}
