'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'ai'
  content: string
  time: string
}

const QUICK_QUESTIONS = [
  'Which schools are in Proposal Sent stage?',
  'Show me all Novel inquiries',
  'What inquiries need follow-up today?',
  'Which institutions are Active Partners?',
]

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    role: 'ai',
    content: "Hi! I can answer questions about your TechTree CRM data — institutions, inquiries, pipeline stages, follow-ups, and more. What would you like to know?",
    time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const time = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { role: 'user', content: text, time }])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.response ?? 'Sorry, could not get a response.',
        time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Something went wrong. Please try again.', time: '' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
        width: 52, height: 52, borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366F1, #4338CA)',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 18px rgba(99,102,241,.45)',
        display: 'grid', placeItems: 'center', fontSize: 22, transition: '.2s',
      }}>
        {open ? '✕' : <img src="/logo.png" style={{ width: 30, height: 30, objectFit: 'contain' }} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 999,
          width: 360, height: 520, background: '#fff',
          borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,.16)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'chatIn .18s ease',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><img src="/logo.png" style={{ width: 24, height: 24, objectFit: 'contain' }} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>TechTree AI Assistant</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)' }}>Ask anything about your pipeline & inquiries</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.8)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                {msg.role === 'ai' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#4338CA)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><img src="/logo.png" style={{ width: 18, height: 18, objectFit: 'contain' }} /></div>
                )}
                <div style={{ maxWidth: '78%' }}>
                  <div style={{
                    padding: '9px 12px',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg,#6366F1,#4338CA)' : '#F1F3F7',
                    color: msg.role === 'user' ? '#fff' : '#0F172A',
                    fontSize: 12.5, lineHeight: 1.55, fontFamily: 'inherit',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                  {msg.time && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</div>}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#4338CA)', display: 'grid', placeItems: 'center', fontSize: 13, flexShrink: 0 }}>🤖</div>
                <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 2px', background: '#F1F3F7', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#94A3B8', animation: `bounce .9s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick questions — only on first open */}
          {messages.length === 1 && !loading && (
            <div style={{ padding: '0 14px 10px', flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 7 }}>Quick Questions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} onClick={() => sendMessage(q)}
                    style={{ padding: '5px 10px', borderRadius: 100, border: '1px solid #E3E7EF', background: '#F8F9FB', fontSize: 11, color: '#334155', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: '.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366F1'; (e.currentTarget as HTMLButtonElement).style.color = '#6366F1' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E3E7EF'; (e.currentTarget as HTMLButtonElement).style.color = '#334155' }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #E3E7EF', display: 'flex', gap: 8, flexShrink: 0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder="Ask about your pipeline, institutions, inquiries..."
              disabled={loading}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #E3E7EF', borderRadius: 10, fontSize: 12.5, fontFamily: 'inherit', outline: 'none', color: '#0F172A', background: '#F8F9FB' }}
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366F1,#4338CA)', color: '#fff', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', opacity: input.trim() && !loading ? 1 : .4, display: 'grid', placeItems: 'center', fontSize: 15, flexShrink: 0 }}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatIn { from { opacity: 0; transform: translateY(10px) scale(.97) } to { opacity: 1; transform: none } }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0) } 30% { transform: translateY(-5px) } }
      `}</style>
    </>
  )
}
