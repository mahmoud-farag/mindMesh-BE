import express from 'express';

import { aiController } from '../controllers/index.js';
import { checkAuth } from '../middlewares/index.js';

const router = express.Router();


router.post('/generate-flashcards', checkAuth, aiController.generateFlashcards);
router.post('/generate-quiz', checkAuth, aiController.generateQuiz);
router.post('/generate-summary', checkAuth, aiController.generateSummary);
router.post('/chat', checkAuth, chat);
router.post('/explain-concept', checkAuth, aiController.explainConcept);
router.get('/chat-history/:documentId', checkAuth, aiController.getChatHistory);




export default router;

