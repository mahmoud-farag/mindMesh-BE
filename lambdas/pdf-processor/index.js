const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { cache, utils, S3Folders, pdfParserUtils, textChunkerUtils } = require('./utilities/index');
const mongoose = require('mongoose');

const geminiService = require('@mindmesh/shared-gemini-service');
const awsService = require('@mindmesh/shared-aws-service');

const { Document, DocumentChunk } = require('@mindmesh/shared-models');

const s3Client = new S3Client({});



/**
 * Lambda handler for processing PDF files uploaded to S3
 * Triggered by S3 ObjectCreated event
 */
exports.handler = async (event) => {
    console.log('---PDF Processor Lambda triggered');
    console.log('----Event:', JSON.stringify(event));

    try {

        const record = event?.Records?.[0];


        if (record?.eventSource !== 'aws:s3' || !record?.s3) {
            console.log('----No S3 record found');
            return;
        }

        const bucketName = record.s3?.bucket?.name;
        const s3Key = record.s3?.object?.key;

        const [geminiApIKey, mongoUri] = await Promise.all([cache.getGeminiAPiKey(), cache.getMongoURI()]);
       
        if (!geminiApIKey) 
            throw new Error('Failed to fetch Gemini API key from SSM');
        

        await utils.setDBConnection(mongoUri);
        geminiService.setApiKey(geminiApIKey);

        const documentId = utils.extractDocumentIdFromFilename(s3Key);

        if (!documentId)
            throw new Error('Document Id not exist on the the s3 file name');

        const document = await Document.findById(documentId);

        if (!document)
            throw new Error('Document not exist');

        await Document.updateOne({ _id: documentId }, { $set: { status: 'processing' } });

        const userId = document.user;
        

        console.log('----PDF Processor Lambda finished');

    } catch (error) {
        console.error('Error processing PDF:', error);

        throw error;
    }
};


