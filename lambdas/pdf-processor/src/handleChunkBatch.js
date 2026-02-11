import geminiService from '@mindmesh/shared-gemini-service';
import { DocumentChunk } from '@mindmesh/shared-models';

/**
 * Helper function to handle chunk batches
 * Generates embeddings and saves chunks to database
 */
async function handleChunkBatch (params) {
    const { batch, userId, documentId } = params;

    // Generate embeddings in parallel
    const embeddingPromises = batch.map(chunk =>
        geminiService.generateEmbeddingWithRetry(chunk.content)
    );

    const results = await Promise.allSettled(embeddingPromises);

    // Save successful chunks
    const insertPromises = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < batch.length; i++) {
        if (results[i].status === 'fulfilled') {
            successCount++;
            insertPromises.push(
                DocumentChunk.create({
                    content: batch[i].content,
                    document: documentId,
                    user: userId,
                    embedding: results[i].value,
                    chunkIndex: batch[i].chunkIndex,
                    pageNumber: batch[i].pageNumber
                })
            );
        } else {
            failedCount++;
            console.error(`Failed to generate embedding for chunk ${batch[i].chunkIndex}:`, results[i].reason);
        }
    }

    await Promise.all(insertPromises);

    return { success: successCount, failed: failedCount };
}

export default handleChunkBatch;