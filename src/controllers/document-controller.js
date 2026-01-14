import { STATUS_CODES } from '../common/index.js';
import { documentService } from '../services/index.js';
import { customErrors, handleSuccessResponse } from '../utils/index.js';


const { BadRequestError } = customErrors;

const documentController = {};

documentController.uploadDocument = async (req, res, next) => {
  try {


    if (!req?.body?.title)
      throw new BadRequestError('Please provide a title for the document.');

    if (!req?.file)
      throw new BadRequestError('Please upload a PDF file.');

    const params = { payload: req.body, file: req.file, userId: req.user._id };

    const { document } = await documentService.uploadPdfDocument(params);


    return handleSuccessResponse({ res, data: { document }, message: 'Your document is being processed...', statusCode: STATUS_CODES.CREATED });

  } catch (error) {

    next(error);
  }
}

documentController.getDocuments = async (req, res, next) => {
  try {

    if (!req?.user?._id)
      throw BadRequestError('You are not authorized to perform this action.');

    const result = await documentService.getAllDocuments({ userId: req.user._id });

    return handleSuccessResponse({ res, data: { ...result } });


  } catch (error) {

    next(error);

  }
}

documentController.getDocument = async (req, res, next) => {
  try {



    if (!req?.params?.documentId)
      throw new BadRequestError('Document ID is required.');

    const result = await documentService.getDocument({ documentId: req.params.documentId });


    return handleSuccessResponse({ res, data: { ...result }, message: 'Document loaded successfully.' });


  } catch (error) {

    next(error);
  }
}

documentController.deleteDocument = async (req, res, next) => {
  try {

    if (!req?.params?.documentId)
      throw new BadRequestError('Document ID is required.');

    await documentService.deleteDocument({ documentId: req.params.documentId });


    return handleSuccessResponse({ res, message: 'Document deleted successfully.' });

  } catch (error) {

    next(error);
  }
}




export default documentController;