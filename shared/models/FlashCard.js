const mongoose = require('mongoose');

const FlashCardSchema = new mongoose.Schema({

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

  flashcards: [
    {
      question: { type: String, required: true },

      answer: { type: String, required: true },

      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
      },

      lastReviewed: { type: Date, default: null },

      reviewCount: { type: Number, default: 0 },

      isStarred: { type: Boolean, default: false },


    }
  ],

}, { timestamps: true });


FlashCardSchema.index({ user: 1, document: 1 });


const FlashCard = mongoose.model('FlashCard', FlashCardSchema);

module.exports = FlashCard;
