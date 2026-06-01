import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAdminSubscriptionPlans,
  createAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
  deleteAdminSubscriptionPlan,
} from '@/api/admin'
import { AdminSubscriptionPlan, CreateAdminSubscriptionPlanRequest } from '@/types/admin'
import { formatVND } from '@/lib/constants'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
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
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Skeleton } from '../components/ui/skeleton'
import { Switch } from '../components/ui/switch'
import { Textarea } from '../components/ui/textarea'
import { Checkbox } from '../components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type EditForm = {
  price: string
  days: string
  description: string
  isActive: boolean
  commissionRate: string   // stored as percent string, e.g. "10"
  maxActiveTours: string   // "" means unlimited
  unlimitedTours: boolean
}

type CreateForm = {
  plan: string
  price: string
  days: string
  description: string
  commissionRate: string
  maxActiveTours: string
  unlimitedTours: boolean
}

const EMPTY_CREATE: CreateForm = {
  plan: '', price: '', days: '', description: '',
  commissionRate: '15', maxActiveTours: '', unlimitedTours: true,
}

// ── Component ────────────────────────────────────────────────────────────────

export function AdminSubscriptions() {
  const queryClient = useQueryClient()

  const [selected, setSelected] = useState<AdminSubscriptionPlan | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    price: '', days: '', description: '', isActive: true,
    commissionRate: '15', maxActiveTours: '', unlimitedTours: true,
  })

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE)

  const [planToDelete, setPlanToDelete] = useState<string | null>(null)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: getAdminSubscriptionPlans,
  })

  // Mutations
  const editMutation = useMutation({
    mutationFn: () => {
      const isFree = selected!.price === 0
      return updateAdminSubscriptionPlan(selected!.plan, {
        // Gói free (price=0): không gửi price/days/isActive — backend giữ nguyên
        ...(isFree ? {} : {
          price: Number(editForm.price),
          days: Number(editForm.days),
          isActive: editForm.isActive,
        }),
        description: editForm.description.trim(),
        commissionRate: Number(editForm.commissionRate) / 100,
        maxActiveTours: editForm.unlimitedTours ? null : Number(editForm.maxActiveTours) || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      toast.success('Đã cập nhật gói subscription')
      setSelected(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminSubscriptionPlanRequest) => createAdminSubscriptionPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      toast.success('Đã tạo gói subscription mới')
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (plan: string) => deleteAdminSubscriptionPlan(plan),
    onSuccess: (_, plan) => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] })
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })
      toast.success(`Đã vô hiệu hóa gói '${plan}'`)
      setPlanToDelete(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Stats
  const activePlans = useMemo(() => plans.filter(p => p.isActive && p.price > 0), [plans])
  const avgPrice    = useMemo(
    () => activePlans.length > 0 ? activePlans.reduce((s, p) => s + p.price, 0) / activePlans.length : 0,
    [activePlans],
  )

  // Handlers
  const openEditor = (plan: AdminSubscriptionPlan) => {
    setSelected(plan)
    setEditForm({
      price: String(plan.price),
      days: String(plan.durationDays),
      description: plan.description,
      isActive: plan.isActive,
      commissionRate: String(Math.round(plan.commissionRate * 100)),
      maxActiveTours: plan.maxActiveTours != null ? String(plan.maxActiveTours) : '',
      unlimitedTours: plan.maxActiveTours == null,
    })
  }

  const handleSave = () => {
    if (!selected) return
    // Chỉ validate price/days khi không phải gói free (price > 0)
    if (selected.price !== 0) {
      if (!editForm.price || Number(editForm.price) <= 0) return toast.error('Giá phải lớn hơn 0')
      if (!editForm.days || Number(editForm.days) <= 0) return toast.error('Số ngày phải lớn hơn 0')
    }
    const rate = Number(editForm.commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) return toast.error('Hoa hồng phải từ 0–100%')
    editMutation.mutate()
  }

  const handleCreate = () => {
    const planKey = createForm.plan.trim().toLowerCase()
    if (!planKey) return toast.error('Nhập tên gói')
    if (!/^[a-z0-9_-]+$/.test(planKey)) return toast.error('Tên gói chỉ gồm chữ thường, số, _ hoặc -')
    if (!createForm.price || Number(createForm.price) <= 0) return toast.error('Giá phải lớn hơn 0')
    if (!createForm.days || Number(createForm.days) <= 0) return toast.error('Số ngày phải lớn hơn 0')
    const rate = Number(createForm.commissionRate)
    if (isNaN(rate) || rate < 0 || rate > 100) return toast.error('Hoa hồng phải từ 0–100%')
    createMutation.mutate({
      plan: planKey,
      price: Number(createForm.price),
      days: Number(createForm.days),
      description: createForm.description.trim(),
      commissionRate: rate / 100,
      maxActiveTours: createForm.unlimitedTours ? null : (Number(createForm.maxActiveTours) || null),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold">Cấu hình gói Subscription</h1>
          <p className="mt-1 text-sm text-slate-200">
            Quản lý bảng giá, hoa hồng và quyền lợi các gói đang bán cho hướng dẫn viên.
          </p>
        </div>
        <Button variant="secondary" className="mt-1 gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Thêm gói mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tổng số gói</p>
            <p className="mt-1 text-2xl font-bold">{plans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Giá trung bình (đang bán)</p>
            <p className="mt-1 text-2xl font-bold">{formatVND(avgPrice)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Gói đang bán</p>
            <p className="mt-1 text-2xl font-bold">{activePlans.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan List */}
      <Card>
        <CardHeader><CardTitle>Danh sách gói</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Chưa có gói nào</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <div
                  key={plan.plan}
                  className={`rounded-xl border p-4 transition hover:shadow-sm ${!plan.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold capitalize">{plan.plan}</p>
                      <p className="text-sm text-gray-500">{plan.durationDays} ngày</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                        {plan.isActive ? 'Đang bán' : 'Tạm dừng'}
                      </Badge>
                      {plan.isSystem && (
                        <Badge variant="outline" className="text-xs text-gray-500">Hệ thống</Badge>
                      )}
                    </div>
                  </div>
                  <p className="mb-2 text-2xl font-bold text-emerald-600">
                    {plan.price > 0 ? formatVND(plan.price) : 'Miễn phí'}
                  </p>
                  <div className="mb-2 flex gap-4 text-sm text-gray-600">
                    <span>Hoa hồng: <strong>{Math.round(plan.commissionRate * 100)}%</strong></span>
                    <span>Tour tối đa: <strong>{plan.maxActiveTours ?? 'Không giới hạn'}</strong></span>
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => openEditor(plan)}>
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      disabled={plan.isSystem}
                      title={plan.isSystem ? 'Không thể xóa gói hệ thống' : 'Vô hiệu hóa gói'}
                      onClick={() => setPlanToDelete(plan.plan)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">Chỉnh sửa gói {selected?.plan}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Ẩn giá/số ngày chỉ khi price = 0 (gói free), các gói khác vẫn sửa được */}
            {selected?.price !== 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Giá (VND)</Label>
                  <Input type="number" min={1} value={editForm.price}
                    onChange={(e) => setEditForm(f => ({ ...f, price: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Số ngày</Label>
                  <Input type="number" min={1} value={editForm.days}
                    onChange={(e) => setEditForm(f => ({ ...f, days: e.target.value }))} className="mt-1" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hoa hồng (%)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={editForm.commissionRate}
                  onChange={(e) => setEditForm(f => ({ ...f, commissionRate: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Tour tối đa</Label>
                <Input type="number" min={1} value={editForm.maxActiveTours}
                  disabled={editForm.unlimitedTours}
                  onChange={(e) => setEditForm(f => ({ ...f, maxActiveTours: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-unlimited"
                checked={editForm.unlimitedTours}
                onCheckedChange={(v) => setEditForm(f => ({ ...f, unlimitedTours: !!v, maxActiveTours: '' }))}
              />
              <label htmlFor="edit-unlimited" className="text-sm">Không giới hạn số tour</label>
            </div>
            <div>
              <Label>Mô tả quyền lợi</Label>
              <Textarea className="mt-1" rows={3} value={editForm.description}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            {/* Gói free (price=0) luôn active, không cho toggle trạng thái bán */}
            {selected?.price !== 0 && (
              <div className="flex items-center gap-3">
                <Switch checked={editForm.isActive}
                  onCheckedChange={(v) => setEditForm(f => ({ ...f, isActive: v }))} />
                <Label>{editForm.isActive ? 'Đang bán' : 'Tạm dừng bán'}</Label>
              </div>
            )}
            {selected?.price === 0 && (
              <p className="text-xs text-gray-500 italic">
                Gói miễn phí — không thể thay đổi giá, số ngày hoặc trạng thái bán.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Hủy</Button>
            <Button onClick={handleSave} disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); setCreateForm(EMPTY_CREATE) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm gói Subscription mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên gói (slug)</Label>
              <Input placeholder="vd: enterprise, starter..." value={createForm.plan}
                onChange={(e) => setCreateForm(f => ({ ...f, plan: e.target.value.toLowerCase() }))} className="mt-1" />
              <p className="mt-1 text-xs text-gray-500">Chỉ dùng chữ thường, số, _ hoặc -. Không thể thay đổi sau khi tạo.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Giá (VND)</Label>
                <Input type="number" min={1} placeholder="vd: 499000" value={createForm.price}
                  onChange={(e) => setCreateForm(f => ({ ...f, price: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Số ngày</Label>
                <Input type="number" min={1} placeholder="vd: 30" value={createForm.days}
                  onChange={(e) => setCreateForm(f => ({ ...f, days: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hoa hồng (%)</Label>
                <Input type="number" min={0} max={100} step={0.5} value={createForm.commissionRate}
                  onChange={(e) => setCreateForm(f => ({ ...f, commissionRate: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Tour tối đa</Label>
                <Input type="number" min={1} value={createForm.maxActiveTours}
                  disabled={createForm.unlimitedTours}
                  onChange={(e) => setCreateForm(f => ({ ...f, maxActiveTours: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="create-unlimited"
                checked={createForm.unlimitedTours}
                onCheckedChange={(v) => setCreateForm(f => ({ ...f, unlimitedTours: !!v, maxActiveTours: '' }))}
              />
              <label htmlFor="create-unlimited" className="text-sm">Không giới hạn số tour</label>
            </div>
            <div>
              <Label>Mô tả quyền lợi</Label>
              <Textarea className="mt-1" rows={3} placeholder="vd: 12% commission, unlimited tours, priority support"
                value={createForm.description}
                onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE) }}>Hủy</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo gói'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vô hiệu hóa gói '{planToDelete}'?</AlertDialogTitle>
            <AlertDialogDescription>
              Gói sẽ không còn hiển thị để hướng dẫn viên mua. Các subscription đã mua không bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => planToDelete && deleteMutation.mutate(planToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xử lý...' : 'Vô hiệu hóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
