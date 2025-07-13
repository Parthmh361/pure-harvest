import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'
import mongoose from 'mongoose'
import { requireAuth } from '@/lib/auth'

// Get single product
export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log('📦 Fetching product with ID:', id)

    // Handle special case for recommendations
    if (id === 'recommendations') {
      return getRecommendations(request)
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    await connectDB()

    const product = await Product.findById(id)
      .populate('farmer', 'name email phone address')
      .lean()

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      product
    })

  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

async function getRecommendations(request) {
  try {
    await connectDB()

    // Get featured/recommended products
    const recommendations = await Product.find({ 
      isActive: true,
      stock: { $gt: 0 }
    })
    .populate('farmer', 'name')
    .sort({ createdAt: -1 })
    .limit(8)
    .lean()

    return NextResponse.json({
      success: true,
      products: recommendations,
      total: recommendations.length
    })

  } catch (error) {
    console.error('Recommendations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

// Update product (PUT)
export async function PUT(request, { params }) {
  return updateProduct(request, params)
}

// Update product (PATCH) - for partial updates
export async function PATCH(request, { params }) {
  return updateProduct(request, params)
}

// Shared update logic
async function updateProduct(request, params) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const { id } = params
    const product = await Product.findById(id)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canUpdate = 
      user.role === 'admin' || 
      (user.role === 'farmer' && product.farmer.toString() === user.id)

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const updateData = await request.json()
    
    // Remove fields that shouldn't be updated
    delete updateData._id
    delete updateData.farmer
    delete updateData.createdAt
    delete updateData.updatedAt
    delete updateData.rating

    console.log('📝 Updating product:', { id, updateData })

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('farmer', 'name businessName phone email')

    console.log('✅ Product updated successfully')

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    })

  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json(
      { error: 'Failed to update product: ' + error.message },
      { status: 500 }
    )
  }
}

// Delete product
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const { id } = params
    const product = await Product.findById(id)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canDelete = 
      user.role === 'admin' || 
      (user.role === 'farmer' && product.farmer.toString() === user.id)

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    console.log('🗑️ Deleting product:', { id, name: product.name })

    // Soft delete by setting isActive to false
    await Product.findByIdAndUpdate(id, { isActive: false })

    console.log('✅ Product deleted successfully')

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product: ' + error.message },
      { status: 500 }
    )
  }
}