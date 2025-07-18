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
  const orders = await Order.find({ logisticsId: user.id })
    .populate('buyer', 'name')
    .populate('items.product', 'name')
    .lean()
  return NextResponse.json(orders)
}

export async function PATCH(request) {
  await connectDB()
  const user = await requireAuth(request)
  if (!user || user.role !== 'logistics') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { orderId, status } = await request.json()
  await Order.findByIdAndUpdate(orderId, { status })
  return NextResponse.json({ success: true })
}