import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { banUser, getAdminUser, getAdminUsers } from '@/api/admin'
import { AdminUser } from '@/types/admin'
import { formatDate } from '@/lib/constants'
import { AdminPager } from '../components/AdminPager'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'

export function AdminUsers() {
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null)
  const [banReason, setBanReason] = useState('')
  const [detailUserId, setDetailUserId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, role, page, size],
    queryFn: () =>
      getAdminUsers({
        q: q || undefined,
        role: role === 'all' ? undefined : role,
        page,
        size,
      }),
  })

  const { data: detailUser, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-user-detail', detailUserId],
    queryFn: () => getAdminUser(detailUserId!),
    enabled: !!detailUserId,
  })

  const banMutation = useMutation({
    mutationFn: (user: AdminUser) =>
      banUser(user.id, {
        isBanned: !user.isBanned,
        reason: !user.isBanned ? banReason.trim() || undefined : undefined,
      }),
    onSuccess: (_, user) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] })
      setBanTarget(null)
      setBanReason('')
      toast.success(user.isBanned ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const users = data?.items ?? []
  const meta = data?.meta

  const activeCount = useMemo(() => users.filter((u) => !u.isBanned).length, [users])
  const bannedCount = useMemo(() => users.filter((u) => u.isBanned).length, [users])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-indigo-800 p-6 text-white">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <p className="mt-1 text-sm text-slate-200">
          Theo dõi tài khoản, xem chi tiết hồ sơ và khóa/mở khóa theo chính sách hệ thống.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tổng kết quả</p>
            <p className="mt-1 text-2xl font-bold">{meta?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Hoạt động (trang hiện tại)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Bị khóa (trang hiện tại)</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{bannedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-56 flex-1">
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="customer">Khách hàng</SelectItem>
              <SelectItem value="guide">Hướng dẫn viên</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
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
                  <th className="p-3 text-left font-medium">Người dùng</th>
                  <th className="p-3 text-left font-medium">Vai trò</th>
                  <th className="hidden p-3 text-left font-medium md:table-cell">Ngày tham gia</th>
                  <th className="p-3 text-left font-medium">Trạng thái</th>
                  <th className="p-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName} className="size-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                            {user.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'guide' ? 'HDV' : 'Khách'}
                      </Badge>
                    </td>
                    <td className="hidden p-3 text-gray-500 md:table-cell">{formatDate(user.createdAt)}</td>
                    <td className="p-3">
                      <Badge variant={user.isBanned ? 'destructive' : 'secondary'}>
                        {user.isBanned ? 'Bị khóa' : 'Hoạt động'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setDetailUserId(user.id)}>
                          Chi tiết
                        </Button>
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant={user.isBanned ? 'outline' : 'destructive'}
                            onClick={() => setBanTarget(user)}
                          >
                            {user.isBanned ? 'Mở khóa' : 'Khóa'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="py-12 text-center text-gray-500">Không tìm thấy người dùng</div>}
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

      <AlertDialog
        open={!!banTarget}
        onOpenChange={(open) => {
          if (!open) {
            setBanTarget(null)
            setBanReason('')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{banTarget?.isBanned ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {banTarget?.isBanned
                ? `Mở khóa tài khoản của "${banTarget.fullName}".`
                : `Khóa tài khoản của "${banTarget?.fullName}". Người dùng sẽ không thể đăng nhập.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!banTarget?.isBanned && (
            <div>
              <p className="mb-1 text-xs font-medium text-gray-600">Lý do khóa (không bắt buộc)</p>
              <Textarea
                rows={3}
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ví dụ: vi phạm chính sách nội dung..."
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => banMutation.mutate(banTarget!)}>
              {banTarget?.isBanned ? 'Xác nhận mở khóa' : 'Xác nhận khóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!detailUserId} onOpenChange={(open) => !open && setDetailUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
          </DialogHeader>
          {detailLoading || !detailUser ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3">
                {detailUser.avatarUrl ? (
                  <img src={detailUser.avatarUrl} alt={detailUser.fullName} className="size-12 rounded-full object-cover" />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {detailUser.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{detailUser.fullName}</p>
                  <p className="text-xs text-gray-500">{detailUser.email}</p>
                </div>
              </div>
              <DetailRow label="Vai trò" value={detailUser.role} />
              <DetailRow label="Số điện thoại" value={detailUser.phone || '-'} />
              <DetailRow label="Xác thực email" value={detailUser.isVerified ? 'Đã xác thực' : 'Chưa xác thực'} />
              <DetailRow label="Trạng thái" value={detailUser.isBanned ? 'Bị khóa' : 'Hoạt động'} />
              {detailUser.banReason && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">
                  <p className="mb-1 text-xs font-semibold uppercase">Lý do khóa</p>
                  <p>{detailUser.banReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  )
}
