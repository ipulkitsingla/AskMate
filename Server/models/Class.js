import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [100, 'Class name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  classCode: {
    type: String,
    required: [true, 'Class code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    length: [6, 'Class code must be exactly 6 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      default: 'student'
    }
  }],
  settings: {
    allowStudentQuestions: {
      type: Boolean,
      default: true
    },
    allowFileUploads: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024 // 10MB
    },
    allowedFileTypes: {
      type: [String],
      default: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate unique class code before saving
classSchema.pre('save', async function(next) {
  if (!this.isNew) return next();
  
  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  let classCode;
  let isUnique = false;
  
  while (!isUnique) {
    classCode = generateClassCode();
    const existingClass = await mongoose.model('Class').findOne({ classCode });
    if (!existingClass) {
      isUnique = true;
    }
  }
  
  this.classCode = classCode;
  next();
});

// Add creator as teacher member
classSchema.pre('save', function(next) {
  if (this.isNew) {
    this.members.push({
      user: this.createdBy,
      role: 'teacher'
    });
  }
  next();
});

export default mongoose.model('Class', classSchema);
