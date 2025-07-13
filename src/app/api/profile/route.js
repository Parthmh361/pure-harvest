import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import { requireAuth } from '@/lib/auth'

// Get user profile
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const userData = await User.findById(user.id)
      .select('-password')
      .lean()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: userData,
      addresses: userData.addresses || [],
      notifications: userData.notificationSettings || {
        orderUpdates: true,
        promotions: false,
        newsletter: true,
        sms: false,
        email: true
      }
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// Update user profile
export async function PUT(request) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      )
    }

    let updateData = {}

    if (type === 'personal') {
      // Validate personal data
      if (data.name && data.name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Name must be at least 2 characters long' },
          { status: 400 }
        )
      }

      if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }

      if (data.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(data.phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }

      // Build update object with only provided fields
      if (data.name !== undefined) updateData.name = data.name.trim()
      if (data.phone !== undefined) updateData.phone = data.phone.trim()
      if (data.bio !== undefined) updateData.bio = data.bio.trim()
      
      // Handle email change
      if (data.email && data.email !== user.email) {
        // Check if email is already taken
        const existingUser = await User.findOne({ 
          email: data.email.toLowerCase(),
          _id: { $ne: user.id }
        })
        
        if (existingUser) {
          return NextResponse.json(
            { error: 'Email is already registered' },
            { status: 400 }
          )
        }
        
        updateData.email = data.email.toLowerCase()
        updateData.emailVerified = false
      }

    } else if (type === 'notifications') {
      // Validate notification settings
      const allowedSettings = ['orderUpdates', 'promotions', 'newsletter', 'sms', 'email']
      const notifications = {}
      
      for (const [key, value] of Object.entries(data)) {
        if (allowedSettings.includes(key) && typeof value === 'boolean') {
          notifications[key] = value
        }
      }
      
      updateData.notificationSettings = notifications

    } else if (type === 'farmer') {
      // Handle farmer-specific updates
      if (user.role !== 'farmer') {
        return NextResponse.json(
          { error: 'Only farmers can update business information' },
          { status: 403 }
        )
      }

      if (data.businessName !== undefined) updateData.businessName = data.businessName.trim()
      if (data.businessDescription !== undefined) updateData.businessDescription = data.businessDescription.trim()
      if (data.farmSize !== undefined) updateData.farmSize = data.farmSize
      if (data.farmLocation !== undefined) updateData.farmLocation = data.farmLocation
      if (data.certifications !== undefined) updateData.certifications = data.certifications

    } else {
      return NextResponse.json(
        { error: 'Invalid update type' },
        { status: 400 }
      )
    }

    // Perform the update
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      updateData,
      { 
        new: true, 
        select: '-password',
        runValidators: true
      }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Profile update error:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        { error: messages.join(', ') },
        { status: 400 }
      )
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}