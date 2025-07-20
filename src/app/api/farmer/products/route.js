import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'
import User from '@/models/user'
import NotificationService from '@/lib/notification-service'

// Create new product
export async function POST(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'farmer') {
      return NextResponse.json(
        { error: 'Only farmers can create products' },
        { status: 403 }
      )
    }

    await connectDB()
    
    const productData = await request.json()

    const requiredFields = ['name', 'description', 'category', 'quantity', 'unit']
    for (const field of requiredFields) {
      if (!productData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate images
    if (!productData.images || productData.images.length === 0) {
      return NextResponse.json(
        { error: 'At least one product image is required' },
        { status: 400 }
      )
    }

    // Set price to zero
    productData.price = 0

    // Create product
    const product = new Product({
      ...productData,
      farmer: user.id,
      isActive: false
    })

    await product.save()

    // Notify all admins when a new product is added
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id')
    for (const admin of admins) {
      await NotificationService.create({
        recipientId: admin._id,
        type: 'product_created',
        title: 'New Product Added',
        message: `A new product "${product.name}" has been added.`,
        data: { productId: product._id, productName: product.name },
        channels: { inApp: true, email: true }
      })
    }

    // Populate farmer data for response
    await product.populate('farmer', 'name businessName phone email')

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product
    }, { status: 201 })

  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

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
        { error: 'Access denied. Farmers only.' },
        { status: 403 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const status = searchParams.get('status') // active, inactive, all

    const skip = (page - 1) * limit

    // Filter for ONLY the authenticated farmer's products
    let filter = { farmer: user.id }

    if (status && status !== 'all') {
      filter.isActive = status === 'active'
    }

    console.log('🚜 Farmer products filter:', filter)
    console.log('👤 Authenticated farmer ID:', user.id)

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ])

    console.log('✅ Found products for farmer:', products.length)

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNextPage: page < Math.ceil(totalProducts / limit),
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('Farmer products fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch farmer products' },
      { status: 500 }
    )
  }
}