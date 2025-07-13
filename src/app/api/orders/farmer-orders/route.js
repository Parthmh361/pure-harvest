import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/order'
import { withAuth } from '@/lib/auth'
import mongoose from 'mongoose'

const getFarmerOrders = async (request) => {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const skip = (page - 1) * limit

    let farmerObjectId
    try {
      farmerObjectId = new mongoose.Types.ObjectId(request.user.id)
    } catch {
      return NextResponse.json({ error: 'Invalid farmer id' }, { status: 400 })
    }

    // Build match stage
    const matchStage = { 'items.farmer': farmerObjectId }
    if (status && status !== 'all') matchStage.status = status
    if (startDate || endDate) {
      matchStage.createdAt = {}
      if (startDate) matchStage.createdAt.$gte = new Date(startDate)
      if (endDate) matchStage.createdAt.$lte = new Date(endDate)
    }

    const [orders, total] = await Promise.all([
      Order.aggregate([
        { $match: matchStage },
        {
          $addFields: {
            farmerTotal: {
              $sum: {
                $map: {
                  input: {
                    $filter: {
                      input: '$items',
                      as: 'item',
                      cond: { $eq: ['$$item.farmer', farmerObjectId] }
                    }
                  },
                  as: 'item',
                  in: { $multiply: ['$$item.price', '$$item.quantity'] }
                }
              }
            },
            farmerItems: {
              $filter: {
                input: '$items',
                as: 'item',
                cond: { $eq: ['$$item.farmer', farmerObjectId] }
              }
            }
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'buyer',
            foreignField: '_id',
            as: 'buyer',
            pipeline: [{ $project: { name: 1, email: 1, phone: 1 } }]
          }
        },
        { $unwind: '$buyer' }
      ]),
      Order.countDocuments(matchStage)
    ])

    const totalPages = Math.ceil(total / limit)

    // Calculate summary statistics
    const statsAgg = await Order.aggregate([
      { $match: { 'items.farmer': farmerObjectId } },
      {
        $addFields: {
          farmerTotal: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$items',
                    as: 'item',
                    cond: { $eq: ['$$item.farmer', farmerObjectId] }
                  }
                },
                as: 'item',
                in: { $multiply: ['$$item.price', '$$item.quantity'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$farmerTotal' }
        }
      }
    ])

    // Calculate stats for frontend
    const stats = {
      totalOrders: total,
      totalRevenue: statsAgg.reduce((sum, stat) => sum + (stat.totalRevenue || 0), 0),
      pendingOrders: statsAgg.find(s => s._id === 'pending')?.count || 0,
      avgOrderValue: total ? Math.round(statsAgg.reduce((sum, stat) => sum + (stat.totalRevenue || 0), 0) / total) : 0,
      statusBreakdown: statsAgg.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, revenue: stat.totalRevenue }
        return acc
      }, {})
    }

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats // <-- frontend expects this key
    })

  } catch (error) {
    console.error('Farmer orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// Export GET using withAuth and restrict to 'farmer'
export const GET = withAuth(getFarmerOrders, ['farmer'])