import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getAdminFeatures,
  createAdminFeature,
  updateAdminFeature,
  deleteAdminFeature,
  getAdminPlanFeatures,
  assignFeatureToPlan,
  removeFeatureFromPlan,
} from '@/api/features'
import { getAdminSubscriptionPlans } from '@/api/admin'
import type { Feature, CreateFeatureRequest, UpdateFeatureRequest } from '@/types/feature'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ChevronRight, Plus, Puzzle, Trash2 } from 'lucide-react'
import { cn } from '../components/ui/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type CreateForm = { key: string; name: string; description: string }
type EditForm   = { name: string; description: string; isActive: boolean }

const EMPTY_CREATE: CreateForm = { key: '', name: '', description: '' }
const KEY_REGEX = /^[a-z0-9]+(\.[a-z0-9_]+)*$/

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminFeatures() {
  const queryClient = useQueryClient()

  // ── Feature registry state ──────────────────────────────────────────────────
  const [showCreate, setShowCreate]     = useState(false)
  const [createForm, setCreateForm]     = useState<CreateForm>(EMPTY_CREATE)
  const [editTarget, setEditTarget]     = useState<Feature | null>(null)
  const [editForm, setEditForm]         = useState<EditForm>({ name: '', description: '', isActive: true })
  const [deleteTarget, setDeleteTarget] = useState<Feature | null>(null)

  // ── Plan features state ─────────────────────────────────────────────────────
  const [expandedPlan, setExpandedPlan]   = useState<string | null>(null)
  const [selectedToAdd, setSelectedToAdd] = useState('')

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: features = [], isLoading: featuresLoading } = useQuery({
    queryKey: ['admin-features'],
    queryFn:  getAdminFeatures,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn:  getAdminSubscriptionPlans,
    staleTime: 5 * 60 * 1000,
  })

  const { data: planFeaturesData } = useQuery({
    queryKey: ['admin-plan-features', expandedPlan],
    queryFn:  () => getAdminPlanFeatures(expandedPlan!),
    enabled:  !!expandedPlan,
  })

  // ── Computed ─────────────────────────────────────────────────────────────────
  const assignedIds       = new Set(planFeaturesData?.features.map((f) => f.id) ?? [])
  const unassignedFeatures = features.filter((f) => f.isActive && !assignedIds.has(f.id))

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: CreateFeatureRequest) => createAdminFeature(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-features'] })
      toast.success('Đã tạo feature mới')
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const editMutation = useMutation({
    mutationFn: () =>
      updateAdminFeature(editTarget!.id, {
        name:        editForm.name.trim()        || undefined,
        description: editForm.description.trim() || undefined,
        isActive:    editForm.isActive,
      } satisfies UpdateFeatureRequest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-features'] })
      if (expandedPlan) queryClient.invalidateQueries({ queryKey: ['admin-plan-features', expandedPlan] })
      toast.success('Đã cập nhật feature')
      setEditTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-features'] })
      if (expandedPlan) queryClient.invalidateQueries({ queryKey: ['admin-plan-features', expandedPlan] })
      toast.success('Đã xóa feature')
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const assignMutation = useMutation({
    mutationFn: ({ plan, featureId }: { plan: string; featureId: string }) =>
      assignFeatureToPlan(plan, { featureId }),
    onSuccess: (_, { plan }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-plan-features', plan] })
      setSelectedToAdd('')
      toast.success('Đã gán feature vào gói')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const unassignMutation = useMutation({
    mutationFn: ({ plan, featureId }: { plan: string; featureId: string }) =>
      removeFeatureFromPlan(plan, featureId),
    onSuccess: (_, { plan }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-plan-features', plan] })
      toast.success('Đã gỡ feature khỏi gói')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function openEditor(f: Feature) {
    setEditTarget(f)
    setEditForm({ name: f.name, description: f.description, isActive: f.isActive })
  }

  function handleCreate() {
    const key = createForm.key.trim()
    if (!KEY_REGEX.test(key)) {
      toast.error("Key phải là chữ thường dạng dot-namespaced, ví dụ: 'analytics.tour_clicks'")
      return
    }
    if (!createForm.name.trim()) { toast.error('Tên không được để trống'); return }
    createMutation.mutate({ key, name: createForm.name.trim(), description: createForm.description.trim() })
  }

  function togglePlan(plan: string) {
    setExpandedPlan((prev) => {
      if (prev === plan) return null
      setSelectedToAdd('')
      return plan
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Puzzle className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Quản lý Tính năng</h1>
              <p className="text-violet-200 text-sm mt-1">
                Tạo feature flags và gán vào các gói subscription
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-white text-violet-700 hover:bg-violet-50"
          >
            <Plus className="h-4 w-4 mr-2" /> Thêm Feature
          </Button>
        </div>
      </div>

      {/* ── Section 1: Feature Registry ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature Registry</CardTitle>
        </CardHeader>
        <CardContent>
          {featuresLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : features.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Chưa có feature nào. Thêm feature đầu tiên.</p>
          ) : (
            <div className="space-y-2">
              {features.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{f.name}</span>
                      <Badge variant={f.isActive ? 'default' : 'secondary'} className="text-xs">
                        {f.isActive ? 'Hoạt động' : 'Tắt'}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{f.key}</p>
                    {f.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{f.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEditor(f)}>
                      Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-700 hover:border-red-300"
                      onClick={() => setDeleteTarget(f)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Plan Features ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tính năng theo gói</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">Chưa có gói subscription nào.</p>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.plan} className="rounded-xl border overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => togglePlan(plan.plan)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold capitalize text-sm">{plan.plan}</span>
                      <Badge variant="outline" className="text-xs">
                        {plan.isActive ? 'Đang hoạt động' : 'Tắt'}
                      </Badge>
                    </div>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 text-gray-400 transition-transform duration-200',
                        expandedPlan === plan.plan && 'rotate-90',
                      )}
                    />
                  </button>

                  {expandedPlan === plan.plan && (
                    <div className="border-t px-4 py-4 space-y-3 bg-gray-50/50">
                      {/* Assigned features */}
                      {planFeaturesData == null ? (
                        <Skeleton className="h-10 w-full rounded-lg" />
                      ) : planFeaturesData.features.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Chưa có tính năng nào được gán.</p>
                      ) : (
                        planFeaturesData.features.map((f) => (
                          <div key={f.id} className="flex items-center justify-between rounded-lg bg-white border px-3 py-2">
                            <div>
                              <span className="text-sm font-medium">{f.name}</span>
                              <p className="text-xs font-mono text-gray-400">{f.key}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              disabled={unassignMutation.isPending}
                              onClick={() => unassignMutation.mutate({ plan: plan.plan, featureId: f.id })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))
                      )}

                      {/* Add unassigned feature */}
                      {unassignedFeatures.length > 0 && (
                        <div className="flex gap-2 pt-1">
                          <Select value={selectedToAdd} onValueChange={setSelectedToAdd}>
                            <SelectTrigger className="h-8 text-xs flex-1 bg-white">
                              <SelectValue placeholder="Chọn tính năng để thêm..." />
                            </SelectTrigger>
                            <SelectContent>
                              {unassignedFeatures.map((f) => (
                                <SelectItem key={f.id} value={f.id} className="text-xs">
                                  {f.name} <span className="font-mono text-gray-400 ml-1">({f.key})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-8 text-xs"
                            disabled={!selectedToAdd || assignMutation.isPending}
                            onClick={() => assignMutation.mutate({ plan: plan.plan, featureId: selectedToAdd })}
                          >
                            Thêm
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Create Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) setCreateForm(EMPTY_CREATE) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm Feature mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Key <span className="text-red-500">*</span></Label>
              <Input
                placeholder="vd: analytics.tour_clicks"
                value={createForm.key}
                onChange={(e) => setCreateForm((p) => ({ ...p, key: e.target.value.toLowerCase() }))}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-400">Chữ thường, cách nhau bằng dấu chấm. Không thay đổi được sau khi tạo.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Tên hiển thị <span className="text-red-500">*</span></Label>
              <Input
                placeholder="vd: Tour Click Analytics"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả ngắn về tính năng này..."
                rows={2}
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo Feature'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa Feature</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-mono text-gray-500">
                {editTarget.key}
              </div>
              <div className="space-y-1.5">
                <Label>Tên hiển thị</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mô tả</Label>
                <Textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="isActive"
                  checked={editForm.isActive}
                  onCheckedChange={(v) => setEditForm((p) => ({ ...p, isActive: v }))}
                />
                <Label htmlFor="isActive">Đang hoạt động</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Hủy</Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
              {editMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete AlertDialog ────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Feature?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa feature <strong>{deleteTarget?.name}</strong> sẽ tự động gỡ nó khỏi tất cả các gói subscription.
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
