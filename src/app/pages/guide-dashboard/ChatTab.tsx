import { ChatPanel } from '../../components/ChatPanel'

interface ChatTabProps {
  initialConvId?: string | null
}

export function ChatTab({ initialConvId = null }: ChatTabProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Tin nhắn</h2>
        <p className="text-sm text-slate-500">Trao đổi với khách hàng đã đặt tour của bạn.</p>
      </div>
      <ChatPanel
        initialConvId={initialConvId}
        // Subtract dashboard chrome above (greeting + KPIs + pill tabs + tab header)
        // so the composer always sits in the visible viewport.
        className="h-[calc(100vh-460px)] min-h-[440px]"
      />
    </div>
  )
}
