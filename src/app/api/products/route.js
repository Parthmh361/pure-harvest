import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import connectDB from '@/lib/mongodb'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 12
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    // Build query
    const query = { isActive: true }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get products
    const products = await Product.find(query)
      .populate('farmer', 'name email')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count
    const total = await Product.countDocuments(query)

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// For farmers to get only their products
export async function POST(request) {
  try {
    // Check authentication
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'farmer') {
      return NextResponse.json({ error: 'Only farmers can add products' }, { status: 403 })
    }

    await connectDB()

    const formData = await request.formData()
    const name = formData.get('name')
    const description = formData.get('description')
    const price = parseFloat(formData.get('price'))
    const category = formData.get('category')
    const unit = formData.get('unit')
    const stock = parseInt(formData.get('stock'))
    const isOrganic = formData.get('isOrganic') === 'true'
    const images = formData.getAll('images')

    // Validate required fields
    if (!name || !description || !price || !category || !unit || !stock) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Handle image uploads
    const imageUrls = []
    
    if (images && images.length > 0) {
      // Create upload directory
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
      try {
        await mkdir(uploadDir, { recursive: true })
      } catch (error) {
        // Directory already exists
      }

      for (const image of images) {
        if (image instanceof File && image.size > 0) {
          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
          if (!allowedTypes.includes(image.type)) {
            return NextResponse.json({ 
              error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
            }, { status: 400 })
          }

          // Validate file size (5MB limit)
          if (image.size > 5 * 1024 * 1024) {
            return NextResponse.json({ 
              error: 'File size too large. Maximum 5MB per image.' 
            }, { status: 400 })
          }

          // Generate unique filename
          const timestamp = Date.now()
          const random = Math.round(Math.random() * 1E9)
          const extension = path.extname(image.name)
          const filename = `${timestamp}-${random}${extension}`
          
          // Save file
          const bytes = await image.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const filePath = path.join(uploadDir, filename)
          await writeFile(filePath, buffer)
          
          // Store the public URL
          imageUrls.push(`/uploads/products/${filename}`)
        }
      }
    }

    // Create product
    const product = new Product({
      name,
      description,
      price,
      category,
      unit,
      stock,
      isOrganic,
      images: imageUrls,
      farmer: user.id,
      isActive: true
    })

    const savedProduct = await product.save()
    
    // Populate farmer data
    await savedProduct.populate('farmer', 'name email')

    return NextResponse.json({
      success: true,
      message: 'Product added successfully',
      product: savedProduct
    }, { status: 201 })

  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({
      error: 'Failed to create product: ' + error.message
    }, { status: 500 })
  }
}