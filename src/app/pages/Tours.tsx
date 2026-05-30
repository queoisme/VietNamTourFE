import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet'
import { Skeleton } from '../components/ui/skeleton'
import { searchTours } from '@/api/tours'
import { TOUR_CATEGORIES, TOUR_TYPES, formatVND } from '@/lib/constants'
import { TourCategory, TourType } from '@/types/tour'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' },
  { value: 'price_asc', label: 'Giá thấp nhất' },
  { value: 'price_desc', label: 'Giá cao nhất' },
]

const MAX_PRICE = 5_000_000

const PRICE_PRESETS = [
  { label: 'Tất cả', min: 0, max: MAX_PRICE },
  { label: 'Dưới 500k', min: 0, max: 500_000 },
  { label: '500k – 1 triệu', min: 500_000, max: 1_000_000 },
  { label: '1 – 2 triệu', min: 1_000_000, max: 2_000_000 },
  { label: '2 – 5 triệu', min: 2_000_000, max: 5_000_000 },
  { label: 'Trên 5 triệu', min: 5_000_000, max: MAX_PRICE },
]

const parsePrice = (value: string | null, fallback: number) => {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, 0), MAX_PRICE)
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

export function Tours() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [minPrice, setMinPrice] = useState(() => parsePrice(searchParams.get('minPrice'), 0))
  const [maxPrice, setMaxPrice] = useState(() => parsePrice(searchParams.get('maxPrice'), MAX_PRICE))

  const q = searchParams.get('q') || undefined
  const city = searchParams.get('city') || undefined
  const category = (searchParams.get('category') || undefined) as TourCategory | undefined
  const tourType = (searchParams.get('tourType') || undefined) as TourType | undefined
  const sort = searchParams.get('sort') || 'newest'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const hasPriceFilter = minPrice > 0 || maxPrice < MAX_PRICE
  const hasActiveFilters = Boolean(q || city || category || tourType || hasPriceFilter)
  const activeFilterCount = [Boolean(q), Boolean(city), Boolean(category), Boolean(tourType), hasPriceFilter].filter(Boolean).length

  useEffect(() => {
    const nextMin = parsePrice(searchParams.get('minPrice'), 0)
    const nextMax = parsePrice(searchParams.get('maxPrice'), MAX_PRICE)
    setMinPrice(nextMin)
    setMaxPrice(Math.max(nextMin, nextMax))
  }, [searchParams])

  const { data, isLoading } = useQuery({
    queryKey: ['tours', { q, city, category, tourType, sort, page, minPrice, maxPrice }],
    queryFn: () =>
      searchTours({
        q,
        city,
        category,
        tourType,
        sort: sort as 'newest' | 'rating_desc' | 'price_asc' | 'price_desc',
        page,
        size: 12,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice < MAX_PRICE ? maxPrice : undefined,
      }),
    placeholderData: (prev) => prev,
  })

  const tours = data?.items ?? []
  const meta = data?.meta

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParam('q', searchInput || undefined)
  }

  const applyPriceFilter = () => {
    const next = new URLSearchParams(searchParams)
    if (minPrice > 0) next.set('minPrice', String(minPrice))
    else next.delete('minPrice')
    if (maxPrice < MAX_PRICE) next.set('maxPrice', String(maxPrice))
    else next.delete('maxPrice')
    next.delete('page')
    setSearchParams(next)
  }

  const clearPriceFilter = () => {
    setMinPrice(0)
    setMaxPrice(MAX_PRICE)
    const next = new URLSearchParams(searchParams)
    next.delete('minPrice')
    next.delete('maxPrice')
    next.delete('page')
    setSearchParams(next)
  }

  const clearAllFilters = () => {
    setMinPrice(0)
    setMaxPrice(MAX_PRICE)
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (sort !== 'newest') next.set('sort', sort)
    setSearchParams(next)
  }

  const FilterContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <label className="mb-2 block text-sm font-semibold text-slate-800">Danh mục</label>
          <Select value={category || 'all'} onValueChange={(v) => updateParam('category', v === 'all' ? undefined : v)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {TOUR_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <label className="mb-2 block text-sm font-semibold text-slate-800">Loại tour</label>
          <Select value={tourType || 'all'} onValueChange={(v) => updateParam('tourType', v === 'all' ? undefined : v)}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Chọn loại tour" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {TOUR_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <label className="mb-2 block text-sm font-semibold text-slate-800">Thành phố</label>
          <Input
            placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
            value={city || ''}
            onChange={(e) => updateParam('city', e.target.value || undefined)}
            className="bg-white"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <label className="mb-3 block text-sm font-semibold text-slate-800">Ngân sách</label>
          <div className="grid grid-cols-2 gap-2">
            {PRICE_PRESETS.map((preset) => {
              const active = minPrice === preset.min && maxPrice === preset.max
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => { setMinPrice(preset.min); setMaxPrice(preset.max) }}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-left ${
                    active
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Input
              type="number"
              placeholder="Từ"
              min={0}
              value={minPrice || ''}
              onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
              className="bg-white text-xs h-8"
            />
            <span className="text-slate-400 shrink-0">–</span>
            <Input
              type="number"
              placeholder="Đến"
              min={0}
              value={maxPrice < MAX_PRICE ? maxPrice : ''}
              onChange={(e) => setMaxPrice(Number(e.target.value) || MAX_PRICE)}
              className="bg-white text-xs h-8"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-5 py-4">
        <div className="space-y-2">
          <Button className="w-full" onClick={applyPriceFilter}>Áp dụng</Button>
          <Button variant="outline" className="w-full" onClick={clearAllFilters}>Xóa bộ lọc</Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-6 text-3xl font-bold">Khám Phá Tour</h1>

        <div className="flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex min-w-64 flex-1 gap-2">
            <Input
              placeholder="Tìm tour..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Tìm</Button>
          </form>

          <Select value={sort} onValueChange={(v) => updateParam('sort', v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                Bộ lọc
                {hasActiveFilters && (
                  <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-orange-100 px-1.5 text-xs font-semibold text-orange-700">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="gap-0 p-0 sm:max-w-md">
              <SheetHeader className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <SheetTitle className="text-xl">Bộ lọc</SheetTitle>
                <p className="text-sm text-slate-500">Tinh chỉnh kết quả tour theo nhu cầu của bạn.</p>
              </SheetHeader>
              <FilterContent />
            </SheetContent>
          </Sheet>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {q && (
              <Badge variant="secondary">
                Tìm: {q}{' '}
                <button onClick={() => updateParam('q', undefined)} className="ml-1">×</button>
              </Badge>
            )}
            {city && (
              <Badge variant="secondary">
                Thành phố: {city}{' '}
                <button onClick={() => updateParam('city', undefined)} className="ml-1">×</button>
              </Badge>
            )}
            {category && (
              <Badge variant="secondary">
                {TOUR_CATEGORIES.find((c) => c.value === category)?.label}{' '}
                <button onClick={() => updateParam('category', undefined)} className="ml-1">×</button>
              </Badge>
            )}
            {tourType && (
              <Badge variant="secondary">
                {TOUR_TYPES.find((t) => t.value === tourType)?.label}{' '}
                <button onClick={() => updateParam('tourType', undefined)} className="ml-1">×</button>
              </Badge>
            )}
            {hasPriceFilter && (
              <Badge variant="secondary">
                Ngân sách: {formatVND(minPrice)} - {maxPrice < MAX_PRICE ? formatVND(maxPrice) : 'Không giới hạn'}{' '}
                <button onClick={clearPriceFilter} className="ml-1">×</button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {meta && <p className="mb-4 text-sm text-gray-500">Tìm thấy {meta.total} tour</p>}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="space-y-2 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tours.length === 0 ? (
        <div className="py-20 text-center">
          <h3 className="mb-2 text-xl font-semibold">Không tìm thấy tour</h3>
          <p className="text-gray-500">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={gridVariants}
          initial="hidden"
          animate="show"
        >
          {tours.map((tour) => (
            <motion.div key={tour.id} variants={cardVariants}>
              <motion.div whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }} transition={{ duration: 0.2 }}>
                <Link to={`/tours/${tour.id}`}>
                  <Card className="flex h-full flex-col overflow-hidden">
                    <div className="relative h-48 overflow-hidden">
                      {tour.coverImageUrl || tour.images?.[0] ? (
                        <img
                          src={tour.coverImageUrl ?? tour.images[0]}
                          alt={tour.title}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-orange-100 text-orange-300 text-4xl">
                          ✦
                        </div>
                      )}
                      <Badge className="absolute right-3 top-3 bg-orange-600">
                        {TOUR_CATEGORIES.find((c) => c.value === tour.category)?.label || tour.category}
                      </Badge>
                      {tour.isBoosted && <Badge className="absolute left-3 top-3 bg-yellow-500">Nổi bật</Badge>}
                      {tour.tourType === 'private' ? (
                        <Badge className="absolute left-3 bottom-3 bg-purple-600">Riêng tư</Badge>
                      ) : (
                        <Badge className="absolute left-3 bottom-3 bg-blue-600">Nhóm</Badge>
                      )}
                    </div>
                    <CardContent className="flex-1 p-4">
                      <h3 className="mb-2 line-clamp-2 text-lg font-semibold">{tour.title}</h3>

                      <div className="mb-3 flex items-center gap-2">
                        {tour.guide.avatarUrl ? (
                          <img src={tour.guide.avatarUrl} alt={tour.guide.fullName} className="size-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-700">
                            {tour.guide.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{tour.guide.fullName}</p>
                          <div className="flex items-center gap-1">
                            <Star className="size-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-gray-600">
                              {tour.avgRating.toFixed(1)} ({tour.totalReviews})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                        <span>{tour.durationHours}h</span>
                        <span>·</span>
                        <span>{tour.tourType === 'private' ? 'Riêng tư' : `Tối đa ${tour.maxGroupSize} người`}</span>
                        <span>·</span>
                        <span>{tour.locationCity}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between p-4 pt-0">
                      <div>
                        <span className="text-xl font-bold text-orange-600">{formatVND(tour.pricePerPerson)}</span>
                        <span className="text-sm text-gray-600">/người</span>
                      </div>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">Xem chi tiết</Button>
                    </CardFooter>
                  </Card>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {meta && meta.total > meta.size && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Trang {page} / {Math.ceil(meta.total / meta.size)}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= Math.ceil(meta.total / meta.size)}
            onClick={() => updateParam('page', String(page + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
