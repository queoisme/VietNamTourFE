import { Link, Navigate } from 'react-router'
import { LifeBuoy, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { SupportPanel } from '../components/SupportPanel'

export function SupportChat() {
  const { isGuide } = useAuth()

  // Guides access support inside their dashboard.
  if (isGuide) return <Navigate to="/guide" state={{ tab: 'support' }} replace />

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 py-5 text-white">
        <div className="container relative mx-auto flex flex-wrap items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <LifeBuoy className="size-5" />
            </div>
            <div>
              <nav className="flex items-center gap-2 text-xs text-white/80">
                <Link to="/" className="hover:text-white">Trang chủ</Link>
                <span className="text-white/50">/</span>
                <span className="font-medium text-white">Hỗ trợ</span>
              </nav>
              <h1 className="mt-0.5 text-2xl font-bold leading-tight tracking-tight md:text-3xl">Hỗ Trợ Khách Hàng</h1>
              <p className="text-xs text-white/85 md:text-sm">
                Đội ngũ chúng tôi sẽ phản hồi sớm nhất có thể.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 ring-1 ring-white/25">
            <Sparkles className="size-3.5" />
            <span className="text-xs font-medium">Phản hồi nhanh</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <SupportPanel className="h-[calc(100vh-200px)]" />
      </div>
    </div>
  )
}
