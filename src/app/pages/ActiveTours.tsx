import { Navigate, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Calendar, MapPin, Navigation, MessageCircle, Phone, Users, Radio, ChevronRight } from 'lucide-react'
import { getActiveBookings } from '@/api/bookings'
import { useAuth } from '../contexts/AuthContext'
import { formatDate, formatVND } from '@/lib/constants'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { cn } from '../components/ui/utils'
import type { ActiveBooking } from '@/types/booking'

export function ActiveTours() {
  const { user } = useAuth()

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['active-bookings'],
    queryFn: getActiveBookings,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })

  if (!user) return <Navigate to="/login" />

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Radio className="size-5 animate-pulse" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tour đang diễn ra</h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Chỉ hiển thị các tour đang trong thời gian thực hiện hôm nay. Tự động làm mới mỗi 30 giây.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          bookings.map((b) => <ActiveTourCard key={b.id} booking={b} />)
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border bg-white px-6 py-16 text-center">
      <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Radio className="size-6" />
      </span>
      <h3 className="text-lg font-semibold text-slate-800">Không có tour nào đang diễn ra</h3>
      <p className="mt-1 text-sm text-slate-500">
        Tour sẽ tự động xuất hiện ở đây vào ngày khởi hành và biến mất khi kết thúc.
      </p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/tours">Khám phá tour mới</Link>
      </Button>
    </div>
  )
}

function ActiveTourCard({ booking }: { booking: ActiveBooking }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tourStart = new Date(booking.tourDate)
  tourStart.setHours(0, 0, 0, 0)
  const tourEnd = new Date(booking.endDate)
  tourEnd.setHours(0, 0, 0, 0)

  const dayIndex = Math.max(0, Math.floor((today.getTime() - tourStart.getTime()) / 86_400_000)) + 1
  const daysRemaining = Math.max(0, Math.floor((tourEnd.getTime() - today.getTime()) / 86_400_000))

  const isMultiDay = booking.durationDays > 1
  const counterpartLabel = booking.viewer === 'customer' ? 'Hướng dẫn viên' : 'Khách hàng'

  return (
    <article
      className={cn(
        'rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md md:p-5',
        booking.hasActiveTracking
          ? 'border-l-4 border-l-emerald-500'
          : 'border-l-4 border-l-indigo-400',
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Cover */}
        <div className="md:shrink-0">
          {(booking.tourCoverImageUrl ?? booking.tourImages?.[0]) ? (
            <img
              src={booking.tourCoverImageUrl ?? booking.tourImages[0]}
              alt={booking.tourTitle}
              className="h-40 w-full rounded-xl object-cover md:h-32 md:w-48"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 md:h-32 md:w-48">
              <span className="text-3xl">🎫</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-900">{booking.tourTitle}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {booking.locationCity}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {formatDate(booking.tourDate)}
                  {isMultiDay && <> → {formatDate(booking.endDate)}</>}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" /> {booking.numPeople} người
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-1.5">
              {booking.hasActiveTracking ? (
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  <Radio className="mr-1 size-3 animate-pulse" /> Đang theo dõi GPS
                </Badge>
              ) : (
                <Badge className="border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                  Đang diễn ra
                </Badge>
              )}
              {isMultiDay && (
                <Badge variant="outline" className="border-slate-200 text-slate-600">
                  Ngày {dayIndex}/{booking.durationDays}
                </Badge>
              )}
              {daysRemaining > 0 && (
                <Badge variant="outline" className="border-slate-200 text-slate-600">
                  Còn {daysRemaining} ngày
                </Badge>
              )}
            </div>
          </div>

          {/* Counterpart */}
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
            {booking.counterpartAvatarUrl ? (
              <img
                src={booking.counterpartAvatarUrl}
                alt={booking.counterpartName}
                className="size-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {booking.counterpartName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{booking.counterpartName}</p>
              <p className="text-xs text-slate-500">{counterpartLabel}</p>
            </div>
            {booking.counterpartPhone && (
              <a
                href={`tel:${booking.counterpartPhone}`}
                className="hidden items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:border-emerald-300 hover:text-emerald-700 sm:flex"
              >
                <Phone className="size-3" /> {booking.counterpartPhone}
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-slate-500">
              Tổng: <strong className="text-slate-900">{formatVND(booking.totalPrice)}</strong>
            </span>
            <div className="flex flex-wrap gap-2">
              {booking.conversationId && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/chat/${booking.conversationId}`}>
                    <MessageCircle className="mr-1.5 size-3.5" /> Nhắn tin
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link to={`/tour-tracking/${booking.id}`}>
                  <Navigation className="mr-1.5 size-3.5" />
                  {booking.viewer === 'guide' ? 'Mở chế độ HDV' : 'Theo dõi lộ trình'}
                  <ChevronRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
