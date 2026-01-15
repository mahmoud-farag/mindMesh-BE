import mongoose from 'mongoose';
import { Quiz } from '../models/index.js';
import { customErrors } from '../utils/index.js';

const { NotFoundError, BadRequestError } = customErrors;

const QuizService = {};

QuizService.getQuizzes = async (params = {}) => {

    try {

        const { userId, paginationParams, documentId } = params;
        const { offset, limit } = paginationParams ?? {};

        const query = {
            user: new mongoose.Types.ObjectId(userId),
            document: new mongoose.Types.ObjectId(documentId),
            status: 'active',
        };

        const totalCount = await Quiz.countDocuments(query);

        const quizzes = await Quiz.find(query)
            .sort({ createdAt: -1 })
            .select('title score totalQuestions completedAt createdAt document user isCompleted')
            .populate({ path: 'user', select: 'username' })
            .populate({ path: 'document', select: 'originalFileName title' })
            .skip(offset)
            .limit(limit)
            .lean();

        return { quizzes, totalCount };

    } catch (error) {

        throw error;
    }
};

QuizService.getQuizById = async (params = {}) => {
    try {

        const { quizId, userId } = params;

        const quiz = await Quiz.findOne({ _id: quizId, user: userId, status: 'active' }).lean();

        if (!quiz)
            throw new NotFoundError('Quiz not found');

        await Quiz.updateOne(
            { _id: quizId },
            { $set: { lastAttempted: new Date() } }
        );

        return { quiz };

    } catch (error) {

        throw error;
    }
};

QuizService.submitQuiz = async (params = {}) => {
    try {

        let { quizId, userId, answers } = params;

        const quiz = await Quiz.findOne({ _id: quizId, user: userId, status: 'active' }).select('questions isCompleted totalQuestions').lean();

        if (!quiz)
            throw new NotFoundError('Quiz not found');


        if (quiz.isCompleted)
            throw new BadRequestError('Quiz already completed');

        let score = 0;
        const userAnswers = [];
        const questions = quiz.questions;

        // Validate answers format
        if (!Array.isArray(answers))
            throw new BadRequestError('Answers must be an array');


        const questionsTracker = new Set();
        const duplicatedQuestions = new Set();
        let overHeadAnswers = [];


        if (answers.length > quiz.totalQuestions) {
            overHeadAnswers = answers.slice(quiz.totalQuestions - 1);
            answers = answers.slice(0, quiz.totalQuestions - 1);
        }


        // Process each answer
        for (const answer of answers) {
            const { questionIndex, selectedAnswer, questionId } = answer;

            if (questionIndex >= 0 && questionIndex < questions.length) {

                const question = questions[questionIndex];
                const isCorrect = question.correctAnswer === selectedAnswer;

                if (questionsTracker.has(questionIndex)) {

                    duplicatedQuestions.add(questionIndex)
                    continue;

                } else {
                    questionsTracker.add(questionIndex);
                }


                if (isCorrect) {
                    score++;
                }

                userAnswers.push({ questionIndex, questionId, selectedAnswer, isCorrect, answeredAt: new Date() });
            }
        }

        const updatedFields = { userAnswers, score, completedAt: new Date(), isCompleted: true };


        await Quiz.updateOne({ _id: quiz._id }, { $set: updatedFields });

        const response = { score, totalQuestions: quiz.totalQuestions, userAnswers };

        if (overHeadAnswers.length)
            response.overHeadAnswers = overHeadAnswers;

        if (duplicatedQuestions.size)
            response.duplicatedQuestions = Array.from(duplicatedQuestions);

        return response;


    } catch (error) {

        throw error;

    }
};

QuizService.getQuizResults = async (params = {}) => {
    try {

        const { quizId, userId } = params;

        const quiz = await Quiz.findOne({ _id: quizId, user: userId, status: 'active' }).select('completedAt userAnswers totalQuestions completedAt score').lean();

        if (!quiz)
            throw new NotFoundError('Quiz not found');


        if (!quiz.completedAt)
            throw new BadRequestError('Quiz not yet completed');


        return {
            score: quiz.score,
            totalQuestions: quiz.totalQuestions,
            userAnswers: quiz.userAnswers,
            completedAt: quiz.completedAt,
        };

    } catch (error) {

        throw error;
    }
};

QuizService.deleteQuiz = async (params = {}) => {
    try {

        const { quizId, userId } = params;

        const quiz = await Quiz.findOne({ user: userId, _id: quizId, status: 'active' }).select('_id').lean();

        if (!quiz)
            throw new NotFoundError('Quiz not found');


        await Quiz.updateOne({ _id: quiz._id }, { $set: { status: 'deleted' } });


        return { message: 'Quiz deleted successfully' };

    } catch (error) {

        throw error;

    }
};

export default QuizService;
