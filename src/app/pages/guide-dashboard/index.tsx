import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { Plus, Zap, Star as StarIcon, Menu as MenuIcon, Wallet, TrendingUp, Clock, Crown } from 'lucide-react'
import {
  getGuideBookings,
  confirmBooking,
  rejectBooking,
  completeBooking,
  guideCancelBooking,
} from '@/api/bookings'
import { getOrCreateConversationByBooking, getConversations } from '@/api/conversations'
import { getUnreadCount } from '@/api/notifications'
import { createWithdrawal, getMyFinance, getMyWithdrawals } from '@/api/withdrawals'
import { getMyTours, updateTourStatus } from '@/api/tours'
import { getMyBoosts, getMySubscription } from '@/api/boosts'
import { formatVND, WITHDRAWAL_METHODS } from '@/lib/constants'
import type { BookingListItem } from '@/types/booking'
import type { CreateWithdrawalRequest } from '@/types/finance'
import type { TourListItem } from '@/types/tour'
import { useAuth } from '../../contexts/AuthContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { Textarea } from '../../components/ui/textarea'

import { SidebarNav } from './SidebarNav'
import { KpiCard } from './components/KpiCard'
import { PillTabs } from './components/PillTabs'
import { OverviewTab } from './OverviewTab'
import { ActiveToursTab } from './ActiveToursTab'
import { ChatTab } from './ChatTab'
import { NotificationsTab } from './NotificationsTab'
import { ToursTab } from './ToursTab'
import { FinanceTab } from './FinanceTab'
import { SubscriptionTab } from './SubscriptionTab'
import { AnalyticsTab } from './AnalyticsTab'
import { ProfileTab } from './ProfileTab'

