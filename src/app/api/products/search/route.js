import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'
import mongoose from 'mongoose'

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const location = searchParams.get('location') || ''
    const minPrice = parseFloat(searchParams.get('minPrice')) || 0
    const maxPrice = parseFloat(searchParams.get('maxPrice')) || Number.MAX_VALUE
    const rating = parseFloat(searchParams.get('rating')) || 0
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12

    // Build search filter
    const filter = {
      isActive: true,
      quantity: { $gt: 0 }
    }

    // Text search
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    }

    // Category filter
    if (category) {
      filter.category = category
    }

    // Price range filter
    if (minPrice > 0 || maxPrice < Number.MAX_VALUE) {
      filter.price = {}
      if (minPrice > 0) filter.price.$gte = minPrice
      if (maxPrice < Number.MAX_VALUE) filter.price.$lte = maxPrice
    }

    // Rating filter
    if (rating > 0) {
      filter.rating = { $gte: rating }
    }

    // Location filter (farmer's location)
    let locationFilter = {}
    if (location) {
      locationFilter = {
        $or: [
          { 'address.state': { $regex: location, $options: 'i' } },
          { 'address.city': { $regex: location, $options: 'i' } },
          { 'location.state': { $regex: location, $options: 'i' } },
          { 'location.city': { $regex: location, $options: 'i' } }
        ]
      }
    }

    // Build sort criteria
    let sortCriteria = {}
    switch (sortBy) {
      case 'price_low':
        sortCriteria = { price: 1 }
        break
      case 'price_high':
        sortCriteria = { price: -1 }
        break
      case 'rating':
        sortCriteria = { rating: -1, reviewCount: -1 }
        break
      case 'newest':
        sortCriteria = { createdAt: -1 }
        break
      case 'relevance':
      default:
        // For relevance, we'll use a combination of rating and creation date
        sortCriteria = { rating: -1, createdAt: -1 }
        break
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build aggregation pipeline
    const pipeline = [
      // Lookup farmer details
      {
        $lookup: {
          from: 'users',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmer'
        }
      },
      { $unwind: '$farmer' },
      
      // Apply location filter to farmer
      ...(Object.keys(locationFilter).length > 0 ? [{ $match: locationFilter }] : []),
      
      // Apply product filters
      { $match: filter },
      
      // Add search score for text relevance
      ...(query ? [{
        $addFields: {
          searchScore: {
            $add: [
              // Name match gets highest score
              {
                $cond: [
                  { $regexMatch: { input: '$name', regex: query, options: 'i' } },
                  10,
                  0
                ]
              },
              // Category match gets medium score
              {
                $cond: [
                  { $regexMatch: { input: '$category', regex: query, options: 'i' } },
                  5,
                  0
                ]
              },
              // Description match gets lower score
              {
                $cond: [
                  { $regexMatch: { input: '$description', regex: query, options: 'i' } },
                  2,
                  0
                ]
              }
            ]
          }
        }
      }] : []),
      
      // Sort
      {
        $sort: query && sortBy === 'relevance' 
          ? { searchScore: -1, rating: -1, createdAt: -1 }
          : sortCriteria
      },
      
      // Pagination
      { $skip: skip },
      { $limit: limit },
      
      // Project fields
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          category: 1,
          price: 1,
          unit: 1,
          quantity: 1,
          images: 1,
          rating: 1,
          reviewCount: 1,
          createdAt: 1,
          'farmer._id': 1,
          'farmer.name': 1,
          'farmer.businessName': 1,
          'farmer.address': 1,
          'farmer.location': 1,
          ...(query ? { searchScore: 1 } : {})
        }
      }
    ]

    // Execute search
    const [products, totalCount] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate([
        // Same lookup and filters for count
        {
          $lookup: {
            from: 'users',
            localField: 'farmer',
            foreignField: '_id',
            as: 'farmer'
          }
        },
        { $unwind: '$farmer' },
        ...(Object.keys(locationFilter).length > 0 ? [{ $match: locationFilter }] : []),
        { $match: filter },
        { $count: 'total' }
      ])
    ])

    const totalProducts = totalCount[0]?.total || 0
    const totalPages = Math.ceil(totalProducts / limit)

    // Add additional product stats for better search experience
    const categoryStats = await Product.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmer'
        }
      },
      { $unwind: '$farmer' },
      ...(Object.keys(locationFilter).length > 0 ? [{ $match: locationFilter }] : []),
      { 
        $match: { 
          isActive: true, 
          quantity: { $gt: 0 },
          ...(query ? {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { category: { $regex: query, $options: 'i' } }
            ]
          } : {})
        } 
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ])

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      },
      filters: {
        appliedFilters: {
          query,
          category,
          location,
          minPrice: minPrice > 0 ? minPrice : null,
          maxPrice: maxPrice < Number.MAX_VALUE ? maxPrice : null,
          rating: rating > 0 ? rating : null,
          sortBy
        },
        categoryStats,
        priceRange: {
          min: Math.min(...products.map(p => p.price)),
          max: Math.max(...products.map(p => p.price))
        }
      }
    })

  } catch (error) {
    console.error('Product search error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}