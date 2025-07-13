import mongoose from 'mongoose'

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Ensure one wishlist per user
wishlistSchema.index({ user: 1 }, { unique: true })

// Virtual for product count
wishlistSchema.virtual('itemCount').get(function() {
  return this.products.length
})

const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema)

export default Wishlist