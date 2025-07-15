import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import { requireAuth } from '@/lib/auth'

export async function GET(request) {
  await connectDB()
  const user = await requireAuth(request)
  if (!user || user.role !== 'logistics') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let filter = {}
  if (status === 'available') {
    filter = { logisticsId: null, status: 'pending' }
  } else if (status === 'active') {
    filter = { logisticsId: user.id, status: { $in: ['in_transit', 'picked_up'] } }
  }
  const deliveries = await Order.find(filter)
    .populate('buyer', 'name')
    .populate('items.product', 'name')
    .lean()
  return NextResponse.json(deliveries)
}

export async function PATCH(request) {
  await connectDB()
  const user = await requireAuth(request)
  if (!user || user.role !== 'logistics') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { orderId, action } = await request.json()
  if (action === 'accept') {
    await Order.findByIdAndUpdate(orderId, { logisticsId: user.id, status: 'in_transit' })
  } else if (action === 'decline') {
    await Order.findByIdAndUpdate(orderId, { logisticsId: null })
  }
  return NextResponse.json({ success: true })
}