import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import Product from '@/models/product'
import User from '@/models/user'
import Notification from '@/models/notification'
import { withAuth, requireAuth } from '@/lib/auth'
import { generateOrderNumber } from '@/lib/utils'
import NotificationService from '@/lib/notification-service'
import mongoose from 'mongoose'

// GET orders for authenticated user
async function getOrders(request) {
  try {
    const user = request.user
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    let filter = {}
    if (user.role === 'customer' || user.role === 'buyer') {
      filter.buyer = user.id
    } else if (user.role === 'farmer') {
      filter['items.farmer'] = new mongoose.Types.ObjectId(user.id)
    } else if (user.role === 'admin') {
      // no filter
    } else {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 403 }
      )
    }
    if (status && status !== 'all') {
      filter.status = status
    }

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate({ path: 'buyer', select: 'name email phone' })
        .populate({ path: 'items.product', populate: { path: 'farmer', model: 'User', select: 'name email' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ])
    const totalPages = Math.ceil(totalOrders / limit)
    return NextResponse.json({
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
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders: ' + error.message },
      { status: 500 }
    )
  }
}

// POST create new order
export async function POST(request) {
  try {
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
    const address = shippingAddress.street || shippingAddress.address
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }
    shippingAddress.address = address

    const processedItems = []
    let subtotal = 0
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid item data' },
          { status: 400 }
        )
      }
      const product = await Product.findById(item.productId).populate('farmer', '_id name email')
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
        quantity: item.quantity,
        price: product.price,
        farmer: product.farmer._id
      })
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -item.quantity } }
      )
    }

    const deliveryFee = subtotal > 500 ? 0 : 50
    const totalAmount = subtotal + deliveryFee
    const orderNumber = generateOrderNumber()
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

    // Notify Buyer
    const buyerUser = await User.findById(savedOrder.buyer)
    console.log('🔍 Buyer user found:', buyerUser)
    if (buyerUser) {
      await NotificationService.create({
        recipientId: savedOrder.buyer, // <-- correct key!
        type: 'order',
        title: 'Order Placed',
        message: `Your order #${savedOrder.orderNumber} has been placed successfully.`,
        data: { orderId: savedOrder._id, orderNumber: savedOrder.orderNumber },
        channels: { inApp: true, email: true }
      })
    } else {
      console.error('❌ Buyer user not found in DB:', savedOrder.buyer)
    }

    // Notify Farmers for each item
    for (const item of savedOrder.items) {
      const farmerUser = await User.findById(item.farmer)
      console.log('🔍 Farmer user found:', farmerUser)
      if (farmerUser) {
        await NotificationService.create({
          recipientId: item.farmer, // <-- correct key!
          type: 'order',
          title: 'Product Ordered',
          message: `Your product has been ordered in order #${savedOrder.orderNumber}.`,
          data: { orderId: savedOrder._id, productId: item.product },
          channels: { inApp: true, email: true }
        })
      } else {
        console.error('❌ Farmer user not found in DB:', item.farmer)
      }
    }

    // Notify Admin(s)
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id')
    for (const admin of admins) {
      await NotificationService.create({
        recipientId: admin._id, // <-- correct key!
        type: 'order',
        title: 'New Order Received',
        message: `A new order #${savedOrder.orderNumber} has been placed by ${user.name || 'a buyer'}.`,
        data: { orderId: savedOrder._id, orderNumber: savedOrder.orderNumber },
        channels: { inApp: true, email: true }
      })
    }

    // Populate the order for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('buyer', 'name email phone')
      .populate({
        path: 'items.product',
        populate: { path: 'farmer', model: 'User', select: 'name email' }
      })

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
    return NextResponse.json({ success: true, message: 'Notifications marked as read' })
  } catch (error) {
    console.error('❌ Mark notifications as read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}

// Export handlers
export const GET = withAuth(getOrders)
export const PUT = withAuth(putHandler)
// POST is already exported above