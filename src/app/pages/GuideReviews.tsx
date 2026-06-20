import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star, MessageSquare, TrendingUp, MapPin, ChevronRight, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { getGuideReviews, replyReview } from '@/api/reviews'
import { ReviewImageGallery } from '../components/ReviewImageUpload'
import { ReviewLikeButton } from '../components/ReviewLikeButton'
import { cn } from '@/app/components/ui/utils'
import { formatDate, formatDateTime } from '@/lib/constants'
import type { Review } from '@/types/review'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'

export function GuideReviews() {
  const queryClient = useQueryClient()
  const [replyTarget, setReplyTarget] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['guide-reviews'],
    queryFn: () => getGuideReviews({ size: 100 }),
  })

  const replyMutation = useMutation({
    mutationFn: () => replyReview(replyTarget!.id, { reply: replyText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide-reviews'] })
      setReplyTarget(null)
      setReplyText('')
      toast.success('Đã gửi phản hồi!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const reviews = data?.items ?? []

  const total = reviews.length
  const avgRating = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))
  const replied = reviews.filter((r) => r.guideReply).length

  const reviewsByTour = useMemo(() => {
    const groups = new Map<string, { tourId: string; tourTitle: string; reviews: Review[] }>()
    for (const r of reviews) {
      const g = groups.get(r.tourId)
      if (g) g.reviews.push(r)
      else groups.set(r.tourId, { tourId: r.tourId, tourTitle: r.tourTitle, reviews: [r] })
    }
    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        avgRating: g.reviews.reduce((s, r) => s + r.rating, 0) / g.reviews.length,
        repliedCount: g.reviews.filter((r) => r.guideReply).length,
      }))
      .sort((a, b) => b.reviews.length - a.reviews.length || b.avgRating - a.avgRating)
  }, [reviews])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/guide" className="hover:text-slate-900">Bảng điều khiển</Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-slate-900">Đánh giá</span>
        </nav>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Đánh giá từ khách hàng</h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi điểm đánh giá và phản hồi các nhận xét của khách để tăng uy tín.
          </p>
        </div>

        {/* Section header */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="min-w-0 flex-1">
            <span className="mb-2 inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
              Tổng quan
            </span>
            <h2 className="text-base font-semibold text-slate-900">Toàn bộ tour của bạn</h2>
            <p className="mt-1 text-sm text-slate-600">Thống kê đánh giá gộp từ tất cả tour bạn đang quản lý.</p>
          </div>
          {total > 0 && (
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium',
                replied === total
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700',
              )}
            >
              {replied}/{total} đã phản hồi
            </span>
          )}
        </div>

        {/* 4 KPI cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard icon={Star} label="Tổng đánh giá" value={total.toString()} />
          <KpiCard
            icon={TrendingUp}
            label="Điểm TB toàn bộ tour"
            value={total > 0 ? avgRating.toFixed(1) : '—'}
          />
          <KpiCard icon={MessageSquare} label="Đã phản hồi" value={replied.toString()} tone="emerald" />
          <KpiCard
            icon={MessageSquare}
            label="Chưa phản hồi"
            value={(total - replied).toString()}
            tone={total - replied > 0 ? 'amber' : 'neutral'}
          />
        </div>

        {/* Phân bố đánh giá */}
        {total > 0 && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-slate-900">Phân bố đánh giá</p>
            <div className="space-y-2">
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="flex w-10 items-center gap-1 text-slate-600">
                    <span className="tabular-nums">{star}</span>
                    <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-slate-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danh sách review nhóm theo tour */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <Star className="size-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Chưa có đánh giá nào</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              Hoàn thành tour và nhận đánh giá từ khách hàng để xây dựng uy tín.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm font-semibold text-slate-900">Đánh giá theo từng tour</p>
            {reviewsByTour.map((group) => (
              <section
                key={group.tourId}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <MapPin className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{group.tourTitle}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {group.reviews.length} đánh giá
                        <span className="text-slate-300"> · </span>
                        Đã phản hồi {group.repliedCount}/{group.reviews.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRow rating={Math.round(group.avgRating)} />
                    <span className="text-sm font-semibold tabular-nums text-slate-900">
                      {group.avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500">/5</span>
                  </div>
                </header>
                <div className="divide-y divide-slate-100">
                  {group.reviews.map((review) => (
                    <div key={review.id} className="px-5 py-4">
                      <ReviewCardInner
                        review={review}
                        onReply={() => {
                          setReplyTarget(review)
                          setReplyText('')
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Reply dialog */}
        <Dialog open={!!replyTarget} onOpenChange={(open) => !open && setReplyTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Phản hồi đánh giá</DialogTitle>
            </DialogHeader>
            {replyTarget && (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">{replyTarget.customerName}</p>
                  <div className="mt-1">
                    <StarRow rating={replyTarget.rating} />
                  </div>
                  {replyTarget.comment && <p className="mt-2">{replyTarget.comment}</p>}
                </div>
                <Textarea
                  placeholder="Viết phản hồi của bạn..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                />
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={() => replyMutation.mutate()}
                  disabled={replyMutation.isPending || !replyText.trim()}
                >
                  {replyMutation.isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function ReviewCardInner({ review, onReply }: { review: Review; onReply: () => void }) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {review.customerAvatarUrl ? (
            <img
              src={review.customerAvatarUrl}
              alt={review.customerName}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-sm font-semibold text-white">
              {review.customerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">{review.customerName}</p>
            <p className="text-xs text-slate-500">
              {formatDate(review.createdAt)}
              {review.editedAt && (
                <span className="ml-1 italic text-slate-400">
                  (đã chỉnh sửa lúc {formatDateTime(review.editedAt)})
                </span>
              )}
            </p>
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>

      {review.comment && <p className="mt-3 text-sm text-slate-700">{review.comment}</p>}
      <ReviewImageGallery images={review.images ?? []} />

      {review.guideReply ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <MessageSquare className="size-3" /> Phản hồi của bạn
          </p>
          <p className="text-sm text-slate-700">{review.guideReply}</p>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mt-3 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
          onClick={onReply}
        >
          <MessageSquare className="mr-1.5 size-3.5" />
          Phản hồi
        </Button>
      )}

      <div className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
        <ThumbsUp className="size-3" />
        <ReviewLikeButton review={review} queryKey={['guide-reviews']} />
      </div>
    </div>
  )
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn('size-4', s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200')}
        />
      ))}
    </div>
  )
}

const TONE_CLASSES = {
  neutral: 'text-slate-900',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
} as const

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: keyof typeof TONE_CLASSES
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
      <p className={cn('mt-1 truncate text-2xl font-semibold tabular-nums', TONE_CLASSES[tone])}>{value}</p>
    </div>
  )
}
