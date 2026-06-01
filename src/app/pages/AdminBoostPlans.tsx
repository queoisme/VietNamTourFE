import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAdminBoostPlans,
  createAdminBoostPlan,
  updateAdminBoostPlan,
  deleteAdminBoostPlan,
} from '@/api/admin'
import { AdminBoostPlan, CreateAdminBoostPlanRequest } from '@/types/admin'
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
import { Plus, Trash2 } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type EditForm = { price: string; days: string; description: string; isActive: boolean }
type CreateForm = { plan: string; price: string; days: string; description: string }

const EMPTY_CREATE: CreateForm = { plan: '', price: '', days: '', description: '' }

// ── Component ────────────────────────────────────────────────────────────────

export function AdminBoostPlans() {
  const queryClient = useQueryClient()

  // Edit state
  const [selected, setSelected] = useState<AdminBoostPlan | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ price: '', days: '', description: '', isActive: true })

  // Create state
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE)

  // Delete confirm
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-boost-plans'],
    queryFn: getAdminBoostPlans,
  })

  // Mutations
  const editMutation = useMutation({
    mutationFn: () =>
      updateAdminBoostPlan(selected!.plan, {
        price: Number(editForm.price),
        days: Number(editForm.days),
        description: editForm.description.trim(),
        isActive: editForm.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-boost-plans'] })
      queryClient.invalidateQueries({ queryKey: ['boost-plans'] })
      toast.success('Đã cập nhật gói boost')
      setSelected(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminBoostPlanRequest) => createAdminBoostPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-boost-plans'] })
      queryClient.invalidateQueries({ queryKey: ['boost-plans'] })
      toast.success('Đã tạo gói boost mới')
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (plan: string) => deleteAdminBoostPlan(plan),
    onSuccess: (_, plan) => {
      queryClient.invalidateQueries({ queryKey: ['admin-boost-plans'] })
      queryClient.invalidateQueries({ queryKey: ['boost-plans'] })
      toast.success(`Đã vô hiệu hóa gói '${plan}'`)
      setPlanToDelete(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Stats
  const activePlans = useMemo(() => plans.filter(p => p.isActive), [plans])
  const totalValue  = useMemo(() => activePlans.reduce((s, p) => s + p.price, 0), [activePlans])

  // Handlers
  const openEditor = (plan: AdminBoostPlan) => {
    setSelected(plan)
    setEditForm({ price: String(plan.price), days: String(plan.durationDays), description: plan.description, isActive: plan.isActive })
  }

  const handleSave = () => {
    if (!selected) return
    if (!editForm.price || Number(editForm.price) <= 0) return toast.error('Giá phải lớn hơn 0')
    if (!editForm.days || Number(editForm.days) <= 0) return toast.error('Số ngày phải lớn hơn 0')
    editMutation.mutate()
  }

  const handleCreate = () => {
    const planKey = createForm.plan.trim().toLowerCase()
    if (!planKey) return toast.error('Nhập tên gói')
    if (!/^[a-z0-9_-]+$/.test(planKey)) return toast.error('Tên gói chỉ gồm chữ thường, số, _ hoặc -')
    if (!createForm.price || Number(createForm.price) <= 0) return toast.error('Giá phải lớn hơn 0')
    if (!createForm.days || Number(createForm.days) <= 0) return toast.error('Số ngày phải lớn hơn 0')
    createMutation.mutate({
      plan: planKey,
      price: Number(createForm.price),
      days: Number(createForm.days),
      description: createForm.description.trim(),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between rounded-2xl border bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold">Cấu hình gói Boost Tour</h1>
          <p className="mt-1 text-sm text-orange-100">
            Quản lý bảng giá, thời hạn và mô tả các gói boost đang bán cho hướng dẫn viên.
          </p>
        </div>
        <Button
          variant="secondary"
          className="mt-1 gap-2"
          onClick={() => setShowCreate(true)}
        >
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
            <p className="mt-1 text-2xl font-bold">
              {activePlans.length > 0 ? formatVND(totalValue / activePlans.length) : formatVND(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tổng giá trị gói đang bán</p>
            <p className="mt-1 text-2xl font-bold">{formatVND(totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói Boost</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Chưa có gói nào</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
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
                  <p className="mb-2 text-2xl font-bold text-orange-600">{formatVND(plan.price)}</p>
                  <p className="line-clamp-2 text-sm text-gray-600">{plan.description}</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => openEditor(plan)}>
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      disabled={false}
                      title="Vô hiệu hóa gói"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">Chỉnh sửa gói {selected?.plan}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div>
              <Label>Mô tả (hiển thị cho hướng dẫn viên)</Label>
              <Textarea className="mt-1" rows={3} value={editForm.description}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editForm.isActive}
                onCheckedChange={(v) => setEditForm(f => ({ ...f, isActive: v }))}
              />
              <Label>{editForm.isActive ? 'Đang bán' : 'Tạm dừng bán'}</Label>
            </div>
            <div className="rounded-lg border bg-orange-50 p-3 text-xs text-orange-700">
              <p className="font-medium">Lưu ý</p>
              <p className="mt-1">Thay đổi sẽ áp dụng cho các giao dịch boost mới. Các boost đã mua không bị ảnh hưởng.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Hủy</Button>
            <Button onClick={handleSave} disabled={editMutation.isPending} className="bg-orange-600 hover:bg-orange-700">
              {editMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); setCreateForm(EMPTY_CREATE) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm gói Boost mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên gói (slug)</Label>
              <Input placeholder="vd: gold, platinum..." value={createForm.plan}
                onChange={(e) => setCreateForm(f => ({ ...f, plan: e.target.value.toLowerCase() }))} className="mt-1" />
              <p className="mt-1 text-xs text-gray-500">Chỉ dùng chữ thường, số, dấu _ hoặc -. Không thể thay đổi sau khi tạo.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Giá (VND)</Label>
                <Input type="number" min={1} placeholder="vd: 150000" value={createForm.price}
                  onChange={(e) => setCreateForm(f => ({ ...f, price: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Số ngày</Label>
                <Input type="number" min={1} placeholder="vd: 5" value={createForm.days}
                  onChange={(e) => setCreateForm(f => ({ ...f, days: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Mô tả quyền lợi</Label>
              <Textarea className="mt-1" rows={3} placeholder="vd: Gold border, priority listing, 5 days"
                value={createForm.description}
                onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setCreateForm(EMPTY_CREATE) }}>Hủy</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-orange-600 hover:bg-orange-700">
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
              Gói sẽ không còn hiển thị để hướng dẫn viên mua. Các boost đã mua trước đây không bị ảnh hưởng.
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
