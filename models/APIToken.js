import mongoose from 'mongoose';

const apiTokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  tokenType: {
    type: String,
    required: true,
    enum: ['full_access', 'read_only', 'edit_only', 'delete_only', 'create_only']
  },
  duration: {
    type: String,
    required: true,
    enum: ['unlimited', '7', '30', '90']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Create expiresAt based on duration
apiTokenSchema.pre('save', function(next) {
  if (this.duration !== 'unlimited') {
    const days = parseInt(this.duration);
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  next();
});

export default mongoose.models.APIToken || mongoose.model('APIToken', apiTokenSchema); 