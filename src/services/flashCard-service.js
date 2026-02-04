import mongoose from 'mongoose';
import { FlashCard } from '@mindmesh/shared-models';
import { customErrors } from '../utils/index.js';

const  { BadRequestError, NotFoundError } = customErrors;


const flashCardsService = {};


flashCardsService.getFlashcards = async (params = {}) => {
  try {
    const { userId, documentId } = params;

    const flashcards = await FlashCard.find({ user: userId, document: documentId })
      .populate('document', 'title fileName')
      .sort({ createdAt: -1 })
      .lean();
    

    return { count: flashcards.length,  flashcards };
    
  } catch(error) {

    throw error;
  }
}


flashCardsService.getAllFlashcardSets = async (params = {}) => {
  try {
    const {userId} = params;

    const flashcards = await FlashCard.find({ user: userId })
    .populate('document', 'title fileName')
    .sort({ createdAt: -1 })
    .lean();

    return { count: flashcards.length,  flashcards };

  } catch(error) {

    throw error;

  }
}


flashCardsService.reviewFlashcard = async (params = {}) => {
  try {
    const { flashCardId, userId } = params;

    const flashcardSet = await FlashCard.findOne({ 'flashcards._id': new mongoose.Types.ObjectId(flashCardId) , user: userId });

    if (!flashcardSet) 
      throw new NotFoundError('Flashcard set or card not found')
    

    const cardIndex = flashcardSet.flashcards.findIndex(card => card._id.toString() === flashCardId);

    if (cardIndex === -1) 
      throw new NotFoundError('Card not found in set')

     
    

    // Update review info
    flashcardSet.flashcards[cardIndex].lastReviewed = new Date();
    flashcardSet.flashcards[cardIndex].reviewCount += 1;

    await flashcardSet.save();


    return { flashcardSet };

  } catch(error) {

    throw error;

  }
}


flashCardsService.toggleStarFlashcard = async (params = {}) => {
  try {
    
    const { flashCardId, userId } = params;

    const flashcardSet = await FlashCard.findOne({ 'flashcards._id': flashCardId, user: userId });

    if (!flashcardSet) 
      throw new NotFoundError('Flashcard set or card not found')
    

    const cardIndex = flashcardSet.flashcards.findIndex(card => card._id.toString() === flashCardId);

    if (cardIndex === -1) 
      throw new NotFoundError('Card not found in set')


    // Toggle star
    flashcardSet.flashcards[cardIndex].isStarred = !flashcardSet.flashcards[cardIndex].isStarred;

    await flashcardSet.save();


    return { flashcardSet, message: `Flashcard ${flashcardSet.flashcards[cardIndex].isStarred ? 'starred' : 'unstarred' }` };

  } catch(error) {

    throw error;

  }
}


flashCardsService.deleteFlashcardSet = async (params = {}) => {
  try {
    const { flashCardId, userId } = params;


    const flashcardSet = await FlashCard.findOne({ _id: flashCardId, user: userId });

    if (!flashcardSet) 
      throw new NotFoundError('Flashcard set or card not found')
    

    await flashcardSet.deleteOne();

    return { message: 'Flashcard set deleted successfully' };

  } catch(error) {

    throw error;

  }
}



export default flashCardsService;