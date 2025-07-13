import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import NotificationService from '@/lib/notification-service'

// Mark notifications as read
export const PUT = requireAuth(async (request) => {
  try {
    const { notificationIds } = await request.json()

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds must be an array' },
        { status: 400 }
      )
    }

    await NotificationService.markAsRead(notificationIds, request.user.userId)

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    })

  } catch (error) {
    console.error('Mark notifications read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
})