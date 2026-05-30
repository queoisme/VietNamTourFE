import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  bookingId: string;
  guideId: string;
  guideName: string;
  guideAvatar: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  tourName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface ChatContextType {
  conversations: Conversation[];
  messages: ChatMessage[];
  sendMessage: (conversationId: string, message: string) => void;
  getConversation: (conversationId: string) => Conversation | undefined;
  getMessages: (conversationId: string) => ChatMessage[];
  markAsRead: (conversationId: string) => void;
  getTotalUnread: () => number;
  createOrGetConversation: (bookingId: string, guideId: string, guideName: string, guideAvatar: string, customerId: string, customerName: string, customerAvatar: string, tourName: string) => string;
  createConversationFromBooking: (booking: any, tour: any) => string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    loadChatData();
  }, []);

  const loadChatData = () => {
    const savedConversations = localStorage.getItem('conversations');
    const savedMessages = localStorage.getItem('chatMessages');

    if (savedConversations) {
      setConversations(JSON.parse(savedConversations));
    }
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  const createOrGetConversation = (
    bookingId: string,
    guideId: string,
    guideName: string,
    guideAvatar: string,
    customerId: string,
    customerName: string,
    customerAvatar: string,
    tourName: string
  ): string => {
    // Load current conversations from localStorage
    const savedConversations = localStorage.getItem('conversations');
    const currentConversations = savedConversations ? JSON.parse(savedConversations) : [];
    
    // Check if conversation already exists
    const existing = currentConversations.find((c: Conversation) => c.bookingId === bookingId);
    if (existing) {
      return existing.id;
    }

    // Create new conversation
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      bookingId,
      guideId,
      guideName,
      guideAvatar,
      customerId,
      customerName,
      customerAvatar,
      tourName,
      unreadCount: 0,
    };

    const updated = [...currentConversations, newConversation];
    setConversations(updated);
    localStorage.setItem('conversations', JSON.stringify(updated));

    return newConversation.id;
  };

  const createConversationFromBooking = (booking: any, tour: any): string => {
    const guideId = booking.guideId;
    const guideName = booking.guideName;
    const guideAvatar = booking.guideAvatar;
    const customerId = booking.customerId;
    const customerName = booking.customerName;
    const customerAvatar = booking.customerAvatar;
    const tourName = tour.name;
    const bookingId = booking.id;

    return createOrGetConversation(bookingId, guideId, guideName, guideAvatar, customerId, customerName, customerAvatar, tourName);
  };

  const sendMessage = (conversationId: string, message: string) => {
    if (!user || !message.trim()) return;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar || '',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));

    // Update conversation
    const recipientId = user.id === conversation.guideId ? conversation.customerId : conversation.guideId;
    const updatedConversations = conversations.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: message.trim(),
          lastMessageTime: new Date().toISOString(),
          unreadCount: user.id === recipientId ? c.unreadCount : c.unreadCount + 1,
        };
      }
      return c;
    });

    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
  };

  const getConversation = (conversationId: string) => {
    return conversations.find(c => c.id === conversationId);
  };

  const getMessages = (conversationId: string) => {
    return messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const markAsRead = (conversationId: string) => {
    if (!user) return;

    // Mark messages as read
    const updatedMessages = messages.map(m => {
      if (m.conversationId === conversationId && m.senderId !== user.id) {
        return { ...m, read: true };
      }
      return m;
    });
    setMessages(updatedMessages);
    localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));

    // Update conversation unread count
    const updatedConversations = conversations.map(c => {
      if (c.id === conversationId) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    });
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
  };

  const getTotalUnread = () => {
    if (!user) return 0;

    return conversations
      .filter(c => {
        // Count unread for current user's conversations
        return (c.guideId === user.id || c.customerId === user.id);
      })
      .reduce((total, c) => {
        // Only count if the last message was not from current user
        const lastMsg = messages
          .filter(m => m.conversationId === c.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        if (lastMsg && lastMsg.senderId !== user.id && !lastMsg.read) {
          return total + 1;
        }
        return total;
      }, 0);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        messages,
        sendMessage,
        getConversation,
        getMessages,
        markAsRead,
        getTotalUnread,
        createOrGetConversation,
        createConversationFromBooking,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}