import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getAdminRefundPolicy, updateAdminRefundPolicy } from '@/api/admin'
import { UpdateRefundPolicyRequest } from '@/types/admin'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Skeleton } from '../components/ui/skeleton'

type FormState = {
  fullRefundDays: string
  partialRefundHours: string
  partialRefundPct: string
}

function validate(form: FormState): string | null {
  const days = Number(form.fullRefundDays)
  const hours = Number(form.partialRefundHours)
  const pct = Number(form.partialRefundPct)
  if (!Number.isInteger(days) || days < 1) return 'Số ngày hoàn 100% phải là số nguyên >= 1'
  if (!Number.isInteger(hours) || hours < 1) return 'Số giờ hoàn một phần phải là số nguyên >= 1'
  if (!Number.isInteger(pct) || pct < 1 || pct > 99) return 'Tỷ lệ hoàn tiền một phần phải từ 1 đến 99'
  if (days * 24 <= hours) return `Ngưỡng hoàn 100% (${days} ngày = ${days * 24}h) phải lớn hơn ngưỡng hoàn một phần (${hours}h)`
  return null
}

export function AdminRefundPolicy() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-refund-policy'],
    queryFn: getAdminRefundPolicy,
  })

  const [form, setForm] = useState<FormState>({
    fullRefundDays: '7',
    partialRefundHours: '48',
    partialRefundPct: '50',
  })
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      setForm({
        fullRefundDays: String(data.fullRefundDays),
        partialRefundHours: String(data.partialRefundHours),
        partialRefundPct: String(data.partialRefundPct),
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateRefundPolicyRequest) => updateAdminRefundPolicy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refund-policy'] })
      toast.success('Đã cập nhật chính sách hoàn tiền')
      setFormError(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSave = () => {
    const error = validate(form)
    if (error) { setFormError(error); return }
    setFormError(null)
    saveMutation.mutate({
      fullRefundDays: Number(form.fullRefundDays),
      partialRefundHours: Number(form.partialRefundHours),
      partialRefundPct: Number(form.partialRefundPct),
    })
  }

  const days = Number(form.fullRefundDays) || 0
  const hours = Number(form.partialRefundHours) || 0
  const pct = Number(form.partialRefundPct) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-6 text-white">
        <h1 className="text-2xl font-bold">Chính sách hoàn tiền</h1>
        <p className="mt-1 text-orange-100 text-sm">
          Cấu hình ngưỡng thời gian và tỷ lệ hoàn tiền khi khách hàng hủy tour
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thiết lập ngưỡng hoàn tiền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fullRefundDays">Hoàn 100% nếu hủy trước (ngày)</Label>
                  <Input
                    id="fullRefundDays"
                    type="number"
                    min={1}
                    value={form.fullRefundDays}
                    onChange={e => setForm(f => ({ ...f, fullRefundDays: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hủy trước {days} ngày so với ngày tour → hoàn toàn bộ tiền
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="partialRefundHours">Hoàn một phần nếu hủy trước (giờ)</Label>
                  <Input
                    id="partialRefundHours"
                    type="number"
                    min={1}
                    value={form.partialRefundHours}
                    onChange={e => setForm(f => ({ ...f, partialRefundHours: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hủy trong khoảng {hours}h – {days * 24}h trước tour → hoàn một phần
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="partialRefundPct">Tỷ lệ hoàn tiền một phần (%)</Label>
                  <Input
                    id="partialRefundPct"
                    type="number"
                    min={1}
                    max={99}
                    value={form.partialRefundPct}
                    onChange={e => setForm(f => ({ ...f, partialRefundPct: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Khách nhận lại {pct}% tổng tiền đặt tour
                  </p>
                </div>

                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}

                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Live preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Xem trước chính sách</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Bảng tóm tắt theo cấu hình hiện tại
            </p>
            <div className="rounded-lg border overflow-hidden text-sm">
              <div className="grid grid-cols-2 bg-muted px-4 py-2 font-medium">
                <span>Thời điểm hủy</span>
                <span className="text-right">Hoàn tiền</span>
              </div>
              <div className="divide-y">
                <div className="grid grid-cols-2 px-4 py-3">
                  <span className="text-muted-foreground">Trước {days} ngày</span>
                  <span className="text-right font-semibold text-green-600">100%</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-3">
                  <span className="text-muted-foreground">Trước {hours}h – {days * 24}h</span>
                  <span className="text-right font-semibold text-amber-600">{pct}%</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-3">
                  <span className="text-muted-foreground">Dưới {hours} giờ</span>
                  <span className="text-right font-semibold text-red-600">0%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p>• Guide hủy hoặc từ chối: luôn hoàn <strong>100%</strong></p>
              <p>• Booking chưa confirmed (pending): luôn hoàn <strong>100%</strong></p>
              <p>• Chính sách này chỉ áp dụng cho booking đã <strong>confirmed</strong> và đã <strong>thanh toán</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
