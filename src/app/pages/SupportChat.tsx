import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  getMyTickets,
  getSupportMessages,
  sendSupportMessage,
  createTicket,
  markSupportRead,
} from '@/api/support'
import { uploadChatAttachments, AttachmentUploadResult } from '@/api/uploads'
import { SupportMessage, SupportTicket, TicketStatus } from '@/types/support'
import { Send, Plus, X, Paperclip, FileText, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Skeleton } from '../components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: 'Mở', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-700' },
  resolved: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-600' },
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export function SupportChat() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [subjectInput, setSubjectInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => getMyTickets({ size: 50 }),
    enabled: !!user,
  })

  const { data: messagesData, isLoading: msgsLoading } = useQuery({
    queryKey: ['support-messages', selectedId],
    queryFn: () => getSupportMessages(selectedId!, { size: 100 }),
    enabled: !!selectedId,
  })

  const createMutation = useMutation({
    mutationFn: () => createTicket({ subject: subjectInput.trim() }),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      setShowCreateDialog(false)
      setSubjectInput('')
      setSelectedId(ticket.id)
      toast.success('Đã tạo yêu cầu hỗ trợ')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const sendMutation = useMutation({
    mutationFn: (payload: { content: string; attachments?: AttachmentUploadResult[] }) =>
      sendSupportMessage(selectedId!, payload),
    onSuccess: (msg) => {
      queryClient.setQueryData<{ items: SupportMessage[] }>(['support-messages', selectedId], (old) => ({
        items: [msg, ...(old?.items ?? [])],
        meta: (old as any)?.meta ?? { page: 1, size: 100, total: 1 },
      }))
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  useEffect(() => {
    if (!selectedId) return
    markSupportRead(selectedId).catch(() => {})
    queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [selectedId, queryClient])

  useEffect(() => {
    if (!selectedId) return
    const channel = supabase
      .channel(`support:${selectedId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `support_conversation_id=eq.${selectedId}`,
        },
        (payload) => {
          const rawSenderId = (payload.new as Record<string, unknown>).sender_id as string | undefined
          if (rawSenderId !== user?.id) {
            queryClient.invalidateQueries({ queryKey: ['support-messages', selectedId] })
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
          }
          queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedId, user?.id, queryClient])

  const tickets = ticketsData?.items ?? []
  const messages = (messagesData?.items ?? []).slice().reverse()
  const selectedTicket = tickets.find((t) => t.id === selectedId)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const total = pendingFiles.length + files.length
    if (total > 5) { toast.error('Tối đa 5 file mỗi tin nhắn'); return }
    const oversized = files.find(f => f.size > 10 * 1024 * 1024)
    if (oversized) { toast.error(`File "${oversized.name}" vượt quá 10 MB`); return }
    setPendingFiles(prev => [...prev, ...files])
    e.target.value = ''
  }

  const handleSend = async () => {
    const hasText = messageInput.trim().length > 0
    const hasFiles = pendingFiles.length > 0
    if ((!hasText && !hasFiles) || sendMutation.isPending || uploading) return

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

  const isClosed = selectedTicket?.status === 'closed'

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hỗ trợ khách hàng</h1>
          <p className="text-gray-500 text-sm mt-1">Gửi yêu cầu hỗ trợ, đội ngũ chúng tôi sẽ phản hồi sớm nhất</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="size-4 mr-2" />
          Tạo yêu cầu mới
        </Button>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-250px)] min-h-[500px]">
        {/* Ticket list */}
        <div className="border rounded-xl bg-white overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <p className="text-sm font-medium text-gray-700">Yêu cầu của tôi</p>
          </div>
          <ScrollArea className="flex-1">
            {ticketsLoading ? (
              <div className="p-3 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center text-gray-400">
                <p className="text-sm">Chưa có yêu cầu nào</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedId(ticket.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedId === ticket.id
                        ? 'bg-orange-50 border border-orange-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium line-clamp-1 flex-1">{ticket.subject}</p>
                      {ticket.userUnread > 0 && (
                        <Badge className="bg-orange-500 text-white text-xs min-w-5 h-5 flex items-center justify-center px-1">
                          {ticket.userUnread}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <StatusBadge status={ticket.status as TicketStatus} />
                      {ticket.lastMessageAt && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(ticket.lastMessageAt), 'dd/MM HH:mm')}
                        </span>
                      )}
                    </div>
                    {ticket.lastMessagePreview && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{ticket.lastMessagePreview}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat window */}
        <div className="border rounded-xl bg-white overflow-hidden flex flex-col">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="font-medium">Chọn yêu cầu để xem tin nhắn</p>
              <p className="text-sm mt-1">hoặc tạo yêu cầu hỗ trợ mới</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <p className="font-semibold line-clamp-1">{selectedTicket?.subject}</p>
                  <StatusBadge status={(selectedTicket?.status ?? 'open') as TicketStatus} />
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {msgsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                        <p className="text-sm">Chưa có tin nhắn nào. Hãy bắt đầu!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isMe && (
                            <Avatar className="size-7 shrink-0 mt-1">
                              <AvatarImage src={msg.senderAvatarUrl ?? undefined} />
                              <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                                {msg.senderName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                            {!isMe && (
                              <span className="text-xs text-gray-500 mb-0.5">{msg.senderName}</span>
                            )}
                            <div
                              className={`px-3 py-2 rounded-2xl text-sm ${
                                isMe
                                  ? 'bg-orange-500 text-white rounded-tr-sm'
                                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                              }`}
                            >
                              {msg.content && <p className="break-words">{msg.content}</p>}
                              {msg.attachments?.length > 0 && (
                                <div className={`space-y-1.5 ${msg.content ? 'mt-2' : ''}`}>
                                  {msg.attachments.map((att, i) =>
                                    att.contentType.startsWith('image/') ? (
                                      <img
                                        key={i}
                                        src={att.url}
                                        alt={att.fileName}
                                        className="max-w-[220px] rounded-lg cursor-pointer hover:opacity-90"
                                        onClick={() => window.open(att.url, '_blank')}
                                      />
                                    ) : (
                                      <a
                                        key={i}
                                        href={att.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs hover:opacity-80 ${isMe ? 'bg-white/20' : 'bg-white/70 border border-gray-200'}`}
                                      >
                                        <FileText className="size-3.5 shrink-0" />
                                        <span className="truncate max-w-[160px]">{att.fileName}</span>
                                        <span className="shrink-0 opacity-60">{(att.fileSize / 1024).toFixed(0)}KB</span>
                                      </a>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 mt-0.5">
                              {format(new Date(msg.sentAt), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                {isClosed ? (
                  <p className="text-center text-sm text-gray-500 py-2">Yêu cầu này đã đóng</p>
                ) : (
                  <>
                    {/* Pending file chips */}
                    {pendingFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {pendingFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-full pl-2.5 pr-1 py-0.5 text-xs max-w-[180px]">
                            <span className="truncate">{f.name}</span>
                            <button
                              type="button"
                              onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                              className="shrink-0 text-gray-400 hover:text-red-500 ml-0.5"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => { e.preventDefault(); handleSend() }}
                    >
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
                      >
                        <Paperclip className="size-4" />
                      </Button>
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={(!messageInput.trim() && pendingFiles.length === 0) || sendMutation.isPending || uploading}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu hỗ trợ mới</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1 block">Tiêu đề vấn đề</label>
            <Input
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              placeholder="VD: Tôi cần hỗ trợ về thanh toán..."
              maxLength={200}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              <X className="size-4 mr-1" />
              Hủy
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!subjectInput.trim() || createMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo yêu cầu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
