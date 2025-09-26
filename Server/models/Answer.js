import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Answer text is required'],
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  files: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isAccepted: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
answerSchema.index({ questionId: 1, createdAt: -1 });
answerSchema.index({ author: 1 });

// Virtual for vote count
answerSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Ensure virtual fields are serialized
answerSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Answer', answerSchema);
