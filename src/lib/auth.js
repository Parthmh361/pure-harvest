import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import connectDB from './mongodb'
import User from '@/models/user'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function extractToken(request) {
  try {
    // Method 1: Try to get token from Authorization header
    let authHeader = null
    if (request.headers?.get) {
      authHeader = request.headers.get('authorization')
    } else if (request.headers && typeof request.headers === 'object') {
      authHeader = request.headers['authorization'] || request.headers['Authorization']
    }
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      console.log('🔑 Token from Authorization header:', token.substring(0, 20) + '...')
      return token
    }

    // Method 2: Try to get token from request cookies header
    let cookieHeader = null
    if (request.headers?.get) {
      cookieHeader = request.headers.get('cookie')
    } else if (request.headers && typeof request.headers === 'object') {
      cookieHeader = request.headers['cookie']
    }
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/)
      if (tokenMatch) {
        console.log('🍪 Token from cookie header:', tokenMatch[1].substring(0, 20) + '...')
        return tokenMatch[1]
      }
    }

    // Optionally: fallback to next/headers cookies() ONLY if in a server component
    // (Uncomment if you use this in server components, not API routes)
    // try {
    //   const { cookies } = require('next/headers')
    //   const cookieStore = cookies()
    //   const cookieToken = cookieStore.get('token')
    //   if (cookieToken && cookieToken.value) {
    //     console.log('🍪 Token from cookie:', cookieToken.value.substring(0, 20) + '...')
    //     return cookieToken.value
    //   }
    // } catch {}

    console.log('❌ No token found in any location')
    return null
  } catch (error) {
    console.error('Token extraction error:', error)
    return null
  }
}

export function verifyToken(token) {
  try {
    if (!token) {
      throw new Error('No token provided')
    }

    // Clean the token (remove any extra quotes or whitespace)
    const cleanToken = token.trim().replace(/^["']|["']$/g, '')
    
    console.log('🔍 Verifying token length:', cleanToken.length)
    console.log('🔍 Token starts with:', cleanToken.substring(0, 10))
    
    const decoded = jwt.verify(cleanToken, JWT_SECRET)
    console.log('✅ Token verified successfully:', decoded)
    return decoded
  } catch (error) {
    console.error('Token verification error:', error.message)
    throw new Error('Invalid token')
  }
}

export async function requireAuth(request) {
  try {
    console.log('🔐 Starting authentication check...')
    
    const token = extractToken(request)
    if (!token) {
      console.log('❌ No token found')
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      console.log('❌ Invalid token payload')
      return null
    }

    console.log('🔍 Looking up user:', decoded.userId)
    
    await connectDB()
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      console.log('❌ User not found:', decoded.userId)
      return null
    }

    if (!user.isActive) {
      console.log('❌ User account is inactive:', decoded.userId)
      return null
    }

    console.log('✅ Authentication successful:', {
      id: user._id,
      email: user.email,
      role: user.role
    })

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified
    }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export function requireRole(roles) {
  return async (request) => {
    const user = await requireAuth(request)
    if (!user) {
      return null
    }

    if (Array.isArray(roles)) {
      if (!roles.includes(user.role)) {
        console.log('❌ Insufficient permissions. Required:', roles, 'User:', user.role)
        return null
      }
    } else {
      if (user.role !== roles) {
        console.log('❌ Insufficient permissions. Required:', roles, 'User:', user.role)
        return null
      }
    }

    return user
  }
}

/**
 * Usage: export const GET = withAuth(handlerFn, ['farmer', ...])
 */
export function withAuth(handler, allowedRoles = []) {
  return async function(request, ...args) {
    const user = await requireAuth(request)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }
    // Attach user to request for downstream use
    request.user = user
    return handler(request, ...args)
  }
}