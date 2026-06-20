import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Calendar, MapPin, Navigation, MessageCircle, Phone, Users, Radio, ChevronRight } from 'lucide-react'
import { getActiveBookings } from '@/api/bookings'
import { formatDate, formatVND } from '@/lib/constants'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { cn } from '../../components/ui/utils'
import type { ActiveBooking } from '@/types/booking'
import { SectionHeader } from './components/SectionHeader'
import { EmptyState } from './components/EmptyState'

export function ActiveToursTab() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['active-bookings'],
    queryFn: getActiveBookings,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  })

  const tracking = bookings.filter((b) => b.hasActiveTracking).length

  return (
    <div className="space-y-6">
      <SectionHeader
        tag="Trực tiếp"
        title="Tour đang diễn ra"
        description="Chỉ hiển thị các tour đang trong thời gian thực hiện. Tự động làm mới mỗi 30 giây."
        chip={
          bookings.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              {bookings.length} tour live{tracking > 0 && ` · ${tracking} có GPS`}
            </span>
          ) : undefined
        }
      />

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="Không có tour nào đang diễn ra"
            description="Tour sẽ tự động xuất hiện ở đây vào ngày khởi hành và biến mất khi kết thúc."
            action={
              <Button size="sm" variant="outline" asChild>
                <Link to="/tours">Khám phá tour mới</Link>
              </Button>
            }
          />
        ) : (
          bookings.map((b) => <ActiveTourCard key={b.id} booking={b} />)
        )}
      </div>
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
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 md:flex-row">
        {/* Cover */}
        <div className="md:shrink-0">
          {(booking.tourCoverImageUrl ?? booking.tourImages?.[0]) ? (
            <div className="h-40 w-full overflow-hidden rounded-lg md:h-28 md:w-40">
              <img
                src={booking.tourCoverImageUrl ?? booking.tourImages[0]}
                alt={booking.tourTitle}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-400 md:h-28 md:w-40">
              <Radio className="size-7" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">{booking.tourTitle}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {booking.locationCity}
                </span>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDate(booking.tourDate)}
                  {isMultiDay && <> → {formatDate(booking.endDate)}</>}
                </span>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" /> {booking.numPeople} người
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-1.5">
              {booking.hasActiveTracking ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <Radio className="mr-1 size-3 animate-pulse" /> GPS
                </Badge>
              ) : (
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
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
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            {booking.counterpartAvatarUrl ? (
              <img
                src={booking.counterpartAvatarUrl}
                alt={booking.counterpartName}
                className="size-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-sm font-semibold text-white">
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
                className="hidden items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 sm:flex"
              >
                <Phone className="size-3" /> {booking.counterpartPhone}
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              Tổng: <span className="font-semibold tabular-nums text-slate-900">{formatVND(booking.totalPrice)}</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {booking.conversationId && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/chat/${booking.conversationId}`}>
                    <MessageCircle className="mr-1.5 size-3.5" /> Nhắn tin
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" className={cn('bg-orange-600 hover:bg-orange-700', booking.hasActiveTracking && 'bg-emerald-600 hover:bg-emerald-700')}>
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
    </motion.article>
  )
}
