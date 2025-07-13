import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'support', 'order_related'],
    default: 'direct'
  },
  title: String, // Optional conversation title
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    orderId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    subject: String
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    archived: [{
      user: mongoose.Schema.Types.ObjectId,
      archivedAt: Date
    }]
  }
}, {
  timestamps: true
})

// Ensure unique conversations between participants
conversationSchema.index({ participants: 1 }, { unique: true })
conversationSchema.index({ lastActivity: -1 })
conversationSchema.index({ 'participants': 1, 'isActive': 1 })

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema)

export default Conversation