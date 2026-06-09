'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PendingPage() {
  const supabase = createClient()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fff7ed' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#f97316" strokeWidth="2"/>
            <path d="M12 7v5l3 3" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Pending</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Your account has been created and is waiting for admin approval.
            You will be notified once access is granted.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 w-full text-left">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">What happens next?</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• An admin will review your request</li>
            <li>• You'll get access once approved</li>
            <li>• Contact Taha if urgent</li>
          </ul>
        </div>

        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
