import { Skeleton } from '../../components/ui/skeleton'
import { Inbox } from 'lucide-react'
import { SectionHeader } from './components/SectionHeader'
import { MiniStat } from './components/MiniStat'
import { BookingCard } from './components/BookingCard'
import { EmptyState } from './components/EmptyState'
import type { BookingListItem } from '@/types/booking'

export function OverviewTab({
  isLoading,
  bookings,
  pendingBookings,
  confirmedBookings,
  completedBookings,
  chatLoadingId,
  onAction,
  onChat,
}: {
  isLoading: boolean
  bookings: BookingListItem[]
  pendingBookings: BookingListItem[]
  confirmedBookings: BookingListItem[]
  completedBookings: BookingListItem[]
  chatLoadingId: string | null
  onAction: (booking: BookingListItem, action: 'confirm' | 'complete' | 'reject' | 'guide-cancel') => void
  onChat: (booking: BookingListItem) => void
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        tag="Đơn đặt"
        title="Tổng quan đơn đặt gần đây"
        description="Theo dõi trạng thái thanh toán và xử lý đơn nhanh hơn."
        chip={
          pendingBookings.length > 0 ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              {pendingBookings.length} chờ xác nhận
            </span>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MiniStat label="Tổng đơn" value={bookings.length} />
        <MiniStat label="Chờ xác nhận" value={pendingBookings.length} tone="amber" />
        <MiniStat label="Đang diễn ra" value={confirmedBookings.length} tone="orange" />
        <MiniStat label="Đã hoàn thành" value={completedBookings.length} tone="emerald" />
      </div>

      {pendingBookings.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Cần xử lý sớm</p>
          {pendingBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              chatLoading={chatLoadingId === b.id}
              onAction={(action) => onAction(b, action)}
              onChat={() => onChat(b)}
            />
          ))}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Tất cả đơn gần đây</p>
          <p className="text-xs text-slate-500">{bookings.length} đơn</p>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Chưa có đơn đặt nào"
            description="Khi khách đặt tour, đơn sẽ hiện ở đây."
          />
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                chatLoading={chatLoadingId === b.id}
                onAction={(action) => onAction(b, action)}
                onChat={() => onChat(b)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
