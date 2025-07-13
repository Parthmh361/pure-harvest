import mongoose from 'mongoose'

const reviewVoteSchema = new mongoose.Schema({
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  helpful: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: true
})

// Ensure one vote per user per review
reviewVoteSchema.index({ review: 1, user: 1 }, { unique: true })

const ReviewVote = mongoose.models.ReviewVote || mongoose.model('ReviewVote', reviewVoteSchema)

export default ReviewVote