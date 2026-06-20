import type { ComponentType } from 'react'
import { Link } from 'react-router'
import {
  ClipboardList,
  MapPin,
  Wallet,
  Zap,
  BarChart3,
  User as UserIcon,
  X as CloseIcon,
  LogOut,
  Home as HomeIcon,
  ArrowRight,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { cn } from '../../components/ui/utils'

type TabItem = { key: string; label: string; icon: ComponentType<{ className?: string }>; badge?: number }
type LinkItem = { href: string; label: string; icon: ComponentType<{ className?: string }> }

export function SidebarNav({
  user,
  activeTab,
  pendingCount,
  isFreePlan,
  hovered,
  setHovered,
  mobileOpen,
  setMobileOpen,
  onSelectTab,
  onUpgrade,
  onLogout,
}: {
  user: { name?: string } | null
  activeTab: string
  pendingCount: number
  isFreePlan: boolean
  hovered: boolean
  setHovered: (v: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  onSelectTab: (key: string) => void
  onUpgrade: () => void
  onLogout: () => void
}) {
  const userInitial = (user?.name || 'U').charAt(0).toUpperCase()
  const expanded = hovered || mobileOpen

  const menuGroups: { label: string; tabItems?: TabItem[]; linkItems?: LinkItem[] }[] = [
    {
      label: 'Quản lý',
      tabItems: [
        { key: 'overview', label: 'Đơn đặt', icon: ClipboardList, badge: pendingCount },
        { key: 'tours', label: 'Tour của tôi', icon: MapPin },
        { key: 'finance', label: 'Tài chính', icon: Wallet },
        { key: 'subscription', label: 'Gói & Boost', icon: Zap },
        { key: 'analytics', label: 'Thống kê', icon: BarChart3 },
      ],
    },
    {
      label: 'Tài khoản',
      tabItems: [{ key: 'profile', label: 'Hồ sơ', icon: UserIcon }],
    },
  ]

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-700/60 bg-slate-800 transition-all duration-300',
          mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full',
          hovered ? 'lg:w-64 lg:translate-x-0' : 'lg:w-16 lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center border-b border-slate-700/60 px-[10px]">
          <Link to="/guide" className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-500 text-xs font-bold text-white shadow-md shadow-orange-500/20">
              VT
            </div>
            <div
              className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                expanded ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0',
                'opacity-100',
              )}
            >
              <p className="text-sm font-semibold text-white">VietNamTours</p>
              <p className="text-xs text-orange-300">Guide Console</p>
            </div>
          </Link>

          <Button
            size="icon"
            variant="ghost"
            className="ml-auto shrink-0 text-slate-300 hover:bg-slate-700 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <CloseIcon className="size-4" />
          </Button>
        </div>

        {/* User */}
        <div className="flex shrink-0 items-center border-b border-slate-700/60 px-[10px] py-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-sm font-bold text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-400/40">
            {userInitial}
          </div>
          <div
            className={cn(
              'ml-3 min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300',
              expanded ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0 lg:ml-0',
              'opacity-100 max-w-xs',
            )}
          >
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-xs text-orange-300">Hướng dẫn viên</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p
                className={cn(
                  'mb-1 overflow-hidden whitespace-nowrap px-[14px] text-[10px] font-semibold uppercase tracking-widest text-slate-400 transition-all duration-300',
                  expanded ? 'lg:opacity-100 lg:h-auto' : 'lg:opacity-0 lg:h-0 lg:mb-0',
                  'opacity-100',
                )}
              >
                {group.label}
              </p>
              <ul className="space-y-0.5 px-1.5">
                {group.tabItems?.map((item) => {
                  const active = activeTab === item.key
                  const Icon = item.icon
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        title={item.label}
                        onClick={() => {
                          onSelectTab(item.key)
                          setMobileOpen(false)
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-[9px] py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/20'
                            : 'text-slate-200 hover:bg-white/10 hover:text-white',
                          !expanded && 'lg:justify-center',
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span
                          className={cn(
                            'flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300',
                            expanded ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
                            'opacity-100 max-w-xs',
                          )}
                        >
                          <span className="text-left">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={cn(
                                'ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                                active ? 'bg-white/25 text-white' : 'bg-orange-500 text-white',
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          {isFreePlan && (
            <div
              className={cn(
                'mx-1.5 mt-2 overflow-hidden rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10 transition-all duration-300',
                expanded ? 'lg:opacity-100 lg:max-h-48 lg:p-3' : 'lg:opacity-0 lg:max-h-0 lg:p-0',
                'opacity-100 max-h-48 p-3',
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300">Gói Free</p>
              <p className="mt-1 text-xs text-slate-300">Nâng cấp để tăng lượt hiển thị tour</p>
              <Button
                size="sm"
                className="mt-2 w-full rounded-md bg-gradient-to-r from-orange-500 to-red-500 text-xs text-white hover:from-orange-600 hover:to-red-600"
                onClick={onUpgrade}
              >
                Nâng cấp
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-0.5 border-t border-slate-700/60 p-1.5">
          <Link
            to="/"
            title="Về trang chủ"
            className={cn(
              'flex items-center gap-3 rounded-lg px-[9px] py-2 text-sm text-slate-200 transition-colors hover:bg-white/10 hover:text-white',
              !expanded && 'lg:justify-center',
            )}
          >
            <HomeIcon className="size-4 shrink-0" />
            <span
              className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                expanded ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
                'opacity-100 max-w-xs',
              )}
            >
              Về trang chủ
            </span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            title="Đăng xuất"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-[9px] py-2 text-sm text-red-300 transition-colors hover:bg-red-900/30 hover:text-red-200',
              !expanded && 'lg:justify-center',
            )}
          >
            <LogOut className="size-4 shrink-0" />
            <span
              className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                expanded ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
                'opacity-100 max-w-xs',
              )}
            >
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
