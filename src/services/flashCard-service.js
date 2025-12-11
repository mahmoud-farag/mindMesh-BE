import { FlashCard } from '../models/index.js';
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

    const flashcardSet = await FlashCard.findOne({ 'cards._id': flashCardId, user: userId });

    if (!flashcardSet) 
      throw new NotFoundError('Flashcard set or card not found')
    

    const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === flashCardId);

    if (cardIndex === -1) 
      throw new NotFoundError('Card not found in set')

     
    

    // Update review info
    flashcardSet.cards[cardIndex].lastReviewed = new Date();
    flashcardSet.cards[cardIndex].reviewCount += 1;

    await flashcardSet.save();


    return { flashcardSet, message };

  } catch(error) {

    throw error;

  }
}


flashCardsService.toggleStarFlashcard = async (params = {}) => {
  try {
    
    const { flashCardId, userId } = params;

    const flashcardSet = await FlashCard.findOne({ 'cards._id': flashCardId, user: userId });

    if (!flashcardSet) 
      throw new NotFoundError('Flashcard set or card not found')
    

    const cardIndex = flashcardSet.cards.findIndex(card => card._id.toString() === flashCardId);

    if (cardIndex === -1) 
      throw new NotFoundError('Card not found in set')


    // Toggle star
    flashcardSet.cards[cardIndex].isStarred = !flashcardSet.cards[cardIndex].isStarred;

    await flashcardSet.save();


    return { flashcardSet,  message: `Flashcard ${flashcardSet.cards[cardIndex].isStarred ? 'starred' : 'unstarred'}` };

  } catch(error) {

    throw error;

  }
}


flashCardsService.deleteFlashcardSet = async (params = {}) => {
  try {
    const { flashCardId, userId } = params;


    const flashcardSet = await FlashCard.findOne({ 'cards._id': flashCardId, user: userId });

    if (!flashcardSet) 
      throw new NotFoundError('Flashcard set or card not found')
    

    await flashcardSet.deleteOne();

    return { message: 'Flashcard set deleted successfully' };

  } catch(error) {

    throw error;

  }
}



export default flashCardsService;