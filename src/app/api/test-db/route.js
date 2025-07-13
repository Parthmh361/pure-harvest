import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function GET() {
  try {
    console.log('Testing MongoDB connection...')
    
    // Test connection
    await connectDB()
    
    // Get connection state
    const connectionState = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    
    // Get database info
    const dbName = mongoose.connection.db?.databaseName
    const host = mongoose.connection.host
    const port = mongoose.connection.port
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      details: {
        state: states[connectionState],
        database: dbName,
        host: host,
        port: port,
        uri: process.env.MONGODB_URI ? 'Set' : 'Not set'
      }
    })
    
  } catch (error) {
    console.error('Database connection test failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      suggestions: [
        'Check your MongoDB URI in .env.local',
        'Ensure your IP is whitelisted in MongoDB Atlas',
        'Verify your MongoDB credentials',
        'Check your network connection',
        'Try using a different DNS server (8.8.8.8)'
      ]
    }, { status: 500 })
  }
}