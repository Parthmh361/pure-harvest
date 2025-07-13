import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'

// Get specific order
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const { id } = params
    const order = await Order.findById(id)
      .populate([
        {
          path: 'buyer',
          select: 'name email phone'
        },
        {
          path: 'items.product',
          select: 'name images category unit price'
        },
        {
          path: 'items.farmer',
          select: 'name businessName phone email address'
        }
      ])
      .lean()

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canView = 
      user.role === 'admin' ||
      (user.role === 'buyer' && order.buyer._id.toString() === user.id) ||
      (user.role === 'farmer' && order.items.some(item => item.farmer._id.toString() === user.id))

    if (!canView) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    console.log('📦 Order structure:', {
      id: order._id,
      itemsCount: order.items.length,
      sampleItem: order.items[0] ? {
        product: order.items[0].product?.name,
        farmer: order.items[0].farmer?.name,
        hasProductId: !!order.items[0].product,
        hasFarmerId: !!order.items[0].farmer
      } : null
    })

    return NextResponse.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Order fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// Update order status (PUT)
export async function PUT(request, { params }) {
  return updateOrder(request, params)
}

// Update order status (PATCH) - for partial updates
export async function PATCH(request, { params }) {
  return updateOrder(request, params)
}

// Shared update logic
async function updateOrder(request, params) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const { id } = params
    const updateData = await request.json()
    const { status, adminNotes, trackingNumber, cancellationReason } = updateData

    console.log('🔄 Order update request:', { id, status, user: user.email, role: user.role })

    const order = await Order.findById(id)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check permissions for different types of updates
    let canUpdate = false
    
    if (status === 'cancelled') {
      // Buyers can cancel their own orders, admins can cancel any order
      canUpdate = 
        (user.role === 'buyer' && order.buyer.toString() === user.id) ||
        user.role === 'admin'
    } else {
      // Other status updates: admin or farmers involved in the order
      canUpdate = 
        user.role === 'admin' ||
        (user.role === 'farmer' && order.items.some(item => item.farmer.toString() === user.id))
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Validate status transition
    if (status) {
      const validTransitions = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['processing', 'cancelled'],
        'processing': ['shipped', 'cancelled'],
        'shipped': ['delivered'],
        'delivered': ['returned'],
        'cancelled': [],
        'returned': []
      }

      if (!validTransitions[order.status]?.includes(status)) {
        return NextResponse.json(
          { error: `Cannot change status from ${order.status} to ${status}` },
          { status: 400 }
        )
      }

      // Special handling for cancellation
      if (status === 'cancelled') {
        // Check if order can still be cancelled
        if (!['pending', 'confirmed'].includes(order.status)) {
          return NextResponse.json(
            { error: 'Order cannot be cancelled at this stage' },
            { status: 400 }
          )
        }

        // Restore product quantities when cancelling
        console.log('🔄 Restoring product quantities for cancelled order')
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { quantity: item.quantity } }
          )
          console.log(`✅ Restored ${item.quantity} units to product ${item.product}`)
        }

        // Set cancellation details
        order.cancellationReason = cancellationReason || 'Cancelled by user'
        order.cancelledAt = new Date()
        order.cancelledBy = user.id
      }

      // Update status and add to history
      order.status = status
      if (!order.statusHistory) {
        order.statusHistory = []
      }
      order.statusHistory.push({
        status: status,
        updatedBy: user.email,
        updatedAt: new Date(),
        note: adminNotes || cancellationReason || ''
      })

      // Set delivery timestamp
      if (status === 'delivered') {
        order.actualDelivery = new Date()
      }
    }

    // Update other fields
    if (adminNotes) {
      order.orderNotes = adminNotes
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber
    }

    await order.save()
    console.log('✅ Order updated successfully:', { id, newStatus: status })

    // Populate updated order for response
    await order.populate([
      {
        path: 'buyer',
        select: 'name email phone'
      },
      {
        path: 'items.product',
        select: 'name images category unit price'
      },
      {
        path: 'items.farmer',
        select: 'name businessName phone email'
      }
    ])

    return NextResponse.json({
      success: true,
      message: status === 'cancelled' ? 'Order cancelled successfully' : 'Order updated successfully',
      order
    })

  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order: ' + error.message },
      { status: 500 }
    )
  }
}

// Cancel order (buyer only) - Alternative DELETE method
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can cancel orders' },
        { status: 403 }
      )
    }

    await connectDB()

    const { id } = params
    const order = await Order.findById(id)

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.buyer.toString() !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Order cannot be cancelled at this stage' },
        { status: 400 }
      )
    }

    // Update order status
    order.status = 'cancelled'
    order.cancellationReason = 'Cancelled by buyer'
    order.cancelledAt = new Date()
    order.cancelledBy = user.id
    
    // Add to status history
    if (!order.statusHistory) {
      order.statusHistory = []
    }
    order.statusHistory.push({
      status: 'cancelled',
      updatedBy: user.email,
      updatedAt: new Date(),
      note: 'Cancelled by buyer'
    })

    await order.save()

    // Restore product quantities
    console.log('🔄 Restoring product quantities for cancelled order')
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } }
      )
      console.log(`✅ Restored ${item.quantity} units to product ${item.product}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    })

  } catch (error) {
    console.error('Order cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}