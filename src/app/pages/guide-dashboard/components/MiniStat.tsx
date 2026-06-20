import { cn } from '../../../components/ui/utils'

const TONES = {
  neutral: 'text-slate-900',
  orange: 'text-orange-600',
  amber: 'text-amber-600',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
} as const

export function MiniStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string | number
  tone?: keyof typeof TONES
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={cn('mt-1.5 text-2xl font-semibold tabular-nums', TONES[tone])}>{value}</p>
    </div>
  )
}
