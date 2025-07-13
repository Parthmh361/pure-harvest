import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import Order from '@/models/order'
import Product from '@/models/product'
import { requireAuth } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    await connectDB()

    const { id } = params
    
    // Get user data
    const userData = await User.findById(id).select('-password').lean()
    
    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get related data
    const [orders, products] = await Promise.all([
      Order.find({
        $or: [
          { buyer: id },
          { 'items.farmer': id }
        ]
      }).lean(),
      userData.role === 'farmer' ? Product.find({ farmer: id }).lean() : []
    ])

    const exportData = {
      user: userData,
      orders,
      products,
      exportedAt: new Date().toISOString(),
      exportedBy: user.id
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-${userData.name}-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('User export error:', error)
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    )
  }
}
