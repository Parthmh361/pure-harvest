import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'
import Order from '@/models/order'
import { requireAuth } from '@/lib/auth'

export const GET = requireAuth(async (request) => {
  try {
    await connectDB()
    
    const farmerId = request.user.userId

    // Get current month for revenue calculation
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all products by farmer
    const [totalProducts, activeProducts] = await Promise.all([
      Product.countDocuments({ farmer: farmerId }),
      Product.countDocuments({ farmer: farmerId, isActive: true })
    ])

    // Get low stock products (quantity < 10)
    const lowStockProducts = await Product.countDocuments({ 
      farmer: farmerId, 
      quantity: { $lt: 10 },
      isActive: true 
    })

    // Get orders statistics
    const [totalOrders, pendingOrders] = await Promise.all([
      Order.countDocuments({ 'items.farmerId': farmerId }),
      Order.countDocuments({ 
        'items.farmerId': farmerId, 
        status: { $in: ['pending', 'confirmed'] }
      })
    ])

    // Calculate total revenue for current month
    const revenueAggregation = await Order.aggregate([
      {
        $match: {
          'items.farmerId': farmerId,
          status: { $ne: 'cancelled' },
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $match: {
          'items.farmerId': farmerId
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $multiply: ['$items.price', '$items.quantity']
            }
          }
        }
      }
    ])

    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        lowStockProducts
      }
    })

  } catch (error) {
    console.error('Farmer stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}, ['farmer'])
