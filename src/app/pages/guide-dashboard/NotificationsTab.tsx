import { NotificationsPanel } from '../../components/NotificationsPanel'

export function NotificationsTab() {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Thông báo</h2>
        <p className="text-sm text-slate-500">Mọi cập nhật về booking, tour, thanh toán và tài khoản của bạn.</p>
      </div>
      <NotificationsPanel />
    </div>
  )
}
