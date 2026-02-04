import quizService from '../services/quiz-service.js';
import { handleSuccessResponse } from '../utils/index.js';

const quizController = {};

quizController.getQuizzes = async (req, res, next) => {
    try {

        if (!req.params?.documentId)
            throw new BadRequestError('Document ID is required.');


        if (!req?.paginationParams)
            throw new BadRequestError('Pagination parameters are missing.');

        const params = {
            userId: req.user._id,
            documentId: req.params.documentId,
            paginationParams: req.paginationParams,
        };

        const result = await quizService.getQuizzes(params);

        return handleSuccessResponse({ res, data: result });

    } catch (error) {

        next(error);
    }
};

quizController.getQuizById = async (req, res, next) => {
    try {

        const userId = req.user._id;

        const { quizId } = req.params;

        const result = await quizService.getQuizById({ quizId, userId });

        return handleSuccessResponse({ res, data: result });

    } catch (error) {

        next(error);
    }
};

quizController.submitQuiz = async (req, res, next) => {
    try {

        const userId = req.user._id;

        const { quizId } = req.params;

        const { answers } = req.body;

        const result = await quizService.submitQuiz({ quizId, userId, answers });

        return handleSuccessResponse({ res, data: result });

    } catch (error) {

        next(error);
    }
};

quizController.getQuizResults = async (req, res, next) => {
    try {

        const userId = req.user._id;

        const { quizId } = req.params;

        const result = await quizService.getQuizResults({ quizId, userId });

        return handleSuccessResponse({ res, data: result });

    } catch (error) {

        next(error);
    }
};

quizController.deleteQuiz = async (req, res, next) => {
    try {

        const userId = req.user._id;

        const { quizId } = req.params;

        const result = await quizService.deleteQuiz({ quizId, userId });

        return handleSuccessResponse({ res, data: result });

    } catch (error) {

        next(error);
    }
};

export default quizController;
