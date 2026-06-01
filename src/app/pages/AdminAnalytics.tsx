import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Cell,
} from 'recharts'
import { Skeleton } from '../components/ui/skeleton'
import { Switch } from '../components/ui/switch'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { getAdminSearchAnalytics, getAdminPageViewAnalytics, getReportSchedule, updateReportSchedule, sendAnalyticsReportNow } from '@/api/admin'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

const CATEGORY_VI: Record<string, string> = {
  nature: 'Thiên nhiên',
  culture: 'Văn hóa',
  food: 'Ẩm thực',
  resort: 'Nghỉ dưỡng',
  adventure: 'Phiêu lưu',
  other: 'Khác',
}

const PAGE_VI: Record<string, string> = {
  '/': 'Trang chủ',
  '/tours': 'Danh sách tour',
  '/guide-application': 'Đăng ký HDV',
  '/subscription': 'Gói đăng ký',
  '/my-bookings': 'Đơn đặt của tôi',
  '/my-wishlist': 'Tour yêu thích',
  '/my-reviews': 'Đánh giá',
}

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff', '#faf5ff']

function toLocaleDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-white px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value.toLocaleString('vi-VN')}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-slate-400 text-sm">{message}</div>
  )
}

const DAY_LABELS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

export function AdminAnalytics() {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [from, setFrom] = useState(fmt(thirtyDaysAgo))
  const [to, setTo] = useState(fmt(today))

  const queryClient = useQueryClient()

  const { data: searches, isLoading: searchLoading } = useQuery({
    queryKey: ['admin-search-analytics', from, to],
    queryFn: () => getAdminSearchAnalytics({ from, to }),
  })

  const { data: pageViews, isLoading: pvLoading } = useQuery({
    queryKey: ['admin-pageview-analytics', from, to],
    queryFn: () => getAdminPageViewAnalytics({ from, to }),
  })

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['admin-report-schedule'],
    queryFn: getReportSchedule,
  })

  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: 1, hourUtc7: 7, isEnabled: true })
  const [scheduleInitialized, setScheduleInitialized] = useState(false)
  const [showSendConfirm, setShowSendConfirm] = useState(false)

  if (schedule && !scheduleInitialized) {
    setScheduleForm({ dayOfWeek: schedule.dayOfWeek, hourUtc7: schedule.hourUtc7, isEnabled: schedule.isEnabled })
    setScheduleInitialized(true)
  }

  const updateScheduleMutation = useMutation({
    mutationFn: updateReportSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-report-schedule'] })
      toast.success('Đã cập nhật lịch gửi báo cáo')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const sendNowMutation = useMutation({
    mutationFn: sendAnalyticsReportNow,
    onSuccess: () => toast.success('Đã gửi báo cáo đến tất cả guide đủ điều kiện'),
    onError: (err: Error) => toast.error(err.message),
  })

  const isLoading = searchLoading || pvLoading

  return (
    <div className="space-y-6">
      {/* Header + date filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Phân tích hành vi</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi hành vi tìm kiếm và truy cập của người dùng</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-500">Từ</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <label className="text-slate-500">đến</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Overview cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Lượt tìm kiếm tour" value={searches?.totalSearches ?? 0} sub="Trong khoảng thời gian đã chọn" />
          <StatCard label="Lượt truy cập trang" value={pageViews?.totalViews ?? 0} sub="Page views từ người dùng" />
        </div>
      )}

      {/* Search trend line chart */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Xu hướng tìm kiếm theo ngày</h2>
        {searchLoading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : !searches?.dailyCounts.length ? (
          <EmptyState message="Chưa có dữ liệu tìm kiếm trong khoảng thời gian này" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={searches.dailyCounts.map(d => ({ ...d, dateLabel: toLocaleDateShort(d.date) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [v, 'Lượt tìm kiếm']} labelFormatter={(l) => `Ngày ${l}`} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top categories + Top cities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top categories */}
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Danh mục được tìm nhiều nhất</h2>
          {searchLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : !searches?.topCategories.length ? (
            <EmptyState message="Chưa có dữ liệu" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                layout="vertical"
                data={searches.topCategories.map(c => ({ ...c, label: CATEGORY_VI[c.label] ?? c.label }))}
                margin={{ left: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip formatter={(v) => [v, 'Lượt tìm']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {searches.topCategories.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top cities */}
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Địa điểm được tìm nhiều nhất</h2>
          {searchLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : !searches?.topCities.length ? (
            <EmptyState message="Chưa có dữ liệu" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                layout="vertical"
                data={searches.topCities}
                margin={{ left: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip formatter={(v) => [v, 'Lượt tìm']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {searches.topCities.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[(i + 2) % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Price range + Top keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price range */}
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Khoảng giá được lọc nhiều</h2>
          {searchLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : !searches?.priceRangeCounts.length ? (
            <EmptyState message="Chưa có dữ liệu lọc giá" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={searches.priceRangeCounts} margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => [v, 'Lượt lọc']} />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top keywords */}
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Từ khóa tìm kiếm phổ biến</h2>
          {searchLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : !searches?.topKeywords.length ? (
            <EmptyState message="Chưa có từ khóa nào" />
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {searches.topKeywords.map((kw, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                    <span className="text-sm text-slate-700 truncate">{kw.label}</span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full ml-2">
                    {kw.count} lượt
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Page view trend */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Lượt truy cập trang theo ngày</h2>
        {pvLoading ? (
          <Skeleton className="h-56 rounded-xl" />
        ) : !pageViews?.dailyCounts.length ? (
          <EmptyState message="Chưa có dữ liệu truy cập trong khoảng thời gian này" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={pageViews.dailyCounts.map(d => ({ ...d, dateLabel: toLocaleDateShort(d.date) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [v, 'Lượt truy cập']} labelFormatter={(l) => `Ngày ${l}`} />
              <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top pages */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Trang được truy cập nhiều nhất</h2>
        {pvLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : !pageViews?.topPages.length ? (
          <EmptyState message="Chưa có dữ liệu" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">#</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Đường dẫn</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Lượt xem</th>
                </tr>
              </thead>
              <tbody>
                {pageViews.topPages.map((page, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="py-2.5 text-slate-400 text-xs w-8">{i + 1}</td>
                    <td className="py-2.5">
                      <span className="font-medium text-slate-700">
                        {PAGE_VI[page.label] ?? page.label}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">{page.label}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="font-semibold text-indigo-600">{page.count.toLocaleString('vi-VN')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Báo cáo tự động ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">📤 Báo cáo tự động hàng tuần</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gửi PDF báo cáo hành vi khách hàng đến guide có feature <code className="bg-slate-100 px-1 rounded">analytics.export</code>
            </p>
          </div>
          <Button
            onClick={() => setShowSendConfirm(true)}
            disabled={sendNowMutation.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {sendNowMutation.isPending ? 'Đang gửi...' : 'Gửi ngay'}
          </Button>
        </div>

        {scheduleLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="schedule-enabled"
                checked={scheduleForm.isEnabled}
                onCheckedChange={(v) => setScheduleForm((p) => ({ ...p, isEnabled: v }))}
              />
              <Label htmlFor="schedule-enabled" className="text-sm">
                {scheduleForm.isEnabled ? 'Đang bật — sẽ tự động gửi theo lịch' : 'Đang tắt — không tự động gửi'}
              </Label>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Ngày gửi trong tuần</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={scheduleForm.dayOfWeek}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, dayOfWeek: Number(e.target.value) }))}
                >
                  {DAY_LABELS.map((label, i) => (
                    <option key={i} value={i}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Giờ gửi (UTC+7, 0–23)</Label>
                <Input
                  type="number"
                  min={0} max={23}
                  className="h-9 w-24"
                  value={scheduleForm.hourUtc7}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(23, Number(e.target.value)))
                    setScheduleForm((p) => ({ ...p, hourUtc7: v }))
                  }}
                />
              </div>

              <Button
                variant="outline"
                disabled={updateScheduleMutation.isPending}
                onClick={() => updateScheduleMutation.mutate(scheduleForm)}
              >
                {updateScheduleMutation.isPending ? 'Đang lưu...' : 'Lưu lịch'}
              </Button>
            </div>

            {schedule && (
              <p className="text-xs text-slate-400">
                Lịch hiện tại: <strong>{DAY_LABELS[schedule.dayOfWeek]}</strong> lúc{' '}
                <strong>{String(schedule.hourUtc7).padStart(2, '0')}:00 (UTC+7)</strong>
                {' · '}Cập nhật lần cuối: {new Date(schedule.updatedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirm send now */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gửi báo cáo ngay?</AlertDialogTitle>
            <AlertDialogDescription>
              Hệ thống sẽ tạo PDF báo cáo hành vi khách hàng 7 ngày gần nhất và gửi email đến tất cả guide có feature <strong>analytics.export</strong>. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowSendConfirm(false); sendNowMutation.mutate() }}
            >
              Xác nhận gửi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
