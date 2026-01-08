import mongoose from 'mongoose';
import { Document, Quiz, FlashCard, } from '../models/index.js';






const dashboardService = {};


dashboardService.getDashboardData = async (params = {}) => {
  try {

    const { userId } = params;


    const user = new mongoose.Types.ObjectId(userId);

    const totalDocuments = await Document.countDocuments({ user, status: 'ready' });
    const totalFlashcardSets = await FlashCard.countDocuments({ user });

    let totalFlashcards = 0, reviewedFlashcards = 0, starredFlashcards = 0;


    const cursor = FlashCard.find({ user })
      .select('flashcards')
      .lean()
      .cursor();

    for await (const flashCardSet of cursor) {

      for (const card of flashCardSet.flashcards) {

        totalFlashcards += 1;
        reviewedFlashcards += card?.reviewCount ?? 0;
        starredFlashcards += card?.isStarred ? 1 : 0;
      }
    }


    const totalQuizzes = await Quiz.countDocuments({ user, isCompleted: true, status: 'active' });


    const quizCursor = Quiz.find({ user, isCompleted: true, status: 'active' })
      .select('isCompleted score')
      .lean()
      .cursor();


    let totalScore = 0, completedQuizzes = 0;

    for await (const quiz of quizCursor) {

      if (quiz.isCompleted) {
        completedQuizzes += 1;
        totalScore += quiz?.score ?? 0;
      }

    }

    let averageScore = 0;

    if (totalScore && totalQuizzes) {

      averageScore = (totalScore / totalQuizzes)?.toFixed(2) ?? 0;
    }


    // Recent activity
    const recentDocuments = await Document.find({ user, status: { $ne: 'failed' } })
      .sort({ lastAccessed: -1 })
      .limit(5)
      .select('title originalFileName lastAccessed status');

    const recentQuizzes = await Quiz.find({ user, status: 'active', lastAttempted: { $exists: true } })
      .sort({ lastAttempted: -1 })
      .limit(5)
      .populate('document', 'title')
      .select('title score totalQuestions completedAt lastAttempted');




    return {
      overview: {
        totalDocuments,
        totalFlashcardSets,
        totalFlashcards,
        reviewedFlashcards,
        starredFlashcards,
        totalQuizzes,
        completedQuizzes,
        averageScore,
      },
      recentActivity: {
        documents: recentDocuments,
        quizzes: recentQuizzes
      }
    }

  } catch (error) {

    throw error;
  }
}




export default dashboardService;


