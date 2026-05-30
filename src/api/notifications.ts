import api from './client'
import { Notification } from '@/types/finance'
import { PaginatedMeta } from '@/types/api'

export interface NotificationListResponse {
  items: Notification[]
  meta: PaginatedMeta
}

export async function getNotifications(params: { page?: number; size?: number; isRead?: boolean } = {}): Promise<NotificationListResponse> {
  const res = await api.get('/notifications', { params })
  return res.data
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get('/notifications/unread-count')
  return (res.data as { count: number }).count
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.put(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put('/notifications/read-all')
}
