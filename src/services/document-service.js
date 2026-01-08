import awsService from './aws-service.js';

import { Document, DocumentChunk } from '../models/index.js';
import { pdfParserUtils, textChunkerUtils } from '../utils/index.js'
import geminiService from './gemini-Service.js';

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

    let { payload, file, userId } = params;


    const originalFileName = file.originalname.replace('.pdf', '');

    const mimeType = file.mimetype;
    const folder = S3Folders.PDF_Documents;
    const fileName = `${originalFileName}_${Date.now()}.pdf`;

    // * create a new record in the db
    // const fileSize = (file.size / (1024 * 1024)).toFixed(4);
    const fileSize = file.size ;


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

    // * upload the pdf file to the S3, make it works in the backgroud to send the user response quickly
    //! DOTO in version2, need to be refactored and move to SLS lambda or uing the BullMQ(background jobs)
    uploadPdfFileToS3({ mimeType, fileBuffer: file.buffer, folder, fileName });


    const buffer = file.buffer;
    file = null; // Release original immediately To avoid memoery leaks
    // * do the background job for text extractation and chunks
    // processPdf({ file, documentId: document._id, userId });
    processPdfV2({ buffer, documentId: document._id, userId });


    return { document };

  } catch (error) {

    throw error;
  }
}

async function uploadPdfFileToS3(params = {}) {
  try {

    const { mimeType, fileBuffer, folder, fileName } = params;

    const S3params = {
      fileBuffer,
      folder,
      fileName,
      mimeType,
    };

    await awsService.uploadFile(S3params);

    console.log('PDF File uploaded Successfully to the S3');

    return;

  } catch (error) {

    await Document.findOneAndUpdate({ _id: documentId }, { status: 'failed', S3Data: null });

    throw error;
  }


}


async function processPdf(params = {}) {
  let { file, documentId, userId } = params;
  const BATCH_SIZE = 200;
  try {

    // * parse the pdf file for text extraction
    const result = await pdfParserUtils.parse({ fileBuffer: file.buffer });

    // * convert the text in a chunks with overlaping
    //! TODO we need to save the chunks in a separate db model , to avoid the mongodb document 16MB limit, DONE
    const chunkSize = process.env?.CHUNK_SIZE ? +process.env.CHUNK_SIZE : 60;
    const overlap = process.env?.OVERLAP ? +process.env.OVERLAP : 60;
    const chunks = textChunkerUtils.chunkText({ text: result.text, chunkSize, overlap });


    // * upload the text into the S3
    const folder = S3Folders.text_Files;
    const fileName = `pdf_extracted_text_${documentId}_${Date.now()}.txt`;
    const mimeType = 'text/plain';

    const S3params = { fileBuffer: result.text, folder, fileName, mimeType };

    await awsService.uploadFile(S3params);

    console.log('text uploaded Successfully to the S3');

    // * Generate embeddings and save chunks to DocumentChunk collection

    let batch = [], successChunks = { count: 0 }, failedChunks = { count: 0 };
    const totalChunks = chunks.length;

    for (const chunk of chunks) {

      batch.push(chunk);

      if (batch.length >= BATCH_SIZE) {

        await handleChunkBatch({ batch, successChunks, failedChunks, userId, documentId });

        batch.length = 0;
      }

    }

    if (batch.length) {

      await handleChunkBatch({ batch, successChunks, failedChunks, userId, documentId });

      batch.length = 0;

    }

    console.log(`Saved (${successChunks.count}) from (${totalChunks})  chunks with embeddings.`);


    // * update the document 
    await Document.findOneAndUpdate({
      _id: documentId,
    }, {
      extractedText: {
        folder,
        fileName,
        mimeType,
      },
      status: 'ready',
    });


    console.log('Pdf Successfully proccessed');

    return;

  } catch (error) {

    console.error('Error while processing the Pdf file:\n', error);

    await Document.findOneAndUpdate({ _id: documentId }, { status: 'failed' });

  } finally {

    file = null;
  }
}

