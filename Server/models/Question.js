import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Question description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Tag cannot exceed 20 characters']
  }],
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
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
  answers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isResolved: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better search performance
questionSchema.index({ title: 'text', description: 'text', tags: 'text' });
questionSchema.index({ classId: 1, createdAt: -1 });
questionSchema.index({ author: 1 });

// Virtual for vote count
questionSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for answer count
questionSchema.virtual('answerCount').get(function() {
  return this.answers.length;
});

// Ensure virtual fields are serialized
questionSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Question', questionSchema);