function formatPlanLabel(plan: string): string {
  return plan.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const TAB_ITEMS = [
  { key: 'overview', label: 'Đơn đặt' },
  { key: 'active', label: 'Đang diễn ra' },
  { key: 'chat', label: 'Tin nhắn' },
  { key: 'notifications', label: 'Thông báo' },
  { key: 'tours', label: 'Tour của tôi' },
  { key: 'finance', label: 'Tài chính' },
  { key: 'subscription', label: 'Gói & Boost' },
  { key: 'analytics', label: 'Thống kê' },
  { key: 'profile', label: 'Hồ sơ' },
]

export function GuideDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<string>(
    (location.state as { tab?: string } | null)?.tab ?? 'overview',
  )
  const [chatInitialConvId, setChatInitialConvId] = useState<string | null>(
    (location.state as { conversationId?: string } | null)?.conversationId ?? null,
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

  // Sidebar badge: total unread across all conversations.
  const { data: chatUnreadCount = 0 } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: async () => {
      const res = await getConversations({ size: 100 })
      return res.items.reduce((sum, c) => sum + c.unreadCount, 0)
    },
    refetchInterval: 30000,
  })

  // Sidebar badge: unread notifications.
  const { data: notifUnreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
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
      setWAmount('')
      setWMethod('bank')
      setWAccountNo('')
      setWAccountName('')
      setWBankName('')
      setWPhone('')
      setWNote('')
      toast.success('Đã gửi yêu cầu rút tiền thành công')
    },
    onError: (err: Error) => toast.error(err.message),
  })

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

  const handleChat = async (booking: BookingListItem) => {
    setChatLoadingId(booking.id)
    try {
      const conv = await getOrCreateConversationByBooking(booking.id)
      if (conv) {
        // Open chat inside the dashboard instead of navigating to /chat.
        setChatInitialConvId(conv.id)
        setActiveTab('chat')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể mở chat lúc này')
    } finally {
      setChatLoadingId(null)
    }
  }

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

  const bookings = bookingsData?.items ?? []
  const tours = toursData?.items ?? []
  const withdrawals = withdrawalsData?.items ?? []
  const pendingBookings = bookings.filter((b) => b.status === 'pending')
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed')
  const completedBookings = bookings.filter((b) => b.status === 'completed')

  const activePlan = currentSub?.status === 'active' ? currentSub.plan : 'free'
  const isFreePlan = activePlan === 'free'
  const sidebarExpanded = sidebarHovered

  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarNav
        user={user}
        activeTab={activeTab}
        pendingCount={pendingBookings.length}
        chatUnreadCount={chatUnreadCount}
        notifUnreadCount={notifUnreadCount}
        isFreePlan={isFreePlan}
        hovered={sidebarHovered}
        setHovered={setSidebarHovered}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onSelectTab={setActiveTab}
        onUpgrade={() => navigate('/subscription')}
        onLogout={() => {
          logout()
          navigate('/')
        }}
      />

      <div className={sidebarExpanded ? 'transition-all duration-300 lg:pl-64' : 'transition-all duration-300 lg:pl-16'}>
        {/* Mobile hamburger */}
        <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <Button size="icon" variant="ghost" onClick={() => setMobileSidebarOpen(true)}>
            <MenuIcon className="size-5" />
          </Button>
          <span className="text-sm font-medium text-slate-800">Bảng điều khiển</span>
        </div>

        <div className="p-4 lg:p-6">
          <main className="mx-auto max-w-7xl space-y-6">
            {/* Greeting */}
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Xin chào, {user?.name}
                </h1>
                <p className="mt-1 text-sm text-slate-600">Quản lý tour và đơn đặt của bạn</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link to="/create-tour">
                    <Plus className="mr-1 size-4" /> Tạo tour mới
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/boost">
                    <Zap className="mr-1 size-4" /> Boost tour
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/reviews">
                    <StarIcon className="mr-1 size-4" /> Đánh giá
                  </Link>
                </Button>
              </div>
            </header>

            {/* 4 KPI cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {financeLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
              ) : (
                <>
                  <KpiCard
                    icon={Wallet}
                    label="Số dư"
                    value={formatVND(finance?.balance ?? 0)}
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          setWithdrawDialog(true)
                        }}
                      >
                        Rút tiền
                      </Button>
                    }
                  />
                  <KpiCard
                    icon={TrendingUp}
                    label="Tổng thu"
                    value={formatVND(finance?.totalEarned ?? 0)}
                  />
                  <KpiCard icon={Clock} label="Chờ xác nhận" value={pendingBookings.length} />
                  <KpiCard
                    icon={Crown}
                    label="Gói đăng ký"
                    value={formatPlanLabel(activePlan)}
                    onClick={() => navigate('/subscription')}
                  />
                </>
              )}
            </div>

            {/* Pill tabs */}
            <PillTabs items={TAB_ITEMS} value={activeTab} onChange={setActiveTab} />

            {/* Tab content with transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && (
                  <OverviewTab
                    isLoading={bookingsLoading}
                    bookings={bookings}
                    pendingBookings={pendingBookings}
                    confirmedBookings={confirmedBookings}
                    completedBookings={completedBookings}
                    chatLoadingId={chatLoadingId}
                    onAction={(booking, action) => setActionBooking({ booking, action })}
                    onChat={handleChat}
                  />
                )}
                {activeTab === 'active' && <ActiveToursTab />}
                {activeTab === 'chat' && <ChatTab initialConvId={chatInitialConvId} />}
                {activeTab === 'notifications' && <NotificationsTab />}
                {activeTab === 'tours' && (
                  <ToursTab
                    isLoading={toursLoading}
                    tours={tours}
                    onToggleStatus={(id, status) => statusMutation.mutate({ id, status })}
                    isUpdatingId={statusMutation.isPending ? statusMutation.variables?.id : undefined}
                  />
                )}
                {activeTab === 'finance' && (
                  <FinanceTab
                    finance={finance}
                    withdrawals={withdrawals}
                    isLoading={false}
                    onWithdraw={() => setWithdrawDialog(true)}
                  />
                )}
                {activeTab === 'subscription' && (
                  <SubscriptionTab
                    currentSub={currentSub ?? null}
                    boosts={boostsData?.items ?? []}
                    onNavigate={navigate}
                  />
                )}
                {activeTab === 'analytics' && <AnalyticsTab />}
                {activeTab === 'profile' && <ProfileTab />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Action dialog: confirm / complete */}
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

      {/* Reject dialog */}
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

      {/* Withdraw dialog — regrouped into 2 sections */}
      <Dialog open={withdrawDialog} onOpenChange={setWithdrawDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yêu cầu rút tiền</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm">
              <span className="text-slate-600">Số dư khả dụng: </span>
              <span className="font-semibold text-orange-700">{formatVND(finance?.balance ?? 0)}</span>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-700">Số tiền & phương thức</p>
              <div className="space-y-1.5">
                <Label>Số tiền (tối thiểu 100.000 ₫)</Label>
                <Input
                  type="number"
                  placeholder="VD: 500000"
                  value={wAmount}
                  onChange={(e) => setWAmount(e.target.value)}
                  min={100000}
                  max={finance?.balance ?? 0}
                />
                {Number(wAmount) > 0 && (
                  <p className="text-xs text-slate-500">
                    Phí 2%: {formatVND(Math.round(Number(wAmount) * 0.02))} · Thực nhận:{' '}
                    <span className="font-medium text-emerald-700">
                      {formatVND(Math.round(Number(wAmount) * 0.98))}
                    </span>
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Phương thức</Label>
                <Select value={wMethod} onValueChange={setWMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WITHDRAWAL_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-700">Thông tin nhận</p>
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
            </div>

            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
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

      {/* Guide-cancel dialog */}
      <Dialog
        open={actionBooking?.action === 'guide-cancel'}
        onOpenChange={() => {
          setActionBooking(null)
          setRejectReason('')
        }}
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
