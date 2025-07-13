import fs from 'fs'
import path from 'path'

// Move existing uploads to public directory
export function migrateUploadsToPublic() {
  const oldUploadDir = path.join(process.cwd(), 'uploads', 'products')
  const newUploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')

  try {
    // Create new directory if it doesn't exist
    if (!fs.existsSync(newUploadDir)) {
      fs.mkdirSync(newUploadDir, { recursive: true })
      console.log('Created public uploads directory')
    }

    // Check if old directory exists
    if (fs.existsSync(oldUploadDir)) {
      const files = fs.readdirSync(oldUploadDir)
      
      files.forEach(file => {
        const oldPath = path.join(oldUploadDir, file)
        const newPath = path.join(newUploadDir, file)
        
        if (!fs.existsSync(newPath)) {
          fs.copyFileSync(oldPath, newPath)
          console.log(`Moved ${file} to public directory`)
        }
      })
    }
  } catch (error) {
    console.error('Error migrating files:', error)
  }
}

// Get correct upload directory
export function getUploadDirectory() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
  
  // Ensure directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  
  return uploadDir
}

// Check where a file exists
export function findFile(filename) {
  const locations = [
    path.join(process.cwd(), 'public', 'uploads', 'products', filename),
    path.join(process.cwd(), 'uploads', 'products', filename),
    path.join(process.cwd(), 'uploads', filename)
  ]

  for (const location of locations) {
    if (fs.existsSync(location)) {
      console.log(`Found file at: ${location}`)
      return location
    }
  }

  console.log(`File not found: ${filename}`)
  return null
}