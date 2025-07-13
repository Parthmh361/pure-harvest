// app/api/messages/route.js
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message from '@/models/message'
import Conversation from '@/models/conversation'
import { requireAuth } from '@/lib/auth'

// GET /api/messages - Get user's conversations
export const GET = requireAuth(async (request) => {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Get messages for specific conversation
      const conversation = await Conversation.findById(conversationId)
        .populate('participants', 'name role farmName')

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }

      // Check if user is participant
      const isParticipant = conversation.participants.some(
        p => p._id.toString() === request.user.userId
      )

      if (!isParticipant) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      const messages = await Message.find({ conversation: conversationId })
        .populate('sender', 'name role farmName')
        .sort({ createdAt: 1 })

      // Mark messages as read
      await Message.updateMany(
        {
          conversation: conversationId,
          sender: { $ne: request.user.userId },
          isRead: false
        },
        { isRead: true, readAt: new Date() }
      )

      return NextResponse.json({
        conversation,
        messages
      })
    } else {
      // Get all conversations for user
      const conversations = await Conversation.find({
        participants: request.user.userId
      })
        .populate('participants', 'name role farmName')
        .populate('lastMessage')
        .sort({ updatedAt: -1 })

      // Get unread count for each conversation
      for (const conv of conversations) {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: request.user.userId },
          isRead: false
        })
        conv.unreadCount = unreadCount
      }

      return NextResponse.json({ conversations })
    }

  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
})

// POST /api/messages - Send new message
export const POST = requireAuth(async (request) => {
  try {
    await connectDB()
    
    const body = await request.json()
    const { recipientId, content, conversationId, orderId } = body

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    let conversation

    if (conversationId) {
      // Use existing conversation
      conversation = await Conversation.findById(conversationId)
      
      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }

      // Check if user is participant
      const isParticipant = conversation.participants.some(
        p => p.toString() === request.user.userId
      )

      if (!isParticipant) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    } else if (recipientId) {
      // Find or create conversation
      conversation = await Conversation.findOne({
        participants: { $all: [request.user.userId, recipientId] }
      })

      if (!conversation) {
        conversation = new Conversation({
          participants: [request.user.userId, recipientId],
          orderId: orderId || null
        })
        await conversation.save()
      }
    } else {
      return NextResponse.json(
        { error: 'Recipient or conversation required' },
        { status: 400 }
      )
    }

    // Create message
    const message = new Message({
      conversation: conversation._id,
      sender: request.user.userId,
      content: content.trim()
    })

    await message.save()

    // Update conversation
    conversation.lastMessage = message._id
    conversation.updatedAt = new Date()
    await conversation.save()

    // Populate message for response
    await message.populate('sender', 'name role farmName')

    return NextResponse.json({
      message: 'Message sent successfully',
      data: message
    }, { status: 201 })

  } catch (error) {
    console.error('Message send error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
})