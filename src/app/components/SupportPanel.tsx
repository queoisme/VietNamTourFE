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
import {
  Send, Plus, X, Paperclip, FileText, Loader2,
  LifeBuoy, ArrowLeft, Search,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Skeleton } from './ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui/dialog'
import { toast } from 'sonner'
import { cn } from './ui/utils'

const STATUS_CONFIG: Record<TicketStatus, { label: string; tone: string }> = {
  open: { label: 'Mở', tone: 'bg-sky-100 text-sky-700' },
  in_progress: { label: 'Đang xử lý', tone: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Đã giải quyết', tone: 'bg-emerald-100 text-emerald-700' },
  closed: { label: 'Đã đóng', tone: 'bg-slate-100 text-slate-600' },
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', cfg.tone)}>
      {cfg.label}
    </span>
  )
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  if (diffHours < 24) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (diffHours < 48) return 'Hôm qua'
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export interface SupportPanelProps {
  className?: string
}

export function SupportPanel({ className }: SupportPanelProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [subjectInput, setSubjectInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollMessagesToBottom = (smooth = true) => {
    const end = messagesEndRef.current
    if (!end) return
    const viewport = end.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
    else end.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest' })
  }

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
    onSuccess: (ticket: SupportTicket) => {
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
      setTimeout(() => scrollMessagesToBottom(), 50)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  useEffect(() => {
    if (!selectedId) return
    markSupportRead(selectedId).catch(() => {})
    queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    setTimeout(() => scrollMessagesToBottom(false), 100)
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
            setTimeout(() => scrollMessagesToBottom(), 200)
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
  const filteredTickets = search.trim()
    ? tickets.filter((t) => t.subject.toLowerCase().includes(search.toLowerCase()))
    : tickets

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (pendingFiles.length + files.length > 5) { toast.error('Tối đa 5 file mỗi tin nhắn'); return }
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
    <>
      <div className={cn(
        'grid min-h-[560px] grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[360px_1fr]',
        className,
      )}>
        {/* Tickets list */}
        <aside className={cn(
          'flex h-full flex-col border-slate-100 lg:border-r',
          selectedId ? 'hidden lg:flex' : 'flex',
        )}>
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">Yêu cầu hỗ trợ</h2>
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 text-xs text-white shadow-md shadow-orange-500/30 hover:from-orange-600 hover:to-red-600"
              >
                <Plus className="mr-1 size-3.5" />
                Tạo mới
              </Button>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{tickets.length} yêu cầu</p>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm yêu cầu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 bg-slate-50 pl-9 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            {ticketsLoading ? (
              <div className="space-y-1 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                  <LifeBuoy className="size-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {search ? 'Không tìm thấy yêu cầu' : 'Chưa có yêu cầu nào'}
                </p>
                <p className="max-w-[240px] text-xs text-slate-500">
                  {search ? 'Thử từ khoá khác.' : 'Bấm "Tạo mới" để gửi yêu cầu hỗ trợ đầu tiên.'}
                </p>
              </div>
            ) : (
              <ul className="py-2">
                {filteredTickets.map((ticket) => {
                  const active = selectedId === ticket.id
                  return (
                    <li key={ticket.id}>
                      <button
                        onClick={() => setSelectedId(ticket.id)}
                        className={cn(
                          'group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                          active ? 'bg-gradient-to-r from-orange-50 to-rose-50' : 'hover:bg-slate-50',
                        )}
                      >
                        <div className="relative shrink-0">
                          <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white ring-2 ring-white">
                            <LifeBuoy className="size-5" />
                          </div>
                          {ticket.userUnread > 0 && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                              {ticket.userUnread > 9 ? '9+' : ticket.userUnread}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              'truncate text-sm text-slate-800',
                              ticket.userUnread > 0 ? 'font-semibold' : 'font-medium',
                            )}>
                              {ticket.subject}
                            </p>
                            {ticket.lastMessageAt && (
                              <span className="shrink-0 text-[11px] text-slate-400">
                                {formatTime(ticket.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <StatusBadge status={ticket.status as TicketStatus} />
                          </div>
                          {ticket.lastMessagePreview && (
                            <p className={cn(
                              'mt-1 truncate text-xs',
                              ticket.userUnread > 0 ? 'font-medium text-slate-700' : 'text-slate-500',
                            )}>
                              {ticket.lastMessagePreview}
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
          {selectedTicket ? (
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
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white">
                  <LifeBuoy className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{selectedTicket.subject}</p>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedTicket.status as TicketStatus} />
                  </div>
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
                        <LifeBuoy className="size-7" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">Chưa có tin nhắn</p>
                      <p className="text-xs text-slate-500">Mô tả vấn đề để đội hỗ trợ giúp bạn nhanh nhất.</p>
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
                                    : 'bg-gradient-to-br from-indigo-400 to-violet-500',
                                )}>
                                  {(msg.senderName || '?')[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <div className={cn('flex max-w-[72%] flex-col', isOwn ? 'items-end' : 'items-start')}>
                            {!isOwn && showAvatar && (
                              <span className="mb-0.5 px-1 text-[11px] font-medium text-slate-500">{msg.senderName}</span>
                            )}
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
                {isClosed ? (
                  <p className="py-2 text-center text-sm text-slate-500">Yêu cầu này đã đóng.</p>
                ) : (
                  <>
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
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSend() }}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100"
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
                        className="size-9 shrink-0 rounded-full text-slate-500 hover:bg-orange-100 hover:text-orange-600"
                      >
                        <Paperclip className="size-4" />
                      </Button>
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Nhập tin nhắn..."
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
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-rose-100 text-orange-500">
                  <LifeBuoy className="size-10" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-slate-800">Chúng tôi luôn sẵn sàng hỗ trợ</h3>
                <p className="mb-4 max-w-sm text-sm text-slate-500">
                  Chọn một yêu cầu ở bên trái hoặc tạo yêu cầu mới — đội ngũ sẽ phản hồi sớm nhất.
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md shadow-orange-500/30 hover:from-orange-600 hover:to-red-600"
                >
                  <Plus className="mr-1.5 size-4" />
                  Tạo yêu cầu mới
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu hỗ trợ mới</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="mb-1 block text-sm font-medium">Tiêu đề vấn đề</label>
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
              <X className="mr-1 size-4" />
              Hủy
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!subjectInput.trim() || createMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo yêu cầu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