async function processPdfV2(params = {}) {

  let { buffer, documentId, userId } = params;
  const BATCH_SIZE = 300;

  try {

    // * parse the pdf file for text extraction
    const result = await pdfParserUtils.parseV2({ fileBuffer: buffer });

    // * upload the text into the S3
    const folder = S3Folders.text_Files;
    const fileName = `pdf_extracted_text_${documentId}_${Date.now()}.txt`;
    const mimeType = 'text/plain';

    const S3params = { fileBuffer: result.text, folder, fileName, mimeType };

    await awsService.uploadFile(S3params);

    console.log('text uploaded Successfully to the S3');

    // * Generate embeddings and save chunks to DocumentChunk collection using Generator
    const chunkSize = process.env?.CHUNK_SIZE ? +process.env.CHUNK_SIZE : 60;
    const overlap = process.env?.OVERLAP ? +process.env.OVERLAP : 20;

    const chunkGenerator = textChunkerUtils.chunkTextV2({
      text: result.text,
      pages: result.pages,
      chunkSize,
      overlap,
    });

    let batch = [], successChunks = { count: 0 }, failedChunks = { count: 0 };
    let totalChunksProcessed = 0;

    for (const chunk of chunkGenerator) {
      batch.push(chunk);
      totalChunksProcessed++;

      if (batch.length >= BATCH_SIZE) {
        await handleChunkBatch({ batch, successChunks, failedChunks, userId, documentId });
        batch = [];
      }
    }

    // Process remaining chunks
    if (batch.length > 0) {
      await handleChunkBatch({ batch, successChunks, failedChunks, userId, documentId });
      batch = [];
    }

    console.log(`Saved (${successChunks.count}) chunks with embeddings. Total processed: ${totalChunksProcessed}`);


    // * update the document 
    await Document.findOneAndUpdate({
      _id: documentId,
    }, {
      extractedText: {
        folder,
        fileName,
        mimeType,
      },
      status: 'ready',
    });


    console.log('Pdf Successfully proccessed (V2)');

    return;

  } catch (error) {

    console.error('Error while processing the Pdf file (V2):\n', error);

    await Document.findOneAndUpdate({ _id: documentId }, { status: 'failed' });

  }
}


async function handleChunkBatch(params = {}) {

  const { batch, userId, documentId } = params
  let { successChunks, failedChunks } = params;


  const embeddingPromiseArr = [];

  for (const chunk of batch) {
    embeddingPromiseArr.push(geminiService.generateEmbeddingWithRetry(chunk.content));
  }


  const results = await Promise.allSettled(embeddingPromiseArr);



  const insertPromises = [];
  for (let index = 0; index < batch.length; index++) {

    if (results?.[index]?.status !== "fulfilled") {
      failedChunks.count += 1;
      continue;
    }

    successChunks.count += 1;


    insertPromises.push(DocumentChunk.create({
      content: batch[index].content,
      document: documentId,
      user: userId,
      embedding: results[index].value,
      chunkIndex: batch[index].chunkIndex,
      pageNumber: batch[index].pageNumber,
    }));

  }

  await Promise.all(insertPromises);

}

documentService.getDocument = async (params = {}) => {
  try {

    const { documentId } = params;

    const query = {
      _id: documentId,
      status: { $ne: 'deleted' },
    };

    const document = await Document.findOne(query)
      .select('-chunks -extractedText')
      .populate({path:'user', select:'username'}).lean();

    if (document?.S3Data?.fileName && document?.S3Data?.folder) {

      const {folder, fileName } = document.S3Data;
      const expiresIn = 86400; // 1 Day

      const signedUrl = await awsService.getSignedUrl(folder, fileName, {expiresIn});
      document.S3FileUrl= signedUrl;
    }
    
    if (!document)
      throw new NotFoundError('Document not Found');

    return { document };

  } catch (error) {

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

  } catch (error) {

    throw error;
  }
}

documentService.getAllDocuments = async (params = {}) => {
  try {

    const { userId } = params;


    const query = {
      user: userId,
      status: { $ne: 'deleted' },
    }; 

    const documents = await Document.find(query).select('-extractedText').lean();


    return { documents };


  } catch (error) {

    throw error;
  }
}



export default documentService;