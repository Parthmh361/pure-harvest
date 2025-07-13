export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'
import mongoose from 'mongoose'

export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Only farmers can access analytics' },
        { status: 403 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    
    // Calculate date range
    const now = new Date()
    let startDate
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const farmerId = new mongoose.Types.ObjectId(user.id)

    // Get farmer's products
    const farmerProducts = await Product.find({ farmer: farmerId }).select('_id')
    const productIds = farmerProducts.map(p => p._id)

    // Parallel queries for better performance
    const [
      // Total revenue and orders
      revenueStats,
      // Product performance
      topProducts,
      // Recent orders
      recentOrders,
      // Monthly trend data
      monthlyData,
      // Product stats
      productStats,
      // Order status distribution
      orderStatusStats
    ] = await Promise.all([
      // Revenue and order stats
      Order.aggregate([
        {
          $match: {
            'items.farmer': farmerId,
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' }
          }
        }
      ]),

      // Top performing products
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        { $match: { 'items.farmer': farmerId } },
        {
          $group: {
            _id: '$items.product',
            totalSold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orderCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        {
          $project: {
            name: '$productDetails.name',
            image: { $arrayElemAt: ['$productDetails.images', 0] },
            totalSold: 1,
            revenue: 1,
            orderCount: 1
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),

      // Recent orders
      Order.find({
        'items.farmer': farmerId,
        createdAt: { $gte: startDate }
      })
        .populate('buyer', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber buyer totalAmount status createdAt items')
        .lean(),

      // Monthly trend data (last 12 months)
      Order.aggregate([
        {
          $match: {
            'items.farmer': farmerId,
            createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
            status: { $ne: 'cancelled' }
          }
        },
        { $unwind: '$items' },
        { $match: { 'items.farmer': farmerId } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // Product statistics
      Product.aggregate([
        { $match: { farmer: farmerId } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
            lowStockProducts: { $sum: { $cond: [{ $lt: ['$quantity', 10] }, 1, 0] } },
            avgPrice: { $avg: '$price' }
          }
        }
      ]),

      // Order status distribution
      Order.aggregate([
        { $match: { 'items.farmer': farmerId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ])

    // Process results
    const overview = revenueStats[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0
    }

    const products = productStats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      avgPrice: 0
    }

    // Format monthly data for charts
    const formattedMonthlyData = monthlyData.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      revenue: item.revenue,
      orders: item.orders
    }))

    // Calculate trends (compare with previous period)
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    
    const previousStats = await Order.aggregate([
      {
        $match: {
          'items.farmer': farmerId,
          createdAt: { $gte: previousPeriodStart, $lt: startDate },
          status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 }
        }
      }
    ])

    const prevStats = previousStats[0] || { totalRevenue: 0, totalOrders: 0 }
    
    const trends = {
      revenueChange: prevStats.totalRevenue > 0 
        ? ((overview.totalRevenue - prevStats.totalRevenue) / prevStats.totalRevenue * 100).toFixed(1)
        : overview.totalRevenue > 0 ? 100 : 0,
      ordersChange: prevStats.totalOrders > 0
        ? ((overview.totalOrders - prevStats.totalOrders) / prevStats.totalOrders * 100).toFixed(1)
        : overview.totalOrders > 0 ? 100 : 0
    }

    // Format response
    const analytics = {
      overview: {
        ...overview,
        ...products
      },
      trends,
      topProducts: topProducts || [],
      recentOrders: recentOrders || [],
      monthlyData: formattedMonthlyData,
      orderStatusDistribution: orderStatusStats.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {})
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Farmer analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics: ' + error.message },
      { status: 500 }
    )
  }
}