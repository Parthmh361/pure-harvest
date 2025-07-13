import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Upload from '@/models/upload'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    await connectDB()
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Save to MongoDB
    const uploadDoc = await Upload.create({
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      data: buffer
    })

    // POST /api/upload
    return NextResponse.json({
      success: true,
      id: uploadDoc._id,
      filename: uploadDoc.filename,
      mimetype: uploadDoc.mimetype,
      size: uploadDoc.size
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}