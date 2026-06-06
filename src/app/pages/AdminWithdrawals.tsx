import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { approveWithdrawal, completeWithdrawal, getAdminWithdrawals, rejectWithdrawal } from '@/api/admin'
import { AdminWithdrawal } from '@/types/admin'
import { formatDate, formatVND } from '@/lib/constants'
import { AdminPager } from '../components/AdminPager'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'

function AccountInfoDisplay({ raw }: { raw: string }) {
  try {
    const info = JSON.parse(raw)
    if (info.accountNo) {
      return (
        <div className="mt-1 space-y-0.5 text-xs text-gray-500">
          <p>STK: {info.accountNo}</p>
          <p>{info.accountName}</p>
          <p>{info.bankName}</p>
        </div>
      )
    }
    if (info.phone) {
      return <p className="mt-1 text-xs text-gray-500">{info.phone}</p>
    }
  } catch {
    // raw string fallback
  }
  return <p className="mt-1 line-clamp-2 text-xs text-gray-500">{raw}</p>
}

function statusLabel(status: string) {
  if (status === 'pending') return 'Chờ duyệt'
  if (status === 'approved') return 'Đã duyệt'
  if (status === 'rejected') return 'Từ chối'
  if (status === 'completed') return 'Hoàn tất'
  return status
}

export function AdminWithdrawals() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [rejectTarget, setRejectTarget] = useState<AdminWithdrawal | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-withdrawals', status, page, size],
    queryFn: () =>
      getAdminWithdrawals({
        status: status === 'all' ? undefined : status,
        page,
        size,
      }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      toast.success('Đã duyệt yêu cầu rút tiền')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => completeWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      toast.success('Đã đánh dấu hoàn tất')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) => rejectWithdrawal(id, { adminNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] })
      setRejectTarget(null)
      setRejectNote('')
      toast.success('Đã từ chối yêu cầu rút tiền')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const withdrawals = data?.items ?? []
  const meta = data?.meta
  const pending = withdrawals.filter((w) => w.status === 'pending').length
  const processed = withdrawals.filter((w) => ['approved', 'completed'].includes(w.status)).length
  const rejected = withdrawals.filter((w) => w.status === 'rejected').length

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-indigo-800 p-6 text-white">
        <h1 className="text-2xl font-bold">Duyệt rút tiền</h1>
        <p className="mt-1 text-sm text-slate-200">
          Xử lý yêu cầu rút tiền của hướng dẫn viên, theo dõi ghi chú đối soát và trạng thái thanh toán.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tổng kết quả</p>
            <p className="mt-1 text-2xl font-bold">{meta?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Chờ duyệt (trang hiện tại)</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Đã xử lý (trang hiện tại)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{processed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Từ chối (trang hiện tại)</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{rejected}</p>
          </CardContent>
        </Card>
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
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
              <SelectItem value="completed">Hoàn tất</SelectItem>
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
                  <th className="p-3 text-left font-medium">Hướng dẫn viên</th>
                  <th className="p-3 text-left font-medium">Số tiền</th>
                  <th className="hidden p-3 text-left font-medium md:table-cell">Phương thức</th>
                  <th className="p-3 text-left font-medium">Trạng thái</th>
                  <th className="p-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <p className="font-medium">{w.guideName}</p>
                      <p className="text-xs text-gray-500">{w.guideEmail}</p>
                      <p className="text-xs text-gray-400">Tạo: {formatDate(w.createdAt)}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold">{formatVND(w.amount)}</p>
                      <p className="text-xs text-gray-500">Thực nhận: {formatVND(w.netAmount)}</p>
                    </td>
                    <td className="hidden p-3 text-gray-600 md:table-cell">
                      <p className="capitalize font-medium">{w.method}</p>
                      <AccountInfoDisplay raw={w.accountInfo} />
                    </td>
                    <td className="p-3">
                      <Badge variant={w.status === 'rejected' ? 'destructive' : w.status === 'pending' ? 'outline' : 'secondary'}>
                        {statusLabel(w.status)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        {w.status === 'pending' && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => approveMutation.mutate(w.id)} disabled={approveMutation.isPending}>
                              Duyệt
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setRejectTarget(w)}>
                              Từ chối
                            </Button>
                          </>
                        )}
                        {w.status === 'approved' && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => completeMutation.mutate(w.id)} disabled={completeMutation.isPending}>
                            Hoàn tất
                          </Button>
                        )}
                        {(w.status === 'completed' || w.status === 'rejected') && (
                          <span className="text-xs text-gray-500">Đã xử lý</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {withdrawals.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                Không có yêu cầu rút tiền.
              </div>
            )}
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

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu rút tiền</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder="Nhập ghi chú lý do từ chối..."
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
          <Button
            variant="destructive"
            onClick={() => rejectMutation.mutate({ id: rejectTarget!.id, adminNote: rejectNote.trim() || undefined })}
            disabled={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
