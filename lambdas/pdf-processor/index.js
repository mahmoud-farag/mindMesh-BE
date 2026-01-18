const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({});

/**
 * Lambda handler for processing PDF files uploaded to S3
 * Triggered by S3 ObjectCreated event
*/
exports.handler = async (event) => {
    console.log('PDF Processor Lambda triggered');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // Extract S3 event details
        const record = event.Records[0];

        if (!record?.s3?.bucket?.name || !record?.s3?.object?.key) {
            throw new Error('Invalid S3 event');
        }
        const bucketName = record.s3.bucket.name;
        console.log('--record.s3.object.key:', record.s3.object.key)
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        console.log(`Processing file: ${objectKey} from bucket: ${bucketName}`);

    } catch (error) {
        console.error('Error processing PDF:', error);

        throw error;
    }
};

