import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, EyeOff, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  getAdminHomeCategories,
  createAdminHomeCategory,
  updateAdminHomeCategory,
  deleteAdminHomeCategory,
} from '@/api/admin'
import { HomeCategory } from '@/types/admin'
import { TOUR_CATEGORIES } from '@/lib/constants'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Badge } from '../components/ui/badge'

type DialogMode = 'create' | 'edit' | null

const EMPTY_FORM = { name: '', description: '', categoryFilter: 'nature', sortOrder: '0', isVisible: true }

export function AdminHomeCategories() {
  const queryClient = useQueryClient()
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [selected, setSelected] = useState<HomeCategory | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HomeCategory | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-home-categories'],
    queryFn: getAdminHomeCategories,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-home-categories'] })
    queryClient.invalidateQueries({ queryKey: ['home-categories'] })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminHomeCategory({
        name: form.name.trim(),
        description: form.description.trim(),
        categoryFilter: form.categoryFilter,
        isVisible: form.isVisible,
        sortOrder: Number(form.sortOrder) || 0,
      }),
    onSuccess: () => { invalidate(); toast.success('Đã tạo danh mục mới'); setDialogMode(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminHomeCategory(selected!.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        categoryFilter: form.categoryFilter,
        isVisible: form.isVisible,
        sortOrder: Number(form.sortOrder) || 0,
      }),
    onSuccess: () => { invalidate(); toast.success('Đã cập nhật danh mục'); setDialogMode(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminHomeCategory(deleteTarget!.id),
    onSuccess: () => { invalidate(); toast.success('Đã xóa danh mục'); setDeleteTarget(null) },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleVisibility = (item: HomeCategory) => {
    updateAdminHomeCategory(item.id, { isVisible: !item.isVisible })
      .then(() => { invalidate(); toast.success(item.isVisible ? 'Đã ẩn danh mục' : 'Đã hiển thị danh mục') })
      .catch((err: Error) => toast.error(err.message))
  }

  const openCreate = () => {
    setSelected(null)
    setForm(EMPTY_FORM)
    setDialogMode('create')
  }

  const openEdit = (item: HomeCategory) => {
    setSelected(item)
    setForm({
      name: item.name,
      description: item.description,
      categoryFilter: item.categoryFilter,
      sortOrder: String(item.sortOrder),
      isVisible: item.isVisible,
    })
    setDialogMode('edit')
  }

  const handleSave = () => {
    if (!form.name.trim()) return toast.error('Tên danh mục không được để trống')
    if (dialogMode === 'create') createMutation.mutate()
    else updateMutation.mutate()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const visibleCount = items.filter((i) => i.isVisible).length
  const hiddenCount = items.length - visibleCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <h1 className="text-2xl font-bold">Danh mục trang chủ</h1>
        <p className="mt-1 text-sm text-slate-200">
          Quản lý các danh mục hiển thị trong section "Khám Phá Theo Danh Mục" trên trang chủ.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Tổng danh mục</p>
          <p className="mt-1 text-2xl font-bold">{items.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Đang hiển thị</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{visibleCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Đang ẩn</p>
          <p className="mt-1 text-2xl font-bold text-gray-400">{hiddenCount}</p>
        </CardContent></Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách danh mục</CardTitle>
          <Button onClick={openCreate} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="mr-1.5 size-4" />
            Thêm mới
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Chưa có danh mục nào</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((item) => {
                const catLabel = TOUR_CATEGORIES.find((c) => c.value === item.categoryFilter)?.label ?? item.categoryFilter
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 transition hover:shadow-sm ${!item.isVisible ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{item.name}</p>
                          {!item.isVisible && (
                            <Badge variant="secondary" className="text-xs">Ẩn</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{catLabel}</Badge>
                          <Badge variant="outline" className="text-xs">Thứ tự: {item.sortOrder}</Badge>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title={item.isVisible ? 'Ẩn' : 'Hiện'}
                          onClick={() => toggleVisibility(item)}
                        >
                          {item.isVisible
                            ? <Eye className="size-4 text-emerald-600" />
                            : <EyeOff className="size-4 text-gray-400" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={!!dialogMode} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên danh mục</Label>
              <Input
                className="mt-1"
                placeholder="VD: Thiên nhiên"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input
                className="mt-1"
                placeholder="VD: Núi rừng, biển đảo"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Bộ lọc danh mục</Label>
              <Select
                value={form.categoryFilter}
                onValueChange={(v) => setForm((p) => ({ ...p, categoryFilter: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOUR_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">Nhấn vào card này sẽ lọc tour theo danh mục đã chọn</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Thứ tự hiển thị</Label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1"
                  value={form.sortOrder}
                  onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select
                  value={form.isVisible ? 'visible' : 'hidden'}
                  onValueChange={(v) => setForm((p) => ({ ...p, isVisible: v === 'visible' }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visible">Hiển thị</SelectItem>
                    <SelectItem value="hidden">Ẩn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>Hủy</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Danh mục <strong>{deleteTarget?.name}</strong> sẽ bị xóa vĩnh viễn và không còn hiển thị trên trang chủ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate()}
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
