import { useState, type ComponentType } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ClipboardList,
  MapPin,
  Wallet,
  Zap,
  BarChart3,
  User as UserIcon,
  CreditCard,
  TrendingUp,
  Clock,
  Crown,
  Plus,
  Star as StarIcon,
  ArrowRight,
  Menu as MenuIcon,
  X as CloseIcon,
  LogOut,
  Home as HomeIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { getGuideBookings, confirmBooking, rejectBooking, completeBooking, guideCancelBooking } from '@/api/bookings'
import { getOrCreateConversationByBooking } from '@/api/conversations'
import { createWithdrawal, getMyFinance, getMyWithdrawals } from '@/api/withdrawals'
import { getMyTours, updateTourStatus } from '@/api/tours'
import { getMyBoosts, getMySubscription, getSubscriptionPlans } from '@/api/boosts'
import { getMyTourClickAnalytics } from '@/api/analytics'
import type { GuideClickAnalyticsResponse } from '@/api/analytics'
import { getMyFeatures } from '@/api/features'
import type { Boost, Subscription } from '@/types/boost'
import type { FinanceSummary } from '@/types/finance'
import { formatDate, formatVND, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS, WITHDRAWAL_METHODS } from '@/lib/constants'
import { BookingListItem } from '@/types/booking'
import { CreateWithdrawalRequest, Withdrawal } from '@/types/finance'
import { TourListItem } from '@/types/tour'
import { useAuth } from '../contexts/AuthContext'
import { GuideProfile } from './GuideProfile'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'
import { cn } from '../components/ui/utils'

const GUIDE_BOOKING_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
}

const GUIDE_BOOKING_PAYMENT_BADGE: Record<string, string> = {
  unpaid: 'bg-orange-50 text-orange-700 border-orange-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refunded: 'bg-slate-100 text-slate-700 border-slate-200',
  refund_failed: 'bg-amber-100 text-amber-800 border-amber-200',
}

const GUIDE_BOOKING_CARD_BORDER: Record<string, string> = {
  pending: 'border-l-4 border-l-amber-400',
  confirmed: 'border-l-4 border-l-blue-400',
  completed: 'border-l-4 border-l-emerald-400',
  cancelled: 'border-l-4 border-l-rose-400',
  rejected: 'border-l-4 border-l-rose-400',
}

