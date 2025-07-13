import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import Product from '@/models/product'
import User from '@/models/user'
import { requireAuth } from '@/lib/auth'

export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    await connectDB()

    // Sales and revenue report
    const totalSales = await Order.countDocuments({ status: 'delivered' })
    const totalRevenueAgg = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
    const totalRevenue = totalRevenueAgg[0]?.total || 0

    // Top 5 products by sales
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      { $project: { name: '$product.name', count: 1 } }
    ])

    // Top 5 farmers by revenue
    const topFarmers = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.farmer', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'farmer'
        }
      },
      { $unwind: '$farmer' },
      { $project: { name: '$farmer.name', revenue: 1 } }
    ])

    // Monthly sales for chart
    const monthlySales = await Order.aggregate([
      { $match: { status: 'delivered' } },
      {
        $group: {
          _id: { $substr: ['$createdAt', 0, 7] }, // YYYY-MM
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    return NextResponse.json({
      success: true,
      report: {
        totalSales,
        totalRevenue,
        topProducts,
        topFarmers,
        monthlySales
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}