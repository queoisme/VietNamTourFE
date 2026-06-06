import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { getAdminTours, updateAdminTourStatus } from '@/api/admin'
import { formatVND } from '@/lib/constants'
import { AdminPager } from '../components/AdminPager'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'

export function AdminTours() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tours', status, page, size],
    queryFn: () =>
      getAdminTours({
        status: status === 'all' ? undefined : status,
        page,
        size,
      }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) => updateAdminTourStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tours'] })
      toast.success('Đã cập nhật trạng thái tour')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const tours = data?.items ?? []
  const meta = data?.meta

  const pageStats = useMemo(
    () => ({
      active: tours.filter((t) => t.status === 'active').length,
      inactive: tours.filter((t) => t.status === 'inactive').length,
      draft: tours.filter((t) => t.status === 'draft').length,
    }),
    [tours],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-indigo-800 p-6 text-white">
        <h1 className="text-2xl font-bold">Quản lý tour</h1>
        <p className="mt-1 text-sm text-slate-200">
          Kiểm soát chất lượng nội dung, trạng thái phát hành và hiệu suất hoạt động tour.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tổng kết quả" value={meta?.total ?? 0} />
        <StatCard label="Hoạt động (trang hiện tại)" value={pageStats.active} color="text-emerald-600" />
        <StatCard label="Tạm dừng (trang hiện tại)" value={pageStats.inactive} color="text-amber-600" />
        <StatCard label="Nháp (trang hiện tại)" value={pageStats.draft} color="text-slate-600" />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-600">Trạng thái</p>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Tạm dừng</SelectItem>
              <SelectItem value="draft">Nháp</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left font-medium">Tour</th>
                  <th className="hidden p-3 text-left font-medium md:table-cell">HDV</th>
                  <th className="p-3 text-left font-medium">Giá</th>
                  <th className="p-3 text-left font-medium">Trạng thái</th>
                  <th className="p-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tours.map((tour) => (
                  <tr key={tour.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div>
                        <p className="line-clamp-1 font-medium">{tour.title}</p>
                        <p className="text-xs text-gray-500">
                          {tour.locationCity} · <Star className="inline size-3 fill-yellow-400 text-yellow-400" /> {tour.avgRating.toFixed(1)}
                        </p>
                      </div>
                    </td>
                    <td className="hidden p-3 text-gray-600 md:table-cell">{tour.guideName}</td>
                    <td className="p-3 font-medium">{formatVND(tour.pricePerPerson)}</td>
                    <td className="p-3">
                      <Badge variant={tour.status === 'active' ? 'default' : 'secondary'}>
                        {tour.status === 'active' ? 'Hoạt động' : tour.status === 'draft' ? 'Nháp' : 'Tạm dừng'}
                      </Badge>
                      {tour.isBoosted && <Badge className="ml-1 bg-yellow-500">⚡ Boost</Badge>}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/tours/${tour.id}`}>Xem</Link>
                        </Button>
                        {tour.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ id: tour.id, newStatus: 'inactive' })}
                          >
                            Tạm dừng
                          </Button>
                        ) : tour.status !== 'draft' ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={statusMutation.isPending}
                            onClick={() => statusMutation.mutate({ id: tour.id, newStatus: 'active' })}
                          >
                            Kích hoạt
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tours.length === 0 && <div className="py-12 text-center text-gray-500">Không tìm thấy tour</div>}
          </div>

          {meta && meta.total > 0 && (
            <div className="rounded-xl border bg-white p-4">
              <AdminPager
                page={meta.page}
                size={meta.size}
                total={meta.total}
                onPageChange={setPage}
                onSizeChange={setSize}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, color = 'text-slate-900' }: { label: string; value: number; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
