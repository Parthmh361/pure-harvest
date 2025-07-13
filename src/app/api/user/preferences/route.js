import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import { requireAuth } from '@/lib/auth'

export const PUT = requireAuth(async (request) => {
  try {
    await connectDB()
    
    const body = await request.json()
    const { preferences } = body

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences data is required' },
        { status: 400 }
      )
    }

    const user = await User.findByIdAndUpdate(
      request.user.userId,
      { preferences },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Preferences updated successfully',
      user
    })

  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}, ['buyer', 'farmer', 'admin'])