import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Conversation from '@/models/conversation'
import Message from '@/models/message'
import { requireAuth } from '@/lib/auth'

// Get messages for a conversation
export const GET = requireAuth(async (request, { params }) => {
  try {
    await connectDB()
    
    const { id: conversationId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50

    const userId = request.user.userId
    const skip = (page - 1) * limit

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
      .populate('sender', 'name email role avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false
    })

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        recipient: userId,
        'readBy.user': { $ne: userId }
      },
      {
        $addToSet: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    )

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        hasMore: skip + messages.length < total
      }
    })

  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
})

// Send new message
export const POST = requireAuth(async (request, { params }) => {
  try {
    await connectDB()
    
    const { id: conversationId } = params
    const { content, messageType = 'text', attachments = [] } = await request.json()
    const senderId = request.user.userId

    if (!content && !attachments.length) {
      return NextResponse.json(
        { error: 'Message content or attachments required' },
        { status: 400 }
      )
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Get recipient
    const recipientId = conversation.participants.find(
      p => p.toString() !== senderId
    )

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      recipient: recipientId,
      content,
      messageType,
      attachments
    })

    await message.save()

    // Update conversation
    conversation.lastMessage = message._id
    conversation.lastActivity = new Date()
    await conversation.save()

    // Populate message for response
    await message.populate('sender', 'name email role avatar')

    // TODO: Send real-time notification via WebSocket
    // TODO: Send push notification if recipient is offline

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
})