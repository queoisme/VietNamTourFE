import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ThumbsUp } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { toggleReviewLike } from '@/api/reviews'
import { useAuth } from '../contexts/AuthContext'
import { cn } from './ui/utils'
import type { Review, ToggleReviewLikeResponse } from '@/types/review'

interface Props {
  review: Review
  /** queryKey of the list that contains this review; used to invalidate / optimistically patch */
  queryKey: readonly unknown[]
}

interface ReviewList {
  items: Review[]
  meta?: unknown
}

export function ReviewLikeButton({ review, queryKey }: Props) {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const isOwner = user?.id === review.customerId

  const mutation = useMutation({
    mutationFn: () => toggleReviewLike(review.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<ReviewList>(queryKey)
      if (prev) {
        queryClient.setQueryData<ReviewList>(queryKey, {
          ...prev,
          items: prev.items.map((r) =>
            r.id === review.id
              ? {
                  ...r,
                  isLikedByMe: !r.isLikedByMe,
                  likeCount: r.likeCount + (r.isLikedByMe ? -1 : 1),
                }
              : r,
          ),
        })
      }
      return { prev }
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
      toast.error(err.message || 'Không thể thực hiện')
    },
    onSuccess: (data: ToggleReviewLikeResponse) => {
      // Reconcile from server in case optimistic count drifted
      const cur = queryClient.getQueryData<ReviewList>(queryKey)
      if (cur) {
        queryClient.setQueryData<ReviewList>(queryKey, {
          ...cur,
          items: cur.items.map((r) =>
            r.id === review.id ? { ...r, isLikedByMe: data.isLiked, likeCount: data.likeCount } : r,
          ),
        })
      }
    },
  })

  if (isOwner) return null

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích đánh giá')
      navigate('/login')
      return
    }
    mutation.mutate()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={mutation.isPending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
        review.isLikedByMe
          ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700',
        mutation.isPending && 'opacity-60',
      )}
    >
      <ThumbsUp className={cn('size-3.5', review.isLikedByMe && 'fill-indigo-500 text-indigo-500')} />
      <span className="font-medium">{review.likeCount}</span>
    </button>
  )
}
