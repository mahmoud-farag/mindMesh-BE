import { GoogleGenAI } from '@google/genai';
import { customErrors } from '../utils/index.js';
import awsService from './aws-service.js';
import Document from '../models/Document.js';


const { InternalServerError } = customErrors;


class GeminiService {

  #geminiClient
  #modelType = 'gemini-2.5-flash-lite';

  constructor() {

    if (!process.env.GEMINI_API_KEY) {
      throw new InternalServerError('GEMINI_API_KEY is not set in the environment variables');
    }

    this.#geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  }

  set modelType(model) {
    this.#modelType = model;
  }


  async generateFlashcards({ document, numberOfFlashcards }) {
    try {


      const prompt = `Generate exactly ${numberOfFlashcards} educational flashcards from the following text.
        Format each flashcard as:
        Q: [Clear, specific question]
        Answer: [Concise, accurate answer]
        Level: [Difficulty level: easy, medium, or hard]
        
        Separate each flashcard with "----"`;

      const validGeminiFileUri = await this.#validateGeminiUri(document);

      const contents = this.#PrepareModelContents({ prompt, mimeType: document.extractedText.mimeType, fileUri: validGeminiFileUri });

      const response = await this.#geminiClient.models.generateContent({ model: this.#modelType, contents });

      const generatedText = response.text;

      // Parse the response
      const flashcards = [];

      const cards = generatedText.split('----').filter(card => card.trim());

      for (const card of cards) {

        const lines = card.trim().split('\n');

        let question = '', answer = '', difficulty = 'medium';

        for (const line of lines) {

          if (line.startsWith('Q:')) {
            question = line.substring(2).trim();

          } else if (line.startsWith('Answer:')) {
            answer = line.substring(7).trim();

          } else if (line.startsWith('Level:')) {
            const diff = line.substring(6).trim().toLowerCase();

            if (['easy', 'medium', 'hard'].includes(diff)) {
              difficulty = diff;
            }

          }
        }

        if (question && answer) {
          flashcards.push({ question, answer, difficulty });
        }
      }



      if (flashcards.length > numberOfFlashcards)
        return flashcards.slice(0, numberOfFlashcards);
      else
        return flashcards;


    } catch (error) {

      console.error('generateFlashcards:: Gemini API error:\n', error);

      let errMsg = 'Failed to generate flashcards';

      if ([429, 503].includes(error.code))
        errMsg = error.message;

      throw new InternalServerError(errMsg);

    }

  }

  #PrepareModelContents(params = {}) {

    const { prompt, mimeType, fileUri } = params;

    // Construct the contents with both text and file
    const contents = [
      {
        // role: 'user', // Represents (the human) sending the prompt or instructions.
        parts: [
          { text: prompt },
          {
            fileData: {
              mimeType,
              fileUri, // Maximum File Size: Up to 5 GB per file
            }
          }
        ]
      }
    ];


    return contents;
  }

  async #validateGeminiUri(document) {
    let geminiFileUri;
    if (document?.geminiFileUri && document?.geminiUriExpirationDate && this.#isDateStillValid(document.geminiUriExpirationDate)) {
      geminiFileUri = document.geminiFileUri;
      return geminiFileUri;
    }

    const { extractedText } = document;
    if (!extractedText || !extractedText?.folder || !extractedText.fileName)
      throw new InternalServerError('Pdf doucment text S3 Data not exist');

    const { folder, fileName, mimeType } = extractedText;

    // Await the file read (awsService.readFile returns a Promise<Uint8Array>)
    let fileData = await awsService.readFile(folder, fileName);

    // Convert Uint8Array to Blob
    // The @google/genai SDK's `upload` method requires a `Blob` or a file path (string).
    // Since we have the file data in memory as a Uint8Array, we must wrap it in a Blob.
    let blob = new Blob([fileData], { type: mimeType });

