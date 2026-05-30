import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/notifications'
import { Notification } from '@/types/finance'
import { formatDateTime } from '@/lib/constants'
import { getNotifPath, NotifIcon } from '../components/NotificationBell'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { cn } from '../components/ui/utils'

const SIZE = 20

export function Notifications() {
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', tab, page],
    queryFn: () =>
      getNotifications({
        page,
        size: SIZE,
        isRead: tab === 'unread' ? false : undefined,
      }),
  })

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] })
    },
  })

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] })
    },
  })

  const handleClick = (n: Notification) => {
    if (!n.isRead) readMutation.mutate(n.id)
    navigate(getNotifPath(n))
  }

  const items = data?.items ?? []
  const meta = data?.meta
  const totalPages = meta ? Math.ceil(meta.total / SIZE) : 1

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        {(meta?.total ?? 0) > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
          >
            Đánh dấu đã đọc tất cả
          </Button>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(['all', 'unread'] as const).map((t) => (
          <button
            key={t}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
            onClick={() => { setTab(t); setPage(1) }}
          >
            {t === 'all' ? 'Tất cả' : 'Chưa đọc'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
          <p className="text-sm">
            {tab === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo nào'}
          </p>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-white">
          {items.map((n) => (
            <button
              key={n.id}
              className={cn(
                'flex w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-slate-50',
                !n.isRead && 'bg-blue-50/50',
              )}
              onClick={() => handleClick(n)}
            >
              <div className="mt-0.5">
                <NotifIcon type={n.type} className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm leading-snug', !n.isRead && 'font-semibold')}>{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-gray-500">{n.body}</p>}
                <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-blue-500" />}
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </Button>
          <span className="text-sm text-gray-600">
            Trang {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Sau
          </Button>
        </div>
      )}
    </div>
  )
}
