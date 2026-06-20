import { useQuery } from '@tanstack/react-query'
import { Crown, Zap, Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../components/ui/utils'
import { SectionHeader } from './components/SectionHeader'
import { MiniStat } from './components/MiniStat'
import { EmptyState } from './components/EmptyState'
import { getSubscriptionPlans } from '@/api/boosts'
import { formatDate, formatVND } from '@/lib/constants'
import type { Boost, Subscription } from '@/types/boost'

const BOOST_STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}
const BOOST_STATUS_LABEL: Record<string, string> = {
  active: 'Đang chạy',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
}

function formatPlanLabel(plan: string): string {
  return plan.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function SubscriptionTab({
  currentSub,
  boosts,
  onNavigate,
}: {
  currentSub: Subscription | null
  boosts: Boost[]
  onNavigate: (path: string) => void
}) {
  const { data: subPlans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
    staleTime: 5 * 60 * 1000,
  })

  const isActive = currentSub?.status === 'active' && new Date(currentSub.expiresAt) > new Date()
  const plan = isActive ? currentSub!.plan || 'free' : 'free'
  const expiresAt = isActive ? currentSub!.expiresAt : null
  const daysLeft = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
    : null
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0
  const isFree = plan === 'free'

  const planInfo = subPlans.find((p) => p.plan === plan)
  const commissionPct = planInfo ? `${Math.round(planInfo.commissionRate * 100)}%` : '15%'
  const maxToursLabel = planInfo?.maxActiveTours != null ? `Tối đa ${planInfo.maxActiveTours} tour` : 'Không giới hạn'

  const activeBoosts = boosts.filter((b) => b.status === 'active').length
  const totalSpent = boosts.reduce((sum, b) => sum + b.pricePaid, 0)

  return (
    <div className="space-y-6">
      <SectionHeader
        tag="Gói & Boost"
        title="Quản lý gói đăng ký và boost tour"
        description="Nâng cấp gói để giảm hoa hồng và tăng giới hạn tour."
        action={
          <Button onClick={() => onNavigate('/subscription')} className={isFree ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-600 hover:bg-slate-700'}>
            {isFree ? 'Nâng cấp ngay' : 'Xem gói'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Plan summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className={cn(
              'flex size-12 items-center justify-center rounded-xl',
              isFree ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600',
            )}>
              <Crown className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">Gói đăng ký hiện tại</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xl font-semibold text-slate-900">{formatPlanLabel(plan)}</span>
                {isActive && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 font-medium text-emerald-700">
                    Đang hoạt động
                  </Badge>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                <div>
                  <span className="text-slate-500">Hoa hồng: </span>
                  <span className="font-semibold text-slate-900">{commissionPct}</span>
                </div>
                <div>
                  <span className="text-slate-500">Tour: </span>
                  <span className="font-semibold text-slate-900">{maxToursLabel}</span>
                </div>
                {expiresAt && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Hết hạn: </span>
                    <span className="font-medium text-slate-900">
                      {new Date(expiresAt).toLocaleDateString('vi-VN')}
                    </span>
                    {daysLeft !== null && daysLeft > 0 && (
                      <span className="ml-1 text-slate-500">(còn {daysLeft} ngày)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {isExpiringSoon && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              <span>Gói còn <span className="font-semibold">{daysLeft} ngày</span> hết hạn. Gia hạn để không gián đoạn.</span>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
                onClick={() => onNavigate('/subscription')}
              >
                Gia hạn
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <MiniStat label="Tổng boost" value={boosts.length} />
          <MiniStat label="Đang chạy" value={activeBoosts} tone="orange" />
          <MiniStat label="Tổng chi boost" value={formatVND(totalSpent)} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Lịch sử Boost tour</p>
          <Button size="sm" variant="outline" onClick={() => onNavigate('/boost')}>
            <Plus className="mr-1 size-4" /> Boost mới
          </Button>
        </div>

        {boosts.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="Chưa có lần boost nào"
            description="Boost tour để tăng lượt hiển thị trên trang chủ."
            action={
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => onNavigate('/boost')}>
                Boost tour ngay
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {boosts.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{b.tourTitle}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Gói {b.plan}
                      <span className="text-slate-300"> · </span>
                      {formatVND(b.pricePaid)}
                      <span className="text-slate-300"> · </span>
                      {b.durationDays} ngày
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(b.startsAt)} → {formatDate(b.expiresAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('shrink-0 font-medium', BOOST_STATUS_BADGE[b.status])}>
                    {BOOST_STATUS_LABEL[b.status] ?? b.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
