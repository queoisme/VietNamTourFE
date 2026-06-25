import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { togglePostLike } from '@/api/posts'
import { useAuth } from '../contexts/AuthContext'
import { cn } from './ui/utils'
import type { Post, TogglePostLikeResponse } from '@/types/post'

interface Props {
  post: Post
  /** queryKey of cache entry holding the post (single post or list). */
  queryKey: readonly unknown[]
  /** Pass true if the queryKey points at a single Post, not a list. */
  isSingle?: boolean
}

interface PostList {
  items: Post[]
  meta?: unknown
}

export function PostLikeButton({ post, queryKey, isSingle }: Props) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const patchSingle = (prev: Post): Post => ({
    ...prev,
    isLikedByMe: !prev.isLikedByMe,
    likeCount: prev.likeCount + (prev.isLikedByMe ? -1 : 1),
  })

  const mutation = useMutation({
    mutationFn: () => togglePostLike(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      if (isSingle) {
        const prev = queryClient.getQueryData<Post>(queryKey)
        if (prev) queryClient.setQueryData<Post>(queryKey, patchSingle(prev))
        return { prev }
      }
      const prev = queryClient.getQueryData<PostList>(queryKey)
      if (prev) {
        queryClient.setQueryData<PostList>(queryKey, {
          ...prev,
          items: prev.items.map((p) => (p.id === post.id ? patchSingle(p) : p)),
        })
      }
      return { prev }
    },
    onError: (err: Error, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
      toast.error(err.message || 'Không thể thực hiện')
    },
    onSuccess: (data: TogglePostLikeResponse) => {
      if (isSingle) {
        const cur = queryClient.getQueryData<Post>(queryKey)
        if (cur)
          queryClient.setQueryData<Post>(queryKey, { ...cur, isLikedByMe: data.isLiked, likeCount: data.likeCount })
        return
      }
      const cur = queryClient.getQueryData<PostList>(queryKey)
      if (cur) {
        queryClient.setQueryData<PostList>(queryKey, {
          ...cur,
          items: cur.items.map((p) =>
            p.id === post.id ? { ...p, isLikedByMe: data.isLiked, likeCount: data.likeCount } : p,
          ),
        })
      }
    },
  })

  const handleClick = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích bài viết')
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
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        post.isLikedByMe
          ? 'border-rose-200 bg-rose-50 text-rose-600'
          : 'border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-600',
        mutation.isPending && 'opacity-60',
      )}
    >
      <Heart className={cn('size-4', post.isLikedByMe && 'fill-rose-500 text-rose-500')} />
      <span className="font-medium">{post.likeCount}</span>
    </button>
  )
}
