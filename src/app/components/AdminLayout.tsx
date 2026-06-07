import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  BarChart3,
  Bell,
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
    items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
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
      { href: '/admin/guide-subscriptions', label: 'Subscription của HDV', icon: Users },
      { href: '/admin/boost-plans', label: 'Gói Boost', icon: Zap },
    ],
  },
  {
    label: 'Phân tích',
    items: [{ href: '/admin/analytics', label: 'Phân tích hành vi', icon: TrendingUp }],
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

  /** Mobile: drawer overlay (always full-width when open) */
  const [mobileOpen, setMobileOpen] = useState(false)
  /** Desktop: sidebar hovered → expand + push content */
  const [hovered, setHovered] = useState(false)

  const currentPage = useMemo(
    () => ALL_ITEMS.find((item) => location.pathname === item.href)?.label ?? 'Admin',
    [location.pathname],
  )

  const initials = (user?.name ?? 'A').charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-indigo-900/50 bg-indigo-800 transition-all duration-300',
          // mobile: full-width drawer, slides in/out
          mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full',
          // desktop: collapsed by default, expands on hover
          hovered ? 'lg:w-64 lg:translate-x-0' : 'lg:w-16 lg:translate-x-0',
        )}
      >
        {/* Logo row */}
        <div className="flex h-16 shrink-0 items-center border-b border-indigo-700/50 px-[10px]">
          <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-3">
            <Shield className="size-6 shrink-0 text-indigo-200" />
            <div
              className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                hovered ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0',
                'opacity-100', // always visible on mobile
              )}
            >
              <p className="text-sm font-semibold text-white">VietNamTours</p>
              <p className="text-xs text-indigo-300">Admin Console</p>
            </div>
          </Link>

          {/* Mobile close button */}
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto shrink-0 text-indigo-300 hover:bg-indigo-700 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </Button>

        </div>

        {/* Avatar */}
        <div className="flex shrink-0 items-center border-b border-indigo-700/50 px-[10px] py-3">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="size-8 shrink-0 rounded-full object-cover ring-2 ring-indigo-400/60"
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {initials}
            </div>
          )}
          <div
            className={cn(
              'ml-3 min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300',
              hovered ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0 lg:ml-0',
              'opacity-100 max-w-xs', // always visible on mobile
            )}
          >
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-indigo-300">Administrator</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {MENU_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              {/* Group label — hidden when desktop collapsed */}
              <p
                className={cn(
                  'mb-1 overflow-hidden whitespace-nowrap px-[14px] text-[10px] font-semibold uppercase tracking-widest text-indigo-400 transition-all duration-300',
                  hovered ? 'lg:opacity-100 lg:h-auto' : 'lg:opacity-0 lg:h-0 lg:mb-0',
                  'opacity-100', // mobile always visible
                )}
              >
                {group.label}
              </p>
              <ul className="space-y-0.5 px-1.5">
                {group.items.map((item) => {
                  const active = location.pathname === item.href
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        title={item.label}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-[9px] py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-white/15 text-white'
                            : 'text-indigo-200 hover:bg-white/10 hover:text-white',
                          // center icon when collapsed on desktop
                          !hovered && 'lg:justify-center',
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span
                          className={cn(
                            'overflow-hidden whitespace-nowrap transition-all duration-300',
                            hovered ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
                            'opacity-100 max-w-xs', // mobile always visible
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer links */}
        <div className="shrink-0 space-y-0.5 border-t border-indigo-700/50 p-1.5">
          <Link
            to="/"
            title="Về trang chủ"
            className={cn(
              'flex items-center gap-3 rounded-lg px-[9px] py-2 text-sm text-indigo-200 transition-colors hover:bg-white/10 hover:text-white',
              !hovered && 'lg:justify-center',
            )}
          >
            <MapPin className="size-4 shrink-0" />
            <span
              className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                hovered ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
                'opacity-100 max-w-xs',
              )}
            >
              Về trang chủ
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-[9px] py-2 text-sm text-red-300 transition-colors hover:bg-red-900/30 hover:text-red-200',
              !hovered && 'lg:justify-center',
            )}
          >
            <LogOut className="size-4 shrink-0" />
            <span
              className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                hovered ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
                'opacity-100 max-w-xs',
              )}
            >
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content — shifts right based on desktop sidebar width ──────── */}
      <div
        className={cn(
          'transition-all duration-300',
          hovered ? 'lg:pl-64' : 'lg:pl-16',
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <Button
                size="icon"
                variant="ghost"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
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