export function GuideDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string>(
    (location.state as { tab?: string } | null)?.tab ?? 'overview'
  )
  const [actionBooking, setActionBooking] = useState<{
    booking: BookingListItem
    action: 'confirm' | 'complete' | 'reject' | 'guide-cancel'
  } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null)
  const [withdrawDialog, setWithdrawDialog] = useState(false)
  const [wAmount, setWAmount] = useState('')
  const [wMethod, setWMethod] = useState('bank')
  const [wAccountNo, setWAccountNo] = useState('')
  const [wAccountName, setWAccountName] = useState('')
  const [wBankName, setWBankName] = useState('')
  const [wPhone, setWPhone] = useState('')
  const [wNote, setWNote] = useState('')
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleChat = async (booking: BookingListItem) => {
    setChatLoadingId(booking.id)
    try {
      const conv = await getOrCreateConversationByBooking(booking.id)
      if (conv) navigate(`/chat/${conv.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể mở chat lúc này')
    } finally {
      setChatLoadingId(null)
    }
  }

  const { data: finance, isLoading: financeLoading } = useQuery({
    queryKey: ['guide-finance'],
    queryFn: getMyFinance,
  })

  const { data: withdrawalsData } = useQuery({
    queryKey: ['my-withdrawals'],
    queryFn: () => getMyWithdrawals({ size: 20 }),
  })

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['guide-bookings'],
    queryFn: () => getGuideBookings({ size: 20 }),
  })

  const { data: toursData, isLoading: toursLoading } = useQuery({
    queryKey: ['my-tours'],
    queryFn: () => getMyTours({ size: 20 }),
  })

  const { data: currentSub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: getMySubscription,
  })

  const { data: boostsData } = useQuery({
    queryKey: ['my-boosts'],
    queryFn: () => getMyBoosts({ size: 20 }),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide-bookings'] })
      setActionBooking(null)
      toast.success('Đã xác nhận đơn!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide-bookings'] })
      setActionBooking(null)
      toast.success('Tour hoàn thành!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectBooking(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide-bookings'] })
      setActionBooking(null)
      setRejectReason('')
      toast.success('Đã từ chối đơn')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const guideCancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      guideCancelBooking(id, { reason: reason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide-bookings'] })
      setActionBooking(null)
      setRejectReason('')
      toast.success('Đã hủy tour thành công')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const withdrawMutation = useMutation({
    mutationFn: (data: CreateWithdrawalRequest) => createWithdrawal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide-finance'] })
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] })
      setWithdrawDialog(false)
      setWAmount(''); setWMethod('bank'); setWAccountNo('')
      setWAccountName(''); setWBankName(''); setWPhone(''); setWNote('')
      toast.success('Đã gửi yêu cầu rút tiền thành công')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleWithdraw = () => {
    const amount = Number(wAmount)
    const isBank = wMethod === 'bank'
    const accountInfoObj = isBank
      ? { accountNo: wAccountNo, accountName: wAccountName, bankName: wBankName }
      : { phone: wPhone }
    withdrawMutation.mutate({
      amount,
      method: wMethod as CreateWithdrawalRequest['method'],
      accountInfo: JSON.stringify(accountInfoObj),
      note: wNote || undefined,
    })
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTourStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['my-tours'] })
      const previous = queryClient.getQueryData<{ items: TourListItem[]; meta: unknown }>(['my-tours'])
      queryClient.setQueryData<{ items: TourListItem[]; meta: unknown }>(['my-tours'], (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((tour) =>
            tour.id === id ? { ...tour, status: status as TourListItem['status'] } : tour,
          ),
        }
      })
      return { previous }
    },
    onSuccess: (_, { status }) => {
      toast.success(status === 'active' ? 'Tour đã được đăng!' : 'Tour đã tạm dừng')
    },
    onError: (err: Error, _, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(['my-tours'], ctx.previous)
      toast.error(err.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tours'] })
    },
  })

  const bookings = bookingsData?.items ?? []
  const tours = toursData?.items ?? []
  const pendingBookings = bookings.filter((b) => b.status === 'pending')
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')
  const completedBookings = bookings.filter((b) => b.status === 'completed')

  const handleAction = () => {
    if (!actionBooking) return
    if (actionBooking.action === 'confirm') {
      confirmMutation.mutate(actionBooking.booking.id)
      return
    }
    if (actionBooking.action === 'complete') {
      completeMutation.mutate(actionBooking.booking.id)
      return
    }
    if (actionBooking.action === 'guide-cancel') {
      guideCancelMutation.mutate({ id: actionBooking.booking.id, reason: rejectReason })
      return
    }
    rejectMutation.mutate({ id: actionBooking.booking.id, reason: rejectReason })
  }

  const activePlan = currentSub?.status === 'active' ? currentSub.plan : 'free'
  const isFreePlan = activePlan === 'free'
  const userInitial = (user?.name || 'U').charAt(0).toUpperCase()
  const sidebarExpanded = sidebarHovered

  type TabItem = { key: string; label: string; icon: ComponentType<{ className?: string }>; badge?: number }
  type LinkItem = { href: string; label: string; icon: ComponentType<{ className?: string }> }

  const menuGroups: { label: string; tabItems?: TabItem[]; linkItems?: LinkItem[] }[] = [
    {
      label: 'Quản lý',
      tabItems: [
        { key: 'overview', label: 'Đơn đặt', icon: ClipboardList, badge: pendingBookings.length },
        { key: 'tours', label: 'Tour của tôi', icon: MapPin },
        { key: 'finance', label: 'Tài chính', icon: Wallet },
        { key: 'subscription', label: 'Gói & Boost', icon: Zap },
        { key: 'analytics', label: 'Thống kê', icon: BarChart3 },
      ],
    },
    {
      label: 'Tài khoản',
      tabItems: [
        { key: 'profile', label: 'Hồ sơ', icon: UserIcon },
      ],
    },
  ]

  const tabPills: { key: string; label: string }[] = [
    { key: 'overview', label: 'Đơn đặt' },
    { key: 'tours', label: 'Tour của tôi' },
    { key: 'finance', label: 'Tài chính' },
    { key: 'subscription', label: 'Gói & Boost' },
    { key: 'analytics', label: 'Thống kê' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-700/60 bg-slate-800 transition-all duration-300',
          mobileSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full',
          sidebarExpanded ? 'lg:w-64 lg:translate-x-0' : 'lg:w-16 lg:translate-x-0',
        )}
      >
        {/* Logo row */}
        <div className="flex h-20 shrink-0 items-center border-b border-slate-700/60 px-[10px]">
          <Link to="/guide" className="flex min-w-0 items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-500 text-xs font-bold text-white shadow-md shadow-orange-500/20">
              VT
            </div>
            <div
              className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                sidebarExpanded ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0',
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
            onClick={() => setMobileSidebarOpen(false)}
          >
            <CloseIcon className="size-4" />
          </Button>
        </div>

        {/* Avatar */}
        <div className="flex shrink-0 items-center border-b border-slate-700/60 px-[10px] py-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-sm font-bold text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-400/40">
            {userInitial}
          </div>
          <div
            className={cn(
              'ml-3 min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300',
              sidebarExpanded ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0 lg:ml-0',
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
                  sidebarExpanded ? 'lg:opacity-100 lg:h-auto' : 'lg:opacity-0 lg:h-0 lg:mb-0',
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
                        onClick={() => { setActiveTab(item.key); setMobileSidebarOpen(false) }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-[9px] py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/20'
                            : 'text-slate-200 hover:bg-white/10 hover:text-white',
                          !sidebarExpanded && 'lg:justify-center',
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span
                          className={cn(
                            'flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap transition-all duration-300',
                            sidebarExpanded ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
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
                {group.linkItems?.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.href}
                        title={item.label}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-[9px] py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white',
                          !sidebarExpanded && 'lg:justify-center',
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span
                          className={cn(
                            'overflow-hidden whitespace-nowrap transition-all duration-300',
                            sidebarExpanded ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
                            'opacity-100 max-w-xs',
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

          {isFreePlan && (
            <div
              className={cn(
                'mx-1.5 mt-2 overflow-hidden rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10 transition-all duration-300',
                sidebarExpanded ? 'lg:opacity-100 lg:max-h-48 lg:p-3' : 'lg:opacity-0 lg:max-h-0 lg:p-0',
                'opacity-100 max-h-48 p-3',
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-300">Gói Free</p>
              <p className="mt-1 text-xs text-slate-300">Nâng cấp để tăng lượt hiển thị tour</p>
              <Button
                size="sm"
                className="mt-2 w-full rounded-md bg-gradient-to-r from-orange-500 to-red-500 text-xs text-white hover:from-orange-600 hover:to-red-600"
                onClick={() => navigate('/subscription')}
              >
                Nâng cấp
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-0.5 border-t border-slate-700/50 p-1.5">
          <Link
            to="/"
            title="Về trang chủ"
            className={cn(
              'flex items-center gap-3 rounded-lg px-[9px] py-2 text-sm text-slate-200 transition-colors hover:bg-white/10 hover:text-white',
              !sidebarExpanded && 'lg:justify-center',
            )}
          >
            <HomeIcon className="size-4 shrink-0" />
            <span
              className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                sidebarExpanded ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
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
              !sidebarExpanded && 'lg:justify-center',
            )}
          >
            <LogOut className="size-4 shrink-0" />
            <span
              className={cn(
                'overflow-hidden whitespace-nowrap transition-all duration-300',
                sidebarExpanded ? 'lg:opacity-100 lg:max-w-xs' : 'lg:opacity-0 lg:max-w-0',
                'opacity-100 max-w-xs',
              )}
            >
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content — shifts right based on sidebar width ─── */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarExpanded ? 'lg:pl-64' : 'lg:pl-16',
        )}
      >
        {/* Mobile hamburger */}
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <MenuIcon className="size-5" />
          </Button>
          <span className="font-medium text-slate-800">Bảng điều khiển</span>
        </div>

        <div className="p-4 lg:p-6">
          {/* Main content */}
          <main className="mx-auto max-w-7xl space-y-6">
            {activeTab === 'profile' ? (
              <GuideProfile />
            ) : (
              <>
            {/* Greeting + actions */}
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
                  Xin chào, {user?.name}! <span className="inline-block">👋</span>
                </h1>
                <p className="mt-1.5 text-base text-slate-500">Quản lý tour và đơn đặt của bạn</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30 hover:from-orange-600 hover:to-red-600">
                  <Link to="/create-tour">
                    <Plus className="mr-1 size-4" /> Tạo tour mới
                  </Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl bg-white">
                  <Link to="/boost">
                    <Zap className="mr-1 size-4 text-orange-500" /> Boost tour
                  </Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl bg-white">
                  <Link to="/reviews">
                    <StarIcon className="mr-1 size-4 text-yellow-500" /> Đánh giá
                  </Link>
                </Button>
              </div>
            </header>

            {/* 4 stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {financeLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
              ) : (
                <>
                  <StatCard
                    icon={CreditCard}
                    iconBg="bg-orange-100 text-orange-600"
                    label="Số dư"
                    value={formatVND(finance?.balance ?? 0)}
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-lg border-orange-200 text-xs text-orange-700 hover:bg-orange-50"
                        onClick={() => setWithdrawDialog(true)}
                      >
                        Rút tiền
                      </Button>
                    }
                  />
                  <StatCard
                    icon={TrendingUp}
                    iconBg="bg-emerald-100 text-emerald-600"
                    label="Tổng thu"
                    value={formatVND(finance?.totalEarned ?? 0)}
                    badge={<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">+12%</span>}
                  />
                  <StatCard
                    icon={Clock}
                    iconBg="bg-amber-100 text-amber-600"
                    label="Chờ xác nhận"
                    value={String(pendingBookings.length)}
                  />
                  <button
                    type="button"
                    onClick={() => navigate('/subscription')}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-left text-white shadow-md transition-shadow hover:shadow-xl"
                  >
                    <div className="absolute -right-4 -top-4 size-28 rounded-full bg-orange-500/20 blur-2xl" />
                    <div className="relative flex items-start justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-orange-300">
                        <Crown className="size-6" />
                      </div>
                      <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-bold uppercase text-white">
                        {formatPlanLabel(activePlan)}
                      </span>
                    </div>
                    <p className="relative mt-5 text-xs font-semibold uppercase tracking-wider text-slate-300">Gói đăng ký</p>
                    <p className="relative mt-1.5 text-2xl font-bold text-white">{formatPlanLabel(activePlan)}</p>
                  </button>
                </>
              )}
            </div>

            {/* Pill-style tabs */}
            <div className="overflow-x-auto rounded-2xl bg-white p-2 shadow-sm">
              <div className="flex items-center gap-1">
                {tabPills.map((t) => {
                  const active = activeTab === t.key
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveTab(t.key)}
                      className={cn(
                        'shrink-0 rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors',
                        active
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30'
                          : 'text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && (
              <div>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <BookingStatCard label="Tổng đơn" value={bookings.length} variant="orange" />
            <BookingStatCard label="Chờ xác nhận" value={pendingBookings.length} variant="amber" />
            <BookingStatCard label="Đang diễn ra" value={confirmedBookings.length} variant="blue" />
            <BookingStatCard label="Đã hoàn thành" value={completedBookings.length} variant="emerald" />
          </div>

          {pendingBookings.length > 0 && (
            <div className="mb-7 rounded-2xl border bg-gradient-to-r from-orange-50 via-white to-orange-50 p-4 md:p-5">
              <h3 className="mb-3 text-lg font-semibold">
                Chờ xác nhận ({pendingBookings.length})
              </h3>
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onAction={(action) => setActionBooking({ booking, action })}
                    onChat={() => handleChat(booking)}
                    chatLoading={chatLoadingId === booking.id}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mb-3">
            <h3 className="text-lg font-semibold">Tất cả đơn gần đây</h3>
            <p className="text-sm text-gray-500">Theo dõi trạng thái thanh toán và xử lý đơn nhanh hơn.</p>
          </div>
          {bookingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Chưa có đơn đặt nào</div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onAction={(action) => setActionBooking({ booking, action })}
                  onChat={() => handleChat(booking)}
                  chatLoading={chatLoadingId === booking.id}
                />
              ))}
            </div>
          )}
              </div>
            )}

            {activeTab === 'tours' && (
              <div>
          {toursLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : tours.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-gray-500">Bạn chưa có tour nào</p>
              <Button asChild>
                <Link to="/create-tour">Tạo tour đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={tour}
                  onToggleStatus={(id, status) => statusMutation.mutate({ id, status })}
                  isUpdating={statusMutation.isPending && statusMutation.variables?.id === tour.id}
                />
              ))}
            </div>
          )}
              </div>
            )}

            {activeTab === 'finance' && (
              <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Lịch sử rút tiền</h3>
              <p className="text-sm text-gray-500">Theo dõi các yêu cầu rút tiền của bạn.</p>
            </div>
            <Button onClick={() => setWithdrawDialog(true)} disabled={(finance?.balance ?? 0) < 100_000}>
              Rút tiền
            </Button>
          </div>

          {(withdrawalsData?.items ?? []).length === 0 ? (
            <div className="rounded-2xl border bg-white px-6 py-12 text-center text-gray-500">
              Chưa có yêu cầu rút tiền nào
            </div>
          ) : (
            <div className="space-y-3">
              {(withdrawalsData?.items ?? []).map((w) => (
                <WithdrawalHistoryCard key={w.id} withdrawal={w} />
              ))}
            </div>
          )}
              </div>
            )}

            {activeTab === 'subscription' && (
              <SubscriptionTab
                finance={finance}
                currentSub={currentSub ?? null}
                boosts={boostsData?.items ?? []}
                onNavigate={navigate}
              />
            )}

            {activeTab === 'analytics' && <GuideAnalyticsTab />}
              </>
            )}
          </main>
        </div>
      </div>

      <AlertDialog
        open={!!actionBooking && actionBooking.action !== 'reject' && actionBooking.action !== 'guide-cancel'}
        onOpenChange={() => setActionBooking(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionBooking?.action === 'confirm' ? 'Xác nhận đơn?' : 'Hoàn thành tour?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionBooking?.action === 'confirm'
                ? `Xác nhận đơn của khách cho tour "${actionBooking?.booking.tourTitle}"`
                : `Đánh dấu tour "${actionBooking?.booking.tourTitle}" là hoàn thành. Doanh thu sẽ được ghi nhận.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={actionBooking?.action === 'reject'} onOpenChange={() => setActionBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đơn</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Lý do từ chối..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleAction}
            disabled={!rejectReason.trim() || rejectMutation.isPending}
            className="w-full"
          >
            {rejectMutation.isPending ? 'Đang xử lý...' : 'Từ chối đơn'}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yêu cầu rút tiền</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-orange-50 px-4 py-3 text-sm">
              <span className="text-gray-500">Số dư khả dụng: </span>
              <span className="font-semibold text-orange-700">{formatVND(finance?.balance ?? 0)}</span>
            </div>

            <div className="space-y-1.5">
              <Label>Số tiền (tối thiểu 100,000 VNĐ)</Label>
              <Input
                type="number"
                placeholder="VD: 500000"
                value={wAmount}
                onChange={(e) => setWAmount(e.target.value)}
                min={100000}
                max={finance?.balance ?? 0}
              />
              {Number(wAmount) > 0 && (
                <p className="text-xs text-gray-500">
                  Phí 2%: {formatVND(Math.round(Number(wAmount) * 0.02))} · Thực nhận:{' '}
                  <span className="font-medium text-emerald-700">{formatVND(Math.round(Number(wAmount) * 0.98))}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Phương thức</Label>
              <Select value={wMethod} onValueChange={setWMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WITHDRAWAL_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {wMethod === 'bank' ? (
              <>
                <div className="space-y-1.5">
                  <Label>Số tài khoản</Label>
                  <Input value={wAccountNo} onChange={(e) => setWAccountNo(e.target.value)} placeholder="VD: 1234567890" />
                </div>
                <div className="space-y-1.5">
                  <Label>Tên chủ tài khoản</Label>
                  <Input value={wAccountName} onChange={(e) => setWAccountName(e.target.value)} placeholder="NGUYEN VAN A" />
                </div>
                <div className="space-y-1.5">
                  <Label>Ngân hàng</Label>
                  <Input value={wBankName} onChange={(e) => setWBankName(e.target.value)} placeholder="VD: Vietcombank" />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input value={wPhone} onChange={(e) => setWPhone(e.target.value)} placeholder="VD: 0901234567" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea value={wNote} onChange={(e) => setWNote(e.target.value)} rows={2} placeholder="..." />
            </div>

            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={
                withdrawMutation.isPending ||
                Number(wAmount) < 100_000 ||
                Number(wAmount) > (finance?.balance ?? 0) ||
                (wMethod === 'bank' ? !wAccountNo || !wAccountName || !wBankName : !wPhone)
              }
            >
              {withdrawMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={actionBooking?.action === 'guide-cancel'}
        onOpenChange={() => { setActionBooking(null); setRejectReason('') }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy tour đã xác nhận</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Hủy tour đã xác nhận sẽ hoàn tiền 100% cho khách. Hành động này không thể hoàn tác.
          </div>
          <Textarea
            placeholder="Lý do hủy tour (tùy chọn)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <Button
            variant="destructive"
            onClick={handleAction}
            disabled={guideCancelMutation.isPending}
            className="w-full"
          >
            {guideCancelMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy tour'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TourCard({
  tour,
  onToggleStatus,
  isUpdating,
}: {
  tour: TourListItem
  onToggleStatus: (id: string, status: string) => void
  isUpdating: boolean
}) {
  const isActive = tour.status === 'active'
  const isDraft = tour.status === 'draft'

  return (
    <Card className="overflow-hidden">
      <div className="relative h-36 overflow-hidden">
        {tour.coverImageUrl || tour.images?.[0] ? (
          <img src={tour.coverImageUrl ?? tour.images[0]} alt={tour.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-orange-100" />
        )}
        <Badge className={`absolute right-2 top-2 ${isActive ? 'bg-green-600' : 'bg-gray-500'}`}>
          {isActive ? 'Hoạt động' : isDraft ? 'Nháp' : 'Tạm dừng'}
        </Badge>
        {tour.isBoosted && <Badge className="absolute left-2 top-2 bg-yellow-500">⚡ Boost</Badge>}
      </div>
      <CardContent className="p-4">
        <h4 className="mb-2 line-clamp-1 font-medium">{tour.title}</h4>
        <p className="mb-3 text-sm text-gray-500">
          {formatVND(tour.pricePerPerson)}/người · {tour.totalBookings} đặt
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/tours/${tour.id}`}>Xem</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/edit-tour/${tour.id}`}>Sửa</Link>
          </Button>
          {isActive ? (
            <Button
              size="sm"
              variant="outline"
              className="text-gray-600"
              disabled={isUpdating}
              onClick={() => onToggleStatus(tour.id, 'inactive')}
            >
              Tạm dừng
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={isUpdating}
              onClick={() => onToggleStatus(tour.id, 'active')}
            >
              Đăng
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function BookingCard({
  booking,
  onAction,
  onChat,
  chatLoading,
}: {
  booking: BookingListItem
  onAction: (action: 'confirm' | 'complete' | 'reject' | 'guide-cancel') => void
  onChat: () => void
  chatLoading: boolean
}) {
  const isPaid = booking.paymentStatus === 'paid'

  return (
    <article
      className={cn(
        'rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:p-6',
        GUIDE_BOOKING_CARD_BORDER[booking.status],
      )}
    >
      <div className="flex gap-4 md:gap-5">
        {(booking.tourCoverImageUrl ?? booking.tourImages?.[0]) ? (
          <img
            src={booking.tourCoverImageUrl ?? booking.tourImages[0]}
            alt={booking.tourTitle}
            className="size-20 shrink-0 rounded-xl object-cover md:size-24"
          />
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-red-100 text-3xl text-orange-500 md:size-24">
            🎫
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="line-clamp-2 text-xl font-semibold text-slate-900">{booking.tourTitle}</p>
              <p className="mt-1 text-xs text-slate-500">Mã đơn: #{booking.id.slice(0, 8).toUpperCase()}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn('font-medium', GUIDE_BOOKING_STATUS_BADGE[booking.status])}>
                {BOOKING_STATUS_LABELS[booking.status] || booking.status}
              </Badge>
              <Badge variant="outline" className={cn('font-medium', GUIDE_BOOKING_PAYMENT_BADGE[booking.paymentStatus] ?? 'bg-slate-100 text-slate-700 border-slate-200')}>
                {PAYMENT_STATUS_LABELS[booking.paymentStatus] || booking.paymentStatus}
              </Badge>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">{formatDate(booking.tourDate)}</span>
            <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">{booking.numPeople} người</span>
            <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">{formatVND(booking.totalPrice)}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {booking.status === 'pending' && !isPaid && (
              <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-orange-700">
                Khách chưa thanh toán, chưa thể xác nhận đơn.
              </p>
            )}

            {booking.status === 'pending' && isPaid && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onAction('confirm')}>
                  Xác nhận
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onAction('reject')}>
                  Từ chối
                </Button>
              </>
            )}

            {booking.status === 'confirmed' && (
              <>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => onAction('complete')}>
                  Hoàn thành
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onAction('guide-cancel')}>
                  Hủy tour
                </Button>
              </>
            )}

            <Button size="sm" variant="outline" asChild>
              <Link to={`/booking-confirmation/${booking.id}`}>Xem chi tiết</Link>
            </Button>

            <Button size="sm" variant="outline" onClick={onChat} disabled={chatLoading}>
              {chatLoading ? 'Đang mở...' : 'Nhắn tin'}
            </Button>

            {booking.status === 'confirmed' && (
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" asChild>
                <Link to={`/tour-tracking/${booking.id}`}>📍 Tracking</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

const BOOKING_STAT_VARIANTS: Record<string, { bg: string; ring: string; value: string }> = {
  orange:  { bg: 'bg-orange-50',  ring: 'border-orange-100',  value: 'text-orange-700' },
  amber:   { bg: 'bg-amber-50',   ring: 'border-amber-100',   value: 'text-amber-700' },
  blue:    { bg: 'bg-blue-50',    ring: 'border-blue-100',    value: 'text-blue-700' },
  emerald: { bg: 'bg-emerald-50', ring: 'border-emerald-100', value: 'text-emerald-700' },
}

function BookingStatCard({
  label,
  value,
  variant = 'orange',
}: {
  label: string
  value: number
  variant?: keyof typeof BOOKING_STAT_VARIANTS
}) {
  const v = BOOKING_STAT_VARIANTS[variant] ?? BOOKING_STAT_VARIANTS.orange
  return (
    <div className={cn('rounded-2xl border px-5 py-5', v.bg, v.ring)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('mt-2 text-3xl font-bold', v.value)}>{value}</p>
    </div>
  )
}

function StatCard({
  icon: Icon,
  iconBg,
  label,
  value,
  action,
  badge,
}: {
  icon: ComponentType<{ className?: string }>
  iconBg: string
  label: string
  value: string
  action?: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className={cn('flex size-12 items-center justify-center rounded-xl', iconBg)}>
          <Icon className="size-6" />
        </div>
        {action ?? badge}
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 truncate text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

// Override màu cho các gói cụ thể; gói admin tự tạo sẽ dùng màu mặc định (indigo)
const PLAN_COLOR_OVERRIDES: Record<string, string> = {
  free:    'bg-gray-100 text-gray-700',
  premium: 'bg-orange-100 text-orange-700',
  pro:     'bg-purple-100 text-purple-700',
}
const PLAN_COLOR_DEFAULT = 'bg-indigo-100 text-indigo-700'

/** Trả về màu badge cho bất kỳ plan name nào */
function getPlanColor(plan: string): string {
  return PLAN_COLOR_OVERRIDES[plan] ?? PLAN_COLOR_DEFAULT
}

/** Chuyển "super_vip" → "Super Vip", "premium" → "Premium" */
function formatPlanLabel(plan: string): string {
  return plan
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}
const BOOST_STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
}
const BOOST_STATUS_LABEL: Record<string, string> = { active: 'Đang chạy', expired: 'Hết hạn', cancelled: 'Đã hủy' }

function SubscriptionTab({
  finance,
  currentSub,
  boosts,
  onNavigate,
}: {
  finance: FinanceSummary | undefined
  currentSub: Subscription | null
  boosts: Boost[]
  onNavigate: (path: string) => void
}) {
  // Fetch plans để lấy commission rate động thay vì hardcode
  const { data: subPlans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
    staleTime: 5 * 60 * 1000,
  })

  // isActive phải check cả status lẫn expiresAt (tránh race condition trước khi ExpireSubscriptionJob chạy)
  const isActive = currentSub?.status === 'active'
    && new Date(currentSub.expiresAt) > new Date()
  const plan = isActive ? (currentSub!.plan || 'free') : 'free'
  const expiresAt = isActive ? currentSub!.expiresAt : null
  const daysLeft = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
    : null
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0

  // Commission rate từ API config, fallback 15% nếu không tìm thấy
  const planInfo  = subPlans.find(p => p.plan === plan)
  const commissionPct = planInfo
    ? `${Math.round(planInfo.commissionRate * 100)}%`
    : '15%'
  const maxToursLabel = planInfo?.maxActiveTours != null
    ? `Tối đa ${planInfo.maxActiveTours} tour`
    : 'Số tour không giới hạn'

  return (
    <div className="space-y-6">
      {/* Subscription Card */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Gói đăng ký hiện tại</p>
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold px-3 py-1 rounded-full ${getPlanColor(plan)}`}>
                {formatPlanLabel(plan)}
              </span>
              {isActive && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đang hoạt động</span>}
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Hoa hồng: <span className="font-semibold">{commissionPct}</span>
            </p>
            {expiresAt && (
              <p className="mt-1 text-sm text-gray-500">
                Hết hạn: {new Date(expiresAt).toLocaleDateString('vi-VN')}
                {daysLeft !== null && daysLeft > 0 && (
                  <span className="ml-1 text-gray-400">(còn {daysLeft} ngày)</span>
                )}
              </p>
            )}
            {plan === 'free' && (
              <p className="mt-2 text-xs text-gray-400">{maxToursLabel} · Hoa hồng {commissionPct}</p>
            )}
          </div>
          <Button
            size="sm"
            className={plan === 'free' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'}
            onClick={() => onNavigate('/subscription')}
          >
            {plan === 'free' ? 'Nâng cấp ngay' : 'Xem gói'}
          </Button>
        </div>

        {isExpiringSoon && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2">
            <span className="text-amber-500">⚠</span>
            <p className="text-sm text-amber-700">
              Gói của bạn còn <span className="font-semibold">{daysLeft} ngày</span> nữa hết hạn. Gia hạn để không bị gián đoạn.
            </p>
            <Button size="sm" variant="outline" className="ml-auto shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100" onClick={() => onNavigate('/subscription')}>
              Gia hạn
            </Button>
          </div>
        )}
      </div>

      {/* Boosts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Lịch sử Boost tour</h3>
          <Button size="sm" variant="outline" onClick={() => onNavigate('/boost')}>+ Boost mới</Button>
        </div>

        {boosts.length === 0 ? (
          <div className="rounded-2xl border bg-white px-6 py-10 text-center text-gray-500">
            <p className="mb-3">Bạn chưa có lần boost nào</p>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => onNavigate('/boost')}>
              Boost tour ngay
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {boosts.map((b) => (
              <div key={b.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{b.tourTitle}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Gói {b.plan} · {formatVND(b.pricePaid)} · {b.durationDays} ngày
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(b.startsAt)} → {formatDate(b.expiresAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('shrink-0 font-medium', BOOST_STATUS_BADGE[b.status])}>
                    {BOOST_STATUS_LABEL[b.status] ?? b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const WITHDRAWAL_STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800 border-amber-200',
  approved:  'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected:  'bg-rose-100 text-rose-700 border-rose-200',
}

const WITHDRAWAL_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt', approved: 'Đã duyệt', completed: 'Hoàn tất', rejected: 'Từ chối',
}

function WithdrawalHistoryCard({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{formatVND(withdrawal.amount)}</p>
          <p className="text-xs text-gray-500">
            Thực nhận: {formatVND(withdrawal.netAmount)} · {withdrawal.method.toUpperCase()}
          </p>
          {withdrawal.adminNote && (
            <p className="mt-1 text-xs text-gray-500">Admin: {withdrawal.adminNote}</p>
          )}
        </div>
        <div className="text-right">
          <Badge variant="outline" className={cn('font-medium', WITHDRAWAL_STATUS_BADGE[withdrawal.status])}>
            {WITHDRAWAL_STATUS_LABEL[withdrawal.status] || withdrawal.status}
          </Badge>
          <p className="mt-1 text-xs text-gray-400">{formatDate(withdrawal.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}

const TOUR_STATUS_BADGE: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  draft:    'bg-amber-100 text-amber-700 border-amber-200',
}
const TOUR_STATUS_LABEL: Record<string, string> = {
  active: 'Đang hoạt động', inactive: 'Tạm dừng', draft: 'Bản nháp',
}

function toShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function GuideAnalyticsTab() {
  const { data: myFeatures, isLoading: featuresLoading } = useQuery({
    queryKey: ['guide-my-features'],
    queryFn: getMyFeatures,
    staleTime: 5 * 60 * 1000,
  })
  const hasAnalytics = myFeatures?.featureKeys.includes('analytics.tour_clicks') ?? false

  const [days, setDays] = useState(30)

  const to   = new Date().toISOString().slice(0, 10)
  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  const { data, isLoading, isError } = useQuery<GuideClickAnalyticsResponse>({
    queryKey: ['guide-tour-analytics', days],
    queryFn: () => getMyTourClickAnalytics({ from, to }),
    enabled: hasAnalytics,
    retry: 1,
  })

  if (featuresLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />
  }

  if (!hasAnalytics) {
    return (
      <div className="rounded-2xl border bg-gradient-to-br from-orange-50 to-amber-50 p-10 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Phân tích lượt xem Tour</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
          Nâng cấp lên gói <strong>Premium</strong> hoặc <strong>Pro</strong> để xem thống kê
          lượt click của khách vào từng tour, biết tour nào đang phổ biến và tour nào cần cải thiện.
        </p>
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link to="/subscription">Nâng cấp ngay</Link>
        </Button>
      </div>
    )
  }

  const tours      = data?.tours      ?? []
  const dailyTrend = data?.dailyTrend ?? []
  const maxClicks  = Math.max(...tours.map((t) => t.clicks), 1)

  const barData = tours.map((t) => ({
    name:   t.title.length > 22 ? t.title.slice(0, 22) + '…' : t.title,
    clicks: t.clicks,
  }))

  const lineData = dailyTrend.map((d) => ({
    date:  toShortDate(d.date),
    count: d.count,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Thống kê lượt xem Tour</h3>
        <div className="flex gap-2">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                days === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border text-gray-600 hover:bg-gray-50',
              )}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {/* API error banner */}
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Không thể tải dữ liệu thống kê. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.
        </div>
      )}

      {/* Total clicks stat */}
      <div className="rounded-2xl border bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5">
        {isLoading ? (
          <Skeleton className="h-10 w-32" />
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
              Tổng lượt xem ({days} ngày qua)
            </p>
            <p className="mt-1 text-4xl font-bold text-indigo-700">
              {(data?.totalClicks ?? 0).toLocaleString('vi-VN')}
            </p>
          </>
        )}
      </div>

      {/* Daily trend chart */}
      <div className="rounded-2xl border bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-gray-700">Xu hướng theo ngày</p>
        {isLoading ? (
          <Skeleton className="h-44 w-full" />
        ) : lineData.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-sm text-gray-400">
            Chưa có dữ liệu trong khoảng thời gian này
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v) => [`${v} lượt`, 'Lượt xem']} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar chart — clicks by tour */}
      {!isLoading && barData.length > 0 && (
        <div className="rounded-2xl border bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-gray-700">Lượt xem theo tour</p>
          <ResponsiveContainer width="100%" height={Math.max(160, barData.length * 36)}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
              <Tooltip formatter={(v) => [`${v} lượt`, 'Lượt xem']} />
              <Bar dataKey="clicks" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tour ranking table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b">
          <p className="text-sm font-semibold text-gray-700">Xếp hạng tour theo lượt xem</p>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            Bạn chưa có tour nào. <Link to="/create-tour" className="text-indigo-600 hover:underline">Tạo tour ngay</Link>
          </div>
        ) : (
          <div className="divide-y">
            {tours.map((tour, idx) => (
              <div key={tour.tourId} className="flex items-center gap-4 px-5 py-3">
                <span className="w-6 shrink-0 text-center text-sm font-bold text-gray-400">
                  {idx + 1}
                </span>
                {tour.coverImageUrl ? (
                  <img
                    src={tour.coverImageUrl}
                    alt={tour.title}
                    className="h-10 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-14 shrink-0 rounded-lg bg-gray-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{tour.title}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('text-[10px] py-0 px-1.5', TOUR_STATUS_BADGE[tour.status])}
                    >
                      {TOUR_STATUS_LABEL[tour.status] ?? tour.status}
                    </Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-indigo-700">
                    {tour.clicks.toLocaleString('vi-VN')}
                  </p>
                  <p className="text-[10px] text-gray-400">lượt xem</p>
                </div>
                <div className="w-24 shrink-0">
                  <div className="h-1.5 rounded-full bg-indigo-100">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${(tour.clicks / maxClicks) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
