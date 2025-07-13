import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit')) || 10

    const products = await Product.find({ farmer: id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name category price images isActive createdAt')
      .lean()

    return NextResponse.json({
      success: true,
      products
    })

  } catch (error) {
    console.error('User products fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user products' },
      { status: 500 }
    )
  }
}