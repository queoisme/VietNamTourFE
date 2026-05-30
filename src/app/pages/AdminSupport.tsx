import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  adminGetAllTickets,
  adminGetMessages,
  adminSendMessage,
  adminUpdateStatus,
  adminMarkRead,
} from '@/api/support'
import { SupportMessage, SupportTicket, TicketStatus } from '@/types/support'
import { Send, Paperclip, Loader2, X } from 'lucide-react'
import { uploadChatAttachments, AttachmentUploadResult } from '@/api/uploads'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Skeleton } from '../components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
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

export function AdminSupport() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin-support-tickets', filterStatus],
    queryFn: () =>
      adminGetAllTickets({ size: 100, status: filterStatus === 'all' ? undefined : filterStatus }),
    enabled: !!user,
  })

  const { data: messagesData, isLoading: msgsLoading } = useQuery({
    queryKey: ['admin-support-messages', selectedId],
    queryFn: () => adminGetMessages(selectedId!, { size: 100 }),
    enabled: !!selectedId,
  })

  const sendMutation = useMutation({
    mutationFn: (payload: { content: string; attachments?: AttachmentUploadResult[] }) =>
      adminSendMessage(selectedId!, payload),
    onSuccess: (msg) => {
      queryClient.setQueryData<{ items: SupportMessage[] }>(['admin-support-messages', selectedId], (old) => ({
        items: [msg, ...(old?.items ?? [])],
        meta: (old as any)?.meta ?? { page: 1, size: 100, total: 1 },
      }))
      setMessageInput('')
      setPendingFiles([])
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => adminUpdateStatus(selectedId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['admin-support-messages', selectedId] })
      toast.success('Đã cập nhật trạng thái')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  useEffect(() => {
    if (!selectedId) return
    adminMarkRead(selectedId).catch(() => {})
    queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] })
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [selectedId, queryClient])

  useEffect(() => {
    if (!selectedId) return
    const channel = supabase
      .channel(`admin-support:${selectedId}`)
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
            queryClient.invalidateQueries({ queryKey: ['admin-support-messages', selectedId] })
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
          }
          queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] })
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
    const oversize = files.find((f) => f.size > 10 * 1024 * 1024)
    if (oversize) { toast.error(`File "${oversize.name}" vượt quá 10 MB`); return }
    setPendingFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const removePendingFile = (idx: number) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx))

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = messageInput.trim()
    if ((!content && pendingFiles.length === 0) || sendMutation.isPending) return

    let attachments: AttachmentUploadResult[] = []
    if (pendingFiles.length > 0) {
      setUploading(true)
      try {
        attachments = await uploadChatAttachments(pendingFiles)
      } catch {
        toast.error('Upload file thất bại')
        setUploading(false)
        return
      }
      setUploading(false)
    }
    sendMutation.mutate({ content, attachments: attachments.length ? attachments : undefined })
  }

  const totalAdminUnread = tickets.reduce((sum, t) => sum + t.adminUnread, 0)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Hỗ trợ người dùng
            {totalAdminUnread > 0 && (
              <Badge className="bg-red-500 text-white">{totalAdminUnread}</Badge>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý tất cả yêu cầu hỗ trợ từ người dùng</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="open">Mở</SelectItem>
              <SelectItem value="in_progress">Đang xử lý</SelectItem>
              <SelectItem value="resolved">Đã giải quyết</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4 h-[calc(100vh-260px)] min-h-[500px]">
        {/* Ticket list */}
        <div className="border rounded-xl bg-white overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              {tickets.length} yêu cầu
            </p>
          </div>
          <ScrollArea className="flex-1">
            {ticketsLoading ? (
              <div className="p-3 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center text-gray-400">
                <p className="text-sm">Không có yêu cầu nào</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedId(ticket.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedId === ticket.id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <Avatar className="size-7 shrink-0 mt-0.5">
                        <AvatarImage src={ticket.userAvatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                          {ticket.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs text-gray-500 truncate">{ticket.userName}</p>
                          {ticket.adminUnread > 0 && (
                            <Badge className="bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center px-1 shrink-0">
                              {ticket.adminUnread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium line-clamp-1">{ticket.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pl-9">
                      <StatusBadge status={ticket.status as TicketStatus} />
                      {ticket.lastMessageAt && (
                        <span className="text-xs text-gray-400">
                          {format(new Date(ticket.lastMessageAt), 'dd/MM HH:mm')}
                        </span>
                      )}
                    </div>
                    {ticket.lastMessagePreview && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1 pl-9">{ticket.lastMessagePreview}</p>
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
              <p className="font-medium">Chọn yêu cầu để phản hồi</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold line-clamp-1">{selectedTicket?.subject}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={(selectedTicket?.status ?? 'open') as TicketStatus} />
                    {selectedTicket && (
                      <span className="text-xs text-gray-500">— {selectedTicket.userName}</span>
                    )}
                  </div>
                </div>
                <Select
                  value={selectedTicket?.status ?? 'open'}
                  onValueChange={(val) => statusMutation.mutate(val)}
                  disabled={statusMutation.isPending}
                >
                  <SelectTrigger className="w-44 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Mở</SelectItem>
                    <SelectItem value="in_progress">Đang xử lý</SelectItem>
                    <SelectItem value="resolved">Đã giải quyết</SelectItem>
                    <SelectItem value="closed">Đã đóng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {msgsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                    <p className="text-sm">Chưa có tin nhắn nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isAdmin = msg.senderId === user?.id
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isAdmin && (
                            <Avatar className="size-7 shrink-0 mt-1">
                              <AvatarImage src={msg.senderAvatarUrl ?? undefined} />
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                {msg.senderName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                            {!isAdmin && (
                              <span className="text-xs text-gray-500 mb-0.5">{msg.senderName}</span>
                            )}
                            <div
                              className={`px-3 py-2 rounded-2xl text-sm ${
                                isAdmin
                                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                                  : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                              }`}
                            >
                              {msg.content}
                              {msg.attachments?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((att, i) => {
                                    const isImage = att.contentType.startsWith('image/')
                                    return isImage ? (
                                      <img
                                        key={i}
                                        src={att.url}
                                        alt={att.fileName}
                                        className="max-w-[240px] rounded-lg cursor-pointer"
                                        onClick={() => window.open(att.url, '_blank')}
                                      />
                                    ) : (
                                      <a
                                        key={i}
                                        href={att.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:opacity-80 ${
                                          isAdmin ? 'bg-white/20 hover:bg-white/30' : 'bg-white/60 hover:bg-white'
                                        }`}
                                      >
                                        <span className="truncate max-w-[160px]">{att.fileName}</span>
                                        <span className="shrink-0 opacity-70">
                                          {(att.fileSize / 1024).toFixed(0)}KB
                                        </span>
                                      </a>
                                    )
                                  })}
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
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs max-w-[180px]">
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => removePendingFile(i)}
                          className="text-gray-400 hover:text-red-500 shrink-0"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <form className="flex gap-2" onSubmit={handleSend}>
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
                    className="shrink-0"
                    disabled={pendingFiles.length >= 5 || uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" />
                  </Button>
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Nhập phản hồi..."
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={(!messageInput.trim() && pendingFiles.length === 0) || sendMutation.isPending || uploading}
                    className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                  >
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
