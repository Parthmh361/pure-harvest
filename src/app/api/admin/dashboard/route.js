import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import Product from '@/models/product'
import Order from '@/models/order'
import { requireAuth } from '@/lib/auth'

export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    // Get basic stats
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      activeProducts,
      verifiedFarmers,
      pendingOrders
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'farmer', isVerified: true }),
      Order.countDocuments({ status: 'pending' })
    ])

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
    const totalRevenue = revenueResult[0]?.total || 0

    // Get pending products count
    const pendingProducts = await Product.countDocuments({ isActive: false })

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('buyer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderNumber totalAmount status buyer createdAt')

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role isVerified createdAt')

    const stats = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingOrders,
      activeProducts,
      verifiedFarmers,
      pendingProducts
    }

    return NextResponse.json({
      success: true,
      stats,
      recentOrders,
      recentUsers
    })

  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}