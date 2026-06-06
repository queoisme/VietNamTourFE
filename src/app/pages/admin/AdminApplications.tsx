import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { approveApplication, getAdminApplication, getAdminApplications, rejectApplication } from '@/api/guide-applications'
import { formatDate } from '@/lib/constants'
import { GuideApplication } from '@/types/guide-application'
import { AdminPager } from '../../components/AdminPager'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Skeleton } from '../../components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Textarea } from '../../components/ui/textarea'

export function AdminApplications() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('pending')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(20)
  const [selected, setSelected] = useState<GuideApplication | null>(null)
  const [rejectTarget, setRejectTarget] = useState<GuideApplication | null>(null)
  const [approveTarget, setApproveTarget] = useState<GuideApplication | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-applications', tab, page, size],
    queryFn: () => getAdminApplications({ status: tab, page, size }),
  })

  // Fetch detail with signed identity doc URL when dialog opens
  const { data: selectedDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-application-detail', selected?.id],
    queryFn: () => getAdminApplication(selected!.id),
    enabled: !!selected,
    staleTime: 10 * 60 * 1000, // signed URL TTL is 15min, cache 10min
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      setApproveTarget(null)
      toast.success('Đã duyệt hồ sơ hướng dẫn viên')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) => rejectApplication(id, { rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      setRejectTarget(null)
      setRejectReason('')
      toast.success('Đã từ chối hồ sơ')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const applications = data?.items ?? []
  const meta = data?.meta
  const stats = useMemo(
    () => ({
      total: meta?.total ?? 0,
      approved: applications.filter((a) => a.status === 'approved').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
      pending: applications.filter((a) => a.status === 'pending').length,
    }),
    [applications, meta?.total],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-indigo-800 p-6 text-white">
        <h1 className="text-2xl font-bold">Hồ sơ đăng ký hướng dẫn viên</h1>
        <p className="mt-1 text-sm text-slate-200">
          Đánh giá hồ sơ ứng tuyển, xác minh thông tin và phản hồi minh bạch cho ứng viên.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tổng kết quả</p>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Chờ duyệt (trang hiện tại)</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Đã duyệt (trang hiện tại)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Từ chối (trang hiện tại)</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v)
            setPage(1)
          }}
        >
          <TabsList>
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center text-gray-500">Không có hồ sơ nào</div>
      ) : (
        <>
          <div className="space-y-4">
            {applications.map((app) => (
              <article key={app.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {app.applicantAvatarUrl ? (
                      <img src={app.applicantAvatarUrl} alt={app.fullName} className="size-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                        {app.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold">{app.fullName}</p>
                      <p className="text-sm text-gray-500">{app.applicantEmail}</p>
                      <p className="text-sm text-gray-500">
                        {app.phone} · {app.location}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">Nộp: {formatDate(app.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        app.status === 'approved'
                          ? 'secondary'
                          : app.status === 'rejected'
                            ? 'destructive'
                            : 'outline'
                      }
                    >
                      {app.status === 'pending' ? 'Chờ duyệt' : app.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => setSelected(app)}>
                      Xem chi tiết
                    </Button>
                    {app.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setApproveTarget(app)}>
                          Duyệt
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setRejectTarget(app); setRejectReason('') }}>
                          Từ chối
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {app.rejectionReason && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <strong>Lý do từ chối:</strong> {app.rejectionReason}
                  </div>
                )}
              </article>
            ))}
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

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hồ sơ: {selected?.fullName}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div>
                <strong>Bio:</strong>
                <p className="mt-1 text-gray-700">{selected.bio}</p>
              </div>
              <div>
                <strong>Kinh nghiệm:</strong> {selected.experienceYears} năm
              </div>
              <div>
                <strong>Ngôn ngữ:</strong> {selected.languages.join(', ')}
              </div>
              <div>
                <strong>Khu vực:</strong> {selected.location || 'Không có'}
              </div>
              {selected.certifications.length > 0 && (
                <div>
                  <strong>Chứng chỉ:</strong>
                  <ul className="mt-1 space-y-1">
                    {selected.certifications.map((cert, i) => (
                      <li key={i} className="text-gray-700">
                        • {cert.name} - {cert.issuedBy} ({cert.year})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <strong>CMND/CCCD:</strong>{' '}
                {detailLoading ? (
                  <span className="text-gray-400 italic">Đang tải link...</span>
                ) : selectedDetail?.identityDocUrl ? (
                  <a
                    href={selectedDetail.identityDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    Xem tài liệu ↗
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Không có</span>
                )}
              </div>
              {selectedDetail?.certificateUrls && selectedDetail.certificateUrls.length > 0 && (
                <div>
                  <strong>Tài liệu chứng chỉ:</strong>
                  <ul className="mt-1 space-y-1">
                    {selectedDetail.certificateUrls.map((url, i) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          Chứng chỉ {i + 1} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyệt hồ sơ?</AlertDialogTitle>
            <AlertDialogDescription>
              Duyệt hồ sơ của &quot;{approveTarget?.fullName}&quot;. Ứng viên sẽ trở thành hướng dẫn viên trên hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-emerald-600 hover:bg-emerald-700" onClick={() => approveMutation.mutate(approveTarget!.id)}>
              Duyệt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối hồ sơ</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Lý do từ chối (sẽ gửi đến người nộp)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <Button
            onClick={() => rejectMutation.mutate({ id: rejectTarget!.id, rejectionReason: rejectReason })}
            disabled={!rejectReason.trim() || rejectMutation.isPending}
            variant="destructive"
            className="w-full"
          >
            {rejectMutation.isPending ? 'Đang xử lý...' : 'Từ chối hồ sơ'}
          </Button>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Ghi chú vận hành</p>
        <p className="mt-1">
          Khi từ chối, nên ghi rõ lý do để ứng viên có thể bổ sung hồ sơ chính xác hơn ở lần đăng ký sau.
        </p>
      </div>
    </div>
  )
}
