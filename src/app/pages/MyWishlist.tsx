import { Link, Navigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MapPin, Star, Sparkles, Compass, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { useAuth } from '../contexts/AuthContext'
import { getWishlist, removeFromWishlist } from '@/api/wishlists'
import { formatVND } from '@/lib/constants'
import { optimizeImg } from '@/lib/imgUrl'

function savedAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const day = 24 * 60 * 60 * 1000
  if (ms < day) return 'Lưu hôm nay'
  const days = Math.floor(ms / day)
  if (days < 7) return `Đã lưu ${days} ngày trước`
  if (days < 30) return `Đã lưu ${Math.floor(days / 7)} tuần trước`
  if (days < 365) return `Đã lưu ${Math.floor(days / 30)} tháng trước`
  return `Đã lưu ${Math.floor(days / 365)} năm trước`
}

export function MyWishlist() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  if (!user) return <Navigate to="/login" />

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => getWishlist({ size: 50 }),
  })

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Đã bỏ khỏi danh sách yêu thích')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const items = data?.items ?? []
  const totalCount = data?.meta?.total ?? items.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 pt-8 pb-24 text-white">
        <div className="container relative mx-auto px-4">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/80">
            <Link to="/" className="hover:text-white">Trang chủ</Link>
            <span className="text-white/50">/</span>
            <span className="font-medium text-white">Tour yêu thích</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25">
                <Sparkles className="size-3.5" />
                Bộ sưu tập của bạn
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Tour Yêu Thích</h1>
              <p className="mt-2 max-w-xl text-base text-white/90 md:text-lg">
                Những hành trình bạn lưu lại để dành cho chuyến đi tiếp theo.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-3 ring-1 ring-white/25">
              <Heart className="size-6 fill-white text-white" />
              <div>
                <div className="text-xs uppercase tracking-wide text-white/80">Đã lưu</div>
                <div className="text-2xl font-bold leading-none">{totalCount}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto -mt-12 px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden rounded-2xl border-0 shadow-md">
                <Skeleton className="h-56 w-full" />
                <div className="space-y-2 p-5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-white py-20 text-center shadow-sm">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-rose-100 text-orange-500">
              <Compass className="size-10" />
            </div>
            <h3 className="mb-2 text-2xl font-semibold text-slate-900">Hành trình đầu tiên đang chờ bạn</h3>
            <p className="mx-auto mb-6 max-w-md text-slate-500">
              Khám phá và lưu lại những tour bạn yêu thích để dễ dàng quay lại đặt chỗ sau này.
            </p>
            <Button asChild className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 text-white shadow-md shadow-orange-500/30 hover:from-orange-600 hover:to-red-600">
              <Link to="/tours">
                Khám phá tour ngay
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <WishlistCard
                key={item.id}
                item={item}
                onRemove={() => removeMutation.mutate(item.tourId)}
                isRemoving={removeMutation.isPending && removeMutation.variables === item.tourId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface WishlistCardProps {
  item: {
    id: string
    tourId: string
    tourTitle: string
    tourCoverImageUrl: string | null
    tourCity: string
    pricePerPerson: number
    avgRating: number
    totalReviews: number
    addedAt: string
  }
  onRemove: () => void
  isRemoving: boolean
}

function WishlistCard({ item, onRemove, isRemoving }: WishlistCardProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onRemove()
  }

  return (
    <Link
      to={`/tours/${item.tourId}`}
      className="group block will-change-transform transition-transform duration-200 hover:-translate-y-1.5"
    >
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-0 bg-white shadow-md transition-shadow group-hover:shadow-xl">
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-orange-200 to-rose-200">
          {item.tourCoverImageUrl ? (
            <img
              src={optimizeImg(item.tourCoverImageUrl, 800)}
              alt={item.tourTitle}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl text-orange-300">✦</div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

          {/* Rating chip — top-left */}
          {item.totalReviews > 0 && (
            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm">
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              {item.avgRating.toFixed(1)}
              <span className="text-slate-400">({item.totalReviews})</span>
            </div>
          )}

          {/* Heart — top-right (remove) */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            aria-label="Bỏ khỏi danh sách yêu thích"
            className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-full bg-white shadow-md transition-all hover:scale-110 hover:bg-rose-50 active:scale-95 disabled:opacity-50"
          >
            <Heart className="size-5 fill-rose-500 text-rose-500" />
          </button>

          {/* City — bottom-left */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-sm font-medium text-white">
            <MapPin className="size-4" />
            <span>{item.tourCity}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{item.tourTitle}</h3>
          <p className="mt-1.5 text-xs text-slate-500">{savedAgo(item.addedAt)}</p>

          <div className="mt-auto flex items-end justify-between pt-4">
            <div>
              <div className="text-xl font-bold text-orange-600">{formatVND(item.pricePerPerson)}</div>
              <div className="text-xs text-slate-500">/người</div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-orange-500/30 transition-colors group-hover:from-orange-600 group-hover:to-orange-700">
              Xem tour
              <ArrowRight className="size-4" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
