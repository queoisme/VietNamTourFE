import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Star, ChevronLeft, ChevronRight, Search, MapPin, Clock, Users, ArrowRight, SlidersHorizontal } from 'lucide-react'
import { motion } from 'motion/react'
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

const CATEGORY_THEME: Record<string, { gradient: string; badge: string; avatar: string }> = {
  nature: {
    gradient: 'from-emerald-400 via-emerald-500 to-teal-600',
    badge: 'bg-emerald-500 text-white',
    avatar: 'from-emerald-400 to-teal-500',
  },
  culture: {
    gradient: 'from-violet-400 via-purple-500 to-fuchsia-600',
    badge: 'bg-violet-500 text-white',
    avatar: 'from-violet-400 to-fuchsia-500',
  },
  food: {
    gradient: 'from-orange-400 via-orange-500 to-red-500',
    badge: 'bg-orange-500 text-white',
    avatar: 'from-orange-400 to-red-500',
  },
  resort: {
    gradient: 'from-cyan-400 via-teal-500 to-emerald-500',
    badge: 'bg-emerald-500 text-white',
    avatar: 'from-cyan-400 to-teal-500',
  },
  adventure: {
    gradient: 'from-rose-400 via-pink-500 to-red-500',
    badge: 'bg-rose-500 text-white',
    avatar: 'from-rose-400 to-pink-500',
  },
  other: {
    gradient: 'from-blue-500 via-indigo-500 to-violet-600',
    badge: 'bg-blue-500 text-white',
    avatar: 'from-blue-400 to-indigo-500',
  },
}

