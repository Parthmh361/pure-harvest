export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'

export async function GET(request) {
  try {
    await connectDB()

    // Get user role from query or session (example: ?role=admin)
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'buyer' // default to buyer

    // Filter for active products for farmer/buyer, all for admin
    const productFilter = (role === 'admin') ? {} : { isActive: true }

    // Get all unique categories
    const categories = await Product.distinct('category', productFilter)

    // Get category counts
    const categoryCounts = await Product.aggregate([
      { $match: productFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Predefined category list with icons and descriptions
    const predefinedCategories = [
      { name: 'Vegetables', description: 'Fresh seasonal vegetables', icon: '🥬', color: 'green' },
      { name: 'Fruits', description: 'Seasonal fresh fruits', icon: '🍎', color: 'red' },
      { name: 'Grains', description: 'Rice, wheat, and other grains', icon: '🌾', color: 'yellow' },
      { name: 'Pulses', description: 'Lentils, beans, and pulses', icon: '🫘', color: 'orange' },
      { name: 'Herbs', description: 'Fresh herbs and spices', icon: '🌿', color: 'green' },
      { name: 'Dairy', description: 'Fresh dairy products', icon: '🥛', color: 'blue' },
      { name: 'Nuts', description: 'Dry fruits and nuts', icon: '🥜', color: 'brown' },
      { name: 'Flowers', description: 'Fresh flowers', icon: '🌸', color: 'pink' }
    ]

    // Merge with actual data
    const enrichedCategories = predefinedCategories.map(predefined => {
      const actual = categoryCounts.find(cat =>
        cat._id.toLowerCase() === predefined.name.toLowerCase()
      )
      return {
        ...predefined,
        count: actual?.count || 0,
        avgPrice: actual?.avgPrice || 0,
        totalQuantity: actual?.totalQuantity || 0,
        isAvailable: Boolean(actual)
      }
    })

    // Add any categories not in predefined list
    categoryCounts.forEach(actual => {
      const exists = predefinedCategories.find(pred =>
        pred.name.toLowerCase() === actual._id.toLowerCase()
      )
      if (!exists) {
        enrichedCategories.push({
          name: actual._id,
          description: `Fresh ${actual._id.toLowerCase()}`,
          icon: '📦',
          color: 'gray',
          count: actual.count,
          avgPrice: actual.avgPrice,
          totalQuantity: actual.totalQuantity,
          isAvailable: true
        })
      }
    })

    return NextResponse.json({
      success: true,
      categories: enrichedCategories.filter(cat => cat.isAvailable),
      allCategories: enrichedCategories,
      totalCategories: categories.length
    })

  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}