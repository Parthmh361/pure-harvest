import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import Product from '@/models/product'
import User from '@/models/user'
import { withAuth } from '@/lib/auth' // <-- use withAuth
import { generateOrderNumber } from '@/lib/utils'
import NotificationService from '@/lib/notification-service'
import mongoose from 'mongoose'

// GET orders for authenticated user
async function getOrders(request) {
  try {
    console.log('📦 GET /api/orders - Starting request')

    const user = request.user // <-- user is attached by withAuth

    console.log('✅ User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role
    })

    await connectDB()
    console.log('✅ Database connected')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    console.log('📋 Query params:', { page, limit, status, skip })

    // Build filter based on user role - FIXED LOGIC
    let filter = {}

    if (user.role === 'customer' || user.role === 'buyer') {
      filter.buyer = user.id
      console.log('👤 Customer filter - buyer:', user.id)
    } else if (user.role === 'farmer') {
      filter['items.farmer'] = new mongoose.Types.ObjectId(user.id)
      console.log('🚜 Farmer filter - items.farmer:', user.id)
    } else if (user.role === 'admin') {
      console.log('👑 Admin view - no user filter')
    } else {
      console.log('❌ Invalid user role:', user.role)
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      )
    }

    if (status && status !== 'all') {
      filter.status = status
    }

    console.log('🔍 Final filter:', filter)

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate({
          path: 'buyer',
          select: 'name email phone'
        })
        .populate({
          path: 'items.product',
          select: 'name price images category unit'
        })
        .populate({
          path: 'items.farmer',
          select: 'name email phone'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ])

    console.log('✅ Queries completed:', {
      ordersFound: orders.length,
      totalOrders: totalOrders
    })

    const totalPages = Math.ceil(totalOrders / limit)

    const response = {
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    }

    console.log('📤 Sending response:', {
      ordersCount: orders.length,
      pagination: response.pagination
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders: ' + error.message },
      { status: 500 }
    )
  }
}

// POST create new order (still needs to call requireAuth directly)
export async function POST(request) {
  try {
    console.log('📦 Creating new order...')

    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const {
      items,
      shippingAddress,
      paymentMethod = 'cod',
      notes = '',
      deliveryDate
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street) {
      return NextResponse.json(
        { error: 'Shipping address incomplete' },
        { status: 400 }
      )
    }

    // Accept street as address
    const address = shippingAddress.street || shippingAddress.address
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }
    // Map to required field for Mongoose
    shippingAddress.address = address
    // Optionally remove street to avoid confusion
    // delete shippingAddress.street

    // Process and validate items
    const processedItems = []
    let subtotal = 0

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        )
      }

      const product = await Product.findById(item.productId)
        .populate('farmer', 'name email')
      
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` },
          { status: 400 }
        )
      }

      const itemTotal = product.price * item.quantity
      subtotal += itemTotal

      processedItems.push({
        product: product._id,
        productName: product.name,
        farmer: product.farmer._id,
        farmerName: product.farmer.name,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
        unit: product.unit
      })

      // Update product stock
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -item.quantity } }
      )
    }

    // Calculate totals
    const deliveryFee = subtotal > 500 ? 0 : 50
    const totalAmount = subtotal + deliveryFee

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Create order
    const orderData = {
      orderNumber,
      buyer: user.id,
      items: processedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      shippingAddress,
      paymentMethod,
      notes,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      status: 'pending',
      createdAt: new Date()
    }

    const order = new Order(orderData)
    const savedOrder = await order.save()

    console.log('✅ Order created successfully:', savedOrder.orderNumber)

    // Create notifications
    try {
      await NotificationService.createOrderNotification(savedOrder, 'new_order')
      console.log('✅ Order notifications created successfully')
    } catch (notificationError) {
      console.error('⚠️ Notification creation failed (non-critical):', notificationError)
    }

    // Populate the order for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('buyer', 'name email phone')
      .populate('items.farmer', 'name email')
      .populate('items.product', 'name images')

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: populatedOrder
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Order creation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Mark notifications as read
const putHandler = async (request) => {
  try {
    const { notificationIds } = await request.json()

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'notificationIds must be an array' },
        { status: 400 }
      )
    }

    await NotificationService.markAsRead(notificationIds, request.user.userId)

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read'
    })

  } catch (error) {
    console.error('Mark notifications read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}

// Export GET and PUT using withAuth
export const GET = withAuth(getOrders)
export const PUT = withAuth(putHandler)