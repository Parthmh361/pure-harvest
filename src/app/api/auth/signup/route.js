import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import { generateToken } from '@/lib/auth'

export async function POST(request) {
  try {
    console.log('🔍 Signup attempt started')
    
    await connectDB()
    console.log('MongoDB connected successfully')

    const { name, email, password, role, phone } = await request.json()
    
    console.log('📧 Signup attempt for email:', email)

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    if (!['buyer', 'farmer', 'admin', 'logistics'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    })

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
      if (existingUser.phone === phone) {
        return NextResponse.json(
          { error: 'User with this phone number already exists' },
          { status: 409 }
        )
      }
    }

    console.log('✅ User validation passed, creating new user')

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password, // Will be hashed by the pre-save middleware
      phone,
      role,
      isVerified: false,
      isActive: true
    }

    const user = new User(userData)
    const savedUser = await user.save()

    console.log('✅ User created successfully:', {
      id: savedUser._id,
      email: savedUser.email,
      role: savedUser.role
    })

    // Generate token
    const token = generateToken(savedUser._id.toString())
    console.log('🔑 Generated token for user:', savedUser._id)

    // Get public profile
    const publicProfile = {
      id: savedUser._id.toString(),
      name: savedUser.name,
      email: savedUser.email,
      phone: savedUser.phone,
      role: savedUser.role,
      isVerified: savedUser.isVerified,
      isActive: savedUser.isActive,
      createdAt: savedUser.createdAt
    }

    console.log('✅ Signup successful')

    // Return success response with token
    const response = NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: publicProfile,
      token // Include token in response for client-side storage
    }, { status: 201 })

    // Set HTTP-only cookie as backup
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Signup error:', error)
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 }
      )
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        { error: validationErrors[0] || 'Validation failed' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Signup failed: ' + error.message },
      { status: 500 }
    )
  }
}