import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star, MessageSquare, TrendingUp, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { getGuideReviews, replyReview } from '@/api/reviews'
import { ReviewImageGallery } from '../components/ReviewImageUpload'
import { cn } from '@/app/components/ui/utils'
import { formatDate } from '@/lib/constants'
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

  // Overall stats (toàn bộ tour của guide)
  const total = reviews.length
  const avgRating = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))
  const replied = reviews.filter((r) => r.guideReply).length

  // Nhóm review theo tour, tính điểm TB của từng tour
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Đánh giá từ khách hàng</h1>

      {/* Stats tổng — toàn bộ tour của guide */}
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        Tổng quan (toàn bộ tour của bạn)
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Tổng đánh giá" value={total.toString()} icon={<Star className="size-5 text-yellow-400" />} />
        <StatCard
          label="Điểm TB toàn bộ tour"
          value={total > 0 ? avgRating.toFixed(1) : '—'}
          icon={<TrendingUp className="size-5 text-indigo-500" />}
        />
        <StatCard label="Đã phản hồi" value={replied.toString()} icon={<MessageSquare className="size-5 text-emerald-500" />} />
        <StatCard
          label="Chưa phản hồi"
          value={(total - replied).toString()}
          icon={<MessageSquare className="size-5 text-slate-400" />}
        />
      </div>

      {/* Phân bố đánh giá tổng */}
      {total > 0 && (
        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-slate-700">Phân bố đánh giá (tất cả tour)</p>
          <div className="space-y-1.5">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-right text-slate-500">{star}</span>
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-6 text-right text-slate-500">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danh sách review nhóm theo từng tour */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-16 text-center">
          <Star className="mx-auto mb-3 size-10 text-slate-300" />
          <h3 className="font-semibold text-slate-700">Chưa có đánh giá nào</h3>
          <p className="mt-1 text-sm text-slate-500">Hoàn thành tour và nhận đánh giá từ khách hàng.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Đánh giá theo từng tour
          </div>
          {reviewsByTour.map((group) => (
            <section key={group.tourId} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r from-indigo-50 to-white px-5 py-4">
                <div className="flex min-w-0 items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{group.tourTitle}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {group.reviews.length} đánh giá · Đã phản hồi {group.repliedCount}/{group.reviews.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRow rating={Math.round(group.avgRating)} />
                  <span className="text-base font-bold text-slate-900">{group.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">/5</span>
                </div>
              </header>
              <div className="divide-y">
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
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-medium text-slate-800">{replyTarget.customerName}</p>
                <StarRow rating={replyTarget.rating} />
                {replyTarget.comment && <p className="mt-1">{replyTarget.comment}</p>}
              </div>
              <Textarea
                placeholder="Viết phản hồi của bạn..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
              />
              <Button
                className="w-full"
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
  )
}

function ReviewCardInner({ review, onReply }: { review: Review; onReply: () => void }) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          {review.customerAvatarUrl ? (
            <img src={review.customerAvatarUrl} alt={review.customerName} className="size-10 rounded-full object-cover" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              {review.customerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900">{review.customerName}</p>
            <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <StarRow rating={review.rating} />
      </div>

      {review.comment && (
        <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
      )}
      <ReviewImageGallery images={review.images ?? []} />

      {review.guideReply ? (
        <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="mb-1 text-xs font-semibold text-emerald-700">Phản hồi của bạn:</p>
          <p className="text-sm text-slate-700">{review.guideReply}</p>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={onReply}
        >
          <MessageSquare className="mr-1.5 size-3.5" />
          Phản hồi
        </Button>
      )}
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

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
