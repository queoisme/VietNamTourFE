import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
  Bell, Calendar, Wallet, MessageCircle, Star, Sparkles, Crown,
  RotateCw, UserCheck, LifeBuoy, Ban, Compass, Megaphone, Wrench,
  ArrowRight, CheckCheck, BellOff,
} from 'lucide-react'
import { getNotifications, getUnreadCount, markAllNotificationsRead, markNotificationRead } from '@/api/notifications'
import { Notification } from '@/types/finance'
import { useAuth } from '../contexts/AuthContext'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from './ui/utils'

export function getNotifPath(n: Notification): string {
  if (!n.entityId && n.entityType !== 'user') return '/notifications'
  switch (n.entityType) {
    case 'booking': return `/booking-confirmation/${n.entityId}`
    case 'withdrawal': return '/guide'
    case 'conversation': return `/chat/${n.entityId}`
    case 'tour': return `/tours/${n.entityId}`
    case 'user': return '/profile'
    case 'review': return '/notifications'
    case 'support':
      return n.type === 'support_reply' ? '/support' : '/admin/support'
    default: return '/notifications'
  }
}

// Map a notification type → { Icon, colored ring tone }. Keep tones soft so the
// list still reads as a cohesive set rather than a coloring book.
export function getNotifVisual(type: string): { Icon: typeof Bell; tone: string } {
  if (type.includes('booking'))                              return { Icon: Calendar,    tone: 'bg-sky-100 text-sky-600' }
  if (type.includes('withdrawal'))                           return { Icon: Wallet,      tone: 'bg-emerald-100 text-emerald-600' }
  if (type.includes('message'))                              return { Icon: MessageCircle,tone: 'bg-indigo-100 text-indigo-600' }
  if (type.includes('review'))                               return { Icon: Star,        tone: 'bg-amber-100 text-amber-600' }
  if (type.includes('boost'))                                return { Icon: Sparkles,    tone: 'bg-orange-100 text-orange-600' }
  if (type.includes('subscription'))                         return { Icon: Crown,       tone: 'bg-purple-100 text-purple-600' }
  if (type.includes('refund'))                               return { Icon: RotateCw,    tone: 'bg-red-100 text-red-600' }
  if (type.includes('application') || type.includes('guide'))return { Icon: UserCheck,   tone: 'bg-teal-100 text-teal-600' }
  if (type.includes('support'))                              return { Icon: LifeBuoy,    tone: 'bg-violet-100 text-violet-600' }
  if (type.includes('banned'))                               return { Icon: Ban,         tone: 'bg-rose-100 text-rose-600' }
  if (type.includes('tour_status'))                          return { Icon: Compass,     tone: 'bg-sky-100 text-sky-600' }
  if (type.includes('admin_broadcast'))                      return { Icon: Megaphone,   tone: 'bg-blue-100 text-blue-600' }
  if (type.includes('maintenance'))                          return { Icon: Wrench,      tone: 'bg-slate-100 text-slate-600' }
  return { Icon: Bell, tone: 'bg-slate-100 text-slate-600' }
}

// Compact dot — kept for callers (e.g. /notifications page) that still use it.
export function NotifIcon({ type, className }: { type: string; className?: string }) {
  const { tone } = getNotifVisual(type)
  const dotColor = tone.split(' ').find((c) => c.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-slate-400'
  return <span className={cn('size-2 shrink-0 rounded-full mt-1', dotColor, className)} />
}

export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = 60 * 1000
  const hour = 60 * min
  const day = 24 * hour
  if (ms < min) return 'Vừa xong'
  if (ms < hour) return `${Math.floor(ms / min)} phút trước`
  if (ms < day)  return `${Math.floor(ms / hour)} giờ trước`
  if (ms < 2 * day) return 'Hôm qua'
  if (ms < 7 * day) return `${Math.floor(ms / day)} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export function NotificationBell({ buttonClassName }: { buttonClassName?: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isGuide } = useAuth()

  const goToAllNotifs = () => {
    if (isGuide) navigate('/guide', { state: { tab: 'notifications' } })
    else navigate('/notifications')
  }

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
  })

  // Prefetch in background so the dropdown opens instantly (no 1–2s spinner).
  // Same polling cadence as unreadCount keeps both in sync without bursts.
  const { data: previewData, isLoading } = useQuery({
    queryKey: ['notifications-preview'],
    queryFn: () => getNotifications({ page: 1, size: 5 }),
    refetchInterval: 60000,
    staleTime: 30000,
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
  const showSkeleton = isLoading && items.length === 0

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
      <PopoverContent align="end" sideOffset={8} className="w-96 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl shadow-slate-900/15">
        {/* Header — travel gradient */}
        <div className="relative bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                <Bell className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Thông báo</p>
                <p className="mt-1 text-[11px] text-white/85">
                  {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white ring-1 ring-white/25 transition-colors hover:bg-white/25 disabled:opacity-50"
                onClick={() => readAllMutation.mutate()}
                disabled={readAllMutation.isPending}
              >
                <CheckCheck className="size-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto bg-white">
          {showSkeleton ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-9 shrink-0 animate-pulse rounded-full bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <BellOff className="size-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">Chưa có thông báo</p>
              <p className="text-xs text-slate-400">Hành trình mới của bạn sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((n) => {
                const { Icon, tone } = getNotifVisual(n.type)
                return (
                  <li key={n.id}>
                    <button
                      className={cn(
                        'group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-orange-50/40',
                        !n.isRead && 'bg-orange-50/60',
                      )}
                      onClick={() => {
                        if (!n.isRead) readMutation.mutate(n.id)
                        setOpen(false)
                        const path = getNotifPath(n)
                        if (isGuide && path === '/notifications') goToAllNotifs()
                        else if (isGuide && path === '/support') navigate('/guide', { state: { tab: 'support' } })
                        else navigate(path)
                      }}
                    >
                      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', tone)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'line-clamp-1 text-sm leading-snug text-slate-800',
                          !n.isRead && 'font-semibold',
                        )}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                        )}
                        <p className="mt-1 text-[11px] font-medium text-slate-400">{relativeTime(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <span className="mt-2 size-2 shrink-0 rounded-full bg-orange-500" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
          <button
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-100/60"
            onClick={() => { setOpen(false); goToAllNotifs() }}
          >
            Xem tất cả thông báo
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