const getTheme = (category?: string | null) => CATEGORY_THEME[category || 'other'] || CATEGORY_THEME.other

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
    <div className="min-h-screen bg-slate-50">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-8 pb-24 text-white">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <nav className="mb-6 flex items-center gap-2 text-sm text-slate-300">
            <Link to="/" className="hover:text-orange-400">Trang chủ</Link>
            <span className="text-slate-500">/</span>
            <span className="text-orange-400">Khám phá tour</span>
          </nav>

          <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">Khám Phá Tour</h1>
          <p className="mb-8 text-base text-slate-300 md:text-lg">Tìm kiếm hành trình hoàn hảo cho chuyến đi của bạn</p>

          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20"
          >
            <div className="flex flex-1 items-center gap-2 pl-3 text-slate-400">
              <Search className="size-5 shrink-0" />
              <Input
                placeholder="Tìm kiếm tour, địa điểm, hướng dẫn viên..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 border-0 bg-transparent text-slate-800 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button
              type="submit"
              className="rounded-xl bg-orange-500 px-6 text-white shadow-md shadow-orange-500/40 hover:bg-orange-600"
            >
              Tìm kiếm
            </Button>
          </form>
        </div>
      </section>

      <div className="container mx-auto -mt-10 px-4 pb-12">
        {/* Category pills */}
        <div className="relative mb-6 overflow-x-auto rounded-2xl bg-white p-3 shadow-lg shadow-slate-900/5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateParam('category', undefined)}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                !category
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
            {TOUR_CATEGORIES.map((cat) => {
              const active = category === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => updateParam('category', active ? undefined : cat.value)}
                  className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Result count + sort + filter */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {meta ? <>Tìm thấy <span className="font-semibold text-slate-800">{meta.total}</span> tour</> : 'Đang tải...'}
          </p>
          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={(v) => updateParam('sort', v)}>
              <SelectTrigger className="w-44 bg-white">
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
                <Button variant="outline" className="relative bg-white">
                  <SlidersHorizontal className="mr-2 size-4" />
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
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap gap-2">
            {q && (
              <Badge variant="secondary" className="bg-white">
                Tìm: {q}{' '}
                <button onClick={() => updateParam('q', undefined)} className="ml-1">×</button>
              </Badge>
            )}
            {city && (
              <Badge variant="secondary" className="bg-white">
                Thành phố: {city}{' '}
                <button onClick={() => updateParam('city', undefined)} className="ml-1">×</button>
              </Badge>
            )}
            {tourType && (
              <Badge variant="secondary" className="bg-white">
                {TOUR_TYPES.find((t) => t.value === tourType)?.label}{' '}
                <button onClick={() => updateParam('tourType', undefined)} className="ml-1">×</button>
              </Badge>
            )}
            {hasPriceFilter && (
              <Badge variant="secondary" className="bg-white">
                Ngân sách: {formatVND(minPrice)} - {maxPrice < MAX_PRICE ? formatVND(maxPrice) : 'Không giới hạn'}{' '}
                <button onClick={clearPriceFilter} className="ml-1">×</button>
              </Badge>
            )}
          </div>
        )}

        {/* Cards grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden rounded-2xl border-0 shadow-md">
                <Skeleton className="h-52 w-full" />
                <CardContent className="space-y-2 p-5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
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
            {tours.map((tour) => {
              const theme = getTheme(tour.category)
              const categoryLabel = TOUR_CATEGORIES.find((c) => c.value === tour.category)?.label || tour.category
              const rating = tour.avgRating || 0
              return (
                <motion.div key={tour.id} variants={cardVariants}>
                  <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
                    <Link to={`/tours/${tour.id}`}>
                      <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-0 bg-white shadow-md transition-shadow hover:shadow-xl">
                        <div className={`relative h-52 overflow-hidden bg-gradient-to-br ${theme.gradient}`}>
                          {(tour.coverImageUrl || tour.images?.[0]) && (
                            <img
                              src={tour.coverImageUrl ?? tour.images[0]}
                              alt={tour.title}
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

                          {tour.tourType === 'private' ? (
                            <Badge className="absolute left-3 top-3 rounded-full border-0 bg-violet-500 px-3 py-1 text-white shadow-md">Riêng tư</Badge>
                          ) : (
                            <Badge className="absolute left-3 top-3 rounded-full border-0 bg-blue-500 px-3 py-1 text-white shadow-md">Nhóm</Badge>
                          )}

                          <Badge className={`absolute right-3 top-3 rounded-full border-0 px-3 py-1 shadow-md ${theme.badge}`}>
                            {categoryLabel}
                          </Badge>

                          {tour.isBoosted && (
                            <Badge className="absolute right-3 top-12 rounded-full border-0 bg-yellow-400 px-3 py-1 text-yellow-900 shadow-md">
                              Nổi bật
                            </Badge>
                          )}

                          <div className="absolute bottom-3 left-3 flex items-center gap-1 text-sm font-medium text-white">
                            <MapPin className="size-4" />
                            <span>{tour.locationCity}</span>
                          </div>
                        </div>

                        <CardContent className="flex-1 space-y-3 p-5">
                          <h3 className="line-clamp-2 text-lg font-semibold text-slate-900">{tour.title}</h3>

                          <div className="flex items-center gap-2.5">
                            {tour.guide.avatarUrl ? (
                              <img src={tour.guide.avatarUrl} alt={tour.guide.fullName} className="size-9 rounded-full object-cover" />
                            ) : (
                              <div className={`flex size-9 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${theme.avatar}`}>
                                {tour.guide.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">{tour.guide.fullName}</p>
                              <div className="flex items-center gap-1.5">
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`size-3 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-medium text-slate-600">{rating.toFixed(1)}</span>
                                <span className="text-xs text-slate-400">
                                  {tour.totalReviews > 0 ? `(${tour.totalReviews} đánh giá)` : '(Chưa có đánh giá)'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3.5" />
                              {tour.durationHours}h
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3.5" />
                              {tour.tourType === 'private' ? 'Riêng tư' : `Tối đa ${tour.maxGroupSize} người`}
                            </span>
                          </div>
                        </CardContent>

                        <CardFooter className="flex items-end justify-between border-t border-slate-100 p-5 pt-4">
                          <div>
                            <div className="text-xl font-bold text-orange-600">{formatVND(tour.pricePerPerson)}</div>
                            <div className="text-xs text-slate-500">/người</div>
                          </div>
                          <Button
                            size="sm"
                            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700"
                          >
                            Xem chi tiết
                            <ArrowRight className="ml-1 size-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {meta && meta.total > meta.size && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" className="bg-white" disabled={page <= 1} onClick={() => updateParam('page', String(page - 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm text-slate-600">
              Trang {page} / {Math.ceil(meta.total / meta.size)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="bg-white"
              disabled={page >= Math.ceil(meta.total / meta.size)}
              onClick={() => updateParam('page', String(page + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
