// scripts/recreate-admin.js
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

async function recreateAdmin() {
  try {
    await mongoose.connect('mongodb+srv://parthchoudhari3612:qsefthikp@cluster0.ccucqrl.mongodb.net/pure-harvest?retryWrites=true&w=majority&appName=Cluster0')
    
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      phone: String,
      role: String,
      isActive: Boolean,
      isVerified: Boolean
    }, { timestamps: true })

    const User = mongoose.models.User || mongoose.model('User', userSchema)

    // Delete existing admin
    await User.deleteOne({ email: 'admin@pureharvest.com' })
    console.log('🗑️  Deleted existing admin user')

    // Create new admin with proper password hashing
    const password = 'SecureAdmin@2024'
    console.log('🔐 Original password:', password)
    
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('🔐 Hashed password:', hashedPassword)
    
    // Test the hash immediately
    const testComparison = await bcrypt.compare(password, hashedPassword)
    console.log('🔐 Immediate hash test:', testComparison)

    const admin = new User({
      name: 'Pure Harvest Admin',
      email: 'admin@pureharvest.com',
      password: hashedPassword,
      phone: '9876543210',
      role: 'admin',
      isActive: true,
      isVerified: true
    })

    await admin.save()
    console.log('✅ New admin created successfully')

    // Test the saved user
    const savedAdmin = await User.findOne({ email: 'admin@pureharvest.com' })
    const finalTest = await bcrypt.compare(password, savedAdmin.password)
    console.log('🔐 Final test with saved user:', finalTest)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
  }
}

recreateAdmin()