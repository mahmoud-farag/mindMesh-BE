import mongoose from 'mongoose';
import dotenv from 'dotenv';
import FlashCard from '../src/models/FlashCard.js';

dotenv.config();

const connectToDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`DB connection established: ${connection.connection.host}`);
  } catch (error) {
    console.log('Error connecting to DB', error);
    process.exit(1);
  }
};

const createTestFlashcards = async () => {
  await connectToDB();

  const documentId = '696521e2ed4528b57840291d';
  const userId = '693816b95df3cff01a0edfb5';

  const flashcardsData = [
    {
      question: 'What is the capital of France?',
      answer: 'Paris',
      difficulty: 'easy',
    },
    {
      question: 'Explain the theory of relativity.',
      answer: 'E=mc^2...',
      difficulty: 'hard',
    },
    {
      question: 'What is 2 + 2?',
      answer: '4',
      difficulty: 'easy',
    }
  ];

  try {
    const newFlashCardSet = new FlashCard({
      user: userId,
      document: documentId,
      flashcards: flashcardsData,
    });

    await newFlashCardSet.save();
    console.log('Test flashcards created successfully:', newFlashCardSet._id);
  } catch (error) {
    console.error('Error creating flashcards:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
};

createTestFlashcards();
