import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import { requireAuth } from '@/lib/auth'

// GET: List all orders (with filters)
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    await connectDB()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    let filter = {}
    if (status && status !== 'all') filter.status = status
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'buyer.name': { $regex: search, $options: 'i' } }
      ]
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('buyer', 'name email')
        .populate('items.farmer', 'name businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ])

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Update order status
export async function PATCH(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    await connectDB()
    const { orderId, status } = await request.json()
    const order = await Order.findById(orderId)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    order.status = status
    await order.save()
    return NextResponse.json({ success: true, order })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}