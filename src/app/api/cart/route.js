import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'

// GET cart items
export async function GET(request) {
  try {
    console.log('🛒 GET /api/cart - Starting request')
    
    const user = await requireAuth(request)
    if (!user) {
      console.log('❌ Authentication failed')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    await connectDB()

    const userWithCart = await User.findById(user.id)
      .populate({
        path: 'cart.product',
        select: 'name price images category farmer isActive'
      })
      .select('cart')

    if (!userWithCart) {
      console.log('❌ User not found')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Filter out inactive products and null references
    const validCartItems = userWithCart.cart.filter(item => 
      item.product && item.product.isActive
    )

    console.log('✅ Cart fetched successfully:', validCartItems.length, 'items')

    return NextResponse.json({
      success: true,
      cart: validCartItems
    })

  } catch (error) {
    console.error('❌ Cart GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart: ' + error.message },
      { status: 500 }
    )
  }
}

// POST add item to cart
export async function POST(request) {
  try {
    console.log('🛒 POST /api/cart - Starting request')
    
    const user = await requireAuth(request)
    if (!user) {
      console.log('❌ Authentication failed')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    const body = await request.json()
    const { productId, quantity = 1 } = body

    console.log('📦 Adding to cart:', { productId, quantity })

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: 'Quantity must be between 1 and 10' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if product exists and is active
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      console.log('❌ Product not found or inactive:', productId)
      return NextResponse.json(
        { error: 'Product not found or unavailable' },
        { status: 404 }
      )
    }

    // Check stock availability
    if (product.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient stock available' },
        { status: 400 }
      )
    }

    // Get user cart
    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if item already exists in cart
    const existingItemIndex = userDoc.cart.findIndex(
      item => item.product && item.product.toString() === productId
    )

    if (existingItemIndex > -1) {
      // Update existing item
      const newQuantity = userDoc.cart[existingItemIndex].quantity + quantity
      
      if (newQuantity > product.quantity) {
        return NextResponse.json(
          { error: 'Cannot add more items than available in stock' },
          { status: 400 }
        )
      }

      if (newQuantity > 10) {
        return NextResponse.json(
          { error: 'Maximum 10 items allowed per product' },
          { status: 400 }
        )
      }

      userDoc.cart[existingItemIndex].quantity = newQuantity
    } else {
      // Add new item
      userDoc.cart.push({
        product: productId,
        quantity,
        addedAt: new Date()
      })
    }

    await userDoc.save()

    console.log('✅ Item added to cart successfully')

    // Return updated cart
    const updatedUser = await User.findById(user.id)
      .populate({
        path: 'cart.product',
        select: 'name price images category farmer isActive'
      })
      .select('cart')

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: updatedUser.cart
    })

  } catch (error) {
    console.error('❌ Cart POST error:', error)
    return NextResponse.json(
      { error: 'Failed to add item to cart: ' + error.message },
      { status: 500 }
    )
  }
}

// DELETE remove item from cart
export async function DELETE(request) {
  try {
    console.log('🛒 DELETE /api/cart - Starting request')
    
    const user = await requireAuth(request)
    if (!user) {
      console.log('❌ Authentication failed')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email)

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Removing from cart:', productId)

    await connectDB()

    const userDoc = await User.findById(user.id)
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Remove item from cart
    const originalLength = userDoc.cart.length
    userDoc.cart = userDoc.cart.filter(
      item => item.product && item.product.toString() !== productId
    )

    if (userDoc.cart.length === originalLength) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      )
    }

    await userDoc.save()

    console.log('✅ Item removed from cart successfully')

    // Return updated cart
    const updatedUser = await User.findById(user.id)
      .populate({
        path: 'cart.product',
        select: 'name price images category farmer isActive'
      })
      .select('cart')

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: updatedUser.cart
    })

  } catch (error) {
    console.error('❌ Cart DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to remove item from cart: ' + error.message },
      { status: 500 }
    )
  }
}