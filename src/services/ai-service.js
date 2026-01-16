import { Document, FlashCard, Quiz, DocumentChunk, ChatHistory } from '../models/index.js';
import geminiService from './gemini-Service.js';
import { customErrors } from '../utils/index.js';
import mongoose from 'mongoose';

// it is a hack way as the json import is not supported in the current version of nodejs
import { createRequire } from 'module';
const require = createRequire(import.meta.url)
const statics = require('../data/statics.json');


const { NotFoundError, InternalServerError } = customErrors;

const aiService = {};

const getDocument = async (documentId, userId) => {

    const query = {
        user: new mongoose.Types.ObjectId(userId),
        _id: new mongoose.Types.ObjectId(documentId),
        status: 'ready',
    };

    const document = await Document.findOne(query).select('title extractedText geminiFileUri geminiUriExpirationDate').lean();

    if (!document)
        throw new NotFoundError('Document not found or it is not ready yet (under processing)');

    if (!document?.extractedText)
        throw new NotFoundError('Text Context not extracted');

    return document;
};

aiService.generateFlashcards = async (params = {}) => {
    try {
        const { documentId, userId, numberOfFlashcards } = params;

        const document = await getDocument(documentId, userId);

        const cards = await geminiService.generateFlashcards({ document, numberOfFlashcards });

        if (!cards || !cards?.length)
            return { message: 'No Flashcards generated, lack of context' };


        const flashcards = [];

        for (const card of cards) {
            flashcards.push({ question: card.question, answer: card.answer, difficulty: card.difficulty });
        }

        const flashcardsDoc = await FlashCard.create({ user: userId, document: documentId, flashcards });


        // update the flashcardsSetCounter 
        await Document.updateOne({ _id: documentId }, { $inc: { flashcardCount: 1 } });

        return { flashcards: flashcardsDoc };

    } catch (error) {

        throw error;
    }
};

aiService.generateQuiz = async (params = {}) => {
    try {

        const { documentId, userId, numQuestions } = params;



        const document = await getDocument(documentId, userId);

        const questions = await geminiService.generateQuiz({ document, numQuestions });


        if (!questions.length)
            throw InternalServerError('No questions generated.')

        const newQuizObject = {
            user: userId,
            document: documentId,
            title: `${document?.title ?? 'N/A'} - Quiz`,
            questions,
            totalQuestions: questions.length,
        };

        const quizDocument = await Quiz.create(newQuizObject);

        await Document.updateOne({ _id: documentId }, { $inc: { quizCount: 1 } });


        return { quizDocument };

    } catch (error) {

        throw error;
    }
};

aiService.generateSummary = async (params = {}) => {
    try {
        const { documentId, userId } = params;

        const document = await getDocument(documentId, userId);

        const summary = await geminiService.generateSummary({ document });


        return { summary };

    } catch (error) {

        throw error;
    }
};

aiService.chat = async (params = {}) => {
    try {

        const { documentId, userId, question } = params;
        
        await getDocument(documentId, userId);

        // * Generate embedding for the question
        const questionEmbedding = await geminiService.generateEmbedding(question);

        // * Vector Search for relevant chunks
        const  chunks = await getRelevantChunks({ emdbeddingQuery : questionEmbedding, documentId, userId });
        // const chunks = await DocumentChunk.aggregate([
        //     {
        //         $vectorSearch: {
        //             index: "vector_index", // User must create this index in Atlas
        //             path: "embedding",
        //             queryVector: questionEmbedding,
        //             numCandidates: 100,
        //             limit: 5,
        //             filter: {
        //                 document: new mongoose.Types.ObjectId(documentId),
        //                 user: new mongoose.Types.ObjectId(userId),
        //             }
        //         }
        //     },
        //     {
        //         $project: {
        //             content: 1,

        //             score: { $meta: "vectorSearchScore" }
        //         }
        //     }
        // ]);

        if (!chunks.length) {
            return "I couldn't find any relevant information in the document to answer your question.";
        }

        // * Construct context
        const context = chunks.map((chunk, index) => `[Chunk ${index + 1} (Score: ${chunk.score.toFixed(2)})]\n${chunk.content}`).join('\n\n');

        // * Ask Gemini
        const answer =  await geminiService.chatWithContext({ context, question });


        // * handle history 

        const eventType = statics.historyTypes.find(item => item.name === 'chat').value;


        const relevantChunks = chunks.map( chunk => chunk._id);

        const userQuestionHistoryRecord = { role : 'user', question, relevantChunks };
        const geminiAnswerHistoryRecord = { role : 'assistant', answer, relevantChunks };



        const questionObj = await ChatHistory.create({
          eventDate: new Date(),
          eventType,
          user: userId,
          document: documentId,
          message: userQuestionHistoryRecord,
        });
        const answerObj = await ChatHistory.create({
          eventDate: new Date(),
          eventType,
          user: userId,
          document: documentId,
          message: geminiAnswerHistoryRecord,
        });

        return {
          question: questionObj,
          answer: answerObj,
          relevantChunks,
          documentId: documentId,
        };
    

    } catch (error) {

        throw error;
    }
};


async function getRelevantChunks (params = {}) {
    try {
        const {emdbeddingQuery, documentId, userId} = params;


        const chunks = await DocumentChunk.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index", // User must create this index in Atlas
                    path: "embedding",
                    queryVector: emdbeddingQuery,
                    numCandidates: 100,
                    limit: 5,
                    filter: {
                        document: new mongoose.Types.ObjectId(documentId),
                        user: new mongoose.Types.ObjectId(userId),
                    }
                }
            },
            {
                $project: {
                    content: 1,

                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]);


        return chunks;

    } catch(error) {

        console.error('Error while getting the relevant chunks\n', error);
        throw error;
    }
}

aiService.explainConcept = async (params = {}) => {
    try {

        const { documentId, userId, concept } = params;

        await getDocument(documentId, userId);

        // * Generate embedding for the question
        const conceptEmbedding = await geminiService.generateEmbedding(concept);

        // * Vector Search for relevant chunks
        const  chunks = await getRelevantChunks({ emdbeddingQuery: conceptEmbedding, documentId, userId });

        // * Construct context
        const context = chunks.map((chunk, index) => `[Chunk ${index + 1} (Score: ${chunk.score.toFixed(2)})]\n${chunk.content}`).join('\n\n');

        const answer =  await geminiService.explainConcept({ context, concept });


        return { answer };

    } catch (error) {

        throw error;
    }
};

aiService.getChatHistory = async (params = {}) => {
    try {
        const { documentId, userId, paginationParams } = params;

        const { limit = 20, offset = 0 } = paginationParams ?? {};


        const eventType = statics.historyTypes.find(item => item.name === 'chat').value;


        const query = { eventType, document: new mongoose.Types.ObjectId(documentId), user: new mongoose.Types.ObjectId(userId)};
       
        const totalCount = await ChatHistory.countDocuments(query);

        const histories = await ChatHistory
            .find(query)
            .skip(offset)
            .limit(limit)
            .lean();


        return { histories, totalCount };

    } catch(error) {
        
        throw error;
    }
};

export default aiService;
