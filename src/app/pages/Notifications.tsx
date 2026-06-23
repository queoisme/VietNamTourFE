import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { Bell, BellOff, CheckCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/notifications'
import { Notification } from '@/types/finance'
import { getNotifPath, getNotifVisual, relativeTime } from '../components/NotificationBell'
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
    placeholderData: (prev) => prev,
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
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / SIZE)) : 1
  const unreadInList = items.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 pt-8 pb-24 text-white">
        <div className="container relative mx-auto px-4">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/80">
            <Link to="/" className="hover:text-white">Trang chủ</Link>
            <span className="text-white/50">/</span>
            <span className="font-medium text-white">Thông báo</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25">
                <Bell className="size-3.5" />
                Trung tâm thông báo
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Thông Báo</h1>
              <p className="mt-2 max-w-xl text-base text-white/90 md:text-lg">
                Cập nhật mọi diễn biến của chuyến đi và tài khoản của bạn.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-3 ring-1 ring-white/25">
              <Bell className="size-6 text-white" />
              <div>
                <div className="text-xs uppercase tracking-wide text-white/80">Tổng số</div>
                <div className="text-2xl font-bold leading-none">{meta?.total ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto -mt-12 max-w-3xl px-4 pb-16">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/5">
          {/* Toolbar: tabs + mark all */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
              {(['all', 'unread'] as const).map((t) => (
                <button
                  key={t}
                  className={cn(
                    'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
                    tab === t
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                  onClick={() => { setTab(t); setPage(1) }}
                >
                  {t === 'all' ? 'Tất cả' : 'Chưa đọc'}
                </button>
              ))}
            </div>

            {unreadInList > 0 && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
                onClick={() => readAllMutation.mutate()}
                disabled={readAllMutation.isPending}
              >
                <CheckCheck className="size-3.5" />
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-5 py-4">
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-rose-100 text-orange-500">
                <BellOff className="size-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                {tab === 'unread' ? 'Tất cả đã đọc' : 'Chưa có thông báo'}
              </h3>
              <p className="max-w-sm text-sm text-slate-500">
                {tab === 'unread'
                  ? 'Bạn đang theo dõi mọi thứ — tiếp tục lên kế hoạch cho chuyến đi nhé.'
                  : 'Hành trình mới và cập nhật quan trọng sẽ xuất hiện tại đây.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => {
                const { Icon, tone } = getNotifVisual(n.type)
                return (
                  <li key={n.id}>
                    <button
                      className={cn(
                        'group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-orange-50/40',
                        !n.isRead && 'bg-orange-50/60',
                      )}
                      onClick={() => handleClick(n)}
                    >
                      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', tone)}>
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'text-sm leading-snug text-slate-800',
                          !n.isRead && 'font-semibold',
                        )}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{n.body}</p>
                        )}
                        <p className="mt-1.5 text-xs font-medium text-slate-400">{relativeTime(n.createdAt)}</p>
                      </div>
                      {!n.isRead && (
                        <span className="mt-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                          <span className="size-1.5 rounded-full bg-orange-500" />
                          Mới
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-500">
                Trang <span className="font-semibold text-slate-700">{page}</span> / {totalPages}
                {meta && (
                  <> · <span className="font-medium text-slate-700">{meta.total}</span> thông báo</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="size-8"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="size-8"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
