import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'

// GET: List all products (with filters)
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    await connectDB()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    let filter = {}
    if (status === 'pending') filter.isActive = false
    if (status === 'active') filter.isActive = true
    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('farmer', 'name businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ])

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Approve or update product
export async function PATCH(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    await connectDB()
    const { productId, isActive } = await request.json()
    const product = await Product.findById(productId)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    product.isActive = isActive
    await product.save()
    return NextResponse.json({ success: true, product })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Remove a product
export async function DELETE(request) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    await connectDB()
    const { productId } = await request.json()
    await Product.findByIdAndDelete(productId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}