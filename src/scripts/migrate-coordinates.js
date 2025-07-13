// Run this script if you have existing users in the database
import mongoose from 'mongoose'
import User from '../models/user.js'

const MONGODB_URI = process.env.MONGODB_URI

async function migrateCoordinates() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Find all users with legacy coordinates
    const users = await User.find({
      'coordinates.latitude': { $ne: null },
      'coordinates.longitude': { $ne: null },
      'location.coordinates': { $exists: false }
    })

    console.log(`Found ${users.length} users to migrate`)

    for (const user of users) {
      if (user.coordinates.latitude && user.coordinates.longitude) {
        user.location = {
          type: 'Point',
          coordinates: [user.coordinates.longitude, user.coordinates.latitude],
          address: user.address
        }
        await user.save()
        console.log(`Migrated user: ${user.email}`)
      }
    }

    console.log('Migration completed')
    process.exit(0)
  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  }
}

migrateCoordinates()