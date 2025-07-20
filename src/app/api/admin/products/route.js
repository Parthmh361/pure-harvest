import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'
import NotificationService from '@/lib/notification-service' // Adjust the import based on your project structure

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
    const category = searchParams.get('category')
    const farmer = searchParams.get('farmer')
    const isOrganic = searchParams.get('isOrganic')
    const skip = (page - 1) * limit

    let filter = {}
    if (status === 'pending') filter.isActive = false
    if (status === 'active') filter.isActive = true
    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }
    if (category && category !== 'all') {
      filter.category = category // category is already lowercase from frontend
    }
    if (farmer) {
      filter.farmer = farmer
    }
    if (isOrganic === 'true') {
      filter.organicCertified = true
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
        totalItems: total
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

    // Notify farmer when product is activated by admin
    if (isActive) {
      await NotificationService.create({
        recipientId: product.farmer,
        type: 'product_activated',
        title: 'Product Activated',
        message: `Your product "${product.name}" has been activated by admin.`,
        data: { productId: product._id, productName: product.name },
        channels: { inApp: true, email: true }
      })
    }

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