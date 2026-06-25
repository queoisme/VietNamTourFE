import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Skeleton } from '../components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { PostImageUpload } from '../components/PostImageUpload'
import { useAuth } from '../contexts/AuthContext'
import { createPost, getPost, updatePost } from '@/api/posts'
import { cn } from '../components/ui/utils'
import type { PostCategory, PostType } from '@/types/post'

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'nature', label: 'Thiên nhiên' },
  { value: 'culture', label: 'Văn hoá' },
  { value: 'food', label: 'Ẩm thực' },
  { value: 'resort', label: 'Nghỉ dưỡng' },
  { value: 'adventure', label: 'Phiêu lưu' },
  { value: 'other', label: 'Khác' },
]

export function PostEditor() {
  const { id } = useParams<{ id?: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()

  const [type, setType] = useState<PostType>('location_review')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState<number | null>(5)
  const [category, setCategory] = useState<PostCategory | ''>('')
  const [locationCity, setLocationCity] = useState('')
  const [locationCountry, setLocationCountry] = useState('Việt Nam')
  const [images, setImages] = useState<string[]>([])
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['post', id],
    queryFn: () => getPost(id!),
    enabled: isEditing,
  })

  useEffect(() => {
    if (!existing) return
    setType(existing.type)
    setTitle(existing.title)
    setContent(existing.content)
    setRating(existing.rating)
    setCategory((existing.category as PostCategory) || '')
    setLocationCity(existing.locationCity || '')
    setLocationCountry(existing.locationCountry || '')
    setImages(existing.images)
    setCoverImageUrl(existing.coverImageUrl)
  }, [existing])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        rating: type === 'location_review' ? rating : rating,
        category: (category as PostCategory) || null,
        locationCity: locationCity.trim() || null,
        locationCountry: locationCountry.trim() || null,
        images,
        coverImageUrl: coverImageUrl ?? images[0] ?? null,
      }
      if (isEditing) {
        return updatePost(id!, payload)
      }
      return createPost({ type, ...payload })
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['posts-feed'] })
      queryClient.invalidateQueries({ queryKey: ['post', post.id] })
      toast.success(isEditing ? 'Đã cập nhật bài viết' : 'Đã đăng bài viết')
      navigate(`/posts/${post.id}`)
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể lưu bài viết'),
  })

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isEditing && loadingExisting)
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-64" />
      </div>
    )
  if (isEditing && existing && !existing.isOwnedByMe) return <Navigate to={`/posts/${id}`} replace />

  const needsCity = type === 'location_review'
  const needsRating = type === 'location_review'

  const canSubmit =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    (!needsCity || locationCity.trim().length > 0) &&
    (!needsRating || rating !== null)

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">{isEditing ? 'Chỉnh sửa bài viết' : 'Đăng bài mới'}</h1>

      {!isEditing && (
        <div className="space-y-2">
          <Label>Loại bài viết</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['location_review', 'travel_story'] as PostType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'rounded-xl border-2 p-4 text-left transition-colors',
                  type === t ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <div className="font-medium">
                  {t === 'location_review' ? 'Đánh giá địa điểm' : 'Câu chuyện du lịch'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {t === 'location_review'
                    ? 'Chia sẻ cảm nhận về một thành phố, có chấm sao'
                    : 'Kể câu chuyện trải nghiệm, không bắt buộc địa điểm'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Tiêu đề</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: 3 ngày khám phá Đà Lạt mùa hoa anh đào"
          maxLength={200}
        />
      </div>

      {needsRating && (
        <div className="space-y-2">
          <Label>Đánh giá tổng quan</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'size-8',
                    (rating ?? 0) >= s ? 'fill-amber-500 text-amber-500' : 'text-slate-300',
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {needsCity && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">Thành phố</Label>
            <Input
              id="city"
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              placeholder="Đà Lạt"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Quốc gia</Label>
            <Input
              id="country"
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Phân loại (tuỳ chọn)</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as PostCategory)}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn phân loại" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Nội dung</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder="Chia sẻ chi tiết trải nghiệm của bạn..."
          maxLength={10000}
        />
        <div className="text-right text-xs text-slate-400">{content.length}/10000</div>
      </div>

      <div className="space-y-2">
        <Label>Ảnh (tối đa 10)</Label>
        <PostImageUpload urls={images} onChange={setImages} maxImages={10} />
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isEditing ? 'Lưu thay đổi' : 'Đăng bài'}
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>Huỷ</Button>
      </div>
    </div>
  )
}
