import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface AdminPagerProps {
  page: number
  size: number
  total: number
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
  className?: string
}

export function AdminPager({
  page,
  size,
  total,
  onPageChange,
  onSizeChange,
  className,
}: AdminPagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / size))
  const canPrev = page > 1
  const canNext = page < totalPages

  const windowStart = Math.max(1, page - 2)
  const windowEnd = Math.min(totalPages, windowStart + 4)
  const pages: number[] = []
  for (let p = windowStart; p <= windowEnd; p += 1) pages.push(p)

  const startItem = total === 0 ? 0 : (page - 1) * size + 1
  const endItem = Math.min(page * size, total)

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className ?? ''}`}>
      <p className="text-sm text-gray-500">
        Hiển thị {startItem}-{endItem} / {total}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Mỗi trang</span>
        <Select
          value={String(size)}
          onValueChange={(v) => {
            onSizeChange(Number(v))
            onPageChange(1)
          }}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            className="min-w-9"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          disabled={!canNext}
          onClick={() => canNext && onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
