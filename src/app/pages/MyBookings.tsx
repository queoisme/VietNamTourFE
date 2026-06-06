import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { cancelBooking, getMyBookings } from '@/api/bookings'
import { createReview } from '@/api/reviews'
import { getOrCreateConversationByBooking } from '@/api/conversations'
import { cn } from '@/app/components/ui/utils'
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatVND,
} from '@/lib/constants'
import { BookingListItem } from '@/types/booking'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
}

const STATUS_CARD_CLASS: Record<string, string> = {
  pending: 'border-l-4 border-l-amber-400',
  confirmed: 'border-l-4 border-l-blue-400',
  completed: 'border-l-4 border-l-emerald-400',
  cancelled: 'border-l-4 border-l-rose-400',
  rejected: 'border-l-4 border-l-rose-400',
}

const PAYMENT_BADGE_CLASS: Record<string, string> = {
  unpaid: 'bg-orange-50 text-orange-700 border-orange-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refunded: 'bg-slate-100 text-slate-700 border-slate-200',
  refund_failed: 'bg-amber-100 text-amber-800 border-amber-200',
}

export function MyBookings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [cancelBookingData, setCancelBookingData] = useState<BookingListItem | null>(null)
  const [reviewBooking, setReviewBooking] = useState<BookingListItem | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null)

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

  if (!user) return <Navigate to="/login" />

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', statusFilter],
    queryFn: () => getMyBookings({ status: statusFilter === 'all' ? undefined : statusFilter, size: 50 }),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id, { reason: 'Khách hàng hủy' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      setCancelBookingData(null)
      toast.success('Đã hủy đơn đặt tour thành công')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const reviewMutation = useMutation({
    mutationFn: () => createReview({ bookingId: reviewBooking!.id, rating, comment: comment || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      setReviewBooking(null)
      setRating(5)
      setComment('')
      toast.success('Đã gửi đánh giá thành công')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const bookings = data?.items ?? []

  const stats = useMemo(() => {
    const total = bookings.length
    const upcoming = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status)).length
    const completed = bookings.filter((b) => b.status === 'completed').length
    const unpaid = bookings.filter((b) => b.paymentStatus === 'unpaid').length
    return { total, upcoming, completed, unpaid }
  }, [bookings])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-2xl border bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Đơn đặt tour của tôi</h1>
            <p className="mt-2 text-sm text-slate-600">
              Theo dõi tiến độ xác nhận, thanh toán và đánh giá cho từng chuyến đi.
            </p>
          </div>
          <div className="w-full md:w-56">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Lọc theo trạng thái</p>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard label="Tổng đơn" value={stats.total.toString()} />
          <SummaryCard label="Sắp diễn ra" value={stats.upcoming.toString()} />
          <SummaryCard label="Đã hoàn thành" value={stats.completed.toString()} />
          <SummaryCard label="Chưa thanh toán" value={stats.unpaid.toString()} />
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border bg-white px-6 py-16 text-center">
            <h3 className="text-xl font-semibold text-slate-900">Chưa có đơn đặt tour nào</h3>
            <p className="mt-2 text-sm text-slate-500">Bạn có thể bắt đầu với một tour đang mở lịch gần đây.</p>
            <Button asChild className="mt-6">
              <Link to="/tours">Khám phá tour ngay</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <article
                key={booking.id}
                className={cn(
                  'rounded-2xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:p-5',
                  STATUS_CARD_CLASS[booking.status],
                )}
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  {(booking.tourCoverImageUrl ?? booking.tourImages?.[0]) ? (
                    <img
                      src={booking.tourCoverImageUrl ?? booking.tourImages[0]}
                      alt={booking.tourTitle}
                      className="h-40 w-full rounded-xl object-cover md:h-32 md:w-52 md:shrink-0"
                    />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 md:h-32 md:w-52 md:shrink-0">
                      <span className="text-3xl">🎫</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link
                          to={`/tours/${booking.tourId}`}
                          className="line-clamp-2 text-lg font-semibold text-slate-900 transition-colors hover:text-orange-600"
                        >
                          {booking.tourTitle}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          Mã đơn: #{booking.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={cn('font-medium', STATUS_BADGE_CLASS[booking.status])}>
                          {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                        </Badge>
                        <Badge variant="outline" className={cn('font-medium', PAYMENT_BADGE_CLASS[booking.paymentStatus])}>
                          {PAYMENT_STATUS_LABELS[booking.paymentStatus] || booking.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                      <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">{formatDate(booking.tourDate)}</span>
                      <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">{booking.numPeople} người</span>
                      <span className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">{formatVND(booking.totalPrice)}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/booking-confirmation/${booking.id}`}>Xem chi tiết</Link>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChat(booking)}
                        disabled={chatLoadingId === booking.id}
                      >
                        {chatLoadingId === booking.id ? 'Đang mở...' : 'Nhắn tin'}
                      </Button>

                      {booking.paymentStatus === 'unpaid' && booking.status === 'pending' && (
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700" asChild>
                          <Link to={`/payment/vnpay/${booking.id}`}>Thanh toán</Link>
                        </Button>
                      )}

                      {booking.status === 'completed' && !booking.hasReview && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReviewBooking(booking)
                            setRating(5)
                            setComment('')
                          }}
                        >
                          <Star className="mr-1 size-4" />
                          Đánh giá
                        </Button>
                      )}
                      {booking.status === 'completed' && booking.hasReview && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                          <Star className="size-3 fill-emerald-500 text-emerald-500" />
                          Đã đánh giá
                        </span>
                      )}

                      {booking.status === 'confirmed' && (
                        <Button size="sm" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" asChild>
                          <Link to={`/tour-tracking/${booking.id}`}>📍 Theo dõi tour</Link>
                        </Button>
                      )}

                      {['pending', 'confirmed'].includes(booking.status) &&
                        booking.tourDate > new Date().toISOString().split('T')[0] && (
                        <Button size="sm" variant="destructive" onClick={() => setCancelBookingData(booking)}>
                          Hủy đơn
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!cancelBookingData} onOpenChange={(open) => !open && setCancelBookingData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn hủy đơn đặt tour &quot;{cancelBookingData?.tourTitle}&quot;? Phí hoàn tiền phụ thuộc vào
              thời gian hủy so với ngày tour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelMutation.mutate(cancelBookingData!.id)}>
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!reviewBooking} onOpenChange={(open) => !open && setReviewBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đánh giá tour: {reviewBooking?.tourTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Điểm đánh giá</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)}>
                    <Star
                      className={cn(
                        'size-8 transition-colors',
                        s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Nhận xét (tùy chọn)</label>
              <Textarea
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
            <Button className="w-full" onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white/80 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

