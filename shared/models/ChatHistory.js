import mongoose from 'mongoose';

const ChatHistorySchema = new mongoose.Schema({

  eventType: { type: String, required: true },
  eventDate: { type: Date, default: Date.now },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },


  message: {
    
    role: { type: String, enum: ['user', 'assistant'], required: true },
    
    answer: { type: String },
    question: { type: String },


    relevantChunks: { 
      type : [mongoose.Schema.Types.ObjectId], 
      ref: 'DocumentChunk',
      required: true,
      default: [] 
    },
  },



}, { timestamps: true });


ChatHistorySchema.index({ user: 1, document: 1 });


const ChatHistory = mongoose.model('ChatHistory', ChatHistorySchema);


export default ChatHistory;
