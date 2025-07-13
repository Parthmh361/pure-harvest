import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Cart from '@/models/cart'
import { requireAuth } from '@/lib/auth'

// DELETE remove specific item from cart
export const DELETE = requireAuth(async (request, { params }) => {
  try {
    await connectDB()

    const { productId } = params

    const cart = await Cart.findOne({ user: request.user.userId })
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      )
    }

    // Remove the item
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    )

    await cart.save()

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart'
    })

  } catch (error) {
    console.error('Remove from cart error:', error)
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    )
  }
}, ['buyer'])