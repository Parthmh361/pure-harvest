import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

// Connection state
let isConnected = false

async function connectDB() {
  // If already connected, return
  if (isConnected) {
    console.log('Using existing MongoDB connection')
    return Promise.resolve()
  }

  try {
    // Set mongoose options
    mongoose.set('strictQuery', false)
    
    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      family: 4, // Use IPv4, skip trying IPv6
    }

    // Connect to MongoDB
    const db = await mongoose.connect(MONGODB_URI, options)
    
    isConnected = db.connections[0].readyState === 1
    
    if (isConnected) {
      console.log('MongoDB connected successfully')
    }

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB')
      isConnected = true
    })

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected')
      isConnected = false
    })

    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('Mongoose connection closed through app termination')
      process.exit(0)
    })

    return Promise.resolve()
    
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    isConnected = false
    
    // Provide more specific error information
    if (error.message.includes('ETIMEOUT')) {
      console.error('Connection timeout - check your network connection and MongoDB Atlas settings')
    } else if (error.message.includes('authentication failed')) {
      console.error('Authentication failed - check your MongoDB credentials')
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('DNS resolution failed - check your MongoDB URI')
    }
    
    throw error
  }
}

export default connectDB