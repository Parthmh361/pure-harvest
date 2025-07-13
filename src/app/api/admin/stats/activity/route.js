export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import Product from '@/models/product'
import Order from '@/models/order'
import { requireAuth } from '@/lib/auth'

export const GET = requireAuth(async (request) => {
  try {
    await connectDB()

    const activities = []

    // Recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role createdAt')

    recentUsers.forEach(user => {
      activities.push({
        type: 'user',
        description: `New ${user.role} registered: ${user.name}`,
        timestamp: user.createdAt,
        link: `/admin/users/${user._id}`
      })
    })

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('buyer', 'name')
      .select('orderNumber buyer totalAmount status createdAt')

    recentOrders.forEach(order => {
      activities.push({
        type: 'order',
        description: `New order #${order.orderNumber} by ${order.buyer?.name || 'Unknown'}`,
        timestamp: order.createdAt,
        link: `/admin/orders/${order._id}`
      })
    })

    // Recent products
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('farmer', 'name businessName')
      .select('name farmer createdAt')

    recentProducts.forEach(product => {
      activities.push({
        type: 'product',
        description: `New product "${product.name}" added by ${product.farmer?.businessName || product.farmer?.name || 'Unknown'}`,
        timestamp: product.createdAt,
        link: `/admin/products/${product._id}`
      })
    })

    // Sort activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return NextResponse.json({
      success: true,
      activities: activities.slice(0, 10) // Return top 10 activities
    })

  } catch (error) {
    console.error('Admin activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}, ['admin'])