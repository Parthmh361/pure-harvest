import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String
    // Remove unique: true from here since we define it in index
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['vegetables', 'fruits', 'grains', 'dairy', 'others'], // all lowercase
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'gram', 'liter', 'piece', 'dozen', 'bundle','box','packet','bundle','bag']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  certifications: [{
    type: String,
    enum: ['organic', 'pesticide-free', 'non-gmo', 'fair-trade', 'local']
  }],
  
  // Rating system - Define as subdocument schema
  rating: {
    average: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 5 
    },
    count: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    distribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  
  // Dates
  harvestDate: Date,
  expiryDate: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: false
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  
  // Location for local delivery
  farmLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Generate slug from name
productSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now()
  }
  next()
})

// Indexes (only define once here, no duplicates)
productSchema.index({ slug: 1 }, { unique: true })
productSchema.index({ farmer: 1 })
productSchema.index({ category: 1 })
productSchema.index({ isActive: 1 })
productSchema.index({ 'rating.average': -1 })
productSchema.index({ createdAt: -1 })
productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ farmLocation: '2dsphere' })

// Virtual for reviews count
productSchema.virtual('reviewsCount').get(function() {
  return this.rating.count
})

const Product = mongoose.models.Product || mongoose.model('Product', productSchema)

export default Product