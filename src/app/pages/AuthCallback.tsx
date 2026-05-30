import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const role =
          session.user.app_metadata?.role ||
          session.user.user_metadata?.role ||
          'customer'
        navigate(role === 'admin' ? '/admin' : role === 'guide' ? '/guide' : '/', { replace: true })
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true })
      }
    })

    // Fallback: nếu session đã tồn tại khi trang load (hash đã được xử lý)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const role =
          data.session.user.app_metadata?.role ||
          data.session.user.user_metadata?.role ||
          'customer'
        navigate(role === 'admin' ? '/admin' : role === 'guide' ? '/guide' : '/', { replace: true })
      }
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
