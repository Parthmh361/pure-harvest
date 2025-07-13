// This is the safest method for production
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    
    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: String,
      phone: String,
      isVerified: Boolean,
      address: {
        street: String,
        city: String,
        state: String,
        pincode: String
      }
    }, { timestamps: true }))

    const hashedPassword = await bcrypt.hash('SecureAdmin@2024', 12)
    
    const adminUser = {
      name: 'PureHarvest Admin',
      email: 'admin@pureharvest.com',
      password: hashedPassword,
      role: 'admin',
      phone: '9876543210',
      isVerified: true,
      address: {
        street: 'Admin Office',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    }

    await User.findOneAndUpdate(
      { email: adminUser.email },
      adminUser,
      { upsert: true, new: true }
    )

    console.log('✅ Admin user created/updated successfully!')
    console.log('📧 Email: admin@pureharvest.com')
    console.log('🔑 Password: SecureAdmin@2024')
    console.log('🎯 Role: admin')
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error)
  } finally {
    await mongoose.disconnect()
  }
}

setupAdmin()