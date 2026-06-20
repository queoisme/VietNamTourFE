import { Link } from 'react-router'
import { motion } from 'motion/react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../components/ui/utils'
import { formatDate, formatVND, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import type { BookingListItem } from '@/types/booking'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
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

export function BookingCard({
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
  const showConfirmReject = booking.status === 'pending' && isPaid
  const showComplete = booking.status === 'confirmed'

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex gap-4">
        {(booking.tourCoverImageUrl ?? booking.tourImages?.[0]) ? (
          <div className="size-20 shrink-0 overflow-hidden rounded-lg md:size-24">
            <img
              src={booking.tourCoverImageUrl ?? booking.tourImages[0]}
              alt={booking.tourTitle}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 md:size-24">
            <span className="text-2xl">·</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold text-slate-900">{booking.tourTitle}</p>
              <p className="mt-0.5 text-xs text-slate-500">#{booking.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <Badge variant="outline" className={cn('shrink-0 font-medium', STATUS_BADGE[booking.status])}>
              {BOOKING_STATUS_LABELS[booking.status] || booking.status}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
            <span>{formatDate(booking.tourDate)}</span>
            <span className="text-slate-300">·</span>
            <span>{booking.numPeople} người</span>
            <span className="text-slate-300">·</span>
            <span className="font-semibold text-slate-900">{formatVND(booking.totalPrice)}</span>
            <span className="text-slate-300">·</span>
            <span className={cn('font-medium', PAYMENT_TEXT[booking.paymentStatus] ?? 'text-slate-500')}>
              {PAYMENT_STATUS_LABELS[booking.paymentStatus] || booking.paymentStatus}
            </span>
          </div>

          {booking.status === 'pending' && !isPaid && (
            <p className="mt-3 inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
              Khách chưa thanh toán, chưa thể xác nhận.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {showConfirmReject && (
              <>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onAction('confirm')}>
                  Xác nhận
                </Button>
                <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => onAction('reject')}>
                  Từ chối
                </Button>
              </>
            )}

            {showComplete && (
              <>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onAction('complete')}>
                  Hoàn thành
                </Button>
                <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => onAction('guide-cancel')}>
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
              <Button size="sm" variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50" asChild>
                <Link to={`/tour-tracking/${booking.id}`}>Tracking</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
