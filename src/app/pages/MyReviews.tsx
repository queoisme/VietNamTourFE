import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { useAuth } from '../contexts/AuthContext'
import { editReview, getMyReviews } from '@/api/reviews'
import { formatDate, formatDateTime } from '@/lib/constants'
import { ReviewImageGallery, ReviewImageUpload } from '../components/ReviewImageUpload'
import { ReviewLikeButton } from '../components/ReviewLikeButton'
import type { Review } from '@/types/review'

const QUERY_KEY = ['my-reviews'] as const

export function MyReviews() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<Review | null>(null)
  const [editComment, setEditComment] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])

  if (!user) return <Navigate to="/login" />

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getMyReviews({ size: 50 }),
  })

  const editMutation = useMutation({
    mutationFn: () => editReview(editTarget!.id, {
      comment: editComment.trim() || undefined,
      images: editImages,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['tour-reviews', editTarget?.tourId] })
      queryClient.invalidateQueries({ queryKey: ['guide-reviews'] })
      setEditTarget(null)
      toast.success('Đã cập nhật đánh giá!')
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể cập nhật'),
  })

  const openEdit = (review: Review) => {
    setEditTarget(review)
    setEditComment(review.comment ?? '')
    setEditImages(review.images ?? [])
  }

  const reviews = data?.items ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Đánh giá của tôi</h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold mb-2">Chưa có đánh giá nào</h3>
          <p className="text-gray-500 mb-6">Hoàn thành một tour để có thể để lại đánh giá!</p>
          <Button asChild><Link to="/tours">Khám phá tour</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <Link to={`/tours/${review.tourId}`} className="font-semibold text-lg hover:text-orange-600 transition-colors">
                      {review.tourTitle}
                    </Link>
                    <div className="flex items-center gap-1 mt-1 mb-3 flex-wrap">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-sm text-gray-500 ml-1">{formatDate(review.createdAt)}</span>
                      {review.editedAt && (
                        <span className="text-xs italic text-gray-400">
                          (đã chỉnh sửa lúc {formatDateTime(review.editedAt)})
                        </span>
                      )}
                    </div>
                    {review.comment && <p className="text-gray-700">{review.comment}</p>}
                    <ReviewImageGallery images={review.images ?? []} />
                    {review.guideReply && (
                      <div className="mt-3 pl-4 border-l-2 border-orange-200 bg-orange-50 p-3 rounded-r-lg">
                        <p className="text-xs text-orange-600 font-medium mb-1">Phản hồi từ hướng dẫn viên:</p>
                        <p className="text-sm text-gray-700">{review.guideReply}</p>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <ReviewLikeButton review={review} queryKey={QUERY_KEY} />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(review)}
                      >
                        <Pencil className="mr-1.5 size-3.5" />
                        Chỉnh sửa
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa đánh giá</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-800">{editTarget.tourTitle}</p>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-4 ${i < editTarget.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">Điểm đánh giá không thể chỉnh sửa.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Nhận xét</label>
                <Textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={4}
                  className="mt-1"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  maxLength={2000}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Ảnh</label>
                <div className="mt-1">
                  <ReviewImageUpload urls={editImages} onChange={setEditImages} />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => editMutation.mutate()}
                disabled={editMutation.isPending}
              >
                {editMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
