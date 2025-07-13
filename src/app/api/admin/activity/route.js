export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import Product from '@/models/product'
import User from '@/models/user'
import { requireAuth } from '@/lib/auth'

export async function GET(request) {
  try {
    console.log('🔍 Admin activity request started')
    
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 20
    const type = searchParams.get('type') // 'all', 'users', 'orders', 'products'

    console.log('📋 Fetching recent activities...')

    // Build activity timeline
    let activities = []

    // Recent user registrations
    if (!type || type === 'all' || type === 'users') {
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email role createdAt')
        .lean()

      const userActivities = recentUsers.map(user => ({
        id: `user-${user._id}`,
        type: 'user_registered',
        title: 'New User Registration',
        description: `${user.name} (${user.role}) joined the platform`,
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        },
        timestamp: user.createdAt,
        icon: 'user-plus',
        color: 'blue'
      }))

      activities.push(...userActivities)
    }

    // Recent orders
    if (!type || type === 'all' || type === 'orders') {
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('buyer', 'name email')
        .select('orderNumber totalAmount status createdAt buyer statusHistory')
        .lean()

      const orderActivities = recentOrders.map(order => ({
        id: `order-${order._id}`,
        type: 'order_created',
        title: 'New Order Placed',
        description: `Order #${order.orderNumber} by ${order.buyer?.name || 'Unknown'} for ₹${order.totalAmount}`,
        order: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          buyer: order.buyer
        },
        timestamp: order.createdAt,
        icon: 'shopping-cart',
        color: 'green'
      }))

      activities.push(...orderActivities)

      // Recent order status changes
      const statusUpdates = recentOrders
        .filter(order => order.statusHistory && order.statusHistory.length > 1)
        .map(order => {
          const latestStatus = order.statusHistory[order.statusHistory.length - 1]
          return {
            id: `status-${order._id}-${latestStatus.timestamp}`,
            type: 'order_status_update',
            title: 'Order Status Updated',
            description: `Order #${order.orderNumber} status changed to ${latestStatus.status}`,
            order: {
              orderNumber: order.orderNumber,
              status: latestStatus.status,
              buyer: order.buyer
            },
            timestamp: latestStatus.timestamp,
            icon: 'refresh',
            color: 'orange'
          }
        })

      activities.push(...statusUpdates)
    }

    // Recent products
    if (!type || type === 'all' || type === 'products') {
      const recentProducts = await Product.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('farmer', 'name businessName')
        .select('name price category images createdAt farmer isActive')
        .lean()

      const productActivities = recentProducts.map(product => ({
        id: `product-${product._id}`,
        type: 'product_added',
        title: 'New Product Added',
        description: `${product.name} by ${product.farmer?.businessName || product.farmer?.name || 'Unknown Farmer'}`,
        product: {
          name: product.name,
          price: product.price,
          category: product.category,
          images: product.images,
          farmer: product.farmer,
          isActive: product.isActive
        },
        timestamp: product.createdAt,
        icon: 'package',
        color: 'purple'
      }))

      activities.push(...productActivities)
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    // Limit results
    activities = activities.slice(0, limit)

    // Add time ago to each activity
    activities = activities.map(activity => ({
      ...activity,
      timeAgo: getTimeAgo(activity.timestamp)
    }))

    console.log('✅ Admin activities fetched successfully:', activities.length)

    return NextResponse.json({
      success: true,
      activities,
      total: activities.length
    })

  } catch (error) {
    console.error('❌ Admin activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities: ' + error.message },
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