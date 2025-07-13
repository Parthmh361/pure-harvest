import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/review'
import Product from '@/models/product'
import Order from '@/models/order'
import { requireAuth } from '@/lib/auth'

// GET reviews for a product
export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const sort = searchParams.get('sort') || 'newest'
    const rating = searchParams.get('rating')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    // Build filter
    let filter = { product: productId }
    if (rating && rating !== 'all') {
      filter.rating = parseInt(rating)
    }

    // Build sort
    let sortOption = { createdAt: -1 } // newest first
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 }
        break
      case 'highest':
        sortOption = { rating: -1, createdAt: -1 }
        break
      case 'lowest':
        sortOption = { rating: 1, createdAt: -1 }
        break
      case 'helpful':
        sortOption = { helpfulVotes: -1, createdAt: -1 }
        break
    }

    const [reviews, totalReviews] = await Promise.all([
      Review.find(filter)
        .populate('buyer', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter)
    ])

    // Calculate average rating and distribution
    const ratingStats = await Review.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ])

    const ratingDistribution = await Review.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ])

    const distribution = {}
    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count
    })

    const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 }
    const totalPages = Math.ceil(totalReviews / limit)

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        distribution
      }
    })

  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

// POST create a new review
export const POST = requireAuth(async (request) => {
  try {
    await connectDB()
    
    const body = await request.json()
    const { productId, orderId, rating, comment, images = [] } = body

    // Validation
    if (!productId || !orderId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Product ID, order ID, rating, and comment are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (comment.length < 10) {
      return NextResponse.json(
        { error: 'Review comment must be at least 10 characters long' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if order exists and belongs to user
    const order = await Order.findById(orderId)
    if (!order || order.buyer.toString() !== request.user.userId) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      )
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'You can only review delivered orders' },
        { status: 400 }
      )
    }

    // Check if product was in the order
    const orderItem = order.items.find(item => 
      item.productId && item.productId.toString() === productId
    )
    
    if (!orderItem) {
      return NextResponse.json(
        { error: 'This product was not in your order' },
        { status: 400 }
      )
    }

    // Check if user has already reviewed this product for this order
    const existingReview = await Review.findOne({
      product: productId,
      order: orderId,
      buyer: request.user.userId
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product for this order' },
        { status: 400 }
      )
    }

    // Create review
    const review = new Review({
      product: productId,
      order: orderId,
      buyer: request.user.userId,
      rating: parseInt(rating),
      comment: comment.trim(),
      images: images.filter(img => img), // Remove empty images
      isVerified: true // Since it's linked to a purchase
    })

    await review.save()

    // Update product rating
    await updateProductRating(productId)

    const populatedReview = await Review.findById(review._id)
      .populate('buyer', 'name')

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      review: populatedReview
    })

  } catch (error) {
    console.error('Review creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}, ['buyer'])

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const ratingStats = await Review.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ])

    const stats = ratingStats[0]
    if (stats) {
      await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(stats.averageRating * 10) / 10,
        'rating.count': stats.totalReviews
      })
    }
  } catch (error) {
    console.error('Error updating product rating:', error)
  }
}