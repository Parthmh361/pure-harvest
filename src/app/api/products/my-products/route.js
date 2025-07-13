export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'

// Get farmer's products
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Only farmers can access this endpoint' },
        { status: 403 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const status = searchParams.get('status') // 'active', 'inactive', or 'all'
    const search = searchParams.get('search')

    // Build filter for farmer's products
    const filter = { farmer: user.id }
    
    // Status filter
    if (status === 'active') {
      filter.isActive = true
    } else if (status === 'inactive') {
      filter.isActive = false
    }
    // If status is 'all' or not provided, don't filter by isActive

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch products
    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ])

    const totalPages = Math.ceil(totalProducts / limit)

    // Calculate summary stats
    const stats = await Product.aggregate([
      { $match: { farmer: user.id } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactiveProducts: { $sum: { $cond: ['$isActive', 0, 1] } },
          totalQuantity: { $sum: '$quantity' },
          averagePrice: { $avg: '$price' }
        }
      }
    ])

    const summary = stats[0] || {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      totalQuantity: 0,
      averagePrice: 0
    }

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      summary
    })

  } catch (error) {
    console.error('My products fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}