const mongoose = require('mongoose')

async function fixIndexes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pureharvest')
    
    const db = mongoose.connection.db
    
    // Drop all indexes on users collection
    try {
      await db.collection('users').dropIndexes()
      console.log('Dropped all user indexes')
    } catch (error) {
      console.log('No user indexes to drop')
    }
    
    // Recreate only the necessary indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('users').createIndex({ role: 1 })
    await db.collection('users').createIndex({ isActive: 1 })
    
    console.log('Recreated user indexes successfully')
    
    // Drop all indexes on orders collection if it exists
    try {
      await db.collection('orders').dropIndexes()
      console.log('Dropped all order indexes')
    } catch (error) {
      console.log('No order indexes to drop')
    }
    
    // Recreate order indexes
    await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true })
    await db.collection('orders').createIndex({ buyer: 1, status: 1 })
    
    console.log('Recreated order indexes successfully')
    
    await mongoose.disconnect()
    console.log('Index fix completed')
    
  } catch (error) {
    console.error('Error fixing indexes:', error)
  }
}

fixIndexes()