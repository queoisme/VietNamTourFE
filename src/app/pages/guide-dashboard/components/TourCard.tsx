import { Link } from 'react-router'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../components/ui/utils'
import { formatVND } from '@/lib/constants'
import { optimizeImg } from '@/lib/imgUrl'
import type { TourListItem } from '@/types/tour'

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Tạm dừng',
  draft: 'Nháp',
}

export function TourCard({
  tour,
  onToggleStatus,
  isUpdating,
}: {
  tour: TourListItem
  onToggleStatus: (id: string, status: string) => void
  isUpdating: boolean
}) {
  const isActive = tour.status === 'active'
  const hasImage = Boolean(tour.coverImageUrl || tour.images?.[0])

  return (
    <div className="group h-full will-change-transform transition-transform duration-200 hover:-translate-y-1">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all group-hover:border-slate-300 group-hover:shadow-md">
        <div className="relative h-40 overflow-hidden bg-slate-100">
          {hasImage ? (
            <img
              src={optimizeImg(tour.coverImageUrl ?? tour.images[0], 600)}
              alt={tour.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 text-3xl text-orange-300">
              ·
            </div>
          )}
          {tour.isBoosted && (
            <Badge className="absolute left-3 top-3 rounded-full border-0 bg-orange-500 px-2.5 py-0.5 text-white shadow-md">
              Boost
            </Badge>
          )}
          <Badge variant="outline" className={cn('absolute right-3 top-3 font-medium', STATUS_BADGE[tour.status])}>
            {STATUS_LABEL[tour.status] || tour.status}
          </Badge>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">{tour.title}</h3>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold tabular-nums text-slate-900">{tour.totalBookings}</span>
            <span>đặt</span>
            {tour.locationCity && (
              <>
                <span className="text-slate-300">·</span>
                <span>{tour.locationCity}</span>
              </>
            )}
          </div>
          <p className="mt-3 text-lg font-semibold tabular-nums text-orange-600">
            {formatVND(tour.pricePerPerson)}
            <span className="ml-1 text-xs font-normal text-slate-500">/người</span>
          </p>

          <div className="mt-auto flex flex-wrap gap-2 pt-4">
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
                className="text-slate-600"
                disabled={isUpdating}
                onClick={() => onToggleStatus(tour.id, 'inactive')}
              >
                Tạm dừng
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={isUpdating}
                onClick={() => onToggleStatus(tour.id, 'active')}
              >
                Đăng
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
