import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Wishlist from '@/models/wishlist'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'

// Get user wishlist
export async function GET(request) {
  try {
    console.log('GET /api/wishlist - Starting request')
    
    const user = await requireAuth(request)
    if (!user) {
      console.log('No user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'buyer') {
      console.log('User is not a buyer')
      return NextResponse.json(
        { error: 'Only buyers can access wishlist' },
        { status: 403 }
      )
    }

    await connectDB()

    console.log('Finding wishlist for user:', user.id)
    
    // Find wishlist without population first
    let wishlist = await Wishlist.findOne({ user: user.id })

    if (!wishlist) {
      console.log('No wishlist found, creating empty one')
      return NextResponse.json({
        success: true,
        wishlist: {
          products: []
        },
        totalItems: 0
      })
    }

    console.log('Found wishlist with', wishlist.products.length, 'products')

    // Get product details separately to avoid serialization issues
    const productIds = wishlist.products.map(item => item.product)
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    }).select('name price images category unit farmer').lean()

    console.log('Found', products.length, 'active products')

    // Create clean response data
    const wishlistProducts = wishlist.products
      .map(wishlistItem => {
        const product = products.find(p => p._id.toString() === wishlistItem.product.toString())
        if (!product) return null

        return {
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            images: product.images,
            category: product.category,
            unit: product.unit,
            farmer: product.farmer
          },
          addedAt: wishlistItem.addedAt
        }
      })
      .filter(item => item !== null)

    console.log('Returning', wishlistProducts.length, 'valid products')

    return NextResponse.json({
      success: true,
      wishlist: {
        _id: wishlist._id,
        user: wishlist.user,
        products: wishlistProducts,
        createdAt: wishlist.createdAt,
        updatedAt: wishlist.updatedAt
      },
      totalItems: wishlistProducts.length
    })

  } catch (error) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}

// Add product to wishlist
export async function POST(request) {
  try {
    console.log('POST /api/wishlist - Starting request')
    
    const user = await requireAuth(request)
    
    if (!user) {
      console.log('No user found - returning 401')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'buyer') {
      console.log('User role is not buyer:', user.role)
      return NextResponse.json(
        { error: 'Only buyers can add to wishlist' },
        { status: 403 }
      )
    }

    await connectDB()

    let body
    try {
      body = await request.json()
      console.log('Request body:', body)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { productId } = body

    if (!productId) {
      console.log('No productId provided')
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    console.log('Looking for product:', productId)

    // Check if product exists and is active
    const product = await Product.findById(productId)
    console.log('Found product:', product ? 'Yes' : 'No')
    
    if (!product) {
      console.log('Product not found')
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!product.isActive) {
      console.log('Product not active')
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 400 }
      )
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: user.id })
    console.log('Found existing wishlist:', wishlist ? 'Yes' : 'No')
    
    if (!wishlist) {
      console.log('Creating new wishlist')
      wishlist = new Wishlist({ user: user.id, products: [] })
    }

    // Check if product already in wishlist
    const existingProduct = wishlist.products.find(
      item => item.product.toString() === productId
    )

    if (existingProduct) {
      console.log('Product already in wishlist')
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      )
    }

    // Add product to wishlist
    console.log('Adding product to wishlist')
    wishlist.products.push({
      product: productId,
      addedAt: new Date()
    })

    await wishlist.save()
    console.log('Wishlist saved successfully')

    console.log('Returning success response')
    return NextResponse.json({
      success: true,
      message: 'Product added to wishlist',
      wishlistId: wishlist._id,
      totalItems: wishlist.products.length
    })

  } catch (error) {
    console.error('Add to wishlist error:', error)
    return NextResponse.json(
      { error: 'Failed to add product to wishlist' },
      { status: 500 }
    )
  }
}