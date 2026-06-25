import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, MapPin, MessageCircle, Pencil, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { PostImageGallery } from '../components/PostImageUpload'
import { PostLikeButton } from '../components/PostLikeButton'
import { PostCommentList } from '../components/PostCommentList'
import { deletePost, getPost } from '@/api/posts'
import { formatDateTime } from '@/lib/constants'

const ROLE_LABEL: Record<string, string> = {
  guide: 'Hướng dẫn viên',
  customer: 'Du khách',
  admin: 'Quản trị viên',
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState(false)
  const queryKey = ['post', id] as const

  const { data: post, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getPost(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(id!),
    onSuccess: () => {
      toast.success('Đã xoá bài viết')
      queryClient.invalidateQueries({ queryKey: ['posts-feed'] })
      navigate('/posts')
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể xoá'),
    onSettled: () => setDeleting(false),
  })

  if (isLoading)
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="aspect-[16/9] w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )

  if (error || !post) return <Navigate to="/posts" replace />

  const cover = post.coverImageUrl || post.images[0]

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={post.type === 'location_review' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}
          >
            {post.type === 'location_review' ? 'Đánh giá địa điểm' : 'Câu chuyện du lịch'}
          </Badge>
          {post.rating != null && (
            <span className="inline-flex items-center gap-0.5 text-amber-600 font-medium">
              <Star className="size-4 fill-amber-500 text-amber-500" />
              {post.rating}.0 / 5
            </span>
          )}
          {!post.isVisible && (
            <Badge variant="destructive">Bị ẩn</Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>

        <div className="flex items-center gap-3">
          {post.authorAvatarUrl ? (
            <img src={post.authorAvatarUrl} alt={post.authorName} className="size-10 rounded-full object-cover" />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-orange-500 text-white font-semibold">
              {post.authorName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="text-sm">
            <Link to={`/users/${post.authorId}/posts`} className="font-medium hover:text-orange-600">
              {post.authorName}
            </Link>
            <div className="text-xs text-slate-500">
              {ROLE_LABEL[post.authorRole] ?? post.authorRole} · {formatDateTime(post.createdAt)}
              {post.createdAt !== post.updatedAt && <span className="italic ml-1">(đã chỉnh sửa)</span>}
            </div>
          </div>

          {post.isOwnedByMe && (
            <div className="ml-auto flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to={`/posts/${post.id}/edit`}>
                  <Pencil className="mr-1 size-3.5" /> Sửa
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-rose-600 hover:bg-rose-50"
                disabled={deleting}
                onClick={() => {
                  if (confirm('Xoá bài viết này?')) {
                    setDeleting(true)
                    deleteMutation.mutate()
                  }
                }}
              >
                <Trash2 className="mr-1 size-3.5" /> Xoá
              </Button>
            </div>
          )}
        </div>

        {post.locationCity && (
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <MapPin className="size-4" />
            <Link to={`/cities/${encodeURIComponent(post.locationCity)}`} className="hover:text-orange-600">
              {post.locationCity}
            </Link>
            {post.locationCountry && <span>, {post.locationCountry}</span>}
          </div>
        )}
      </div>

      {/* Cover */}
      {cover && (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100">
          <img src={cover} alt={post.title} className="size-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-slate max-w-none whitespace-pre-line text-base leading-relaxed">
        {post.content}
      </div>

      {/* Extra images (excluding cover when used) */}
      {post.images.length > 0 && (
        <PostImageGallery images={post.images.filter((u) => u !== cover)} />
      )}

      {/* Stats + actions */}
      <div className="flex items-center justify-between border-y py-3">
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-4" /> {post.commentCount} bình luận
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-4" /> {post.viewCount} lượt xem
          </span>
        </div>
        <PostLikeButton post={post} queryKey={queryKey} isSingle />
      </div>

      {/* Comments */}
      <PostCommentList postId={post.id} />
    </div>
  )
}
