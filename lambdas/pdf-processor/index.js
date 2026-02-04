const { cache, utils, S3Folders } = require('./utilities/index');

const geminiService = require('@mindmesh/shared-gemini-service');
const awsService = require('@mindmesh/shared-aws-service');

const { Document } = require('@mindmesh/shared-models');
const { handleChunkBatch, pdfParserUtils, textChunkerUtils } = require('./src/index');

const BATCH_SIZE = 300;

/**
 * Lambda handler for processing PDF files uploaded to S3
 * Triggered by S3 ObjectCreated event
 */
exports.handler = async (event) => {
    console.log('---PDF Processor Lambda triggered');
    console.log('----Event:', JSON.stringify(event));

    let documentId;

    try {
        const record = event?.Records?.[0];

        if (record?.eventSource !== 'aws:s3' || !record?.s3) {
            console.log('----No S3 record found');
            return { statusCode: 200, body: 'No S3 event' };
        }

        const bucketName = record.s3?.bucket?.name;
        const s3Key = decodeURIComponent(record.s3?.object?.key.replace(/\+/g, ' '));

        // console.log(`----Processing file: ${s3Key} from bucket: ${bucketName}`);

        const [geminiApiKey, mongoUri] = await Promise.all([
            cache.getGeminiAPiKey(),
            cache.getMongoURI(),
        ]);

        if (!geminiApiKey) {
            throw new Error('Failed to fetch Gemini API key from SSM');
        }

        await utils.setDBConnection(mongoUri);
        geminiService.setApiKey(geminiApiKey);

        
        documentId = utils.extractDocumentIdFromFilename(s3Key);

        if (!documentId) {
            throw new Error('Document ID not found in S3 filename');
        }


        const document = await Document.findById(documentId);

        if (!document) {
            throw new Error(`Document not found in database: ${documentId}`);
        }

        // Update status to processing
        await Document.updateOne({ _id: documentId }, { $set: { status: 'processing' } });
        const userId = document.user;

    
        const { folder, fileName } = extractFolderAndFileName(s3Key);
     
        
        const fileBuffer = await awsService.downloadFile(folder, fileName);

        const result = await pdfParserUtils.parseV2({ fileBuffer });

        const textFileName = `pdf_extracted_text_${documentId}_${Date.now()}.txt`;
        const {} = await uploadTextToS3({documentId, result, textFileName, });


        const chunkSize = process.env?.CHUNK_SIZE ? +process.env.CHUNK_SIZE : 60;
        const overlap = process.env?.OVERLAP ? +process.env.OVERLAP : 10;

        const chunkGenerator = textChunkerUtils.chunkTextV2({
            text: result.text,
            pages: result.pages,
            chunkSize,
            overlap,
        });

        let batch = [];
        let successCount = 0;
        let failedCount = 0;
        let totalProcessed = 0;

        for (const chunk of chunkGenerator) {
            batch.push(chunk);
            totalProcessed++;

            if (batch.length >= BATCH_SIZE) {
                const batchResult = await handleChunkBatch({ batch, userId, documentId });
                successCount += batchResult.success;
                failedCount += batchResult.failed;
                batch = [];
            }
        }

        // Process remaining chunks
        if (batch.length > 0) {
            const batchResult = await handleChunkBatch({ batch, userId, documentId });
            successCount += batchResult.success;
            failedCount += batchResult.failed;
        }

        // Update document status
        await Document.findOneAndUpdate(
            { _id: documentId },
            {
                extractedText: {
                    folder: S3Folders.text_Files,
                    fileName: textFileName,
                    mimeType: 'text/plain'
                },
                status: 'ready'
            }
        );

        console.log('----PDF processing completed successfully');
        return { statusCode: 200, body: 'Success' };

    } catch (error) {
        console.error('Error processing PDF:', error);

        // Update document status to failed
        if (documentId) {
            try {
                await Document.findOneAndUpdate(
                    { _id: documentId },
                    { status: 'failed' }
                );
                console.log(`----Updated document ${documentId} status to failed`);
            } catch (updateError) {
                console.error('Error updating document status:', updateError);
            }
        }

        throw error;
    }
};


function extractFolderAndFileName(s3Key) {
    // Extract folder and fileName from s3Key (e.g., "pdf-documents/file_id_timestamp.pdf")
   const lastSlashIndex = s3Key.lastIndexOf('/');

   return { folder: s3Key.substring(0, lastSlashIndex), fileName: s3Key.substring(lastSlashIndex + 1) };
}


async function uploadTextToS3({result, documentId}) {

    await awsService.uploadFile({
        fileBuffer: result.text,
        folder:  S3Folders.text_Files,
        fileName: `pdf_extracted_text_${documentId}_${Date.now()}.txt`,
        mimeType: 'text/plain'
    });
}
