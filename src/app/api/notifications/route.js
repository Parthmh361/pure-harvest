import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import NotificationService from '@/lib/notification-service'

// GET user notifications
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 10
    const skip = parseInt(searchParams.get('skip')) || 0
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type') // Add type filtering

    console.log('📬 Fetching notifications for user:', user.id, {
      limit, skip, unreadOnly, type
    })

    const result = await NotificationService.getUserNotifications(user.id, {
      limit,
      skip,
      unreadOnly,
      type // Pass type filter
    })

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('❌ Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { notificationId, markAllAsRead } = await request.json()

    if (markAllAsRead) {
      const count = await NotificationService.markAllAsRead(user.id)
      return NextResponse.json({
        success: true,
        message: `Marked ${count} notifications as read`
      })
    }

    if (notificationId) {
      const notification = await NotificationService.markAsRead(notificationId, user.id)
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Notification update error:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}