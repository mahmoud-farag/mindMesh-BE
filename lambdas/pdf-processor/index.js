const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { cache } = require('./utils/cache');
const mongoose = require('mongoose');

// Import models from npm package
const { Document, DocumentChunk, User } = require('@mindmesh/shared-models');

const s3Client = new S3Client({});



/**
 * Lambda handler for processing PDF files uploaded to S3
 * Triggered by S3 ObjectCreated event
 */
exports.handler = async (event) => {

    console.log('---PDF Processor Lambda triggered');
    console.log('----Event:', JSON.stringify(event));

    try {

        // Extract S3 event details
        const record = event?.Records[0];

        console.log('----record:', record);

        if (record?.eventSource === 'aws:s3' && record?.s3) {

            const [geminiApIKey, mongoUri] = await Promise.all([cache.getGeminiAPiKey(), cache.getMongoURI()]);

            console.log('---geminiApIKey:', geminiApIKey);
            console.log('--mongoUri:', mongoUri);

            // Connect to MongoDB
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(mongoUri);
                console.log('----MongoDB connected--');
            }

            const bucketName = record.s3.bucket.name;
            console.log('--record.s3.object.key:', record.s3.object.key);
            const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

            console.log(`Processing file: ${objectKey} from bucket: ${bucketName}`);

            // Now you can use the models here
            // Example: Find or update document
            // const document = await Document.findOne({ 'S3Data.fileName': objectKey });
            // if (document) {
            //     document.status = 'processing';
            //     await document.save();
            // }

        } else {
            console.log('----No S3 record found')
        }

        console.log('----PDF Processor Lambda finished');

    } catch (error) {
        console.error('Error processing PDF:', error);

        throw error;
    }
};


