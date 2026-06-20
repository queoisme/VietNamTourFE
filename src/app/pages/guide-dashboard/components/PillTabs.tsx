import { cn } from '../../../components/ui/utils'

export type PillTabsItem = { key: string; label: string }

export function PillTabs({
  items,
  value,
  onChange,
}: {
  items: PillTabsItem[]
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1">
      {items.map((item) => {
        const active = value === item.key
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'shrink-0 rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
