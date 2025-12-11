import awsService from './aws-service.js';

import { Document } from '../models/index.js';
import { parsePdf, textChunkerUtils } from '../utils/index.js'

import { customErrors } from '../utils/index.js';

// it is a hack way as the json import is not supported in the current version of nodejs
import { createRequire } from 'module';
const require = createRequire(import.meta.url)
const S3Folders = require('../data/S3-folders.json');

const { NotFoundError } = customErrors;

const documentService = {};


documentService.uploadPdfDocument = async (params = {}) => {
  try {
    console.log('documentService.uploadPdfDocument:: started');

    const { payload, file, userId } = params;


    const originalFileName = file.originalname;
    const mimeType = file.mimetype;
    const folder = S3Folders.PDF_Documents;
    const fileName = `${originalFileName}_${Date.now()}.pdf`;

    // *) create a new record in the db
    const fileSize = (file.size / (1024 * 1024)).toFixed(4);

    const document = await Document.create({
      title: payload.title,
      S3Data: {
        mimeType,
        fileName,
        folder,
      },
      originalFileName,
      fileSize,
      user: userId,
      status: 'processing',
    });

    // *) upload the file to the S3 make it works in the backgroud to send the user response quickly
    uploadPdfFileToS3({ documentId: document._id, mimeType, fileBuffer: file.buffer, folder, fileName });

    // *) do the background job for text extractation and chunk
    processPdf({ file, documentId: document._id });



    return { document };

  } catch (error) {

    throw error;
  }
}

async function uploadPdfFileToS3(params = {}) {
  try{

    const { documentId, mimeType, fileBuffer, folder, fileName} = params;


 

    const S3params = {
      fileBuffer,
      folder,
      fileName,
      mimeType,
    };
  
    await awsService.uploadFile(S3params);
  
    console.log('File uploaded Successfully to the S3');
  
    return;

  } catch (error) {

    await Document.findOneAndUpdate({ _id: documentId }, { status: 'failed', S3Data: null });

    throw error;
  }


}


async function processPdf(params = {}) {
  let { file, documentId } = params;
  try {

    const result = await parsePdf({ fileBuffer: file.buffer });

    const chunks = textChunkerUtils.chunkText({ text: result.text, chunkSize: 60, overlap: 10 });

    await Document.findOneAndUpdate({
      _id: documentId
    }, {
      extractedText: result.text,
      chunks,
      status: 'ready',
    }
    );


    console.log('Pdf Successfully proccessed');
    return;

  } catch (error) {

    console.error('Error while processing the Pdf file:\n', error);

    await Document.findOneAndUpdate({ _id: documentId }, { status: 'failed' });

  } finally {

    file = null;
  }
}

documentService.getDocument = async (params = {}) => {
  try {

    const { documentId } = params;

    const query = {
      _id: documentId,
      status: {$ne: 'deleted'},
    };

    const document = await Document.findOne(query).select('-chunks -extractedText').lean();

    if (!document)
      throw new NotFoundError('Document not Found');

    return { document };

  } catch(error) {

    throw error;
  }
}

documentService.deleteDocument = async (params = {}) => {
  try {

    const { documentId } = params;

    const query = { _id: documentId, status: { $ne: 'deleted' } };

    const document = await Document.findOne(query).select('_id').lean();

    if (!document)
      throw new NotFoundError('Document not Found');



    await Document.updateOne({ _id: documentId }, { $set: { status: 'deleted' } });

    return;

  } catch(error) {

    throw error;
  }
}

documentService.getAllDocuments = async (params = {}) => {
  try {

    const { userId } = params;


    const query = {
      user: userId,
      status: { $ne : 'deleted' },
    };

    const documents = await Document.find(query).select('-chunks -extractedText').lean();


    return { documents };
    

  } catch(error) {

    throw error;
  }
}



export default documentService;