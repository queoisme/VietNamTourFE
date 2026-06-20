import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { cn } from '../../components/ui/utils'
import { SectionHeader } from './components/SectionHeader'
import { KpiCard } from './components/KpiCard'
import { getMyTourClickAnalytics } from '@/api/analytics'
import type { GuideClickAnalyticsResponse } from '@/api/analytics'
import { getMyFeatures } from '@/api/features'

const TOUR_STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
}
const TOUR_STATUS_LABEL: Record<string, string> = {
  active: 'Đang hoạt động',
  inactive: 'Tạm dừng',
  draft: 'Bản nháp',
}

const ORANGE_PRIMARY = '#ea580c'
const ORANGE_LIGHT = '#fed7aa'

function toShortDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function AnalyticsTab() {
  const { data: myFeatures, isLoading: featuresLoading } = useQuery({
    queryKey: ['guide-my-features'],
    queryFn: getMyFeatures,
    staleTime: 5 * 60 * 1000,
  })
  const hasAnalytics = myFeatures?.featureKeys.includes('analytics.tour_clicks') ?? false

  const [days, setDays] = useState(30)

  const to = new Date().toISOString().slice(0, 10)
  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  const { data, isLoading, isError } = useQuery<GuideClickAnalyticsResponse>({
    queryKey: ['guide-tour-analytics', days],
    queryFn: () => getMyTourClickAnalytics({ from, to }),
    enabled: hasAnalytics,
    retry: 1,
  })

  if (featuresLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  if (!hasAnalytics) {
    return (
      <div className="space-y-6">
        <SectionHeader
          tag="Thống kê"
          title="Phân tích lượt xem Tour"
          description="Theo dõi tour nào đang phổ biến, tour nào cần cải thiện."
        />
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
            <BarChart3 className="size-6" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Tính năng dành cho gói Premium / Pro</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Nâng cấp để xem thống kê lượt click theo tour và xu hướng truy cập.
          </p>
          <Button asChild className="mt-4 bg-orange-600 hover:bg-orange-700" size="sm">
            <Link to="/subscription">Nâng cấp ngay</Link>
          </Button>
        </div>
      </div>
    )
  }

  const tours = data?.tours ?? []
  const dailyTrend = data?.dailyTrend ?? []
  const maxClicks = Math.max(...tours.map((t) => t.clicks), 1)

  const barData = tours.map((t) => ({
    name: t.title.length > 22 ? t.title.slice(0, 22) + '…' : t.title,
    clicks: t.clicks,
  }))

  const lineData = dailyTrend.map((d) => ({
    date: toShortDate(d.date),
    count: d.count,
  }))

  return (
    <div className="space-y-6">
      <SectionHeader
        tag="Thống kê"
        title="Phân tích lượt xem Tour"
        description="Theo dõi tour nào đang phổ biến, tour nào cần cải thiện."
        chip={
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  days === d
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {d} ngày
              </button>
            ))}
          </div>
        }
      />

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Không thể tải dữ liệu thống kê. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={BarChart3}
          label={`Tổng lượt xem (${days} ngày)`}
          value={(data?.totalClicks ?? 0).toLocaleString('vi-VN')}
        />
        <KpiCard
          icon={BarChart3}
          label="Số tour có lượt xem"
          value={tours.filter((t) => t.clicks > 0).length}
        />
        <KpiCard
          icon={BarChart3}
          label="Tour hot nhất"
          value={tours[0]?.clicks?.toLocaleString('vi-VN') ?? '0'}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-slate-900">Xu hướng theo ngày</p>
        {isLoading ? (
          <Skeleton className="h-44 w-full" />
        ) : lineData.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-sm text-slate-400">
            Chưa có dữ liệu trong khoảng thời gian này
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} width={28} />
              <Tooltip
                formatter={(v) => [`${v} lượt`, 'Lượt xem']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={ORANGE_PRIMARY}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: ORANGE_PRIMARY }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {!isLoading && barData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-900">Lượt xem theo tour</p>
          <ResponsiveContainer width="100%" height={Math.max(160, barData.length * 36)}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <defs>
                <linearGradient id="orangeBar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={150} />
              <Tooltip
                formatter={(v) => [`${v} lượt`, 'Lượt xem']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Bar dataKey="clicks" fill="url(#orangeBar)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Xếp hạng tour theo lượt xem</p>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">
            Bạn chưa có tour nào.{' '}
            <Link to="/create-tour" className="text-orange-600 hover:underline">
              Tạo tour ngay
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tours.map((tour, idx) => (
              <div key={tour.tourId} className="flex items-center gap-4 px-5 py-3">
                <span className="w-6 shrink-0 text-center text-sm font-bold text-slate-400">
                  {idx + 1}
                </span>
                {tour.coverImageUrl ? (
                  <img
                    src={tour.coverImageUrl}
                    alt={tour.title}
                    className="h-10 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-14 shrink-0 rounded-lg bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{tour.title}</p>
                  <div className="mt-0.5">
                    <Badge variant="outline" className={cn('px-1.5 py-0 text-[10px]', TOUR_STATUS_BADGE[tour.status])}>
                      {TOUR_STATUS_LABEL[tour.status] ?? tour.status}
                    </Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-orange-600">
                    {tour.clicks.toLocaleString('vi-VN')}
                  </p>
                  <p className="text-[10px] text-slate-400">lượt xem</p>
                </div>
                <div className="w-24 shrink-0">
                  <div className="h-1.5 rounded-full" style={{ background: ORANGE_LIGHT }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${(tour.clicks / maxClicks) * 100}%`, background: ORANGE_PRIMARY }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
