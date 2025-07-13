export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import { requireAuth } from '@/lib/auth'

// GET user profile
export const GET = requireAuth(async (request) => {
  try {
    await connectDB()
    
    const user = await User.findById(request.user.userId).select('-password')
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}, ['buyer', 'farmer', 'admin'])

// PUT update user profile
export const PUT = requireAuth(async (request) => {
  try {
    await connectDB()
    
    const body = await request.json()
    const { name, email, phone, businessName, description, address, location } = body

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: request.user.userId } 
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already registered with another account' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (phone) updateData.phone = phone
    if (businessName) updateData.businessName = businessName
    if (description) updateData.description = description
    if (address) updateData.address = address
    if (location) updateData.location = location

    const user = await User.findByIdAndUpdate(
      request.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}, ['buyer', 'farmer', 'admin'])