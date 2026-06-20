import type { ComponentType, ReactNode } from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
        <Icon className="size-6" />
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
