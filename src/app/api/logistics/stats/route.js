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
  const totalDeliveries = await Order.countDocuments({ logisticsId: user.id })
  const activeDeliveries = await Order.countDocuments({ logisticsId: user.id, status: { $in: ['in_transit', 'pending'] } })
  const totalEarnings = await Order.aggregate([
    { $match: { logisticsId: user.id, status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
  ])
  return NextResponse.json({
    totalDeliveries,
    activeDeliveries,
    totalEarnings: totalEarnings[0]?.total || 0
  })
}