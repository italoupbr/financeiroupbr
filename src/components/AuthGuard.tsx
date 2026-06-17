import { useState, useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function AuthGuard() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Checking session
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-[#0873F7]/30 border-t-[#0873F7] rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (session === null) {
    return <Navigate to="/login" replace />
  }

  // First-login: must change password
  const mustChange = session.user.user_metadata?.must_change_password === true
  if (mustChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  // Already on change-password but password is ok
  if (!mustChange && location.pathname === '/change-password') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
