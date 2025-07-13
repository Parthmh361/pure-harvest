import mongoose from 'mongoose'

const reviewReportSchema = new mongoose.Schema({
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other'],
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  }
}, {
  timestamps: true
})

// Ensure one report per user per review
reviewReportSchema.index({ review: 1, reporter: 1 }, { unique: true })

const ReviewReport = mongoose.models.ReviewReport || mongoose.model('ReviewReport', reviewReportSchema)

export default ReviewReport