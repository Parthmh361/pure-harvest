import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Review details
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Additional ratings
  productQuality: {
    type: Number,
    min: 1,
    max: 5
  },
  packaging: {
    type: Number,
    min: 1,
    max: 5
  },
  delivery: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Review media
  images: [String],
  
  // Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  
  // Helpfulness
  helpfulVotes: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Ensure one review per buyer per product per order
reviewSchema.index({ product: 1, buyer: 1, order: 1 }, { unique: true })

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema)

export default Review