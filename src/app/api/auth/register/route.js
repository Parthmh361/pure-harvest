import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'

// Add this to the register route for creating admin users
export async function POST(request) {
  try {
    console.log('🚀 Registration attempt started')
    
    await connectDB()
    
    const { name, email, password, role, phone, adminSecret, address, businessName } = await request.json()

    console.log('📧 Registration attempt for:', { name, email, role })

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Name, email, password, and phone are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate phone format (10 digits starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Please provide a valid 10-digit phone number' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['buyer', 'farmer', 'admin']
    const userRole = role || 'buyer'
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Admin creation check
    if (userRole === 'admin') {
      const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-super-secret-admin-key-2024'
      if (adminSecret !== ADMIN_SECRET) {
        console.log('❌ Invalid admin secret provided')
        return NextResponse.json(
          { error: 'Invalid admin creation secret' },
          { status: 403 }
        )
      }
      console.log('✅ Valid admin secret provided')
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    })

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'phone'
      console.log(`❌ User already exists with ${field}:`, existingUser[field])
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 }
      )
    }

    // Hash password
    console.log('🔐 Hashing password...')
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user object
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone.trim(),
      role: userRole,
      address: address?.trim() || '',
      businessName: businessName?.trim() || '',
      isActive: true,
      isVerified: userRole === 'admin' ? true : false, // Auto-verify admin accounts
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Create and save user
    console.log('💾 Creating user in database...')
    const user = new User(userData)
    const savedUser = await user.save()

    console.log('✅ User created successfully:', {
      id: savedUser._id,
      email: savedUser.email,
      role: savedUser.role
    })

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: savedUser._id,
        email: savedUser.email,
        role: savedUser.role
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    )

    // Prepare user data for response (excluding sensitive information)
    const responseUserData = {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      phone: savedUser.phone,
      address: savedUser.address,
      businessName: savedUser.businessName,
      isActive: savedUser.isActive,
      isVerified: savedUser.isVerified,
      createdAt: savedUser.createdAt
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: responseUserData,
      token
    }, { status: 201 })

    // Set HTTP-only cookie for enhanced security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    console.log('🎉 Registration completed successfully')
    return response

  } catch (error) {
    console.error('❌ Registration error:', error)

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return NextResponse.json(
        { error: `Validation failed: ${validationErrors.join(', ')}` },
        { status: 400 }
      )
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      const fieldNames = {
        email: 'email address',
        phone: 'phone number'
      }
      return NextResponse.json(
        { error: `User with this ${fieldNames[field] || field} already exists` },
        { status: 409 }
      )
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Token generation failed' },
        { status: 500 }
      )
    }

    // Handle bcrypt errors
    if (error.name === 'Error' && error.message.includes('bcrypt')) {
      return NextResponse.json(
        { error: 'Password encryption failed' },
        { status: 500 }
      )
    }

    // Generic error response
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}

// Optional: Add GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Registration API endpoint',
    methods: ['POST'],
    requiredFields: ['name', 'email', 'password', 'phone'],
    optionalFields: ['role', 'address', 'businessName', 'adminSecret']
  })
}