    // Upload to Gemini
    const uploadResponse = await this.#geminiClient.files.upload({
      file: blob,
      config: {
        mimeType: mimeType,
        displayName: fileName,
      }
    });

    // an Example of the resonse contents 
    /**
      {
        name: 'files/11076d3lzldm',
        displayName: 'pdf_extracted_text_693c0f38123beaa5236c4d1f_1765543738294.txt',
        mimeType: 'text/plain',
        sizeBytes: '501007',
        createTime: '2025-12-12T14:27:49.766928Z',
        updateTime: '2025-12-12T14:27:49.766928Z',
        expirationTime: '2025-12-14T14:27:49.177804586Z',
        sha256Hash: 'NjEyN2IzNDZjZDRhODY3Njk4NGU1YTU0MmM5MjQ5NTA4YTdiMjRkZTI1MTYzMzQ0OGE4N2I5NWI4OTEzYmRiYg==',
        uri: 'https://generativelanguage.googleapis.com/v1beta/files/11076d3lzldm',
        state: 'ACTIVE',
        source: 'UPLOADED'
      }
    */

    geminiFileUri = uploadResponse.uri;
    const expirationTime = uploadResponse.expirationTime;


    // clear immediatly the memory manually
    fileData = blob = null;

    // update the Document with the new valid geminiFileUri 
    const updatedFields = {
      geminiFileUri,
      geminiUriExpirationDate: new Date(expirationTime) // will be valid for the next 48h
    };

    await Document.updateOne({ _id: document._id }, { $set: updatedFields });


    return geminiFileUri;
  }

  #isDateStillValid(geminiUriExpirationDate) {
    const now = new Date();
    if (new Date(geminiUriExpirationDate).getTime() >= now.getTime())
      return true;
    else
      return false;

  }

  async generateQuiz({ document, numQuestions = 5 }) {
    try {

      const prompt = `Generate exactly ${numQuestions} multiple choice questions from the following text.
        Format each question as:
        Q: [Question]
        Opt1: [Option 1]
        Opt2: [Option 2]
        Opt3: [Option 3]
        Opt4: [Option 4]
        Correct: [Correct option – exactly as written above]
        Explanation: [Brief explanation]
        Level: [Difficulty: easy, medium, or hard]
        
        Separate questions with "----"`;


      const validGeminiFileUri = await this.#validateGeminiUri(document);

      const contents = this.#PrepareModelContents({ prompt, mimeType: document.extractedText.mimeType, fileUri: validGeminiFileUri });



      const response = await this.#geminiClient.models.generateContent({ model: this.#modelType, contents });

      const generatedText = response.text;

      // parese the response 
      const questions = [];
      const questionBlocks = generatedText.split('----').filter(question => question.trim());

      for (const block of questionBlocks) {

        const lines = block.trim().split('\n');
        let question = '', options = [], correctAnswer = '', explanation = '', difficulty = 'medium';

        for (const line of lines) {

          const trimmed = line.trim();

          if (trimmed.startsWith('Q:')) {
            question = trimmed.substring(2).trim();

          } else if (trimmed.match(/^Opt\d:/)) {
            options.push(trimmed.substring(5).trim());

          } else if (trimmed.startsWith('Correct:')) {
            correctAnswer = trimmed.substring(8).trim();

          } else if (trimmed.startsWith('Explanation:')) {
            explanation = trimmed.substring(12).trim();

          } else if (trimmed.startsWith('Level:')) {
            const diff = trimmed.substring(6).trim().toLowerCase();

            if (['easy', 'medium', 'hard'].includes(diff)) {
              difficulty = diff;
            }
          }
        }

        if (question && options.length === 4 && correctAnswer) {

          questions.push({ question, options, correctAnswer, explanation, difficulty });

        }
      }



      if (questions.length > numQuestions)
        return questions.slice(0, numQuestions);

      else
        return questions;


    } catch (error) {

      console.error('generateQuiz:: Gemini API error:\n', error);

      let errMsg = 'Failed to generate quiz';

      if ([429, 503].includes(error.code))
        errMsg = error.message;

      throw new InternalServerError(errMsg);

    }
  }

  async generateSummary({ document }) {
    try {

      const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important details.
        Keep the summary clear and structured.`;


      const validGeminiFileUri = await this.#validateGeminiUri(document);

      const contents = this.#PrepareModelContents({ prompt, mimeType: document.extractedText.mimeType, fileUri: validGeminiFileUri });


      const response = await this.#geminiClient.models.generateContent({ model: this.#modelType, contents });

      const generatedText = response.text;

      return generatedText;

    } catch (error) {

      console.error('generateSummary:: Gemini API error:\n', error);

      let errMsg = 'Failed to generate summary';

      if ([429, 503].includes(error.code))
        errMsg = error.message;

      throw new InternalServerError(errMsg);
    }
  };

  async chatWithContext({ context, question }) {
    try {

      const prompt = `Based on the following context from a document, analyse the context and answer the user's question.
        If the answer is not in the context, say so.
        
        Context:
        ${context}
        
        Question: ${question}
        
        Answer:`;

      const response = await this.#geminiClient.models.generateContent({ model: this.#modelType, contents: prompt });

      const generatedText = response.text;

      return generatedText;

    } catch (error) {

      console.error('chatWithContext:: Gemini API error:\n', error);

      let errMsg = 'Failed to process chat request';

      if ([429, 503].includes(error.code))
        errMsg = error.message;

      throw new InternalServerError(errMsg);

    }
  };

  async explainConcept({ context, concept }) {
    try {

      const prompt = `Explain the concept of "${concept}" based on the following context.
        Provide a clear, educational explanation that's easy to understand.
        Include examples if relevant.
        
        here is context:
        ${context}`;


      const response = await this.#geminiClient.models.generateContent({ model: this.#modelType, contents: prompt });



      const generatedText = response.text;

      return generatedText;

    } catch (error) {

      console.error('explainConcept:: Gemini API error:', error);

      let errMsg = 'Failed to explain concept';

      if ([429, 503].includes(error.code))
        errMsg = error.message;

      throw new InternalServerError(errMsg);
    }

  };

  async generateEmbedding(text) {
    try {

      const result = await this.#geminiClient.models.embedContent({
        model: "text-embedding-004",
        contents: text,
      });

      if (!result.embeddings || result.embeddings.length === 0) {
        throw new Error("No embedding returned from Gemini");
      }

      return result.embeddings[0].values;

    } catch (error) {

      console.error('generateEmbedding:: Gemini API error:', error);

      let errMsg = 'Failed to generate embedding';

      if ([429, 503].includes(error.code))
        errMsg = error.message;

      throw new InternalServerError(errMsg);
    }
  }

  async generateEmbeddingWithRetry(text, options = {}) {

    const maxRetries = options.maxRetries ?? 3;
    const baseDelay = options.baseDelay ?? 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {

        const result = await this.#geminiClient.models.embedContent({
          model: "text-embedding-004",
          contents: text,
        });

        if (!result.embeddings || result.embeddings.length === 0) {
          throw new Error("No embedding returned from Gemini");
        }

        return result.embeddings[0].values;

      } catch (error) {

        const isRetryable = this.#isRetryableError(error);

        if (isRetryable && attempt < maxRetries) {
          
          const delay = baseDelay * Math.pow(2, attempt - 1);

          console.log(`generateEmbeddingWithRetry:: Attempt ${attempt} failed, retrying in ${delay}ms...`);

          await this.#sleep(delay);
          continue;
        }

        // if the error not retirable , then break the loop and finish
        break;
      }
    }
  }

  #isRetryableError(error) {
    // Network errors
    if (error.message?.includes('fetch failed')) return true;
    if (error.message?.includes('ECONNRESET')) return true;
    if (error.message?.includes('ETIMEDOUT')) return true;
    if (error.message?.includes('socket hang up')) return true;

    // Rate limit or server overload
    if ([429, 500, 502, 503, 504].includes(error.code)) return true;

    return false;
  }

  #sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}




const geminiService = new GeminiService();

export default geminiService;
