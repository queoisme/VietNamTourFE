import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getGuideBookings, confirmBooking, rejectBooking, completeBooking, guideCancelBooking } from '@/api/bookings'
import { getOrCreateConversationByBooking } from '@/api/conversations'
import { createWithdrawal, getMyFinance, getMyWithdrawals } from '@/api/withdrawals'
import { getMyTours, updateTourStatus } from '@/api/tours'
import { formatDate, formatVND, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS, WITHDRAWAL_METHODS } from '@/lib/constants'
import { BookingListItem } from '@/types/booking'
import { CreateWithdrawalRequest, Withdrawal } from '@/types/finance'
import { TourListItem } from '@/types/tour'
import { useAuth } from '../contexts/AuthContext'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
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
  const { user } = useAuth()
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Xin chào, {user?.name}!</h1>
          <p className="mt-1 text-gray-500">Quản lý tour và đơn đặt của bạn</p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/create-tour">+ Tạo tour mới</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/boost">Boost tour</Link>
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {financeLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setWithdrawDialog(true)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Số dư</p>
                    <p className="text-lg font-bold">{formatVND(finance?.balance ?? 0)}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={(e) => { e.stopPropagation(); setWithdrawDialog(true) }}>
                    Rút tiền
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Tổng thu</p>
                <p className="text-lg font-bold">{formatVND(finance?.totalEarned ?? 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Chờ xác nhận</p>
                <p className="text-lg font-bold">{pendingBookings.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Gói đăng ký</p>
                <p className="text-lg font-bold capitalize">{finance?.subscriptionPlan || 'free'}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Đơn đặt</TabsTrigger>
          <TabsTrigger value="tours">Tour của tôi</TabsTrigger>
          <TabsTrigger value="finance">Tài chính</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <BookingStatCard label="Tổng đơn" value={bookings.length} />
            <BookingStatCard label="Chờ xác nhận" value={pendingBookings.length} />
            <BookingStatCard label="Đang diễn ra" value={confirmedBookings.length} />
            <BookingStatCard label="Đã hoàn thành" value={completedBookings.length} />
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
        </TabsContent>

        <TabsContent value="tours">
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
        </TabsContent>

        <TabsContent value="finance">
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
        </TabsContent>
      </Tabs>

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
        'rounded-2xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:p-5',
        GUIDE_BOOKING_CARD_BORDER[booking.status],
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        {(booking.tourCoverImageUrl ?? booking.tourImages?.[0]) ? (
          <img
            src={booking.tourCoverImageUrl ?? booking.tourImages[0]}
            alt={booking.tourTitle}
            className="h-32 w-full rounded-xl object-cover md:w-48 md:shrink-0"
          />
        ) : (
          <div className="flex h-32 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 md:w-48 md:shrink-0">
            <span className="text-3xl">🎫</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="line-clamp-2 text-lg font-semibold text-slate-900">{booking.tourTitle}</p>
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
          </div>
        </div>
      </div>
    </article>
  )
}

function BookingStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
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
