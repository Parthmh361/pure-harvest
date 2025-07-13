import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Upload from '@/models/upload'
import mongoose from 'mongoose'

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { id } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    const fileDoc = await Upload.findById(id)
    if (!fileDoc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return new Response(fileDoc.data, {
      headers: {
        'Content-Type': fileDoc.mimetype,
        'Content-Disposition': `inline; filename="${fileDoc.filename}"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
  }
}