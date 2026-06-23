import { Link, Navigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { getNotifications } from '@/api/notifications'
import { useAuth } from '../contexts/AuthContext'
import { NotificationsPanel } from '../components/NotificationsPanel'

export function Notifications() {
  const { isGuide } = useAuth()

  // Guides access notifications inside their dashboard.
  if (isGuide) return <Navigate to="/guide" state={{ tab: 'notifications' }} replace />

  const { data } = useQuery({
    queryKey: ['notifications', 'all', 1],
    queryFn: () => getNotifications({ page: 1, size: 20 }),
  })
  const total = data?.meta?.total ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 pt-8 pb-24 text-white">
        <div className="container relative mx-auto px-4">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/80">
            <Link to="/" className="hover:text-white">Trang chủ</Link>
            <span className="text-white/50">/</span>
            <span className="font-medium text-white">Thông báo</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25">
                <Bell className="size-3.5" />
                Trung tâm thông báo
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Thông Báo</h1>
              <p className="mt-2 max-w-xl text-base text-white/90 md:text-lg">
                Cập nhật mọi diễn biến của chuyến đi và tài khoản của bạn.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-3 ring-1 ring-white/25">
              <Bell className="size-6 text-white" />
              <div>
                <div className="text-xs uppercase tracking-wide text-white/80">Tổng số</div>
                <div className="text-2xl font-bold leading-none">{total}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto -mt-12 max-w-3xl px-4 pb-16">
        <NotificationsPanel stickyTop="top-16" />
      </div>
    </div>
  )
}
