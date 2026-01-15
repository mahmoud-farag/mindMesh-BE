import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({

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

  title: { type: String, required: true, trim: true },

  questions: [{

    question: { type: String, required: true },

    options: {
      type: [String],
      required: true,
      validate: [array => array.length === 4, 'Must have exactly 4 options']
    },

    correctAnswer: { type: String, required: true },

    explanation: { type: String, default: '' },

    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  }],

  userAnswers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },

    questionIndex: { type: Number },

    selectedAnswer: { type: String },

    isCorrect: { type: Boolean, },

    answeredAt: { type: Date, default: Date.now },
  }],

  score: { type: Number, default: 0 },

  totalQuestions: { type: Number, required: true },

  completedAt: { type: Date, },

  isCompleted: { type: Boolean, default: false },

  lastAttempted: { type: Date },

  status: { type: String, enum: ['active', 'deleted'], default: 'active' },

}, { timestamps: true });


QuizSchema.index({ user: 1, document: 1 });


const Quiz = mongoose.model('Quiz', QuizSchema);

export default Quiz;