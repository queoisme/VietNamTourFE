import { Link, Navigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { useAuth } from '../contexts/AuthContext'
import { getMyReviews } from '@/api/reviews'
import { formatDate } from '@/lib/constants'
import { ReviewImageGallery } from '../components/ReviewImageUpload'

export function MyReviews() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" />

  const { data, isLoading } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => getMyReviews({ size: 50 }),
  })

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
                    <div className="flex items-center gap-1 mt-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-sm text-gray-500 ml-1">{formatDate(review.createdAt)}</span>
                    </div>
                    {review.comment && <p className="text-gray-700">{review.comment}</p>}
                    <ReviewImageGallery images={review.images ?? []} />
                    {review.guideReply && (
                      <div className="mt-3 pl-4 border-l-2 border-orange-200 bg-orange-50 p-3 rounded-r-lg">
                        <p className="text-xs text-orange-600 font-medium mb-1">Phản hồi từ hướng dẫn viên:</p>
                        <p className="text-sm text-gray-700">{review.guideReply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
