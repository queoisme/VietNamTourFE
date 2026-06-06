import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { exportReport, getAdminRevenue } from '@/api/admin'
import { formatDate, formatVND } from '@/lib/constants'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'

export function AdminReports() {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const [from, setFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0])
  const [to, setTo] = useState(today.toISOString().split('T')[0])
  const [bookingStatus, setBookingStatus] = useState('all')
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue', from, to],
    queryFn: () => getAdminRevenue({ from, to }),
  })

  const chartData =
    data?.byDate?.map((d) => ({
      date: formatDate(d.date),
      revenue: Math.round(d.revenue / 1_000_000),
      bookings: d.bookingCount,
    })) ?? []

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const blob = await exportReport({
        from,
        to,
        status: bookingStatus === 'all' ? undefined : bookingStatus,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `admin-report-${from}-${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Đã xuất báo cáo CSV')
    } catch (err) {
      toast.error((err as Error).message || 'Lỗi khi xuất báo cáo')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-indigo-800 p-6 text-white">
        <h1 className="text-2xl font-bold">Báo cáo doanh thu</h1>
        <p className="mt-1 text-sm text-indigo-100">
          Theo dõi doanh thu theo ngày, số lượng booking và xuất báo cáo phục vụ đối soát.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Từ ngày</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-40" />
          </div>
          <div>
            <Label className="text-xs">Đến ngày</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-40" />
          </div>
          <div>
            <Label className="text-xs">Trạng thái booking (xuất CSV)</Label>
            <Select value={bookingStatus} onValueChange={setBookingStatus}>
              <SelectTrigger className="mt-1 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="ml-auto" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Đang xuất...' : 'Xuất CSV'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Tổng doanh thu" value={formatVND(data?.totalRevenue ?? 0)} />
          <MetricCard label="Tổng booking" value={(data?.totalBookings ?? 0).toString()} />
          <MetricCard label="Giá trị trung bình/booking" value={formatVND((data?.totalBookings ?? 0) > 0 ? (data?.totalRevenue ?? 0) / data!.totalBookings : 0)} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Doanh thu theo ngày (triệu VND)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72 rounded-xl" />
          ) : chartData.length === 0 ? (
            <div className="py-20 text-center text-sm text-gray-500">Không có dữ liệu trong khoảng thời gian đã chọn.</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}M VND`, 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {!isLoading && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left font-medium">Ngày</th>
                    <th className="p-3 text-right font-medium">Số booking</th>
                    <th className="p-3 text-right font-medium">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.byDate?.map((d) => (
                    <tr key={d.date} className="hover:bg-slate-50/60">
                      <td className="p-3">{formatDate(d.date)}</td>
                      <td className="p-3 text-right">{d.bookingCount}</td>
                      <td className="p-3 text-right font-medium text-indigo-600">{formatVND(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}
