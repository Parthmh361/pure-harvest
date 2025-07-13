import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request, { params }) {
  try {
    const { path: filePath } = params
    
    // First try public directory
    const publicPath = path.join(process.cwd(), 'public', 'uploads', ...filePath)
    
    if (fs.existsSync(publicPath)) {
      const fileBuffer = fs.readFileSync(publicPath)
      const ext = path.extname(publicPath).toLowerCase()
      
      let contentType = 'application/octet-stream'
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg'
          break
        case '.png':
          contentType = 'image/png'
          break
        case '.gif':
          contentType = 'image/gif'
          break
        case '.webp':
          contentType = 'image/webp'
          break
        case '.svg':
          contentType = 'image/svg+xml'
          break
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        }
      })
    }

    return new NextResponse('File not found', { status: 404 })

  } catch (error) {
    console.error('Upload API Error:', error)
    return new NextResponse('Server Error', { status: 500 })
  }
}