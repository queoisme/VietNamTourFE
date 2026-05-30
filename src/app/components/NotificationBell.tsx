import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Bell } from 'lucide-react'
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from '@/api/notifications'
import { Notification } from '@/types/finance'
import { formatDateTime } from '@/lib/constants'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from './ui/utils'

export function getNotifPath(n: Notification): string {
  if (!n.entityId) return '/notifications'
  switch (n.entityType) {
    case 'booking': return `/booking-confirmation/${n.entityId}`
    case 'withdrawal': return '/guide'
    case 'conversation': return `/chat/${n.entityId}`
    case 'tour': return `/tours/${n.entityId}`
    case 'support':
      // admin notifications go to admin support panel, user reply goes to user support page
      return n.type === 'support_reply' ? '/support' : '/admin/support'
    default: return '/notifications'
  }
}

function getNotifColor(type: string): string {
  if (type.includes('booking')) return 'bg-blue-500'
  if (type.includes('withdrawal')) return 'bg-emerald-500'
  if (type.includes('message')) return 'bg-indigo-500'
  if (type.includes('review')) return 'bg-amber-500'
  if (type.includes('boost')) return 'bg-orange-500'
  if (type.includes('subscription')) return 'bg-purple-500'
  if (type.includes('refund')) return 'bg-red-500'
  if (type.includes('application') || type.includes('guide')) return 'bg-teal-500'
  if (type.includes('support')) return 'bg-violet-500'
  return 'bg-gray-400'
}

export function NotifIcon({ type, className }: { type: string; className?: string }) {
  return <span className={cn('size-2 shrink-0 rounded-full mt-1', getNotifColor(type), className)} />
}

export function NotificationBell({ buttonClassName }: { buttonClassName?: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
  })

  const { data: previewData } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: () => getNotifications({ page: 1, size: 5 }),
    enabled: open,
  })

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const items = previewData?.items ?? []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('relative hidden md:flex px-2', buttonClassName)} title="Thông báo">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 flex size-4 items-center justify-center p-0 text-[10px] bg-red-600 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Thông báo</p>
          {unreadCount > 0 && (
            <button
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
            >
              Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>

        <div className="max-h-[360px] divide-y overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <p className="text-sm">Không có thông báo</p>
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                className={cn(
                  'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                  !n.isRead && 'bg-blue-50/60',
                )}
                onClick={() => {
                  if (!n.isRead) readMutation.mutate(n.id)
                  setOpen(false)
                  navigate(getNotifPath(n))
                }}
              >
                <div className="mt-1.5">
                  <NotifIcon type={n.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm leading-snug', !n.isRead && 'font-medium')}>{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.body}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />}
              </button>
            ))
          )}
        </div>

        <div className="border-t px-4 py-2.5 text-center">
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => { setOpen(false); navigate('/notifications') }}
          >
            Xem tất cả thông báo →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
