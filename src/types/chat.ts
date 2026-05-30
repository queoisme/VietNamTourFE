export interface ConversationListItem {
  id: string
  bookingId: string | null
  tourId: string | null
  otherUserId: string
  otherUserName: string
  otherUserAvatarUrl: string | null
  tourTitle: string
  unreadCount: number
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

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatarUrl: string | null
  content: string
  isRead: boolean
  readAt: string | null
  sentAt: string
  attachments: MessageAttachment[]
}

export interface SendMessageRequest {
  content: string
  attachments?: MessageAttachment[]
}
