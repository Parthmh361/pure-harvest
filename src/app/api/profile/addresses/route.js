import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/user'
import { requireAuth } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// Get all addresses
export async function GET(request) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const userData = await User.findById(user.id).select('addresses')
    
    return NextResponse.json({
      success: true,
      addresses: userData?.addresses || []
    })

  } catch (error) {
    console.error('Address fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

// Add new address
export async function POST(request) {
  try {
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await connectDB()

    const addressData = await request.json()

    // Validate required fields
    const required = ['type', 'street', 'city', 'state', 'pincode']
    const missing = required.filter(field => !addressData[field]?.trim())
    
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate pincode format (Indian pincode)
    if (!/^\d{6}$/.test(addressData.pincode)) {
      return NextResponse.json(
        { error: 'Pincode must be a 6-digit number' },
        { status: 400 }
      )
    }

    const newAddress = {
      _id: new ObjectId(),
      type: addressData.type,
      street: addressData.street.trim(),
      city: addressData.city.trim(),
      state: addressData.state,
      pincode: addressData.pincode.trim(),
      landmark: addressData.landmark?.trim() || '',
      isDefault: addressData.isDefault || false
    }

    // If this is the first address or marked as default, make it default
    const userData = await User.findById(user.id).select('addresses')
    const isFirstAddress = !userData.addresses || userData.addresses.length === 0
    
    if (isFirstAddress) {
      newAddress.isDefault = true
    } else if (newAddress.isDefault) {
      // Remove default from other addresses
      await User.findByIdAndUpdate(
        user.id,
        { $set: { 'addresses.$[].isDefault': false } }
      )
    }

    // Add new address
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { $push: { addresses: newAddress } },
      { new: true, select: 'addresses' }
    )

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
      address: newAddress,
      addresses: updatedUser.addresses
    })

  } catch (error) {
    console.error('Address add error:', error)
    return NextResponse.json(
      { error: 'Failed to add address' },
      { status: 500 }
    )
  }
}