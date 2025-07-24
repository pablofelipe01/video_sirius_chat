'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  MessageCircle, 
  Send, 
  Users, 
  X, 
  Reply
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ChatMessage } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface SuperChatProps {
  roomId: string
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export function SuperChat({ roomId, isOpen, onToggle, onClose }: SuperChatProps) {
  const { employee } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when opening chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Load chat messages when component mounts or roomId changes
  useEffect(() => {
    if (!roomId) return
    loadChatMessages()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel(`chat_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('💬 Real-time chat update:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ChatMessage
            console.log('🔔 Nuevo mensaje recibido via realtime:', newMessage.message_text)
            setMessages(prev => {
              // Verificar que no existe ya el mensaje para evitar duplicados
              const messageExists = prev.some(msg => msg.id === newMessage.id)
              if (messageExists) {
                console.log('⚠️ Mensaje duplicado ignorado:', newMessage.id)
                return prev
              }
              console.log('✅ Agregando mensaje al estado:', newMessage.id)
              return [...prev, newMessage]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as ChatMessage
            console.log('📝 Mensaje actualizado via realtime:', updatedMessage.id)
            setMessages(prev => 
              prev.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedMessage = payload.old as ChatMessage
            console.log('🗑️ Mensaje eliminado via realtime:', deletedMessage.id)
            setMessages(prev => 
              prev.filter(msg => msg.id !== deletedMessage.id)
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción realtime:', status)
      })

    // Send join message
    if (employee) {
      sendSystemMessage(`${employee.first_name} ${employee.last_name} se unió al chat`, 'join')
    }

    return () => {
      console.log('🔌 Desconectando suscripción realtime para room:', roomId)
      // Send leave message
      if (employee) {
        sendSystemMessage(`${employee.first_name} ${employee.last_name} salió del chat`, 'leave')
      }
      subscription.unsubscribe()
    }
  }, [roomId, employee]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadChatMessages = async () => {
    try {
      console.log('🔄 Cargando mensajes para room:', roomId)
      
      // Usar consulta directa simple
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100)
      
      if (error) {
        console.error('❌ Error loading chat messages:', error)
        return
      }

      console.log('✅ Mensajes cargados:', data?.length || 0)
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading chat messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !employee || isLoading) return

    setIsLoading(true)
    try {
      console.log('📤 Enviando mensaje:', newMessage.trim())
      
      // Get meeting ID from room
      const { data: meeting } = await supabase
        .from('meetings')
        .select('id')
        .eq('room_id', roomId)
        .single()

      const messageData = {
        room_id: roomId,
        meeting_id: meeting?.id || null,
        sender_cedula: employee.cedula,
        sender_name: `${employee.first_name} ${employee.last_name}`,
        sender_type: 'internal',
        message_text: newMessage.trim(),
        message_type: 'text',
        reply_to_id: replyingTo?.id || null,
        metadata: replyingTo ? { 
          reply_to: {
            sender_name: replyingTo.sender_name,
            message_text: replyingTo.message_text
          }
        } : {},
        is_edited: false
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select()

      if (error) {
        console.error('❌ Error sending message:', error)
        return
      }

      console.log('✅ Mensaje enviado exitosamente:', data)
      
      // Agregar el mensaje inmediatamente al estado local
      if (data && data[0]) {
        setMessages(prev => {
          // Verificar que no existe ya el mensaje para evitar duplicados
          const messageExists = prev.some(msg => msg.id === data[0].id)
          if (messageExists) {
            return prev
          }
          return [...prev, data[0]]
        })
      }
      
      setNewMessage('')
      setReplyingTo(null)
    } catch (error) {
      console.error('❌ Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendSystemMessage = async (text: string, type: 'join' | 'leave' | 'system') => {
    if (!employee) return

    try {
      const { data: meeting } = await supabase
        .from('meetings')
        .select('id')
        .eq('room_id', roomId)
        .single()

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          room_id: roomId,
          meeting_id: meeting?.id || null,
          sender_cedula: employee.cedula,
          sender_name: `${employee.first_name} ${employee.last_name}`,
          sender_type: 'system',
          message_text: text,
          message_type: type,
          metadata: {},
          is_edited: false
        }])

      if (error) {
        console.error('❌ Error sending system message:', error)
      }
    } catch (error) {
      console.error('❌ Error sending system message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message)
    inputRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyingTo(null)
  }

  const getMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: es 
    })
  }

  const getAvatarInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwn = message.sender_cedula === employee?.cedula
    const isSystem = message.sender_type === 'system'

    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center my-3">
          <span className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
            {message.message_text}
          </span>
        </div>
      )
    }

    return (
      <div key={message.id} className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
            {getAvatarInitials(message.sender_name)}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Reply indicator */}
          {message.reply_to_id && message.metadata?.reply_to && (
            <div className="text-xs text-gray-400 mb-2 p-2 bg-gray-700 rounded border-l-4 border-blue-500 max-w-full">
              <div className="truncate">
                <span className="font-medium text-blue-400">
                  {message.metadata.reply_to.sender_name}: 
                </span>
                <span className="ml-1">
                  {message.metadata.reply_to.message_text.slice(0, 40)}...
                </span>
              </div>
            </div>
          )}
          
          <div className={`relative group ${isOwn ? 'bg-blue-600' : 'bg-gray-600'} rounded-lg p-3 max-w-full shadow-lg`}>
            {!isOwn && (
              <div className="text-xs font-medium text-blue-300 mb-1">
                {message.sender_name}
              </div>
            )}
            <div className="text-white break-words leading-relaxed">
              {message.message_text}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className={`text-xs ${isOwn ? 'text-blue-200' : 'text-gray-300'}`}>
                {getMessageTime(message.created_at)}
                {message.is_edited && <span className="ml-1 italic">(editado)</span>}
              </div>
              
              {/* Message actions */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0 hover:bg-gray-500 border-gray-400"
                  onClick={() => handleReply(message)}
                >
                  <Reply className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-gray-900 border-2 border-blue-500 rounded-xl shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-blue-500 bg-blue-600">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-white" />
          <span className="text-white font-bold">SuperChat Mejorado</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-blue-100 flex items-center gap-1">
            <Users className="w-4 h-4" />
            {messages.filter(m => m.message_type === 'join').length}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 hover:bg-blue-700 text-white border-blue-300"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-gray-800 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>¡Sé el primero en escribir!</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply Section */}
      {replyingTo && (
        <div className="px-4 py-3 bg-gray-700 border-t border-gray-600">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span className="truncate flex-1 mr-2">
              Respondiendo a <strong className="text-blue-400">{replyingTo.sender_name}</strong>: {replyingTo.message_text.slice(0, 30)}...
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 hover:bg-gray-600 border-gray-500"
              onClick={cancelReply}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="p-4 bg-gray-700 border-t-2 border-blue-500">
        <div className="flex gap-3">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí..."
            className="flex-1 bg-gray-600 border-gray-500 text-white placeholder:text-gray-400 focus:border-blue-400 h-10"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
