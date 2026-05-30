import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getAdminBoostPlans, updateAdminBoostPlan } from '@/api/admin'
import { AdminBoostPlan } from '@/types/admin'
import { formatVND } from '@/lib/constants'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Skeleton } from '../components/ui/skeleton'
import { Textarea } from '../components/ui/textarea'

const PLAN_LABELS: Record<string, string> = {
  basic: 'Gói Cơ Bản',
  standard: 'Gói Tiêu Chuẩn',
  premium: 'Gói Cao Cấp',
}

export function AdminBoostPlans() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<AdminBoostPlan | null>(null)
  const [price, setPrice] = useState('')
  const [days, setDays] = useState('')
  const [description, setDescription] = useState('')

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-boost-plans'],
    queryFn: getAdminBoostPlans,
  })

  const mutation = useMutation({
    mutationFn: () =>
      updateAdminBoostPlan(selected!.plan, {
        price: Number(price),
        days: Number(days),
        description: description.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-boost-plans'] })
      queryClient.invalidateQueries({ queryKey: ['boost-plans'] })
      toast.success('Đã cập nhật gói boost')
      setSelected(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const totalValue = useMemo(
    () => plans.reduce((sum, p) => sum + p.price, 0),
    [plans],
  )

  const openEditor = (plan: AdminBoostPlan) => {
    setSelected(plan)
    setPrice(String(plan.price))
    setDays(String(plan.durationDays))
    setDescription(plan.description)
  }

  const handleSave = () => {
    if (!selected) return
    if (!price || Number(price) <= 0) return toast.error('Giá phải lớn hơn 0')
    if (!days || Number(days) <= 0) return toast.error('Số ngày phải lớn hơn 0')
    mutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white">
        <h1 className="text-2xl font-bold">Cấu hình gói Boost Tour</h1>
        <p className="mt-1 text-sm text-orange-100">
          Quản lý bảng giá, thời hạn và mô tả các gói boost đang bán cho hướng dẫn viên.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tổng số gói</p>
            <p className="mt-1 text-2xl font-bold">{plans.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Giá trung bình</p>
            <p className="mt-1 text-2xl font-bold">
              {plans.length > 0 ? formatVND(plans.reduce((s, p) => s + p.price, 0) / plans.length) : formatVND(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Tổng giá trị gói</p>
            <p className="mt-1 text-2xl font-bold">{formatVND(totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói Boost</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Chưa có gói nào</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.plan} className="rounded-xl border p-4 transition hover:shadow-sm">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold">{PLAN_LABELS[plan.plan] ?? plan.plan}</p>
                      <p className="text-sm text-gray-500">{plan.durationDays} ngày</p>
                    </div>
                  </div>
                  <p className="mb-3 text-2xl font-bold text-orange-600">{formatVND(plan.price)}</p>
                  <p className="line-clamp-3 text-sm text-gray-600">{plan.description}</p>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => openEditor(plan)}>
                    Chỉnh sửa gói
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{PLAN_LABELS[selected?.plan ?? ''] ?? selected?.plan}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Giá (VND)</Label>
                <Input
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Số ngày</Label>
                <Input
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea
                className="mt-1"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="rounded-lg border bg-orange-50 p-3 text-xs text-orange-700">
              <p className="font-medium">Lưu ý</p>
              <p className="mt-1">
                Thay đổi giá và mô tả sẽ áp dụng cho các giao dịch boost mới. Các boost đã mua không bị ảnh hưởng.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={mutation.isPending} className="bg-orange-600 hover:bg-orange-700">
              {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
