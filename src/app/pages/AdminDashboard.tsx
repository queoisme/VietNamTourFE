import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getAdminRevenue, getAdminStats, getAdminSubscriptionPlans, getAdminBoostPlans } from '@/api/admin'
import { formatDate, formatVND } from '@/lib/constants'

/** Chuyển plan slug thành label đẹp: "super_vip" → "Super Vip" */
function formatPlanLabel(plan: string): string {
  return plan.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'

export function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
  })

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => getAdminRevenue(),
  })

  const { data: subscriptionPlans = [] } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: getAdminSubscriptionPlans,
  })

  const { data: boostPlans = [] } = useQuery({
    queryKey: ['admin-boost-plans'],
    queryFn: getAdminBoostPlans,
  })

  const statCards = stats
    ? [
        { label: 'Tổng người dùng', value: stats.totalUsers },
        { label: 'Hướng dẫn viên', value: stats.totalGuides },
        { label: 'Tour hoạt động', value: stats.activeTours },
        { label: 'Tổng đặt tour', value: stats.totalBookings },
        { label: 'Chờ xác nhận', value: stats.pendingBookings },
        { label: 'Tổng doanh thu', value: formatVND(stats.totalRevenue) },
      ]
    : []

  const chartData =
    revenue?.byDate?.map((d) => ({
      date: formatDate(d.date),
      revenue: d.revenue / 1_000_000,
    })) ?? []

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-indigo-800 p-6 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-indigo-100">
          Theo dõi toàn bộ vận hành hệ thống, doanh thu và tăng trưởng theo thời gian thực.
        </p>
      </div>

      {statsLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold mt-1">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doanh thu theo ngày (triệu VND)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : chartData.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">Chưa có dữ liệu doanh thu</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}M VND`, 'Doanh thu']} />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gói Boost Tour</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {boostPlans.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có cấu hình gói.</p>
            ) : (
              boostPlans.map((plan) => (
                <div key={plan.plan} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {formatPlanLabel(plan.plan)}
                    </p>
                    <span className="text-sm font-medium text-orange-600">{formatVND(plan.price)}</span>
                  </div>
                  <p className="text-xs text-gray-400">{plan.durationDays} ngày</p>
                  {plan.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{plan.description}</p>
                  )}
                </div>
              ))
            )}
            <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
              <Link to="/admin/boost-plans">Quản lý gói Boost</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subscriptionPlans.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có cấu hình gói.</p>
            ) : (
              subscriptionPlans.map((plan) => (
                <div key={plan.plan} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {formatPlanLabel(plan.plan)}
                    </p>
                    <span className="text-sm font-medium text-emerald-600">{formatVND(plan.price)}</span>
                  </div>
                  <p className="text-xs text-gray-400">{plan.durationDays} ngày</p>
                  {plan.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{plan.description}</p>
                  )}
                </div>
              ))
            )}
            <Button asChild className="w-full">
              <Link to="/admin/subscriptions">Quản lý subscription</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan trạng thái booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Chờ xác nhận', value: stats.pendingBookings, className: 'text-amber-600' },
                { label: 'Đã xác nhận', value: stats.confirmedBookings, className: 'text-blue-600' },
                { label: 'Hoàn thành', value: stats.completedBookings, className: 'text-emerald-600' },
                { label: 'Đã hủy', value: stats.cancelledBookings, className: 'text-rose-600' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border bg-slate-50 p-4 text-center">
                  <p className={`text-3xl font-bold ${item.className}`}>{item.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { to: '/admin/users', label: 'Người dùng' },
          { to: '/admin/tours', label: 'Tour' },
          { to: '/admin/applications', label: 'Hồ sơ HDV' },
          { to: '/admin/reports', label: 'Báo cáo' },
          { to: '/admin/withdrawals', label: 'Rút tiền' },
          { to: '/admin/subscriptions', label: 'Subscription' },
        ].map((item) => (
          <Button key={item.to} variant="outline" className="h-auto py-4" asChild>
            <Link to={item.to}>
              <span className="text-xs">{item.label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
