import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowLeft, Sparkles, Star, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Skeleton } from '../components/ui/skeleton'
import { aiSearch } from '@/api/ai'
import { formatVND, TOUR_CATEGORIES } from '@/lib/constants'
import type { AiSearchItem } from '@/types/ai'

const LOADING_LINES = [
  'AI đang phân tích mong muốn của bạn...',
  'Đang tìm các tour phù hợp...',
  'Đang xếp hạng theo độ phù hợp...',
  'Sắp xong rồi...',
]

export function AiSearch() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const q = params.get('q')?.trim() ?? ''
  const [prompt, setPrompt] = useState(q)

  useEffect(() => { setPrompt(q) }, [q])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ai-search', q],
    queryFn: () => aiSearch({ prompt: q }),
    enabled: q.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const items = data?.items ?? []
  const usedFallback = data?.usedFallback ?? false

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = prompt.trim()
    if (!v || v === q) return
    navigate(`/ai-search?q=${encodeURIComponent(v)}`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header / re-prompt */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-orange-600 mb-3">
          <ArrowLeft className="mr-1 size-4" /> Trang chủ
        </Link>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="size-5 text-orange-600" />
          Gợi ý từ AI
        </h1>
        <form onSubmit={handleResubmit} className="bg-white border rounded-2xl p-3 shadow-sm">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            maxLength={500}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
            placeholder="Mô tả mong muốn của bạn..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleResubmit(e as unknown as React.FormEvent)
              }
            }}
          />
          <div className="flex justify-end mt-2">
            <Button type="submit" disabled={!prompt.trim() || prompt.trim() === q} size="sm" className="bg-orange-600 hover:bg-orange-700">
              <Sparkles className="mr-2 size-4" /> Gợi ý lại
            </Button>
          </div>
        </form>
      </div>

      {/* Fallback banner */}
      {usedFallback && !isLoading && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Đang dùng tìm kiếm thông thường</p>
            <p className="mt-0.5 text-amber-700">
              AI tạm thời không khả dụng. Đây là kết quả tìm theo từ khoá.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div>
          <LoadingPulse />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-20">
          <p className="text-red-600 mb-4">Không thể tải gợi ý. {(error as Error)?.message ?? ''}</p>
          <Button onClick={() => navigate('/')}>Về trang chủ</Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && items.length === 0 && q && (
        <div className="text-center py-20">
          <p className="text-lg font-medium mb-2">Chưa tìm thấy tour phù hợp</p>
          <p className="text-gray-500 mb-6">Thử mô tả lại với từ khoá khác, hoặc xem toàn bộ tour.</p>
          <div className="flex justify-center gap-3">
            <Button asChild variant="outline"><Link to="/">Về trang chủ</Link></Button>
            <Button asChild className="bg-orange-600 hover:bg-orange-700"><Link to="/tours">Khám phá tour</Link></Button>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && !isError && items.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Tìm thấy <span className="font-semibold text-gray-900">{items.length}</span> tour phù hợp với mong muốn của bạn
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => <AiTourCard key={item.tour.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  )
}

function LoadingPulse() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % LOADING_LINES.length), 1500)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600 px-1">
      <Sparkles className="size-4 text-orange-600 animate-pulse" />
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {LOADING_LINES[idx]}
      </motion.span>
    </div>
  )
}

function AiTourCard({ item }: { item: AiSearchItem }) {
  const { tour, score, reason } = item
  const showMatch = score > 0.7
  const catLabel = TOUR_CATEGORIES.find((c) => c.value === tour.category)?.label ?? tour.category
  return (
    <motion.div whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }} transition={{ duration: 0.2 }}>
      <Link to={`/tours/${tour.id}`}>
        <Card className="overflow-hidden h-full flex flex-col">
          <div className="relative h-48 overflow-hidden">
            {tour.coverImageUrl ? (
              <img
                src={tour.coverImageUrl}
                alt={tour.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-300 text-4xl">✦</div>
            )}
            <Badge className="absolute top-3 right-3 bg-orange-600">{catLabel}</Badge>
            {tour.isBoosted && (
              <Badge className="absolute top-3 left-3 bg-yellow-500">Nổi bật</Badge>
            )}
            {showMatch && (
              <Badge className="absolute bottom-3 left-3 bg-indigo-600">
                {Math.round(score * 100)}% phù hợp
              </Badge>
            )}
          </div>
          <CardContent className="p-4 flex-1">
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{tour.title}</h3>
            <div className="flex items-center gap-2 mb-3">
              {tour.guide.avatarUrl ? (
                <img src={tour.guide.avatarUrl} alt={tour.guide.fullName} className="size-8 rounded-full object-cover" />
              ) : (
                <div className="size-8 rounded-full bg-orange-200 flex items-center justify-center text-xs font-bold text-orange-700">
                  {tour.guide.fullName.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{tour.guide.fullName}</p>
                <div className="flex items-center gap-1">
                  <Star className="size-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600">
                    {tour.avgRating.toFixed(1)} ({tour.totalReviews})
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
              <span>{tour.durationHours}h</span><span>·</span>
              <span>Tối đa {tour.maxGroupSize} người</span><span>·</span>
              <span>{tour.locationCity}</span>
            </div>
            {reason && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2 text-sm italic text-indigo-800">
                <span className="not-italic mr-1">💡</span>{reason}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0 flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-orange-600">{formatVND(tour.pricePerPerson)}</span>
              <span className="text-sm text-gray-600">/người</span>
            </div>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">Xem chi tiết</Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
