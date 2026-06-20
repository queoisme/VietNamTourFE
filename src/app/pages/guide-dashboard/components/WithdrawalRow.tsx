import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../components/ui/utils'
import { formatDate, formatVND } from '@/lib/constants'
import type { Withdrawal } from '@/types/finance'

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  completed: 'Hoàn tất',
  rejected: 'Từ chối',
}

export function WithdrawalRow({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tabular-nums text-slate-900">{formatVND(withdrawal.amount)}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Thực nhận: <span className="font-medium text-emerald-600">{formatVND(withdrawal.netAmount)}</span>
            <span className="text-slate-300"> · </span>
            {withdrawal.method.toUpperCase()}
          </p>
          {withdrawal.adminNote && (
            <p className="mt-1 text-xs text-slate-500">Ghi chú admin: {withdrawal.adminNote}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <Badge variant="outline" className={cn('font-medium', STATUS_BADGE[withdrawal.status])}>
            {STATUS_LABEL[withdrawal.status] || withdrawal.status}
          </Badge>
          <p className="mt-1 text-xs text-slate-500">{formatDate(withdrawal.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}
