import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getConversations,
  getMessages,
  sendMessage,
  markConversationRead,
} from '@/api/conversations';
import { uploadChatAttachments, AttachmentUploadResult } from '@/api/uploads';
import { Message } from '@/types/chat';
import { Send, ArrowLeft, Paperclip, FileText, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';

export function Chat() {
  const { user } = useAuth();
  const { id: routeConversationId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations({ size: 50 }),
    enabled: !!user,
  });

  const { data: messagesData, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => getMessages(selectedId!, { size: 100 }),
    enabled: !!selectedId,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: { content: string; attachments?: AttachmentUploadResult[] }) =>
      sendMessage(selectedId!, payload),
    onSuccess: (newMessage) => {
      queryClient.setQueryData<{ items: Message[] }>(['messages', selectedId], (old) => ({
        items: [newMessage, ...(old?.items ?? [])],
        meta: old ? (old as any).meta : { page: 1, size: 100, total: 1 },
      }));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    },
  });

  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedId) {
      markConversationRead(selectedId).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [selectedId, queryClient]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!selectedId) return;

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
          // Realtime payload uses raw snake_case DB fields (no joined senderName/Avatar).
          // Only refetch if the message is from the other party; own messages are
          // already added optimistically in sendMutation.onSuccess.
          const rawSenderId = (payload.new as Record<string, unknown>).sender_id as string | undefined;
          if (rawSenderId !== user?.id) {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedId] });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
          }
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, user?.id, queryClient]);

  const conversations = convsData?.items ?? [];
  const messages = (messagesData?.items ?? []).slice().reverse();
  const selectedConv = conversations.find((c) => c.id === selectedId);

  // Auto-open conversation when navigating to /chat/:id
  useEffect(() => {
    if (!routeConversationId) return;
    const exists = conversations.some((c) => c.id === routeConversationId);
    if (exists && selectedId !== routeConversationId) {
      setSelectedId(routeConversationId);
    }
  }, [routeConversationId, conversations, selectedId]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const total = pendingFiles.length + files.length;
    if (total > 5) { toast.error('Tối đa 5 file mỗi tin nhắn'); return; }
    const oversized = files.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) { toast.error(`File "${oversized.name}" vượt quá 10 MB`); return; }
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = messageInput.trim().length > 0;
    const hasFiles = pendingFiles.length > 0;
    if ((!hasText && !hasFiles) || !selectedId || sendMutation.isPending || uploading) return;

    let attachments: AttachmentUploadResult[] = [];
    if (hasFiles) {
      setUploading(true);
      try {
        attachments = await uploadChatAttachments(pendingFiles);
        setPendingFiles([]);
      } catch {
        toast.error('Upload file thất bại. Vui lòng thử lại.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    sendMutation.mutate({ content: messageInput.trim(), attachments });
    setMessageInput('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl mb-2">Tin nhắn</h1>
        <p className="text-gray-600">Trò chuyện với hướng dẫn viên và khách hàng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations List */}
        <Card className={`lg:col-span-1 ${selectedId ? 'hidden lg:block' : ''}`}>
          <CardHeader>
            <CardTitle>Cuộc trò chuyện</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-350px)]">
              {convsLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="size-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>Chưa có cuộc trò chuyện nào</p>
                  <p className="text-sm mt-2">Tin nhắn xuất hiện sau khi booking được xác nhận</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedId === conv.id ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage src={conv.otherUserAvatarUrl ?? undefined} alt={conv.otherUserName} />
                          <AvatarFallback>{(conv.otherUserName || '?')[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium truncate">{conv.otherUserName}</p>
                            {conv.lastMessageAt && (
                              <span className="text-xs text-gray-500 ml-2 shrink-0">
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate mb-1">{conv.tourTitle}</p>
                          {conv.lastMessagePreview && (
                            <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                              {conv.lastMessagePreview}
                            </p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-orange-600 text-white shrink-0">{conv.unreadCount}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className={`lg:col-span-2 ${!selectedId ? 'hidden lg:block' : ''}`}>
          {selectedConv ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedId(null)}>
                    <ArrowLeft className="size-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={selectedConv.otherUserAvatarUrl ?? undefined} alt={selectedConv.otherUserName} />
                    <AvatarFallback>{(selectedConv.otherUserName || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{selectedConv.otherUserName}</p>
                    <p className="text-sm text-gray-500">{selectedConv.tourTitle}</p>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="h-[calc(100vh-480px)] lg:h-[calc(100vh-450px)]">
                <div className="p-4 space-y-4">
                  {msgsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                          <Skeleton className="size-8 rounded-full shrink-0" />
                          <Skeleton className="h-12 w-48 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>Chưa có tin nhắn nào</p>
                      <p className="text-sm mt-2">Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="size-8 shrink-0">
                            <AvatarImage src={msg.senderAvatarUrl ?? undefined} alt={msg.senderName} />
                            <AvatarFallback>{(msg.senderName || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-lg p-3 ${isOwn ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                              {msg.content && <p className="text-sm break-words">{msg.content}</p>}
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
                                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs hover:opacity-80 ${isOwn ? 'bg-white/20' : 'bg-white/70 border border-gray-200'}`}
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
                            <p className="text-xs text-gray-500 mt-1 px-1">{formatTime(msg.sentAt)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-4">
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
                <form onSubmit={handleSend} className="flex gap-2">
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
                    placeholder="Nhập tin nhắn..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={(!messageInput.trim() && pendingFiles.length === 0) || sendMutation.isPending || uploading}
                  >
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p>Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
