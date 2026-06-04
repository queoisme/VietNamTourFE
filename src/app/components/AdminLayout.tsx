import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  BarChart3,
  ChevronRight,
  FileText,
  Headphones,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  Percent,
  Puzzle,
  ReceiptText,
  Settings2,
  Shield,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { cn } from './ui/utils'
import { NotificationBell } from './NotificationBell'

const MENU_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/applications', label: 'Hồ sơ HDV', icon: FileText },
  { href: '/admin/tours', label: 'Tour', icon: MapPin },
  { href: '/admin/analytics', label: 'Phân tích hành vi', icon: TrendingUp },
  { href: '/admin/reports', label: 'Báo cáo doanh thu', icon: BarChart3 },
  { href: '/admin/withdrawals', label: 'Rút tiền', icon: ReceiptText },
  { href: '/admin/subscriptions', label: 'Gói subscription', icon: Settings2 },
  { href: '/admin/boost-plans', label: 'Gói Boost', icon: Zap },
  { href: '/admin/features', label: 'Tính năng', icon: Puzzle },
  { href: '/admin/refund-policy', label: 'Chính sách hoàn tiền', icon: Percent },
  { href: '/admin/home-categories', label: 'Danh mục trang chủ', icon: LayoutGrid },
  { href: '/admin/support', label: 'Hỗ trợ', icon: Headphones },
  { href: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings2 },
]

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentPage = useMemo(() => {
    return MENU_ITEMS.find((item) => location.pathname === item.href)?.label ?? 'Admin'
  }, [location.pathname])

  const initials = (user?.name ?? 'A').charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 border-r bg-white transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b p-5">
            <div className="flex items-center justify-between">
              <Link to="/admin/dashboard" className="flex items-center gap-2">
                <Shield className="size-6 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">VietNamTours</p>
                  <p className="text-xs text-slate-500">Admin Console</p>
                </div>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="size-11 rounded-full object-cover" />
              ) : (
                <div className="flex size-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1.5">
              {MENU_ITEMS.map((item) => {
                const active = location.pathname === item.href
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                      )}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="space-y-2 border-t p-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/">
                <MapPin className="mr-2 size-4" />
                Về trang chủ
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="size-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm">
                <Link to="/admin/dashboard" className="text-slate-500 hover:text-slate-700">
                  Admin
                </Link>
                <ChevronRight className="size-4 text-slate-400" />
                <span className="font-medium text-slate-900">{currentPage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell buttonClassName="flex" />
              <p className="hidden text-xs text-slate-500 sm:block">
                Quản trị hệ thống VietNamTours
              </p>
            </div>
          </div>
        </header>

        <main className="p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

