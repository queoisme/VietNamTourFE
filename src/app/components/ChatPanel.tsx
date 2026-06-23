import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Send, ArrowLeft, Paperclip, FileText, Loader2, X,
  MessageCircle, Search, MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
} from '@/api/conversations'
import { uploadChatAttachments, AttachmentUploadResult } from '@/api/uploads'
import { Message } from '@/types/chat'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Skeleton } from './ui/skeleton'
import { cn } from './ui/utils'

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 24) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (diffHours < 48) return 'Hôm qua'
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export interface ChatPanelProps {
  initialConvId?: string | null
  /** Called when user clicks a conversation. Use to sync URL (e.g. /chat/:id). */
  onSelectConversation?: (id: string) => void
  /** Tailwind class for the outer card wrapper — controls height. */
  className?: string
}

export function ChatPanel({
  initialConvId = null,
  onSelectConversation,
  className,
}: ChatPanelProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(initialConvId)
  const [messageInput, setMessageInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll only the messages viewport, not the window — otherwise opening a
  // conversation jumps the whole page down to the chat bottom.
  const scrollMessagesToBottom = (smooth = true) => {
    const end = messagesEndRef.current
    if (!end) return
    const viewport = end.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    } else {
      end.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' })
    }
  }

  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations({ size: 50 }),
    enabled: !!user,
  })

  const { data: messagesData, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => getMessages(selectedId!, { size: 100 }),
    enabled: !!selectedId,
  })

  const sendMutation = useMutation({
    mutationFn: (payload: { content: string; attachments?: AttachmentUploadResult[] }) =>
      sendMessage(selectedId!, payload),
    onSuccess: (newMessage) => {
      queryClient.setQueryData<{ items: Message[] }>(['messages', selectedId], (old) => ({
        items: [newMessage, ...(old?.items ?? [])],
        meta: old ? (old as any).meta : { page: 1, size: 100, total: 1 },
      }))
      setTimeout(() => scrollMessagesToBottom(), 50)
    },
  })

  useEffect(() => {
    if (selectedId) {
      markConversationRead(selectedId).catch(() => {})
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] })
      setTimeout(() => scrollMessagesToBottom(false), 100)
    }
  }, [selectedId, queryClient])

  useEffect(() => {
    if (!selectedId) return

    const channel = supabase
      .channel(`conversation:${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const rawSenderId = (payload.new as Record<string, unknown>).sender_id as string | undefined
          if (rawSenderId !== user?.id) {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedId] })
            setTimeout(() => scrollMessagesToBottom(), 200)
          }
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedId, user?.id, queryClient])

  const conversations = convsData?.items ?? []
  const messages = (messagesData?.items ?? []).slice().reverse()
  const selectedConv = conversations.find((c) => c.id === selectedId)

  const filteredConvs = search.trim()
    ? conversations.filter((c) =>
        (c.otherUserName + ' ' + (c.tourTitle ?? '')).toLowerCase().includes(search.toLowerCase()),
      )
    : conversations

  // Sync external prop changes (e.g. URL route param).
  useEffect(() => {
    if (initialConvId && initialConvId !== selectedId) {
      const exists = conversations.some((c) => c.id === initialConvId)
      if (exists) setSelectedId(initialConvId)
    }
  }, [initialConvId, conversations, selectedId])

  const handlePickConv = (id: string) => {
    setSelectedId(id)
    onSelectConversation?.(id)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (pendingFiles.length + files.length > 5) { toast.error('Tối đa 5 file mỗi tin nhắn'); return }
    const oversized = files.find(f => f.size > 10 * 1024 * 1024)
    if (oversized) { toast.error(`File "${oversized.name}" vượt quá 10 MB`); return }
    setPendingFiles(prev => [...prev, ...files])
    e.target.value = ''
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasText = messageInput.trim().length > 0
    const hasFiles = pendingFiles.length > 0
    if ((!hasText && !hasFiles) || !selectedId || sendMutation.isPending || uploading) return

    let attachments: AttachmentUploadResult[] = []
    if (hasFiles) {
      setUploading(true)
      try {
        attachments = await uploadChatAttachments(pendingFiles)
        setPendingFiles([])
      } catch {
        toast.error('Upload file thất bại. Vui lòng thử lại.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    sendMutation.mutate({ content: messageInput.trim(), attachments })
    setMessageInput('')
  }

  return (
    <div className={cn(
      'grid min-h-[560px] grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[360px_1fr]',
      className,
    )}>
      {/* Conversations list */}
      <aside className={cn(
        'flex h-full flex-col border-slate-100 lg:border-r',
        selectedId ? 'hidden lg:flex' : 'flex',
      )}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Cuộc trò chuyện</h2>
          <p className="mt-0.5 text-xs text-slate-500">{conversations.length} cuộc trò chuyện</p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm cuộc trò chuyện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 bg-slate-50 pl-9 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {convsLoading ? (
            <div className="space-y-1 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 p-2">
                  <Skeleton className="size-11 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <MessageCircle className="size-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                {search ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện'}
              </p>
              <p className="max-w-[240px] text-xs text-slate-500">
                {search
                  ? 'Thử từ khoá khác.'
                  : 'Cuộc trò chuyện sẽ xuất hiện sau khi booking được xác nhận.'}
              </p>
            </div>
          ) : (
            <ul className="py-2">
              {filteredConvs.map((conv) => {
                const active = selectedId === conv.id
                return (
                  <li key={conv.id}>
                    <button
                      onClick={() => handlePickConv(conv.id)}
                      className={cn(
                        'group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                        active ? 'bg-gradient-to-r from-orange-50 to-rose-50' : 'hover:bg-slate-50',
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="size-11 ring-2 ring-white">
                          <AvatarImage src={conv.otherUserAvatarUrl ?? undefined} alt={conv.otherUserName} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-400 to-rose-500 text-sm font-semibold text-white">
                            {(conv.otherUserName || '?')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            'truncate text-sm text-slate-800',
                            conv.unreadCount > 0 ? 'font-semibold' : 'font-medium',
                          )}>
                            {conv.otherUserName}
                          </p>
                          {conv.lastMessageAt && (
                            <span className="shrink-0 text-[11px] text-slate-400">
                              {formatTime(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        {conv.tourTitle && (
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-orange-600">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{conv.tourTitle}</span>
                          </p>
                        )}
                        {conv.lastMessagePreview && (
                          <p className={cn(
                            'mt-0.5 truncate text-xs',
                            conv.unreadCount > 0 ? 'font-medium text-slate-700' : 'text-slate-500',
                          )}>
                            {conv.lastMessagePreview}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>
      </aside>

      {/* Chat window */}
      <section className={cn(
        'flex h-full flex-col bg-gradient-to-br from-slate-50 to-white',
        selectedId ? 'flex' : 'hidden lg:flex',
      )}>
        {selectedConv ? (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-3.5">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <Avatar className="size-10">
                <AvatarImage src={selectedConv.otherUserAvatarUrl ?? undefined} alt={selectedConv.otherUserName} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-rose-500 text-sm font-semibold text-white">
                  {(selectedConv.otherUserName || '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{selectedConv.otherUserName}</p>
                {selectedConv.tourTitle && (
                  <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                    <MapPin className="size-3 shrink-0 text-orange-500" />
                    <span className="truncate">{selectedConv.tourTitle}</span>
                  </p>
                )}
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3 px-5 py-4">
                {msgsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={cn('flex gap-2', i % 2 === 0 ? '' : 'flex-row-reverse')}>
                        <Skeleton className="size-8 shrink-0 rounded-full" />
                        <Skeleton className="h-10 w-48 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-rose-100 text-orange-500">
                      <MessageCircle className="size-7" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Chưa có tin nhắn</p>
                    <p className="text-xs text-slate-500">Gửi lời chào để bắt đầu chuyến đi nhé!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwn = msg.senderId === user?.id
                    const prev = messages[idx - 1]
                    const showAvatar = !prev || prev.senderId !== msg.senderId
                    return (
                      <div key={msg.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : '')}>
                        <div className="w-8 shrink-0">
                          {showAvatar && (
                            <Avatar className="size-8">
                              <AvatarImage src={msg.senderAvatarUrl ?? undefined} alt={msg.senderName} />
                              <AvatarFallback className={cn(
                                'text-xs font-semibold text-white',
                                isOwn
                                  ? 'bg-gradient-to-br from-orange-500 to-red-500'
                                  : 'bg-gradient-to-br from-slate-400 to-slate-500',
                              )}>
                                {(msg.senderName || '?')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div className={cn('flex max-w-[72%] flex-col', isOwn ? 'items-end' : 'items-start')}>
                          <div className={cn(
                            'rounded-2xl px-3.5 py-2 shadow-sm',
                            isOwn
                              ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-md'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-tl-md',
                          )}>
                            {msg.content && (
                              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</p>
                            )}
                            {msg.attachments?.length > 0 && (
                              <div className={cn('space-y-1.5', msg.content ? 'mt-2' : '')}>
                                {msg.attachments.map((att, i) =>
                                  att.contentType.startsWith('image/') ? (
                                    <img
                                      key={i}
                                      src={att.url}
                                      alt={att.fileName}
                                      loading="lazy"
                                      decoding="async"
                                      className="max-w-[240px] cursor-pointer rounded-lg transition-opacity hover:opacity-90"
                                      onClick={() => window.open(att.url, '_blank')}
                                    />
                                  ) : (
                                    <a
                                      key={i}
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={cn(
                                        'flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors',
                                        isOwn
                                          ? 'bg-white/20 hover:bg-white/30 text-white'
                                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700',
                                      )}
                                    >
                                      <FileText className="size-3.5 shrink-0" />
                                      <span className="max-w-[160px] truncate">{att.fileName}</span>
                                      <span className="shrink-0 opacity-70">{(att.fileSize / 1024).toFixed(0)} KB</span>
                                    </a>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          <p className="mt-0.5 px-1 text-[10px] text-slate-400">{formatTime(msg.sentAt)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-slate-100 bg-white p-3">
              {pendingFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex max-w-[200px] items-center gap-1 rounded-full bg-orange-50 py-1 pl-3 pr-1 text-xs text-orange-700">
                      <FileText className="size-3 shrink-0" />
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="ml-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-orange-500 hover:bg-orange-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || pendingFiles.length >= 5}
                  title="Đính kèm file"
                  className="size-9 shrink-0 rounded-full text-slate-500 hover:bg-orange-100 hover:text-orange-600"
                >
                  <Paperclip className="size-4" />
                </Button>
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="h-9 flex-1 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  type="submit"
                  disabled={(!messageInput.trim() && pendingFiles.length === 0) || sendMutation.isPending || uploading}
                  className="size-9 shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-red-500 p-0 text-white shadow-md shadow-orange-500/30 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-rose-100 text-orange-500">
                <MessageCircle className="size-10" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-slate-800">Bắt đầu trò chuyện</h3>
              <p className="max-w-sm text-sm text-slate-500">
                Chọn một cuộc trò chuyện ở bên trái để xem tin nhắn.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
