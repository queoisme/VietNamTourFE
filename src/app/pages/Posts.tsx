import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { PenSquare, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { PostCard } from '../components/PostCard'
import { getPosts, GetPostsParams } from '@/api/posts'
import type { PostCategory, PostFeedSort, PostType } from '@/types/post'

const TYPE_OPTIONS: { value: PostType | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'location_review', label: 'Đánh giá địa điểm' },
  { value: 'travel_story', label: 'Câu chuyện du lịch' },
]

const CATEGORY_OPTIONS: { value: PostCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'nature', label: 'Thiên nhiên' },
  { value: 'culture', label: 'Văn hoá' },
  { value: 'food', label: 'Ẩm thực' },
  { value: 'resort', label: 'Nghỉ dưỡng' },
  { value: 'adventure', label: 'Phiêu lưu' },
  { value: 'other', label: 'Khác' },
]

const SORT_OPTIONS: { value: PostFeedSort; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'top_rated', label: 'Đánh giá cao' },
  { value: 'most_liked', label: 'Nhiều lượt thích' },
  { value: 'most_commented', label: 'Nhiều bình luận' },
]

export function Posts() {
  const [city, setCity] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [type, setType] = useState<PostType | 'all'>('all')
  const [category, setCategory] = useState<PostCategory | 'all'>('all')
  const [sort, setSort] = useState<PostFeedSort>('newest')

  const params: GetPostsParams = {
    city: city || undefined,
    type: type === 'all' ? undefined : type,
    category: category === 'all' ? undefined : category,
    sort,
    size: 24,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['posts-feed', params],
    queryFn: () => getPosts(params),
  })

  const posts = data?.items ?? []

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Cộng đồng VietNamTours</h1>
          <p className="text-sm text-slate-500 mt-1">
            Khám phá đánh giá địa điểm và câu chuyện du lịch từ cộng đồng
          </p>
        </div>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link to="/posts/new">
            <PenSquare className="mr-2 size-4" /> Đăng bài
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-[1fr_auto_auto_auto]">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setCity(cityInput.trim())
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Tìm theo thành phố (vd: Đà Lạt, Hội An...)"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">Tìm</Button>
        </form>

        <Select value={type} onValueChange={(v) => setType(v as PostType | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => setCategory(v as PostCategory | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as PostFeedSort)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border bg-white py-20 text-center">
          <h3 className="text-xl font-semibold mb-2">Chưa có bài viết nào</h3>
          <p className="text-slate-500 mb-6">Hãy là người đầu tiên chia sẻ trải nghiệm!</p>
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <Link to="/posts/new">Đăng bài đầu tiên</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
