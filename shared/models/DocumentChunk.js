import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema({

    content: { type: String, required: true },

    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    embedding: {
        type: [Number], // Array of numbers for the vector
        required: true,
        // Note: The vector index is created in MongoDB Atlas, not here.
    },

    chunkIndex: { type: Number, required: true },

    pageNumber: { type: Number, default: 0 },


}, { timestamps: true });

documentChunkSchema.index({ user: 1, document: 1 });

const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);

export default DocumentChunk;
