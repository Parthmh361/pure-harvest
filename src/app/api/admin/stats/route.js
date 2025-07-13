export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import Product from '@/models/product'
import User from '@/models/user'
import { requireAuth } from '@/lib/auth'

export async function GET(request) {
  try {
    console.log('🔍 Admin stats request started')
    
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    console.log('📊 Calculating admin stats...')

    // Get date ranges
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisWeek = new Date(now.setDate(now.getDate() - now.getDay()))

    // Parallel queries for better performance
    const [
      totalUsers,
      totalFarmers,
      totalBuyers,
      newUsersThisMonth,
      totalProducts,
      activeProducts,
      newProductsThisMonth,
      totalOrders,
      ordersThisMonth,
      totalRevenue,
      revenueThisMonth,
      pendingOrders,
      recentUsers,
      recentOrders,
      topProducts,
      ordersByStatus
    ] = await Promise.all([
      // User stats
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ createdAt: { $gte: thisMonth } }),

      // Product stats
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ createdAt: { $gte: thisMonth } }),

      // Order stats
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),

      // Revenue stats
      Order.aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      // Pending orders
      Order.countDocuments({ status: 'pending' }),

      // Recent data
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt')
        .lean(),

      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('buyer', 'name email')
        .select('orderNumber totalAmount status createdAt buyer')
        .lean(),

      // Top products
      Product.find({ isActive: true })
        .sort({ soldCount: -1 })
        .limit(5)
        .select('name price soldCount images')
        .lean(),

      // Orders by status
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }
          }
        }
      ])
    ])

    // Process results
    const stats = {
      overview: {
        totalUsers,
        totalFarmers,
        totalBuyers,
        newUsersThisMonth,
        totalProducts,
        activeProducts,
        newProductsThisMonth,
        totalOrders,
        ordersThisMonth,
        totalRevenue: totalRevenue[0]?.total || 0,
        revenueThisMonth: revenueThisMonth[0]?.total || 0,
        pendingOrders
      },
      recentActivity: {
        recentUsers: recentUsers.map(user => ({
          ...user,
          timeAgo: getTimeAgo(user.createdAt)
        })),
        recentOrders: recentOrders.map(order => ({
          ...order,
          timeAgo: getTimeAgo(order.createdAt)
        }))
      },
      insights: {
        topProducts,
        ordersByStatus
      }
    }

    console.log('✅ Admin stats calculated successfully')

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('❌ Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats: ' + error.message },
      { status: 500 }
    )
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date()
  const diffTime = Math.abs(now - new Date(date))
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffTime / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}