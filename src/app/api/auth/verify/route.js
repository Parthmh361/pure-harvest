export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Token verification failed' },
      { status: 500 }
    )
  }
}