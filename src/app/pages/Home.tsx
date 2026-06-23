import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Sparkles, Star } from 'lucide-react'
import { motion } from 'motion/react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardFooter } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { ScrollReveal } from '../components/ScrollReveal'
import { useAuth } from '../contexts/AuthContext'
import { searchTours } from '@/api/tours'
import { getHomeCategories } from '@/api/home'
import { formatVND, TOUR_CATEGORIES } from '@/lib/constants'
import { optimizeImg } from '@/lib/imgUrl'
import type { TourListItem } from '@/types/tour'

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tours', 'featured'],
    queryFn: () => searchTours({ sort: 'rating_desc', size: 50 }),
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['home-categories'],
    queryFn: getHomeCategories,
    staleTime: 5 * 60 * 1000,
  })

  // Tour Nổi Bật chỉ hiển thị tour đã boost. Backend trả về boosted trên cùng
  // khi sort, lấy size=50 để chắc chắn cover hết các boost spot hiện có.
  const boostedTours = data?.items.filter((t) => t.isBoosted) ?? []

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = prompt.trim()
    if (!q) return
    navigate(`/ai-search?q=${encodeURIComponent(q)}`)
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-500 to-red-500 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              className="text-4xl md:text-5xl mb-6 font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Khám Phá Việt Nam Cùng Hướng Dẫn Viên Địa Phương
            </motion.h1>
            <motion.p
              className="text-xl mb-8 opacity-90"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Tìm và đặt tour trải nghiệm độc đáo phù hợp với sở thích và ngân sách của bạn
            </motion.p>
            <motion.form
              onSubmit={handleAiSearch}
              className="bg-white rounded-2xl p-3 shadow-xl text-left"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Textarea
                placeholder="Hôm nay tôi muốn... (vd: 'đi đâu thư giãn 2 ngày gần biển', 'tour ẩm thực miền Tây cho gia đình')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                maxLength={500}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAiSearch(e as unknown as React.FormEvent)
                  }
                }}
              />
              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="bg-orange-600 hover:bg-orange-700 shrink-0"
                >
                  <Sparkles className="mr-2 size-4" />
                  Gợi ý bằng AI
                </Button>
              </div>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Categories */}
      <ScrollReveal>
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl text-center mb-8">Khám Phá Theo Danh Mục</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoriesLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-6 space-y-2">
                        <Skeleton className="h-5 w-3/4 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                      </CardContent>
                    </Card>
                  ))
                : categories.map((cat) => (
                    <Link key={cat.id} to={`/tours?category=${cat.categoryFilter}`}>
                      <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                            <h3 className="font-semibold mb-1">{cat.name}</h3>
                            <p className="text-sm text-gray-500">{cat.description}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Link>
                  ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Featured Tours — marquee, chỉ hiển thị tour đã boost */}
      {(isLoading || boostedTours.length > 0) && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl">Tour Nổi Bật</h2>
              <Link to="/tours">
                <Button variant="outline">Xem tất cả</Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
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
            ) : boostedTours.length === 1 ? (
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <BoostedTourCard tour={boostedTours[0]} />
                </div>
              </div>
            ) : (
              <BoostedToursMarquee tours={boostedTours} />
            )}
          </div>
        </section>
      )}

      {/* Accommodations Coming Soon */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-4">
              <span className="text-sm font-medium">SẮP RA MẮT</span>
            </div>
            <h2 className="text-3xl mb-4">Khách Sạn & Nhà Hàng</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Tính năng đặt khách sạn và nhà hàng đang được phát triển. Hãy quay lại sớm!
            </p>
            <Link to="/accommodations">
              <Button variant="outline">Xem thêm</Button>
            </Link>
          </div>
        </section>
      </ScrollReveal>

      {/* Why Choose Us */}
      <ScrollReveal delay={0.05}>
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl text-center mb-12">Tại Sao Chọn VietNamTours?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Hướng Dẫn Viên Chuyên Nghiệp', desc: 'Đội ngũ HDV địa phương am hiểu, nhiệt tình và có chứng chỉ hành nghề' },
                { title: 'Trải nghiệm độc đáo', desc: 'Các tour được thiết kế riêng biệt, mang đến trải nghiệm khác biệt' },
                { title: 'Giá Cả Hợp Lý', desc: 'Đa dạng lựa chọn phù hợp với mọi ngân sách và nhu cầu' },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* CTA Section */}
      {(!user || user.role !== 'guide') && (
        <section className="py-16 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl mb-4">Bạn là hướng dẫn viên du lịch?</h2>
            <p className="text-xl mb-8 opacity-90">
              Đăng ký và bắt đầu chia sẻ tour trải nghiệm của bạn ngay hôm nay
            </p>
            <Link to="/guide-application">
              <Button size="lg" variant="secondary">Đăng ký ngay</Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

// ── Boosted tour card (shared bởi marquee & single-item layout) ──────────────
function BoostedTourCard({ tour }: { tour: TourListItem }) {
  return (
    <Link
      to={`/tours/${tour.id}`}
      className="group block h-full will-change-transform transition-transform duration-200 hover:-translate-y-1"
    >
      <Card className="overflow-hidden h-full transition-shadow duration-200 group-hover:shadow-xl">
        <div className="relative h-48 overflow-hidden">
          {tour.coverImageUrl ? (
            <img
              src={optimizeImg(tour.coverImageUrl, 640)}
              alt={tour.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-300 text-4xl">
              ✦
            </div>
          )}
          <Badge className="absolute top-3 right-3 bg-orange-600">
            {TOUR_CATEGORIES.find((c) => c.value === tour.category)?.label ?? tour.category}
          </Badge>
          <Badge className="absolute top-3 left-3 bg-yellow-500">Nổi bật</Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{tour.title}</h3>
          <div className="flex items-center gap-2 mb-3">
            {tour.guide.avatarUrl ? (
              <img src={optimizeImg(tour.guide.avatarUrl, 64)} alt={tour.guide.fullName} loading="lazy" decoding="async" className="size-8 rounded-full object-cover" />
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
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span>{tour.durationHours}h</span>
              <span>·</span>
              <span>Tối đa {tour.maxGroupSize} người</span>
              <span>·</span>
              <span>{tour.locationCity}</span>
            </div>
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
  )
}

// ── Marquee tự động cuộn ngang, pause khi hover ──────────────────────────────
function BoostedToursMarquee({ tours }: { tours: TourListItem[] }) {
  // Tốc độ: ~8s mỗi card → list dài thì chậm hơn, ngắn thì nhanh hơn (tối thiểu 20s).
  const durationSec = Math.max(tours.length * 8, 20)
  // Nhân đôi list để có thể translate -50% mà nhìn liền mạch.
  const items = [...tours, ...tours]

  return (
    <div className="relative overflow-hidden boosted-marquee-mask">
      <div
        className="flex gap-6 w-max boosted-marquee-track"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {items.map((tour, i) => (
          <div key={`${tour.id}-${i}`} className="w-[320px] shrink-0">
            <BoostedTourCard tour={tour} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes boosted-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .boosted-marquee-track {
          animation-name: boosted-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .boosted-marquee-mask:hover .boosted-marquee-track {
          animation-play-state: paused;
        }
        .boosted-marquee-mask {
          mask-image: linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%);
        }
        @media (prefers-reduced-motion: reduce) {
          .boosted-marquee-track { animation: none; }
        }
      `}</style>
    </div>
  )
}
