import { STATUS_CODES } from '../common/index.js';
import { documentService } from '../services/index.js';
import { customErrors, handleSuccessResponse } from '../utils/index.js';


const { BadRequestError } = customErrors;

const documentController = {};


documentController.initUpload = async (req, res, next) => {
  try {
    if (!req.body?.title || !req.body?.fileName || !req.body?.fileSize || !req.body?.mimeType) {
      throw new BadRequestError('Missing required fields (title, fileName, fileSize, mimeType)');
    }

    const params = { userId: req.user._id, payload: req.body };
    const { uploadUrl, document } = await documentService.initUpload(params);

    return handleSuccessResponse({
      res,
      data: { uploadUrl, document },
      message: 'Upload initialized. Use the URL to upload your file.',
      statusCode: STATUS_CODES.CREATED,
    });

  } catch (error) {
    next(error);
  }
}

documentController.confirmUpload = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      throw new BadRequestError('Document ID is required');
    }

    const params = { documentId, userId: req.user._id };
    await documentService.confirmUpload(params);

    return handleSuccessResponse({
      res,
      data: { documentId },
      message: 'Document uploaded successfully.',
    });

  } catch (error) {
    next(error);
  }
}

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