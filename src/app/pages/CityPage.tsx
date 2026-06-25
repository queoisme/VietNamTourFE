import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Star } from 'lucide-react'
import { Skeleton } from '../components/ui/skeleton'
import { Badge } from '../components/ui/badge'
import { PostCard } from '../components/PostCard'
import { getCitySummary, getPosts } from '@/api/posts'

const CATEGORY_LABEL: Record<string, string> = {
  nature: 'Thiên nhiên',
  culture: 'Văn hoá',
  food: 'Ẩm thực',
  resort: 'Nghỉ dưỡng',
  adventure: 'Phiêu lưu',
  other: 'Khác',
}

export function CityPage() {
  const { city: rawCity } = useParams<{ city: string }>()
  const city = decodeURIComponent(rawCity || '')

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['city-summary', city],
    queryFn: () => getCitySummary(city),
    enabled: !!city,
  })

  const { data: postsData, isLoading: loadingPosts } = useQuery({
    queryKey: ['posts-feed', { city, sort: 'top_rated' }],
    queryFn: () => getPosts({ city, sort: 'top_rated', size: 24 }),
    enabled: !!city,
  })

  const posts = postsData?.items ?? []

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-8 text-white">
        <div className="flex items-center gap-2 text-sm opacity-90">
          <MapPin className="size-4" /> Cộng đồng
        </div>
        <h1 className="mt-1 text-4xl font-bold">{city}</h1>
        {loadingSummary ? (
          <Skeleton className="mt-4 h-6 w-48 bg-white/30" />
        ) : summary ? (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1 text-lg font-semibold">
              <Star className="size-5 fill-white text-white" />
              {summary.avgRating.toFixed(1)} / 5
            </span>
            <span className="text-sm opacity-90">{summary.totalPosts} bài viết từ cộng đồng</span>
          </div>
        ) : null}

        {summary?.categoryCounts && Object.keys(summary.categoryCounts).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(summary.categoryCounts).map(([cat, count]) => (
              <Badge key={cat} variant="secondary" className="bg-white/20 text-white border-white/30">
                {CATEGORY_LABEL[cat] ?? cat} ({count})
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Posts grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Bài viết nổi bật</h2>
        {loadingPosts ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border bg-white py-16 text-center text-slate-500">
            Chưa có bài viết nào về {city}. Hãy là người đầu tiên!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
