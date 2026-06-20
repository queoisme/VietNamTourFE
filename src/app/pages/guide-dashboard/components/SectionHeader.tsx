import type { ReactNode } from 'react'

export function SectionHeader({
  tag,
  title,
  description,
  action,
  chip,
}: {
  tag?: string
  title: string
  description?: string
  action?: ReactNode
  chip?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="min-w-0 flex-1">
        {tag && (
          <span className="mb-2 inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
            {tag}
          </span>
        )}
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {(action || chip) && (
        <div className="flex shrink-0 items-center gap-2">
          {chip}
          {action}
        </div>
      )}
    </div>
  )
}
