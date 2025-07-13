import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'

export async function POST(request) {
  try {
    console.log('🔍 Login attempt started')
    
    // Check if we can read the request
    const contentType = request.headers.get('content-type')
    console.log('🔍 Content-Type:', contentType)
    
    if (!contentType || !contentType.includes('application/json')) {
      console.log('❌ Invalid content type')
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }
    
    await connectDB()
    
    // Parse the request body
    let body
    try {
      body = await request.json()
      console.log('🔍 Request body:', body)
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { email, password } = body
    
    console.log('📧 Login attempt for email:', email)
    console.log('🔑 Password provided:', password ? 'Yes' : 'No')

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user by email (need to select password field explicitly)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    
    if (!user) {
      console.log('❌ User not found for email:', email)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('✅ User found:', { id: user._id, email: user.email, role: user.role })

    // Enhanced password debugging
    console.log('🔍 Password details:')
    console.log('  - Stored hash:', user.password)
    console.log('  - Hash length:', user.password ? user.password.length : 'No password')
    console.log('  - Hash type:', user.password ? user.password.substring(0, 4) : 'No password')
    console.log('  - Input password:', password)
    console.log('  - Input length:', password.length)

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User account is inactive:', email)
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 401 }
      )
    }

    // Compare password with detailed logging
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password)
      console.log('🔍 Password comparison result:', isPasswordValid)
      
      if (!isPasswordValid) {
        console.log('❌ Invalid password for email:', email)
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }
    } catch (compareError) {
      console.error('❌ Password comparison error:', compareError)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }

    console.log('✅ Password valid for user:', email)

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    )
    
    // Prepare user data for response (excluding sensitive info)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      businessName: user.businessName,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }

    console.log('✅ Login successful for user:', { 
      id: userData.id, 
      email: userData.email, 
      role: userData.role 
    })

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    })

    // Set HTTP-only cookie for additional security
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}