import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Settings2 } from 'lucide-react'
import { getMaintenanceMode, setMaintenanceMode } from '@/api/siteConfig'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Switch } from '../components/ui/switch'
import { Label } from '../components/ui/label'

export function AdminSiteSettings() {
  const queryClient = useQueryClient()

  const { data: isMaintenanceOn, isLoading } = useQuery({
    queryKey: ['site-config', 'maintenance_mode'],
    queryFn: getMaintenanceMode,
    refetchInterval: 30_000,
  })

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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-slate-800 p-6 text-white">
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
              Tất cả người dùng (trừ admin đã mở sẵn trang) đang thấy trang bảo trì. Tắt khi hoàn
              tất bảo trì.
            </p>
          </div>
        </div>
      )}

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
            <code className="rounded bg-muted px-1 font-mono text-xs">
              VITE_MAINTENANCE_MODE=true
            </code>{' '}
            là override khẩn cấp — ghi đè cài đặt trên Supabase (cần redeploy).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
