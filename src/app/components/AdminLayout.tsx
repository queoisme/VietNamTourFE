import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  BarChart3,
  Bell,
  ChevronLeft,
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

const MENU_GROUPS = [
  {
    label: 'Tổng quan',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      { href: '/admin/users', label: 'Người dùng', icon: Users },
      { href: '/admin/applications', label: 'Hồ sơ HDV', icon: FileText },
      { href: '/admin/tours', label: 'Tour', icon: MapPin },
      { href: '/admin/support', label: 'Hỗ trợ', icon: Headphones },
    ],
  },
  {
    label: 'Tài chính',
    items: [
      { href: '/admin/reports', label: 'Báo cáo doanh thu', icon: BarChart3 },
      { href: '/admin/withdrawals', label: 'Rút tiền', icon: ReceiptText },
      { href: '/admin/subscriptions', label: 'Gói subscription', icon: Settings2 },
      { href: '/admin/boost-plans', label: 'Gói Boost', icon: Zap },
    ],
  },
  {
    label: 'Phân tích',
    items: [
      { href: '/admin/analytics', label: 'Phân tích hành vi', icon: TrendingUp },
    ],
  },
  {
    label: 'Cấu hình',
    items: [
      { href: '/admin/features', label: 'Tính năng', icon: Puzzle },
      { href: '/admin/refund-policy', label: 'Chính sách hoàn tiền', icon: Percent },
      { href: '/admin/home-categories', label: 'Danh mục trang chủ', icon: LayoutGrid },
      { href: '/admin/notifications', label: 'Gửi thông báo', icon: Bell },
      { href: '/admin/settings', label: 'Cài đặt hệ thống', icon: Settings2 },
    ],
  },
]

const ALL_ITEMS = MENU_GROUPS.flatMap((g) => g.items)

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const currentPage = useMemo(() => {
    return ALL_ITEMS.find((item) => location.pathname === item.href)?.label ?? 'Admin'
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
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 border-r border-slate-700 bg-slate-900 transition-all duration-300 lg:translate-x-0',
          collapsed ? 'w-16' : 'w-72',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700 px-4">
            {collapsed ? (
              <Link to="/admin/dashboard" className="flex w-full justify-center">
                <Shield className="size-6 text-indigo-400" />
              </Link>
            ) : (
              <>
                <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-2.5">
                  <Shield className="size-6 shrink-0 text-indigo-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">VietNamTours</p>
                    <p className="text-xs text-slate-400">Admin Console</p>
                  </div>
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </>
            )}
          </div>

          {/* Avatar */}
          <div
            className={cn(
              'shrink-0 border-b border-slate-700 py-3',
              collapsed ? 'flex justify-center' : 'px-4',
            )}
          >
            {collapsed ? (
              user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="size-8 rounded-full object-cover ring-2 ring-indigo-500"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {initials}
                </div>
              )
            ) : (
              <div className="flex items-center gap-3">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="size-9 shrink-0 rounded-full object-cover ring-2 ring-indigo-500"
                  />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">Administrator</p>
                </div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3">
            {MENU_GROUPS.map((group, gi) => (
              <div key={group.label} className={cn('mb-2', gi > 0 && collapsed && 'mt-1')}>
                {collapsed ? (
                  <div className="mx-3 mb-2 border-t border-slate-700/60" />
                ) : (
                  <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    {group.label}
                  </p>
                )}
                <ul className={cn('space-y-0.5', collapsed ? 'px-1.5' : 'px-2')}>
                  {group.items.map((item) => {
                    const active = location.pathname === item.href
                    const Icon = item.icon
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          title={collapsed ? item.label : undefined}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center rounded-lg py-2 text-sm font-medium transition-colors',
                            collapsed ? 'justify-center px-0' : 'gap-3 px-2.5',
                            active
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          {!collapsed && item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="shrink-0 space-y-0.5 border-t border-slate-700 p-2">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Mở rộng' : undefined}
              className={cn(
                'hidden w-full items-center rounded-lg py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:flex',
                collapsed ? 'justify-center px-0' : 'gap-2 px-2.5',
              )}
            >
              {collapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <>
                  <ChevronLeft className="size-4" />
                  <span>Thu gọn</span>
                </>
              )}
            </button>
            <Link
              to="/"
              title={collapsed ? 'Về trang chủ' : undefined}
              className={cn(
                'flex items-center rounded-lg py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white',
                collapsed ? 'justify-center px-0' : 'gap-2 px-2.5',
              )}
            >
              <MapPin className="size-4 shrink-0" />
              {!collapsed && <span>Về trang chủ</span>}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? 'Đăng xuất' : undefined}
              className={cn(
                'flex w-full items-center rounded-lg py-2 text-sm text-red-400 transition-colors hover:bg-red-900/30 hover:text-red-300',
                collapsed ? 'justify-center px-0' : 'gap-2 px-2.5',
              )}
            >
              <LogOut className="size-4 shrink-0" />
              {!collapsed && <span>Đăng xuất</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className={cn('transition-all duration-300', collapsed ? 'lg:pl-16' : 'lg:pl-72')}>
        <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
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
              <p className="hidden text-xs text-slate-500 sm:block">Quản trị hệ thống VietNamTours</p>
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
