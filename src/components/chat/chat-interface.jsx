"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  Paperclip, 
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  User,
  MessageSquare,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react'
import Image from 'next/image'
import useAuthStore from '@/stores/auth-store'
import { formatDate, formatTime } from '@/lib/utils'

export default function ChatInterface({ conversationId, onClose }) {
  const { user } = useAuthStore()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    if (conversationId) {
      fetchConversation()
      fetchMessages()
    }
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConversation(data.conversation)
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: messageContent,
          messageType: 'text'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
      } else {
        setNewMessage(messageContent) // Restore message on error
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Send message error:', error)
      setNewMessage(messageContent) // Restore message on error
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getOtherParticipant = () => {
    if (!conversation || !user) return null
    return conversation.participants.find(p => p._id !== user.id)
  }

  const isMyMessage = (message) => {
    return message.sender._id === user?.id
  }

  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return formatTime(messageDate)
    } else if (diffDays === 1) {
      return `Yesterday ${formatTime(messageDate)}`
    } else if (diffDays < 7) {
      return messageDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return formatDate(messageDate)
    }
  }

  const otherParticipant = getOtherParticipant()

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Conversation not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col mobile-chat-container">
      {/* Chat Header */}
      <div className="border-b p-4 bg-white mobile-chat-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden icon-button"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-green-600" />
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{otherParticipant?.name}</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {otherParticipant?.role}
                </Badge>
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {conversation.lastActivity && `Active ${formatDate(conversation.lastActivity)}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="icon-button hidden sm:flex">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="icon-button hidden sm:flex">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="icon-button">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-2 sm:p-4 mobile-chat-messages" ref={messagesContainerRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = isMyMessage(message)
              const showAvatar = index === 0 || messages[index - 1]?.sender._id !== message.sender._id
              
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    {!isOwn && showAvatar && (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                    {!isOwn && !showAvatar && (
                      <div className="w-8 h-8 flex-shrink-0"></div>
                    )}

                    {/* Message Bubble */}
                    <div className={`rounded-lg px-3 py-2 ${
                      isOwn 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      
                      <div className={`flex items-center justify-between mt-1 text-xs ${
                        isOwn ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {isOwn && (
                          <div className="ml-2">
                            {message.readBy?.length > 1 ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-2 sm:p-4 bg-white mobile-chat-input">
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 icon-button"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="resize-none border-0 focus:ring-0 p-2 sm:p-3"
              rows={1}
              style={{ 
                minHeight: '40px', 
                maxHeight: window.innerWidth < 640 ? '80px' : '120px' 
              }}
            />
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0 icon-button"
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}