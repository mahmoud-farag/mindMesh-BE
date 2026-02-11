import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  title: {
    type: String,
    required: [true, 'Provide a title for the insrted Document'],
    trim: true,
  },

  S3Data: {
    fileName: { type: String, required: true },
    folder: { type: String, required: true },
    mimeType: { type: String, required: true },
  },

  originalFileName: { type: String, required: true },

  fileSize: { type: Number, required: true },

  extractedText: {
    fileName: { type: String },
    folder: { type: String },
    mimeType: { type: String },
  },

  geminiFileUri: { type: String, default: null },

  geminiUriExpirationDate: { type: Date, default: null }, // valid only for 48h


  uploadDate: { type: Date, default: Date.now },

  lastAccessed: { type: Date, default: Date.now },

  flashcardCount: { type: Number, default: 0 },
  quizCount: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['uploading', 'uploaded', 'processing', 'ready', 'failed', 'deleted'],
    default: 'uploading',
  },

}, { timestamps: true });


DocumentSchema.index({ user: 1, uploadDate: -1 });


const Document = mongoose.model('Document', DocumentSchema);

export default Document;
