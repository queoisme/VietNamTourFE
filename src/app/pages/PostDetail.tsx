import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, MapPin, MessageCircle, Pencil, Star, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
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
  const [lightbox, setLightbox] = useState<string | null>(null)
  const queryKey = ['post', id] as const

  const { data: post, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getPost(id!),
    enabled: !!id,
  })

  // De-duplicate cover + extra images
  const allImages = useMemo(() => {
    if (!post) return []
    const set = new Set<string>()
    if (post.coverImageUrl) set.add(post.coverImageUrl)
    post.images.forEach((u) => set.add(u))
    return Array.from(set)
  }, [post])

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
          {!post.isVisible && <Badge variant="destructive">Bị ẩn</Badge>}
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

      {/* Hero gallery — single coherent block for all images */}
      {allImages.length > 0 && <HeroGallery images={allImages} onOpen={setLightbox} title={post.title} />}

      {/* Content section — clearly separated */}
      <article className="rounded-xl border bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-500 mb-3 uppercase tracking-wide">Nội dung</h2>
        <div className="whitespace-pre-line text-base leading-relaxed text-slate-800">{post.content}</div>
      </article>

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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt={post.title}
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </div>
  )
}

/** TripAdvisor-style hero gallery: 1 → full cover. 2 → side by side. 3+ → 1 big + grid right. */
function HeroGallery({
  images,
  onOpen,
  title,
}: {
  images: string[]
  onOpen: (url: string) => void
  title: string
}) {
  if (images.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onOpen(images[0])}
        className="block w-full aspect-[16/9] overflow-hidden rounded-xl bg-slate-100"
      >
        <img src={images[0]} alt={title} className="size-full object-cover" />
      </button>
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 aspect-[2/1] rounded-xl overflow-hidden">
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onOpen(url)}
            className="overflow-hidden bg-slate-100"
          >
            <img src={url} alt={title} className="size-full object-cover transition-transform hover:scale-105" />
          </button>
        ))}
      </div>
    )
  }

  // 3+ images: 1 big left, grid of up to 4 right
  const [hero, ...rest] = images
  const thumbs = rest.slice(0, 4)
  const remaining = images.length - 1 - thumbs.length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:aspect-[2/1] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onOpen(hero)}
        className="aspect-[16/10] sm:aspect-auto overflow-hidden bg-slate-100"
      >
        <img src={hero} alt={title} className="size-full object-cover transition-transform hover:scale-105" />
      </button>
      <div className="grid grid-cols-2 gap-2">
        {thumbs.map((url, i) => {
          const isLast = i === thumbs.length - 1 && remaining > 0
          return (
            <button
              key={i}
              type="button"
              onClick={() => onOpen(url)}
              className="relative aspect-square overflow-hidden bg-slate-100"
            >
              <img src={url} alt={title} className="size-full object-cover transition-transform hover:scale-105" />
              {isLast && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-semibold">
                  +{remaining + 1}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
