"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/layout'
import ChatSidebar from '@/components/chat/chat-sidebar'
import ChatInterface from '@/components/chat/chat-interface'
import NewConversationModal from '@/components/chat/new-conversation-modal'
import { MessageSquare } from 'lucide-react'
import useAuthStore from '@/stores/auth-store'

export default function ChatPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Check for mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isAuthenticated, router])

  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId)
  }

  const handleNewConversation = () => {
    setShowNewConversation(true)
  }

  const handleConversationCreated = (conversationId) => {
    setSelectedConversationId(conversationId)
    setShowNewConversation(false)
  }

  const handleCloseChat = () => {
    setSelectedConversationId(null)
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-gray-600 mb-6">You need to login to access the chat.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requireAuth>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Sidebar - Hidden on mobile when chat is open */}
        {(!isMobile || !selectedConversationId) && (
          <div className="w-full md:w-80 lg:w-96">
            <ChatSidebar
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </div>
        )}

        {/* Chat Interface */}
        <div className={`flex-1 ${(!selectedConversationId && !isMobile) ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversationId ? (
            <ChatInterface
              conversationId={selectedConversationId}
              onClose={handleCloseChat}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* New Conversation Modal */}
        {showNewConversation && (
          <NewConversationModal
            onClose={() => setShowNewConversation(false)}
            onConversationCreated={handleConversationCreated}
          />
        )}
      </div>
    </Layout>
  )
}