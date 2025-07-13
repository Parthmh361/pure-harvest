export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const location = searchParams.get('location')
    const organicOnly = searchParams.get('organicOnly') === 'true'
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12

    // Build query
    let query = { 
      isActive: true,
      quantity: { $gt: 0 }
    }

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }

    // Category filter
    if (category) {
      query.category = category
    }

    // Price range
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = parseFloat(minPrice)
      if (maxPrice) query.price.$lte = parseFloat(maxPrice)
    }

    // Organic filter
    if (organicOnly) {
      query.isOrganic = true
    }

    // Build sort
    let sort = {}
    switch (sortBy) {
      case 'price-low':
        sort = { price: 1 }
        break
      case 'price-high':
        sort = { price: -1 }
        break
      case 'rating':
        sort = { 'rating.average': -1 }
        break
      case 'popular':
        sort = { soldQuantity: -1 }
        break
      default:
        sort = { createdAt: -1 }
    }

    const skip = (page - 1) * limit

    // Execute query
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .populate('farmer', 'name businessName location city state')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ])

    const totalPages = Math.ceil(totalProducts / limit)

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}