import { Link } from 'react-router'
import { Map, Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { SectionHeader } from './components/SectionHeader'
import { TourCard } from './components/TourCard'
import { EmptyState } from './components/EmptyState'
import type { TourListItem } from '@/types/tour'

export function ToursTab({
  isLoading,
  tours,
  onToggleStatus,
  isUpdatingId,
}: {
  isLoading: boolean
  tours: TourListItem[]
  onToggleStatus: (id: string, status: string) => void
  isUpdatingId: string | undefined
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        tag="Tour của tôi"
        title="Quản lý tour"
        description="Đăng tour mới, cập nhật trạng thái và theo dõi lượt đặt."
        chip={
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {tours.length} tour
          </span>
        }
        action={
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link to="/create-tour">
              <Plus className="mr-1 size-4" /> Tạo tour mới
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : tours.length === 0 ? (
        <EmptyState
          icon={Map}
          title="Chưa có tour nào"
          description="Bắt đầu hành trình hướng dẫn viên bằng cách tạo tour đầu tiên."
          action={
            <Button size="sm" asChild className="bg-orange-600 hover:bg-orange-700">
              <Link to="/create-tour">
                <Plus className="mr-1 size-4" /> Tạo tour đầu tiên
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tours.map((tour) => (
            <TourCard
              key={tour.id}
              tour={tour}
              onToggleStatus={onToggleStatus}
              isUpdating={isUpdatingId === tour.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
