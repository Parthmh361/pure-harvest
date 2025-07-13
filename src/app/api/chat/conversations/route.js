import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Conversation from '@/models/conversation'
import Message from '@/models/message'
import { requireAuth } from '@/lib/auth'

// Get user conversations
export const GET = requireAuth(async (request) => {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const archived = searchParams.get('archived') === 'true'

    const userId = request.user.userId
    const skip = (page - 1) * limit

    // Build filter
    let filter = {
      participants: userId,
      isActive: true
    }

    if (archived) {
      filter['settings.archived.user'] = userId
    } else {
      filter['settings.archived.user'] = { $ne: userId }
    }

    const conversations = await Conversation.find(filter)
      .populate('participants', 'name email role avatar')
      .populate('lastMessage')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          recipient: userId,
          'readBy.user': { $ne: userId }
        })

        return {
          ...conv,
          unreadCount,
          otherParticipant: conv.participants.find(p => p._id.toString() !== userId)
        }
      })
    )

    const total = await Conversation.countDocuments(filter)

    return NextResponse.json({
      success: true,
      conversations: conversationsWithUnread,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        hasMore: skip + conversations.length < total
      }
    })

  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
})

// Create new conversation
export const POST = requireAuth(async (request) => {
  try {
    await connectDB()
    
    const { recipientId, message, type = 'direct', metadata = {} } = await request.json()
    const senderId = request.user.userId

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'Recipient ID and message are required' },
        { status: 400 }
      )
    }

    if (recipientId === senderId) {
      return NextResponse.json(
        { error: 'Cannot start conversation with yourself' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] },
      type
    })

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        participants: [senderId, recipientId],
        type,
        metadata,
        lastActivity: new Date()
      })
      await conversation.save()
    }

    // Create first message
    const newMessage = new Message({
      conversation: conversation._id,
      sender: senderId,
      recipient: recipientId,
      content: message,
      messageType: 'text'
    })

    await newMessage.save()

    // Update conversation
    conversation.lastMessage = newMessage._id
    conversation.lastActivity = new Date()
    await conversation.save()

    // Populate conversation for response
    await conversation.populate('participants', 'name email role avatar')
    await conversation.populate('lastMessage')

    return NextResponse.json({
      success: true,
      conversation,
      message: newMessage
    })

  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
})