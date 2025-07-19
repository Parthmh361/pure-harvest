import mongoose from 'mongoose'

const bargainSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  initialOffer: {
    price: Number,
    quantity: Number
  },
  counterOffers: [{
    price: Number,
    quantity: Number,
    by: { type: String, enum: ['buyer', 'farmer'] },
    createdAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['pending', 'agreed', 'rejected'], default: 'pending' },
  agreedOffer: {
    price: Number,
    quantity: Number
  }
}, { timestamps: true })

export default mongoose.models.Bargain || mongoose.model('Bargain', bargainSchema)