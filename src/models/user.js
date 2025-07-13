import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Delete the existing model to force recreation
delete mongoose.models.User

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['buyer', 'farmer', 'admin', 'logistics'], // add 'logistics'
    default: 'buyer'
  },
  // Updated address field to handle both string and object
  address: {
    type: mongoose.Schema.Types.Mixed, // Allows both string and object
    default: ''
  },
  businessName: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  profileImage: {
    type: String,
    default: ''
  },
  // Optionally, logistics-specific fields:
  vehicleNumber: String,
  serviceArea: String,
}, {
  timestamps: true
})

// Index for better performance
userSchema.index({ email: 1 })
userSchema.index({ phone: 1 })

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Get public profile method - ADD THIS
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject()
  
  // Remove sensitive information
  delete user.password
  
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    isActive: user.isActive,
    avatar: user.avatar,
    address: user.address,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLogin: user.lastLogin
  }
}

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  return user
}

// Create and export the model
const User = mongoose.model('User', userSchema)

export default User