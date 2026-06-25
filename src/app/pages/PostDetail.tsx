import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Eye,
  Heart,
  Link2,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { PostCommentList } from '../components/PostCommentList'
import { togglePostLike, deletePost, getPost } from '@/api/posts'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../components/ui/utils'
import { formatDateTime } from '@/lib/constants'
import type { Post, TogglePostLikeResponse } from '@/types/post'

const ROLE_LABEL: Record<string, string> = {
  guide: 'Hướng dẫn viên',
  customer: 'Du khách',
  admin: 'Quản trị viên',
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const queryKey = ['post', id] as const

  const { data: post, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getPost(id!),
    enabled: !!id,
  })

  const allImages = useMemo(() => {
    if (!post) return []
    const set = new Set<string>()
    if (post.coverImageUrl) set.add(post.coverImageUrl)
    post.images.forEach((u) => set.add(u))
    return Array.from(set)
  }, [post])

  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(id!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<Post>(queryKey)
      if (prev) {
        queryClient.setQueryData<Post>(queryKey, {
          ...prev,
          isLikedByMe: !prev.isLikedByMe,
          likeCount: prev.likeCount + (prev.isLikedByMe ? -1 : 1),
        })
      }
      return { prev }
    },
    onError: (err: Error, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
      toast.error(err.message || 'Không thể thực hiện')
    },
    onSuccess: (data: TogglePostLikeResponse) => {
      const cur = queryClient.getQueryData<Post>(queryKey)
      if (cur)
        queryClient.setQueryData<Post>(queryKey, { ...cur, isLikedByMe: data.isLiked, likeCount: data.likeCount })
    },
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
      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )

  if (error || !post) return <Navigate to="/posts" replace />

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thích bài viết')
      navigate('/login')
      return
    }
    likeMutation.mutate()
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Đã sao chép liên kết bài viết')
    } catch {
      toast.error('Không thể sao chép liên kết')
    }
  }

  const handleComment = () => {
    const el = document.getElementById('post-comments')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="bg-slate-100 min-h-screen py-6">
      <div className="container mx-auto max-w-2xl px-4 space-y-4">
        {/* FB-style card */}
        <article className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Author header */}
          <header className="flex items-start gap-3 px-4 pt-4 pb-3">
            {post.authorAvatarUrl ? (
              <img src={post.authorAvatarUrl} alt={post.authorName} className="size-11 rounded-full object-cover" />
            ) : (
              <span className="flex size-11 items-center justify-center rounded-full bg-orange-500 text-white text-lg font-semibold">
                {post.authorName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <Link
                to={`/users/${post.authorId}/posts`}
                className="font-semibold text-slate-900 hover:underline"
              >
                {post.authorName}
              </Link>
              <div className="text-xs text-slate-500 flex items-center gap-1 flex-wrap">
                <span>{ROLE_LABEL[post.authorRole] ?? post.authorRole}</span>
                <span>·</span>
                <span>{formatDateTime(post.createdAt)}</span>
                {post.createdAt !== post.updatedAt && (
                  <>
                    <span>·</span>
                    <span className="italic">đã chỉnh sửa</span>
                  </>
                )}
              </div>
            </div>

            {post.isOwnedByMe && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full p-2 hover:bg-slate-100 text-slate-500" aria-label="Menu">
                    <MoreHorizontal className="size-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/posts/${post.id}/edit`} className="cursor-pointer">
                      <Pencil className="mr-2 size-4" /> Chỉnh sửa bài viết
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={deleting}
                    onClick={() => {
                      if (confirm('Xoá bài viết này?')) {
                        setDeleting(true)
                        deleteMutation.mutate()
                      }
                    }}
                    className="text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="mr-2 size-4" /> Xoá bài viết
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          {/* Meta badges */}
          <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={
                post.type === 'location_review'
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
              }
            >
              {post.type === 'location_review' ? 'Đánh giá địa điểm' : 'Câu chuyện du lịch'}
            </Badge>
            {post.rating != null && (
              <span className="inline-flex items-center gap-0.5 text-amber-600 text-sm font-medium">
                <Star className="size-4 fill-amber-500 text-amber-500" />
                {post.rating}.0
              </span>
            )}
            {post.locationCity && (
              <Link
                to={`/cities/${encodeURIComponent(post.locationCity)}`}
                className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-orange-600"
              >
                <MapPin className="size-3.5" />
                {post.locationCity}
                {post.locationCountry && <span className="text-slate-400">, {post.locationCountry}</span>}
              </Link>
            )}
            {!post.isVisible && <Badge variant="destructive">Bị ẩn</Badge>}
          </div>

          {/* Title + content */}
          <div className="px-4 pb-3 space-y-2">
            <h1 className="text-xl font-semibold leading-snug text-slate-900">{post.title}</h1>
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-800">{post.content}</p>
          </div>

          {/* FB-style image grid */}
          {allImages.length > 0 && <FbImageGrid images={allImages} onOpen={setLightbox} title={post.title} />}

          {/* Stats row */}
          {(post.likeCount > 0 || post.commentCount > 0 || post.viewCount > 0) && (
            <div className="px-4 py-2 flex items-center justify-between text-sm text-slate-500 border-b border-slate-100">
              <div className="flex items-center gap-1">
                {post.likeCount > 0 && (
                  <>
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-rose-500">
                      <Heart className="size-3 fill-white text-white" />
                    </span>
                    <span>{post.likeCount}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                {post.commentCount > 0 && <span>{post.commentCount} bình luận</span>}
                {post.viewCount > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" /> {post.viewCount}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="px-2 py-1 grid grid-cols-3 border-b border-slate-100">
            <ActionButton
              icon={<Heart className={cn('size-5', post.isLikedByMe && 'fill-rose-500 text-rose-500')} />}
              label="Thích"
              active={post.isLikedByMe}
              onClick={handleLike}
              disabled={likeMutation.isPending}
            />
            <ActionButton icon={<MessageCircle className="size-5" />} label="Bình luận" onClick={handleComment} />
            <ActionButton icon={<Link2 className="size-5" />} label="Chia sẻ" onClick={handleShare} />
          </div>

          {/* Comments */}
          <div id="post-comments" className="px-4 py-4">
            <PostCommentList postId={post.id} />
          </div>
        </article>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
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

function ActionButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
        active ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-600 hover:bg-slate-100',
        disabled && 'opacity-60',
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

/** Facebook-style image grid: 1=full · 2=split · 3=1 top + 2 below · 4=2x2 · 5+=1 top + 4 below with +N overlay */
function FbImageGrid({
  images,
  onOpen,
  title,
}: {
  images: string[]
  onOpen: (url: string) => void
  title: string
}) {
  const n = images.length
  const Img = ({ src, overlay, className }: { src: string; overlay?: string; className?: string }) => (
    <button
      type="button"
      onClick={() => onOpen(src)}
      className={cn('relative overflow-hidden bg-slate-100 group', className)}
    >
      <img src={src} alt={title} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white text-2xl font-semibold">
          {overlay}
        </div>
      )}
    </button>
  )

  if (n === 1) {
    return (
      <div className="aspect-[4/3] sm:aspect-[16/10] w-full">
        <Img src={images[0]} />
      </div>
    )
  }

  if (n === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-square sm:aspect-[2/1]">
        <Img src={images[0]} />
        <Img src={images[1]} />
      </div>
    )
  }

  if (n === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-[4/3]">
        <Img src={images[0]} className="row-span-2" />
        <Img src={images[1]} />
        <Img src={images[2]} />
      </div>
    )
  }

  if (n === 4) {
    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-square">
        <Img src={images[0]} />
        <Img src={images[1]} />
        <Img src={images[2]} />
        <Img src={images[3]} />
      </div>
    )
  }

  // 5+
  const extra = n - 5
  return (
    <div className="grid grid-cols-6 grid-rows-2 gap-0.5 aspect-[16/10]">
      <Img src={images[0]} className="col-span-3 row-span-2" />
      <Img src={images[1]} className="col-span-3" />
      <Img src={images[2]} className="col-span-2" />
      <Img src={images[3]} className="col-span-2" />
      <Img src={images[4]} className="col-span-2" overlay={extra > 0 ? `+${extra}` : undefined} />
    </div>
  )
}
