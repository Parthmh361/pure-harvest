import mongoose from 'mongoose'

// Direct MongoDB connection instead of using the alias
const connectDB = async () => {
  if (mongoose.connections[0].readyState) {
    return
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pureharvest')
    console.log('MongoDB connected for migration')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

async function fixProductRatings() {
  try {
    await connectDB()
    console.log('Connected to MongoDB')

    // Update all products with incorrect rating structure
    const result = await mongoose.connection.db.collection('products').updateMany(
      {
        $or: [
          { rating: { $type: 'number' } }, // If rating is a number
          { rating: { $exists: false } }   // If rating doesn't exist
        ]
      },
      {
        $set: {
          rating: {
            average: 0,
            count: 0,
            distribution: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0
            }
          }
        }
      }
    )

    console.log(`Updated ${result.modifiedCount} products`)
    
    // Also fix any products where rating is an object but missing fields
    const result2 = await mongoose.connection.db.collection('products').updateMany(
      {
        'rating.average': { $exists: false }
      },
      {
        $set: {
          'rating.average': 0,
          'rating.count': 0,
          'rating.distribution.1': 0,
          'rating.distribution.2': 0,
          'rating.distribution.3': 0,
          'rating.distribution.4': 0,
          'rating.distribution.5': 0
        }
      }
    )

    console.log(`Fixed ${result2.modifiedCount} additional products`)
    
    await mongoose.disconnect()
    console.log('Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error fixing product ratings:', error)
    process.exit(1)
  }
}

fixProductRatings()