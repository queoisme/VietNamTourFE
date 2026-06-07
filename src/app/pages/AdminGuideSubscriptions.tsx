import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Users, CheckCircle2, XCircle, Clock, Wallet } from 'lucide-react'
import {
  getAdminGuideSubscriptions,
  getAdminGuideSubscriptionStats,
  getAdminSubscriptionPlans,
} from '@/api/admin'
import { formatVND } from '@/lib/constants'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang hoạt động',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function AdminGuideSubscriptions() {
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const size = 20

  const { data: stats } = useQuery({
    queryKey: ['admin-guide-subscription-stats'],
    queryFn: getAdminGuideSubscriptionStats,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: getAdminSubscriptionPlans,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-guide-subscriptions', planFilter, statusFilter, search, page],
    queryFn: () =>
      getAdminGuideSubscriptions({
        plan: planFilter === 'all' ? undefined : planFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
        page,
        size,
      }),
  })

  const items = data?.items ?? []
  const total = data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / size))

  const planOptions = useMemo(
    () => plans.filter((p) => p.plan !== 'free').map((p) => p.plan),
    [plans],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-indigo-800 p-6 text-white">
        <h1 className="text-2xl font-bold">Subscription của hướng dẫn viên</h1>
        <p className="mt-1 text-sm text-slate-200">
          Theo dõi các gói subscription mà guide đã mua, ngày hiệu lực và trạng thái.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Tổng" value={stats?.totalSubscriptions ?? 0} icon={<Users className="size-5 text-indigo-500" />} />
        <StatCard label="Đang hoạt động" value={stats?.activeCount ?? 0} icon={<CheckCircle2 className="size-5 text-emerald-500" />} />
        <StatCard label="Hết hạn" value={stats?.expiredCount ?? 0} icon={<Clock className="size-5 text-slate-500" />} />
        <StatCard label="Đã hủy" value={stats?.cancelledCount ?? 0} icon={<XCircle className="size-5 text-rose-500" />} />
        <StatCard
          label="Tổng doanh thu"
          value={stats ? formatVND(stats.totalRevenue) : '—'}
          icon={<Wallet className="size-5 text-orange-500" />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Tìm theo tên hoặc email guide
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="vd: Thiên hoặc email@..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Gói</label>
            <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả gói</SelectItem>
                {planOptions.map((p) => (
                  <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Trạng thái</label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              Không có subscription nào khớp với bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Hướng dẫn viên</th>
                    <th className="px-4 py-3">Gói</th>
                    <th className="px-4 py-3 text-right">Đã trả</th>
                    <th className="px-4 py-3">Bắt đầu</th>
                    <th className="px-4 py-3">Hết hạn</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Mã giao dịch</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {s.guideAvatarUrl ? (
                            <img src={s.guideAvatarUrl} alt={s.guideName} className="size-8 rounded-full object-cover" />
                          ) : (
                            <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                              {s.guideName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{s.guideName}</p>
                            <p className="truncate text-xs text-slate-500">{s.guideEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">{s.plan}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        {formatVND(s.pricePaid)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(s.startsAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(s.expiresAt)}</td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_BADGE_CLASS[s.status] ?? ''} variant="outline">
                          {STATUS_LABELS[s.status] ?? s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {s.paymentTxnId ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-slate-600">
              <span>Trang {page}/{totalPages} · {total} kết quả</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Trước
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
          {icon}
          <span>{label}</span>
        </div>
        <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  )
}
