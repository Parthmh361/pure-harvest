import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  logisticsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    address: { type: String, required: true }
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  orderNumber: { type: String, unique: true, required: true }
}, {
  timestamps: true
})

export default mongoose.models.Order || mongoose.model('Order', orderSchema)