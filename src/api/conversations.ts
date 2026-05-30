import api from './client'
import { ConversationListItem, Message, SendMessageRequest } from '@/types/chat'
import { PaginatedMeta } from '@/types/api'

export interface ConversationListResponse {
  items: ConversationListItem[]
  meta: PaginatedMeta
}

export interface MessageListResponse {
  items: Message[]
  meta: PaginatedMeta
}

export async function getConversations(params: { page?: number; size?: number } = {}): Promise<ConversationListResponse> {
  const res = await api.get('/conversations', { params })
  return res.data
}

export async function getConversation(id: string): Promise<ConversationListItem> {
  const res = await api.get(`/conversations/${id}`)
  return res.data
}

export async function getMessages(
  id: string,
  params: { page?: number; size?: number; before?: string } = {},
): Promise<MessageListResponse> {
  const res = await api.get(`/conversations/${id}/messages`, { params })
  return res.data
}

export async function sendMessage(id: string, data: SendMessageRequest): Promise<Message> {
  const res = await api.post(`/conversations/${id}/messages`, data)
  return res.data
}

export async function markConversationRead(id: string): Promise<void> {
  await api.put(`/conversations/${id}/read`)
}

interface GetOrCreateConversationOptions {
  otherUserId?: string
}

async function findExistingConversation(bookingId: string, otherUserId?: string): Promise<ConversationListItem | null> {
  try {
    const convs = await getConversations({ size: 100 })
    const byBooking = convs.items.find((c) => c.bookingId === bookingId)
    if (byBooking) return byBooking
    if (!otherUserId) return null
    const byUser = convs.items.find((c) => c.otherUserId === otherUserId)
    return byUser ?? null
  } catch {
    return null
  }
}

export async function getOrCreateConversationByBooking(
  bookingId: string,
  options: GetOrCreateConversationOptions = {},
): Promise<ConversationListItem | null> {
  const { otherUserId } = options
  let originalError: unknown = null

  try {
    const res = await api.post(`/conversations/by-booking/${bookingId}`)
    return res.data
  } catch (error) {
    originalError = error
  }

  const existing = await findExistingConversation(bookingId, otherUserId)
  if (existing) return existing

  if (originalError instanceof Error) throw originalError
  throw new Error('Không thể tạo hoặc tìm thấy hội thoại')
}

export async function getOrCreateConversationByTour(tourId: string): Promise<ConversationListItem> {
  try {
    const res = await api.post(`/conversations/by-tour/${tourId}`)
    return res.data
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Không thể mở chat với guide lúc này')
  }
}
