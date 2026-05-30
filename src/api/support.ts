import api from './client'
import { SupportTicket, SupportMessage, CreateTicketRequest, SendSupportMessageRequest } from '@/types/support'
import { PaginatedMeta } from '@/types/api'

export interface TicketListResponse {
  items: SupportTicket[]
  meta: PaginatedMeta
}

export interface MessageListResponse {
  items: SupportMessage[]
  meta: PaginatedMeta
}

// --- User ---

export async function createTicket(data: CreateTicketRequest): Promise<SupportTicket> {
  const res = await api.post('/support-chat', data)
  return res.data
}

export async function getMyTickets(params: { page?: number; size?: number } = {}): Promise<TicketListResponse> {
  const res = await api.get('/support-chat', { params })
  return res.data
}

export async function getTicket(id: string): Promise<SupportTicket> {
  const res = await api.get(`/support-chat/${id}`)
  return res.data
}

export async function getSupportMessages(
  id: string,
  params: { before?: string; size?: number } = {},
): Promise<MessageListResponse> {
  const res = await api.get(`/support-chat/${id}/messages`, { params })
  return res.data
}

export async function sendSupportMessage(id: string, data: SendSupportMessageRequest): Promise<SupportMessage> {
  const res = await api.post(`/support-chat/${id}/messages`, data)
  return res.data
}

export async function markSupportRead(id: string): Promise<void> {
  await api.put(`/support-chat/${id}/read`)
}

// --- Admin ---

export async function adminGetAllTickets(params: { page?: number; size?: number; status?: string } = {}): Promise<TicketListResponse> {
  const res = await api.get('/admin/support-chat', { params })
  return res.data
}

export async function adminGetMessages(
  id: string,
  params: { before?: string; size?: number } = {},
): Promise<MessageListResponse> {
  const res = await api.get(`/admin/support-chat/${id}/messages`, { params })
  return res.data
}

export async function adminSendMessage(id: string, data: SendSupportMessageRequest): Promise<SupportMessage> {
  const res = await api.post(`/admin/support-chat/${id}/messages`, data)
  return res.data
}

export async function adminUpdateStatus(id: string, status: string): Promise<SupportTicket> {
  const res = await api.put(`/admin/support-chat/${id}/status`, { status })
  return res.data
}

export async function adminMarkRead(id: string): Promise<void> {
  await api.put(`/admin/support-chat/${id}/read`)
}
