import { useParams, Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'motion/react'
import {
  Check,
  Clock,
  Calendar,
  Users,
  MapPin,
  CreditCard,
  MessageCircle,
  ChevronRight,
  Compass,
  Plane,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Wallet,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { toast } from 'sonner'
import { getBooking } from '@/api/bookings'
import { getOrCreateConversationByBooking } from '@/api/conversations'
import {
  formatVND,
  formatDate,
  formatDateTime,
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/constants'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../components/ui/utils'

const CANCELLATION_BY_LABELS: Record<string, string> = {
  customer: 'Khách hàng',
  guide: 'Hướng dẫn viên',
  admin: 'Quản trị viên',
  system: 'Hệ thống',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
}

const PAYMENT_BADGE: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
  refunded: 'bg-slate-100 text-slate-700 border-slate-200',
  refund_failed: 'bg-rose-50 text-rose-700 border-rose-200',
}

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

export function BookingConfirmation() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isGuide = user?.role === 'guide'
  const [chatLoading, setChatLoading] = useState(false)

  const { data: booking, isLoading, isError, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBooking(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="container mx-auto max-w-4xl space-y-4 px-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <AlertTriangle className="size-6" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Không tìm thấy đơn đặt tour</p>
          <p className="mt-1 text-xs text-slate-500">
            {isError ? (error instanceof Error ? error.message : 'Vui lòng thử lại sau.') : 'Đơn có thể đã bị xóa.'}
          </p>
          <Button asChild className="mt-5 bg-orange-600 hover:bg-orange-700">
            <Link to={isGuide ? '/guide' : '/my-bookings'}>Quay lại</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isPaid = booking.paymentStatus === 'paid'
  const isCancelled = booking.status === 'cancelled' || booking.status === 'rejected'
  const date = parseDateBlock(booking.tourDate)

  const handleChat = async () => {
    if (!id) return
    setChatLoading(true)
    try {
      const conv = await getOrCreateConversationByBooking(id, {
        otherUserId: (isGuide ? booking.customerId : booking.guideId) || undefined,
      })
      if (conv) {
        navigate(`/chat/${conv.id}`)
        return
      }
      navigate('/chat')
      toast('Chưa tạo được hội thoại, vui lòng thử lại')
    } catch (err: unknown) {
      navigate('/chat')
      toast(err instanceof Error ? err.message : 'Không thể mở trang chat lúc này')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Link to={isGuide ? '/guide' : '/'} className="hover:text-slate-900">
            {isGuide ? 'Bảng điều khiển' : 'Trang chủ'}
          </Link>
          <ChevronRight className="size-3.5" />
          <Link to={isGuide ? '/guide' : '/my-bookings'} className="hover:text-slate-900">
            {isGuide ? 'Đơn đặt' : 'Đơn của tôi'}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-slate-900">Chi tiết</span>
        </nav>

        {/* Hero */}
        {isGuide ? (
          <GuideHero booking={booking} />
        ) : (
          <CustomerHero booking={booking} isPaid={isPaid} isCancelled={isCancelled} />
        )}

        {/* Trip ticket card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {/* Cover with date overlay */}
          <div className="relative h-56 w-full overflow-hidden md:h-64">
            {booking.tourCoverImageUrl ? (
              <img
                src={booking.tourCoverImageUrl}
                alt={booking.tourTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-sky-100 text-orange-400">
                <Plane className="size-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

            {/* Date block */}
            <div className="absolute left-4 top-4 rounded-xl bg-white/95 px-3 py-2 text-center shadow-md backdrop-blur">
              <p className="text-[10px] font-medium uppercase tracking-wider text-orange-600">{date.weekday}</p>
              <p className="text-2xl font-bold leading-none tabular-nums text-slate-900">{date.day}</p>
              <p className="text-[10px] text-slate-500">{date.month} {date.year}</p>
            </div>

            {/* Status badges */}
            <div className="absolute right-4 top-4 flex flex-wrap justify-end gap-1.5">
              <Badge variant="outline" className={cn('bg-white/95 shadow-sm backdrop-blur', STATUS_BADGE[booking.status])}>
                {BOOKING_STATUS_LABELS[booking.status] || booking.status}
              </Badge>
              <Badge variant="outline" className={cn('bg-white/95 shadow-sm backdrop-blur', PAYMENT_BADGE[booking.paymentStatus])}>
                {PAYMENT_STATUS_LABELS[booking.paymentStatus] || booking.paymentStatus}
              </Badge>
            </div>

            {/* Title bottom */}
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2 className="text-xl font-semibold text-white drop-shadow-sm md:text-2xl">{booking.tourTitle}</h2>
              <p className="mt-1 text-xs text-white/80">
                Mã đơn: <span className="font-mono">#{booking.id.slice(0, 8).toUpperCase()}</span>
              </p>
            </div>
          </div>

          {/* Trip details grid */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 md:grid-cols-4">
            <DetailCell
              icon={Calendar}
              label="Ngày tour"
              value={formatDate(booking.tourDate)}
              tone="orange"
            />
            <DetailCell icon={Users} label="Số người" value={`${booking.numPeople} người`} tone="sky" />
            <DetailCell icon={MapPin} label="Hướng dẫn viên" value={booking.guideName} tone="emerald" />
            <DetailCell icon={Clock} label="Ngày đặt" value={formatDateTime(booking.createdAt)} tone="amber" />
          </div>

          {/* Total + payment */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 bg-gradient-to-br from-orange-50/50 to-white px-5 py-5">
            <div>
              <p className="text-xs font-medium text-slate-500">Tổng tiền</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-orange-600">
                {formatVND(booking.totalPrice)}
              </p>
            </div>
            {booking.paymentMethod && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Phương thức thanh toán</p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
                  <CreditCard className="size-3.5 text-slate-400" />
                  {booking.paymentMethod.toUpperCase()}
                </p>
              </div>
            )}
          </div>

          {/* Refund failed warning */}
          {booking.paymentStatus === 'refund_failed' && (
            <div className="border-b border-slate-100 px-5 py-4">
              <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                <AlertTitle className="text-sm font-semibold">Hoàn tiền thất bại</AlertTitle>
                <AlertDescription className="text-xs">
                  Hệ thống gặp sự cố khi hoàn tiền qua cổng thanh toán. Đội ngũ hỗ trợ sẽ xử lý hoàn tiền thủ công trong vòng 3–5 ngày làm việc.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Cancellation info */}
          {isCancelled && (
            <div className="border-b border-slate-100 px-5 py-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <AlertTriangle className="size-4 text-rose-500" />
                Thông tin hủy / từ chối
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                {booking.cancellationBy && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Hủy bởi</p>
                    <p className="mt-0.5 font-medium text-slate-900">
                      {CANCELLATION_BY_LABELS[booking.cancellationBy] ?? booking.cancellationBy}
                    </p>
                  </div>
                )}
                {(booking.cancellationReason || booking.rejectionReason) && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 md:col-span-2">
                    <p className="text-xs text-slate-500">Lý do</p>
                    <p className="mt-0.5 font-medium text-slate-900">
                      {booking.cancellationReason || booking.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Refund info */}
          {isCancelled && booking.refundAmount > 0 && (
            <div className="border-b border-slate-100 px-5 py-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Wallet className="size-4 text-emerald-500" />
                Thông tin hoàn tiền
              </h3>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                  <p className="text-xs text-emerald-600">Số tiền hoàn</p>
                  <p className="mt-0.5 text-base font-bold tabular-nums text-emerald-700">
                    {formatVND(booking.refundAmount)}
                  </p>
                </div>
                {booking.refundPolicy && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Chính sách</p>
                    <p className="mt-0.5 font-medium text-slate-900">{booking.refundPolicy}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer contact (guide only) */}
          {isGuide && (
            <div className="px-5 py-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Phone className="size-4 text-sky-500" />
                Thông tin liên hệ khách
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Điện thoại</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-900">{booking.contactPhone || '-'}</p>
                  </div>
                </div>
                {booking.contactEmail && (
                  <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="mt-0.5 truncate text-sm font-medium text-slate-900">{booking.contactEmail}</p>
                    </div>
                  </div>
                )}
                {booking.note && (
                  <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 md:col-span-2">
                    <FileText className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Ghi chú</p>
                      <p className="mt-0.5 text-sm text-slate-700">{booking.note}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.section>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {!isGuide && booking.paymentStatus === 'unpaid' && (
            <Button className="bg-orange-600 hover:bg-orange-700" asChild>
              <Link to={`/payment/vnpay/${booking.id}`}>
                <CreditCard className="mr-1.5 size-4" /> Thanh toán ngay
              </Link>
            </Button>
          )}
          <Button
            disabled={chatLoading}
            onClick={handleChat}
            className="bg-sky-600 hover:bg-sky-700"
          >
            <MessageCircle className="mr-1.5 size-4" />
            {chatLoading ? 'Đang mở...' : isGuide ? 'Nhắn tin với khách' : 'Nhắn tin với HDV'}
          </Button>
          <Button variant="outline" asChild>
            <Link to={isGuide ? '/guide' : '/my-bookings'}>
              <ArrowLeft className="mr-1.5 size-4" />
              {isGuide ? 'Quay lại dashboard' : 'Xem tất cả đơn'}
            </Link>
          </Button>
          {!isGuide && (
            <Button variant="outline" asChild>
              <Link to="/tours">
                <Compass className="mr-1.5 size-4" /> Khám phá thêm
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Hero variants ─────────────── */

function CustomerHero({
  booking,
  isPaid,
  isCancelled,
}: {
  booking: { customerName?: string }
  isPaid: boolean
  isCancelled: boolean
}) {
  if (isCancelled) {
    return (
      <div className="overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-6 md:p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-md ring-4 ring-white">
            <AlertTriangle className="size-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Đơn đặt đã hủy</h1>
          <p className="mt-2 text-sm text-slate-600">
            Đơn này đã bị hủy hoặc từ chối. Xem chi tiết hoàn tiền và lý do bên dưới.
          </p>
        </div>
      </div>
    )
  }

  if (!isPaid) {
    return (
      <div className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 md:p-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-md ring-4 ring-white">
            <Clock className="size-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Đơn đã tạo, chờ thanh toán</h1>
          <p className="mt-2 text-sm text-slate-600">
            Vui lòng thanh toán để hoàn tất đặt tour. Đơn sẽ được hướng dẫn viên xác nhận sau khi nhận được thanh toán.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-6 md:p-8">
      <div className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 size-56 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-xl text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-white"
        >
          <Check className="size-8" strokeWidth={3} />
        </motion.div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 backdrop-blur">
          <Plane className="size-3.5" /> Hành trình sắp bắt đầu
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Đặt tour thành công</h1>
        <p className="mt-2 text-sm text-slate-600">
          Cảm ơn bạn! Hướng dẫn viên sẽ xác nhận và liên hệ trong thời gian sớm nhất. Hãy chuẩn bị cho chuyến đi của bạn.
        </p>
      </div>
    </div>
  )
}

function GuideHero({ booking }: { booking: { customerName?: string; status: string } }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <FileText className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Chi tiết đơn đặt</p>
            <h1 className="mt-0.5 text-xl font-semibold text-slate-900 md:text-2xl">
              {booking.customerName || 'Khách hàng'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">Xem thông tin khách và xử lý đơn từ dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Detail cell ─────────────── */

const DETAIL_TONE = {
  orange: 'text-orange-500',
  sky: 'text-sky-500',
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
} as const

function DetailCell({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: keyof typeof DETAIL_TONE
}) {
  return (
    <div className="p-4 md:p-5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn('size-3.5', DETAIL_TONE[tone])} />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}
