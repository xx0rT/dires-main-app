import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatTime, isOnline } from '@/lib/utils'
import { Database } from '@/types/database'
import { Send } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']
type Conversation = Database['public']['Tables']['chat_conversations']['Row'] & {
  partner?: Profile
  unread_count?: number
  last_message?: string
}
type Message = Database['public']['Tables']['chat_messages']['Row']

export default function MessagesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { conversationId } = useParams<{ conversationId: string }>()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id)
        loadConversations(user.id)
      }
    })
  }, [])

  useEffect(() => {
    if (location.state?.trainerId && currentUserId) {
      handleCreateOrOpenConversation(location.state.trainerId)
    }
  }, [location.state, currentUserId])

  useEffect(() => {
    if (conversationId && currentUserId) {
      loadConversationById(conversationId)
    }
  }, [conversationId, currentUserId])

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id)
      markMessagesAsRead(activeConversation.id)

      const channel = supabase
        .channel(`messages:${activeConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${activeConversation.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message])
            markMessagesAsRead(activeConversation.id)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [activeConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadConversations(userId: string) {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .or(`user_id.eq.${userId},trainer_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error loading conversations:', error)
      return
    }

    const conversationsWithPartners = await Promise.all(
      (data || []).map(async (conv) => {
        const partnerId = conv.user_id === userId ? conv.trainer_id : conv.user_id

        const { data: partner } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerId)
          .maybeSingle()

        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('read', false)
          .neq('sender_id', userId)

        return {
          ...conv,
          partner: partner || undefined,
          last_message: lastMessage?.content,
          unread_count: count || 0,
        }
      })
    )

    setConversations(conversationsWithPartners)
  }

  async function loadConversationById(convId: string) {
    if (!currentUserId) return

    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', convId)
      .maybeSingle()

    if (error || !data) {
      console.error('Error loading conversation:', error)
      return
    }

    const partnerId = data.user_id === currentUserId ? data.trainer_id : data.user_id

    const { data: partner } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .maybeSingle()

    setActiveConversation({
      ...data,
      partner: partner || undefined,
    })
  }

  async function handleCreateOrOpenConversation(trainerId: string) {
    if (!currentUserId) return

    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('*')
      .or(`and(user_id.eq.${currentUserId},trainer_id.eq.${trainerId}),and(user_id.eq.${trainerId},trainer_id.eq.${currentUserId})`)
      .maybeSingle()

    if (existing) {
      const partnerId = existing.user_id === currentUserId ? existing.trainer_id : existing.user_id
      const { data: partner } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .maybeSingle()

      setActiveConversation({
        ...existing,
        partner: partner || undefined,
      })
    } else {
      const { data: newConv, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: currentUserId,
          trainer_id: trainerId,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return
      }

      const { data: partner } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', trainerId)
        .maybeSingle()

      setActiveConversation({
        ...newConv,
        partner: partner || undefined,
      })

      if (currentUserId) {
        loadConversations(currentUserId)
      }
    }
  }

  async function loadMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
    } else {
      setMessages(data || [])
    }
  }

  async function markMessagesAsRead(conversationId: string) {
    if (!currentUserId) return

    await supabase
      .from('chat_messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('read', false)

    if (currentUserId) {
      loadConversations(currentUserId)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !currentUserId) return

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversation.id,
      sender_id: currentUserId,
      content: newMessage,
      read: false,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setNewMessage('')

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: activeConversation.id,
        sender_id: currentUserId,
        content: newMessage,
      })

    if (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
    } else {
      if (currentUserId) {
        loadConversations(currentUserId)
      }
    }
  }

  function getInitials(name: string | null) {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as any)
    }
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
      <div className="flex h-full bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="w-1/3 border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                onClick={() => setActiveConversation(conv)}
                className={`p-4 cursor-pointer border-b flex items-center gap-3 ${
                  activeConversation?.id === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={conv.partner?.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(conv.partner?.full_name || null)}</AvatarFallback>
                  </Avatar>
                  {isOnline(conv.partner?.last_seen_at || null) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold truncate">
                      {conv.partner?.full_name || 'Unknown'}
                    </h3>
                    {conv.last_message_at && (
                      <span className="text-xs text-gray-500">
                        {formatTime(new Date(conv.last_message_at))}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate">
                      {conv.last_message || 'No messages yet'}
                    </p>
                    {conv.unread_count! > 0 && (
                      <Badge variant="default" className="ml-2">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {conversations.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No conversations yet
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {activeConversation ? (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={activeConversation.partner?.avatar_url || undefined} />
                    <AvatarFallback>
                      {getInitials(activeConversation.partner?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline(activeConversation.partner?.last_seen_at || null) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {activeConversation.partner?.full_name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isOnline(activeConversation.partner?.last_seen_at || null)
                      ? 'Online'
                      : 'Offline'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/trainers/${activeConversation.partner?.id}`)}
                >
                  View Profile
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const isSent = message.sender_id === currentUserId
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[70%]">
                        {!isSent && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activeConversation.partner?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(activeConversation.partner?.full_name || null)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isSent
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            {message.content}
                          </div>
                          <div
                            className={`text-xs text-gray-500 mt-1 ${
                              isSent ? 'text-right' : 'text-left'
                            }`}
                          >
                            {formatTime(new Date(message.created_at))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No conversation selected</p>
                <p className="text-sm">Choose a conversation from the list or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
