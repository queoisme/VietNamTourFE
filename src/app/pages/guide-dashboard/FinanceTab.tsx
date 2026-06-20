import { Wallet, TrendingUp, Clock, CreditCard, Receipt } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Skeleton } from '../../components/ui/skeleton'
import { SectionHeader } from './components/SectionHeader'
import { KpiCard } from './components/KpiCard'
import { EmptyState } from './components/EmptyState'
import { WithdrawalRow } from './components/WithdrawalRow'
import { formatVND } from '@/lib/constants'
import type { FinanceSummary, Withdrawal } from '@/types/finance'

export function FinanceTab({
  finance,
  withdrawals,
  isLoading,
  onWithdraw,
}: {
  finance: FinanceSummary | undefined
  withdrawals: Withdrawal[]
  isLoading: boolean
  onWithdraw: () => void
}) {
  const balance = finance?.balance ?? 0
  const totalEarned = finance?.totalEarned ?? 0
  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length

  return (
    <div className="space-y-6">
      <SectionHeader
        tag="Tài chính"
        title="Doanh thu & rút tiền"
        description="Theo dõi số dư khả dụng và lịch sử rút tiền về tài khoản."
        action={
          <Button onClick={onWithdraw} disabled={balance < 100_000} className="bg-orange-600 hover:bg-orange-700">
            <CreditCard className="mr-1 size-4" /> Rút tiền
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={Wallet} label="Số dư khả dụng" value={formatVND(balance)} />
        <KpiCard icon={TrendingUp} label="Tổng đã kiếm" value={formatVND(totalEarned)} />
        <KpiCard icon={Clock} label="Đang chờ duyệt" value={pendingCount} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Lịch sử rút tiền</p>
          <p className="text-xs text-slate-500">{withdrawals.length} yêu cầu</p>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Chưa có yêu cầu rút tiền"
            description="Rút tiền khi số dư đạt tối thiểu 100.000 ₫ về tài khoản ngân hàng."
          />
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <WithdrawalRow key={w.id} withdrawal={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
