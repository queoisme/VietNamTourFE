import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  Star,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Compass,
  CheckCircle2,
  Clock,
  ChevronRight,
  MessageCircle,
  Navigation,
  CreditCard,
  Plane,
} from 'lucide-react'
import { toast } from 'sonner'
import { cancelBooking, getMyBookings } from '@/api/bookings'
import { createReview } from '@/api/reviews'
import { getOrCreateConversationByBooking } from '@/api/conversations'
import { ReviewImageUpload } from '../components/ReviewImageUpload'
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
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
}

const PAYMENT_TEXT: Record<string, string> = {
  paid: 'text-emerald-600',
  unpaid: 'text-amber-600',
  refunded: 'text-slate-500',
  refund_failed: 'text-rose-600',
}

const FILTER_PILLS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTH_SHORT = ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12']

function parseDateBlock(dateStr: string) {
  const d = new Date(dateStr)
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: MONTH_SHORT[d.getMonth()],
    weekday: WEEKDAY[d.getDay()],
    year: d.getFullYear(),
  }
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
  const [reviewImages, setReviewImages] = useState<string[]>([])
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
    mutationFn: () =>
      createReview({
        bookingId: reviewBooking!.id,
        rating,
        comment: comment || undefined,
        images: reviewImages.length ? reviewImages : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      setReviewBooking(null)
      setRating(5)
      setComment('')
      setReviewImages([])
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero — travel vibe gradient */}
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-amber-50 to-sky-50 p-6 md:p-8 relative">
          <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-orange-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-sky-200/40 blur-3xl" />

          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-orange-700 backdrop-blur">
              <Plane className="size-3.5" /> Hành trình của bạn
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Đơn đặt tour của tôi
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Theo dõi tiến độ xác nhận, thanh toán và lưu giữ kỷ niệm cho từng chuyến đi của bạn.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard icon={Compass} label="Tổng chuyến" value={stats.total} tone="orange" />
              <StatCard icon={Calendar} label="Sắp diễn ra" value={stats.upcoming} tone="sky" />
              <StatCard icon={CheckCircle2} label="Hoàn thành" value={stats.completed} tone="emerald" />
              <StatCard icon={Wallet} label="Chưa thanh toán" value={stats.unpaid} tone="amber" />
            </div>
          </div>
        </div>

        {/* Status pills */}
        <div className="mt-6 overflow-x-auto">
          <div className="inline-flex min-w-full gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            {FILTER_PILLS.map((p) => {
              const active = statusFilter === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setStatusFilter(p.value)}
                  className={cn(
                    'shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bookings list */}
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <TripCard
                  key={booking.id}
                  booking={booking}
                  chatLoading={chatLoadingId === booking.id}
                  onChat={() => handleChat(booking)}
                  onCancel={() => setCancelBookingData(booking)}
                  onReview={() => {
                    setReviewBooking(booking)
                    setRating(5)
                    setComment('')
                    setReviewImages([])
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel dialog */}
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

      {/* Review dialog */}
      <Dialog open={!!reviewBooking} onOpenChange={(open) => !open && setReviewBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chia sẻ trải nghiệm chuyến đi</DialogTitle>
            {reviewBooking && (
              <p className="mt-0.5 truncate text-sm text-slate-500">{reviewBooking.tourTitle}</p>
            )}
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Điểm đánh giá</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)}>
                    <Star
                      className={cn(
                        'size-9 transition-colors',
                        s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 hover:text-yellow-300',
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 self-center text-sm text-slate-500">
                  {['', 'Tệ', 'Không hài lòng', 'Bình thường', 'Tốt', 'Xuất sắc'][rating]}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Nhận xét <span className="font-normal text-slate-400">(tùy chọn)</span>
              </label>
              <Textarea
                placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Hình ảnh <span className="font-normal text-slate-400">(tùy chọn, tối đa 5 ảnh)</span>
              </label>
              <ReviewImageUpload
                urls={reviewImages}
                onChange={setReviewImages}
                disabled={reviewMutation.isPending}
              />
            </div>

            <Button
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─────────────── Stat card ─────────────── */

const STAT_TONE = {
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-600' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
} as const

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone: keyof typeof STAT_TONE
}) {
  const t = STAT_TONE[tone]
  return (
    <div className="rounded-xl border border-white/60 bg-white/70 p-4 backdrop-blur transition-shadow hover:shadow-md">
      <div className={cn('flex size-9 items-center justify-center rounded-lg', t.bg, t.text)}>
        <Icon className="size-4.5" />
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  )
}

/* ─────────────── Trip card ─────────────── */

function TripCard({
  booking,
  chatLoading,
  onChat,
  onCancel,
  onReview,
}: {
  booking: BookingListItem
  chatLoading: boolean
  onChat: () => void
  onCancel: () => void
  onReview: () => void
}) {
  const date = parseDateBlock(booking.tourDate)
  const isUpcoming = ['pending', 'confirmed'].includes(booking.status)
  const isCompleted = booking.status === 'completed'
  const canCancel =
    isUpcoming && booking.tourDate > new Date().toISOString().split('T')[0]

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex flex-col md:flex-row">
        {/* Cover image */}
        <Link
          to={`/tours/${booking.tourId}`}
          className="relative block h-48 w-full overflow-hidden md:h-auto md:w-56 md:shrink-0"
        >
          {(booking.tourCoverImageUrl ?? booking.tourImages?.[0]) ? (
            <img
              src={booking.tourCoverImageUrl ?? booking.tourImages[0]}
              alt={booking.tourTitle}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-sky-100 text-orange-400">
              <Plane className="size-10" />
            </div>
          )}

          {/* Date block overlay top-left */}
          <div className="absolute left-3 top-3 rounded-xl bg-white/95 px-3 py-2 text-center shadow-md backdrop-blur">
            <p className="text-[10px] font-medium uppercase tracking-wider text-orange-600">
              {date.weekday}
            </p>
            <p className="text-xl font-bold leading-none tabular-nums text-slate-900">{date.day}</p>
            <p className="text-[10px] text-slate-500">{date.month}</p>
          </div>

          {/* Status badge top-right */}
          <Badge
            variant="outline"
            className={cn(
              'absolute right-3 top-3 border bg-white/95 shadow-sm backdrop-blur',
              STATUS_BADGE[booking.status],
            )}
          >
            {BOOKING_STATUS_LABELS[booking.status] || booking.status}
          </Badge>
        </Link>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col p-5">
          <Link
            to={`/tours/${booking.tourId}`}
            className="line-clamp-2 text-base font-semibold text-slate-900 transition-colors hover:text-orange-600"
          >
            {booking.tourTitle}
          </Link>

          <p className="mt-1 text-xs text-slate-400">
            Mã đơn: <span className="font-mono">#{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5 text-orange-500" />
              {formatDate(booking.tourDate)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 text-sky-500" />
              {booking.numPeople} người
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet className="size-3.5 text-emerald-500" />
              <span className="font-semibold tabular-nums text-slate-900">{formatVND(booking.totalPrice)}</span>
              <span className={cn('font-medium', PAYMENT_TEXT[booking.paymentStatus])}>
                · {PAYMENT_STATUS_LABELS[booking.paymentStatus] || booking.paymentStatus}
              </span>
            </span>
          </div>

          {/* Action row pinned bottom */}
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/booking-confirmation/${booking.id}`}>
                Chi tiết
                <ChevronRight className="ml-0.5 size-3.5" />
              </Link>
            </Button>

            <Button variant="outline" size="sm" onClick={onChat} disabled={chatLoading}>
              <MessageCircle className="mr-1 size-3.5" />
              {chatLoading ? 'Đang mở...' : 'Nhắn tin'}
            </Button>

            {booking.paymentStatus === 'unpaid' && booking.status === 'pending' && (
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700" asChild>
                <Link to={`/payment/vnpay/${booking.id}`}>
                  <CreditCard className="mr-1 size-3.5" />
                  Thanh toán
                </Link>
              </Button>
            )}

            {isCompleted && !booking.hasReview && (
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                onClick={onReview}
              >
                <Star className="mr-1 size-3.5" />
                Đánh giá
              </Button>
            )}

            {isCompleted && booking.hasReview && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                <Star className="size-3 fill-emerald-500 text-emerald-500" />
                Đã đánh giá
              </span>
            )}

            {booking.status === 'confirmed' && (
              <Button
                size="sm"
                variant="outline"
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
                asChild
              >
                <Link to={`/tour-tracking/${booking.id}`}>
                  <Navigation className="mr-1 size-3.5" />
                  Theo dõi
                </Link>
              </Button>
            )}

            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                className="ml-auto border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={onCancel}
              >
                Hủy đơn
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

/* ─────────────── Empty state ─────────────── */

function EmptyState() {
  return (
    <div className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white">
      <div className="bg-gradient-to-br from-orange-50 via-white to-sky-50 px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-md ring-4 ring-orange-100">
          <Compass className="size-7 text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Hành trình của bạn đang chờ được viết</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Bạn chưa có đơn đặt tour nào. Khám phá hàng trăm trải nghiệm độc đáo cùng hướng dẫn viên địa phương.
        </p>
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link to="/tours">
              <Compass className="mr-1.5 size-4" />
              Khám phá tour
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/ai-search">Gợi ý từ AI</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
