// scripts/check-admin.js
const mongoose = require('mongoose')

async function checkAdmin() {
  try {
    await mongoose.connect("mongodb+srv://parthchoudhari3612:qsefthikp@cluster0.ccucqrl.mongodb.net/pure-harvest?retryWrites=true&w=majority&appName=Cluster0")
    
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

    // Find the admin user
    const admin = await User.findOne({ email: 'admin@pureharvest.com' }).select('+password')
    
    if (admin) {
      console.log('✅ Admin user found:')
      console.log('📧 Email:', admin.email)
      console.log('👤 Role:', admin.role)
      console.log('🔐 Password hash:', admin.password)
      console.log('🔐 Hash length:', admin.password ? admin.password.length : 'No password')
      console.log('🔐 Hash starts with $2a or $2b:', admin.password ? admin.password.startsWith('$2') : 'No')
      console.log('📱 Phone:', admin.phone)
      console.log('✅ Active:', admin.isActive)
      console.log('✅ Verified:', admin.isVerified)
    } else {
      console.log('❌ Admin user not found')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
  }
}

checkAdmin()