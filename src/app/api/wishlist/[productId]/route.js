import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Wishlist from '@/models/wishlist'
import { requireAuth } from '@/lib/auth'

// Remove product from wishlist
export async function DELETE(request, { params }) {
  try {
    console.log('DELETE wishlist item - productId:', params.productId)
    
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Only buyers can remove from wishlist' },
        { status: 403 }
      )
    }

    await connectDB()

    const { productId } = params

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: user.id })

    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      )
    }

    // Remove product from wishlist
    const initialLength = wishlist.products.length
    wishlist.products = wishlist.products.filter(
      item => item.product.toString() !== productId
    )

    if (wishlist.products.length === initialLength) {
      return NextResponse.json(
        { error: 'Product not found in wishlist' },
        { status: 404 }
      )
    }

    await wishlist.save()

    console.log('Product removed from wishlist successfully')
    return NextResponse.json({
      success: true,
      message: 'Product removed from wishlist',
      totalItems: wishlist.products.length
    })

  } catch (error) {
    console.error('Remove from wishlist error:', error)
    return NextResponse.json(
      { error: 'Failed to remove product from wishlist' },
      { status: 500 }
    )
  }
}