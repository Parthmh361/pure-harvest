import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const name = file.originalname.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
    cb(null, uniqueSuffix + '-' + name + ext)
  }
})

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false)
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
})

export default upload

// Helper function to get the public URL
export function getPublicImageUrl(filename) {
  if (!filename) return null
  
  // If filename already includes /uploads, return as is
  if (filename.startsWith('/uploads')) {
    return filename
  }
  
  // Otherwise, prepend the public path
  return `/uploads/products/${filename}`
}

// Helper function to delete uploaded file
export function deleteUploadedFile(filename) {
  try {
    if (!filename) return
    
    let filePath
    if (filename.startsWith('/uploads')) {
      filePath = path.join(process.cwd(), 'public', filename)
    } else {
      filePath = path.join(process.cwd(), 'public', 'uploads', 'products', filename)
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log('Deleted file:', filePath)
    }
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}