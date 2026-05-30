export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface SupportTicket {
  id: string
  userId: string
  userName: string
  userAvatarUrl: string | null
  subject: string
  status: TicketStatus
  userUnread: number
  adminUnread: number
  lastMessagePreview: string | null
  lastMessageAt: string | null
  createdAt: string
}

export interface MessageAttachment {
  url: string
  fileName: string
  fileSize: number
  contentType: string
}

export interface SupportMessage {
  id: string
  supportConversationId: string
  senderId: string
  senderName: string
  senderAvatarUrl: string | null
  content: string
  isRead: boolean
  sentAt: string
  attachments: MessageAttachment[]
}

export interface CreateTicketRequest {
  subject: string
}

export interface SendSupportMessageRequest {
  content: string
  attachments?: MessageAttachment[]
}
