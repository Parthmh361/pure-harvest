export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 8
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')

    // Build query
    let query = { 
      isActive: true,
      quantity: { $gt: 0 }
    }

    if (category && category !== 'all') {
      query.category = category
    }

    if (featured === 'true') {
      // For featured products, we can use high-rated or recently added products
      query.$or = [
        { 'rating.average': { $gte: 4 } },
        { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Last 7 days
      ]
    }

    const products = await Product.find(query)
      .populate('farmer', 'name businessName location rating')
      .sort({ createdAt: -1 })
      .limit(limit)

    // Transform products to include farmer info
    const transformedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      unit: product.unit,
      category: product.category,
      images: product.images,
      quantity: product.quantity,
      rating: product.rating,
      tags: product.tags,
      isOrganic: product.isOrganic,
      harvestDate: product.harvestDate,
      farmer: product.farmer ? {
        _id: product.farmer._id,
        name: product.farmer.name,
        businessName: product.farmer.businessName,
        location: product.farmer.location,
        rating: product.farmer.rating
      } : null,
      createdAt: product.createdAt
    }))

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      count: transformedProducts.length
    })

  } catch (error) {
    console.error('Products preview fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}