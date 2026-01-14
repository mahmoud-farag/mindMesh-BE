import express from 'express';
import { flashCardsController } from '../controllers/index.js';
import { checkAuth } from '../middlewares/index.js';

const router = express.Router();


router.get('/', checkAuth, flashCardsController.getAllFlashcardSets);
router.get('/:documentId', checkAuth, flashCardsController.getFlashcards);
router.post('/:flashCardId/review', checkAuth, flashCardsController.reviewFlashcard);
router.patch('/:flashCardId/star', checkAuth, flashCardsController.toggleStarFlashcard);
router.delete('/:flashCardId', checkAuth, flashCardsController.deleteFlashcardSet);

export default router;
