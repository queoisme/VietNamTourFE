import { useParams, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Sparkles } from 'lucide-react'
import { getConversations } from '@/api/conversations'
import { useAuth } from '../contexts/AuthContext'
import { ChatPanel } from '../components/ChatPanel'

export function Chat() {
  const { user } = useAuth()
  const { id: routeConversationId } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations({ size: 50 }),
    enabled: !!user,
  })

  const totalUnread = (convsData?.items ?? []).reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-rose-500 to-red-500 py-5 text-white">
        <div className="container relative mx-auto flex flex-wrap items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">Tin Nhắn</h1>
              <p className="text-xs text-white/85 md:text-sm">
                Kết nối với hướng dẫn viên cho chuyến đi của bạn.
              </p>
            </div>
          </div>

          {totalUnread > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 ring-1 ring-white/25">
              <Sparkles className="size-3.5" />
              <span className="text-xs font-medium">{totalUnread} chưa đọc</span>
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        <ChatPanel
          initialConvId={routeConversationId ?? null}
          onSelectConversation={(id) => navigate(`/chat/${id}`)}
          className="h-[calc(100vh-200px)]"
        />
      </div>
    </div>
  )
}
