import mongoose from 'mongoose'

const uploadSchema = new mongoose.Schema({
  filename: String,
  mimetype: String,
  size: Number,
  data: Buffer,
  uploadedAt: { type: Date, default: Date.now }
})

export default mongoose.models.Upload || mongoose.model('Upload', uploadSchema)