import { flashCardsService } from '../services/index.js';
import { customErrors, handleSuccessResponse } from '../utils/index.js';




const flashCardsController = {};

const  { BadRequestError } = customErrors;

flashCardsController.getFlashcards = async (req, res, next) => {

  try {
    
    if (!req.params?.documentId)
      throw new BadRequestError('Document Id is required');

    const result = await flashCardsService.getFlashcards({ documentId: req.params.documentId, userId: req.user._id });

    
    return handleSuccessResponse({res, data: { ...result } });
  
  } catch(error) {

    next(error);
  }
}


flashCardsController.getAllFlashcardSets = async (req, res, next) => {
 
  try {

    const result = await flashCardsService.getAllFlashcardSets({ userId: req.user._id });

    return handleSuccessResponse({ res, data: { ...result } });


  } catch(error) {

    next(error);
  }
}


flashCardsController.reviewFlashcard = async (req, res, next) => {
  try {

    if (!req.params?.flashCardId) 
      throw new BadRequestError('Flashcard Id is required');

    const result = await flashCardsService.reviewFlashcard({ flashCardId: req.params.flashCardId, userId: req.user._id });

    return handleSuccessResponse({ res, data: { ...result } });

  } catch(error) {

    next(error);
  }
}


flashCardsController.toggleStarFlashcard = async (req, res, next) => {
  try {


    if (!req.params?.flashCardId) 
      throw new BadRequestError('Flashcard Id is required');
   
    const result = await flashCardsService.toggleStarFlashcard({ flashCardId: req.params.flashCardId, userId: req.user._id });

    return handleSuccessResponse({ res, data: { ...result } });


  } catch(error) {

    next(error);
  }
}


flashCardsController.deleteFlashcardSet = async (req, res, next) => {
  try {

    if (!req.params?.flashCardId) 
      throw new BadRequestError('Flashcard Id is required');

    const result = await flashCardsService.deleteFlashcardSet({ flashCardId: req.params.flashCardId, userId: req.user._id });
   
    return handleSuccessResponse({ res, data: { ...result } });

  } catch(error) {

    next(error);
  }
}



export default flashCardsController;