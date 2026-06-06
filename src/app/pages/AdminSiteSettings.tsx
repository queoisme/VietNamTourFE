import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Settings2, Timer } from 'lucide-react'
import {
  getMaintenanceMode,
  setMaintenanceMode,
  getMaintenanceConfig,
  setMaintenanceCountdown,
} from '@/api/siteConfig'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Switch } from '../components/ui/switch'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

export function AdminSiteSettings() {
  const queryClient = useQueryClient()
  const [hours, setHours] = useState(2)
  const [minutes, setMinutes] = useState(0)

  const { data: isMaintenanceOn, isLoading } = useQuery({
    queryKey: ['site-config', 'maintenance_mode'],
    queryFn: getMaintenanceMode,
    refetchInterval: 30_000,
  })

  const { data: countdownConfig, isLoading: countdownLoading } = useQuery({
    queryKey: ['site-config', 'countdown'],
    queryFn: getMaintenanceConfig,
  })

  useEffect(() => {
    if (!countdownConfig) return
    setHours(Math.floor(countdownConfig.durationMinutes / 60))
    setMinutes(countdownConfig.durationMinutes % 60)
  }, [countdownConfig])

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => setMaintenanceMode(enabled),
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['site-config', 'maintenance_mode'] })
      toast.success(
        enabled
          ? 'Đã bật chế độ bảo trì — người dùng đang thấy trang bảo trì'
          : 'Đã tắt chế độ bảo trì — website hoạt động bình thường',
      )
    },
    onError: (err: Error) => toast.error(`Lỗi: ${err.message}`),
  })

  const countdownMutation = useMutation({
    mutationFn: (durationMinutes: number) => setMaintenanceCountdown(durationMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-config', 'countdown'] })
      toast.success('Đã cập nhật đồng hồ đếm ngược')
    },
    onError: (err: Error) => toast.error(`Lỗi: ${err.message}`),
  })

  const handleSetCountdown = () => {
    const total = hours * 60 + minutes
    if (total <= 0) {
      toast.error('Vui lòng nhập thời gian lớn hơn 0')
      return
    }
    countdownMutation.mutate(total)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-indigo-800 p-6 text-white">
        <div className="flex items-center gap-3">
          <Settings2 className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Cài đặt hệ thống</h1>
            <p className="mt-1 text-sm text-indigo-200">Quản lý trạng thái vận hành của website</p>
          </div>
        </div>
      </div>

      {isMaintenanceOn && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Chế độ bảo trì đang BẬT</p>
            <p className="text-sm text-red-600">
              Tất cả người dùng (trừ admin) đang thấy trang bảo trì. Tắt khi hoàn tất.
            </p>
          </div>
        </div>
      )}

      {/* Maintenance toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chế độ bảo trì</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="maintenance-toggle" className="text-sm font-medium">
                  Bật / Tắt chế độ bảo trì
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Khi bật, toàn bộ người dùng truy cập website sẽ thấy trang "Đang bảo trì". Thay
                  đổi có hiệu lực ngay lập tức — không cần redeploy.
                </p>
              </div>
              <Switch
                id="maintenance-toggle"
                checked={isMaintenanceOn ?? false}
                onCheckedChange={(enabled) => toggleMutation.mutate(enabled)}
                disabled={toggleMutation.isPending}
                className="shrink-0"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Countdown config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-4 w-4" />
            Đồng hồ đếm ngược
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Đặt thời lượng mỗi chu kỳ đếm ngược. Khi đồng hồ về 0, tự động reset và đếm lại từ đầu.
          </p>
          {countdownLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="flex items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Giờ</Label>
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phút</Label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-20"
                  />
                </div>
                <Button onClick={handleSetCountdown} disabled={countdownMutation.isPending}>
                  {countdownMutation.isPending ? 'Đang lưu...' : 'Cập nhật'}
                </Button>
              </div>
              {countdownConfig?.endTime && (
                <p className="text-xs text-muted-foreground">
                  Chu kỳ hiện tại kết thúc lúc:{' '}
                  <strong>{new Date(countdownConfig.endTime).toLocaleString('vi-VN')}</strong>
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Lưu ý vận hành</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Admin đang mở sẵn trang sẽ <strong>không</strong> bị chuyển sang trang bảo trì —
            chỉ áp dụng cho lần tải trang tiếp theo.
          </p>
          <p>• Để kiểm tra, hãy mở tab ẩn danh sau khi bật.</p>
          <p>
            • Biến môi trường{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">VITE_MAINTENANCE_MODE=true</code>{' '}
            là override khẩn cấp — ghi đè cài đặt trên Supabase (cần redeploy).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
