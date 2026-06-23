import { ChatPanel } from '../../components/ChatPanel'

interface ChatTabProps {
  initialConvId?: string | null
}

export function ChatTab({ initialConvId = null }: ChatTabProps) {
  // Rendered immersively (no greeting/KPIs/pill tabs above), so the panel can
  // fill almost the entire viewport — leaving just dashboard padding + mobile bar.
  return (
    <ChatPanel
      initialConvId={initialConvId}
      className="h-[calc(100vh-100px)] min-h-[480px]"
    />
  )
}
