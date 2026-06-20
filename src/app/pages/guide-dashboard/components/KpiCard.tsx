import type { ComponentType, ReactNode } from 'react'
import { cn } from '../../../components/ui/utils'

export function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  action,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string | number
  trend?: ReactNode
  action?: ReactNode
  onClick?: () => void
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex flex-col rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200',
        onClick && 'hover:border-slate-300 hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <Icon className="size-5" />
        </div>
        {trend ?? action}
      </div>
      <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </Wrapper>
  )
}
