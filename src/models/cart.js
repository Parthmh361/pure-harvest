import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, {
  _id: false
})

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Update the updatedAt field before saving
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Virtual for total items
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0)
})

// Virtual for total price (requires populated products)
cartSchema.virtual('totalPrice').get(function() {
  return this.items.reduce((total, item) => {
    if (item.product && item.product.price) {
      return total + (item.product.price * item.quantity)
    }
    return total
  }, 0)
})

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema)

export default Cart