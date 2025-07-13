import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import { requireAuth } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    const { id } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 10

    // Find orders for this user (either as buyer or farmer)
    const orders = await Order.find({
      $or: [
        { buyer: id },
        { 'items.farmer': id }
      ]
    })
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('orderNumber buyer totalAmount status createdAt items')
      .lean()

    return NextResponse.json({
      success: true,
      orders
    })

  } catch (error) {
    console.error('User orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user orders' },
      { status: 500 }
    )
  }
}