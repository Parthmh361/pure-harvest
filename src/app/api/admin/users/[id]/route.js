import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import Order from '@/models/order'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'

// Get specific user details
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    const { id } = params
    const targetUser = await User.findById(id).select('-password').lean()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user statistics based on role
    let userStats = {}

    if (targetUser.role === 'buyer') {
      const [totalOrders, totalSpent] = await Promise.all([
        Order.countDocuments({ buyer: targetUser._id }),
        Order.aggregate([
          { $match: { buyer: targetUser._id, status: 'delivered' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ])
      ])

      userStats = {
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0,
        avgOrderValue: totalOrders > 0 ? (totalSpent[0]?.total || 0) / totalOrders : 0
      }
    } else if (targetUser.role === 'farmer') {
      const [totalProducts, totalOrders, totalRevenue] = await Promise.all([
        Product.countDocuments({ farmer: targetUser._id }),
        Order.countDocuments({ 'items.farmer': targetUser._id }),
        Order.aggregate([
          { $match: { 'items.farmer': targetUser._id, status: 'delivered' } },
          { $unwind: '$items' },
          { $match: { 'items.farmer': targetUser._id } },
          { $group: { _id: null, total: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } }
        ])
      ])

      userStats = {
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    }

    return NextResponse.json({
      success: true,
      user: targetUser,
      stats: userStats
    })

  } catch (error) {
    console.error('Admin user fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

// Update user status (verify, suspend, etc.)
export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    const { id } = params
    const updateData = await request.json()

    // Only allow specific fields to be updated by admin
    const allowedFields = ['isVerified', 'isActive', 'adminNotes']
    const filteredUpdate = {}

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdate[key] = updateData[key]
      }
    })

    const updatedUser = await User.findByIdAndUpdate(
      id,
      filteredUpdate,
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Log admin action (you can create an admin log model for this)
    console.log(`Admin ${user.id} updated user ${id}:`, filteredUpdate)

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// Delete user (soft delete)
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    const { id } = params

    // Soft delete by deactivating the user
    const deletedUser = await User.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        deletedAt: new Date(),
        deletedBy: user.id
      },
      { new: true }
    ).select('-password')

    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Log admin action
    console.log(`Admin ${user.id} deleted user ${id}`)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}