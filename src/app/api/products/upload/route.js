import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireAuth } from '@/lib/auth'

export async function POST(request) {
  try {
    // Check authentication
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('images')

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    const uploadedFiles = []

    // Create upload directory in public folder
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
    await mkdir(uploadDir, { recursive: true })

    for (const file of files) {
      if (file instanceof File && file.size > 0) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ 
            error: `Invalid file type: ${file.type}. Only JPEG, PNG, GIF, and WebP are allowed.` 
          }, { status: 400 })
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json({ 
            error: 'File size too large. Maximum 5MB per image.' 
          }, { status: 400 })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const random = Math.round(Math.random() * 1E9)
        const extension = path.extname(file.name)
        const filename = `${timestamp}-${random}${extension}`
        
        // Save file to public directory
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filePath = path.join(uploadDir, filename)
        await writeFile(filePath, buffer)
        
        console.log(`File saved to: ${filePath}`)
        
        // Return the public URL path
        uploadedFiles.push(`/uploads/products/${filename}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: 'Upload failed: ' + error.message
    }, { status: 500 })
  }
}