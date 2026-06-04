import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'
import { getMe } from '@/api/users'

export function AuthCallback() {
  const navigate = useNavigate()
  const handled = useRef(false)

  useEffect(() => {
    const handleSession = async () => {
      if (handled.current) return
      handled.current = true

      try {
        const profile = await getMe()
        navigate(
          profile.role === 'admin' ? '/admin' :
          profile.role === 'guide' ? '/guide' : '/',
          { replace: true }
        )
      } catch {
        // getMe failed: banned (401), not found, or network error
        // client.ts interceptor already called signOut() for 401
        navigate('/login', { replace: true })
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') handleSession()
      else if (event === 'SIGNED_OUT') navigate('/login', { replace: true })
    })

    // Fallback: session already exists when page loads
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handleSession()
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      <p className="text-gray-600">Đang xử lý đăng nhập...</p>
    </div>
  )
}
