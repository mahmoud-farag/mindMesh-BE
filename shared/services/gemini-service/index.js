const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Shared Gemini Service for app and Lambda functions
 * Provides full AI functionality: flashcards, quizzes, summaries, chat, embeddings
 * Note: Some methods require awsService and Document model to be passed as dependencies
 */
class GeminiService {
  #geminiClient;
  #modelType = 'gemini-2.0-flash-exp';
  #apiKey;

  constructor() {
    this.#apiKey = process.env.GEMINI_API_KEY;
    this.#geminiClient = null;
  }

  /**
   * Set API key explicitly (useful for Lambda when fetching from SSM)
   * @param {string} apiKey - Gemini API key
   */
  setApiKey(apiKey) {
    if (!apiKey) {
      throw new Error('API key cannot be empty');
    }
    this.#apiKey = apiKey;
    this.#geminiClient = null;
  }

  #ensureInitialized() {
    if (this.#geminiClient) {
      return;
    }

    if (!this.#apiKey) {
      this.#apiKey = process.env.GEMINI_API_KEY;
    }

    if (!this.#apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required or call setApiKey() first');
    }

    this.#geminiClient = new GoogleGenerativeAI(this.#apiKey);
  }

  set modelType(model) {
    this.#modelType = model;
  }

  /**
   * Generate flashcards from document
   * @param {object} params
   * @param {object} params.document - Document object with extractedText
   * @param {number} params.numberOfFlashcards - Number of flashcards to generate
   * @param {object} params.awsService - AWS service instance for file operations
   * @param {object} params.DocumentModel - Mongoose Document model for updates
   * @returns {Promise<Array>} Array of flashcard objects
   */
  async generateFlashcards({ document, numberOfFlashcards, awsService, DocumentModel }) {
    this.#ensureInitialized();

    try {
      const prompt = `Generate exactly ${numberOfFlashcards} educational flashcards from the following text.
        Format each flashcard as:
        Q: [Clear, specific question]
        Answer: [Concise, accurate answer]
        Level: [Difficulty level: easy, medium, or hard]
        
        Separate each flashcard with "----"`;

      const validGeminiFileUri = await this.#validateGeminiUri(document, awsService, DocumentModel);

      const contents = this.#PrepareModelContents({ 
        prompt, 
        mimeType: document.extractedText.mimeType, 
        fileUri: validGeminiFileUri 
      });

      const model = this.#geminiClient.getGenerativeModel({ model: this.#modelType });
      const response = await model.generateContent({ contents });

      const generatedText = response.response.text();

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
      if (error.status === 429) {
        errMsg = 'You exceeded your current quota, try again in another time';
      }
      if ([503].includes(error.status)) errMsg = error.message;
      throw new Error(errMsg);
    }
  }

  /**
   * Generate quiz questions from document
   * @param {object} params
   * @param {object} params.document - Document object
   * @param {number} params.numQuestions - Number of questions
   * @param {object} params.awsService - AWS service instance
   * @param {object} params.DocumentModel - Document model
   * @returns {Promise<Array>} Array of question objects
   */
  async generateQuiz({ document, numQuestions = 5, awsService, DocumentModel }) {
    this.#ensureInitialized();

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

      const validGeminiFileUri = await this.#validateGeminiUri(document, awsService, DocumentModel);
      const contents = this.#PrepareModelContents({ 
        prompt, 
        mimeType: document.extractedText.mimeType, 
        fileUri: validGeminiFileUri 
      });

      const model = this.#geminiClient.getGenerativeModel({ model: this.#modelType });
      const response = await model.generateContent({ contents });
      const generatedText = response.response.text();

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
      if ([429, 503].includes(error.code)) errMsg = error.message;
      throw new Error(errMsg);
    }
  }

  /**
   * Generate summary from document
   * @param {object} params
   * @param {object} params.document - Document object
   * @param {object} params.awsService - AWS service instance
   * @param {object} params.DocumentModel - Document model
   * @returns {Promise<string>} Summary text
   */
  async generateSummary({ document, awsService, DocumentModel }) {
    this.#ensureInitialized();

    try {
      const prompt = `Provide a concise summary of the following text, highlighting the key concepts, main ideas, and important details.
        Keep the summary clear and structured.`;

      const validGeminiFileUri = await this.#validateGeminiUri(document, awsService, DocumentModel);
      const contents = this.#PrepareModelContents({ 
        prompt, 
        mimeType: document.extractedText.mimeType, 
        fileUri: validGeminiFileUri 
      });

      const model = this.#geminiClient.getGenerativeModel({ model: this.#modelType });
      const response = await model.generateContent({ contents });
      const generatedText = response.response.text();

      return generatedText;

    } catch (error) {
      console.error('generateSummary:: Gemini API error:\n', error);
      let errMsg = 'Failed to generate summary';
      if ([429, 503].includes(error.code)) errMsg = error.message;
      throw new Error(errMsg);
    }
  }

  /**
   * Chat with context
   * @param {object} params
   * @param {string} params.context - Context text
   * @param {string} params.question - User question
   * @returns {Promise<string>} Answer text
   */
  async chatWithContext({ context, question }) {
    this.#ensureInitialized();

    try {
      const prompt = `Based on the following context from a document, analyse the context and answer the user's question.
        If the answer is not in the context, say so.
        
        Context:
        ${context}
        
        Question: ${question}
        
        Answer:`;

      const model = this.#geminiClient.getGenerativeModel({ model: this.#modelType });
      const response = await model.generateContent(prompt);
      const generatedText = response.response.text();

      return generatedText;

    } catch (error) {
      console.error('chatWithContext:: Gemini API error:\n', error);
      let errMsg = 'Failed to process chat request';
      if ([429, 503].includes(error.code)) errMsg = error.message;
      throw new Error(errMsg);
    }
  }

  /**
   * Explain concept
   * @param {object} params
   * @param {string} params.context - Context text
   * @param {string} params.concept - Concept to explain
   * @returns {Promise<string>} Explanation text
   */
  async explainConcept({ context, concept }) {
    this.#ensureInitialized();

    try {
      const prompt = `Explain the concept of "${concept}" based on the following context.
        Provide a clear, educational explanation that's easy to understand.
        Include examples if relevant.
        
        here is context:
        ${context}`;

      const model = this.#geminiClient.getGenerativeModel({ model: this.#modelType });
      const response = await model.generateContent(prompt);
      const generatedText = response.response.text();

      return generatedText;

    } catch (error) {
      console.error('explainConcept:: Gemini API error:', error);
      let errMsg = 'Failed to explain concept';
      if ([429, 503].includes(error.code)) errMsg = error.message;
      throw new Error(errMsg);
    }
  }

  /**
   * Generate embedding for text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateEmbedding(text) {
    this.#ensureInitialized();

    try {
      const model = this.#geminiClient.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);

      if (!result.embedding || !result.embedding.values) {
        throw new Error("No embedding returned from Gemini");
      }

      return result.embedding.values;

    } catch (error) {
      console.error('generateEmbedding:: Gemini API error:', error);
      let errMsg = 'Failed to generate embedding';
      if ([429, 503].includes(error.code)) errMsg = error.message;
      throw new Error(errMsg);
    }
  }

  /**
   * Generate embedding with retry logic for transient failures
   * @param {string} text - Text to generate embedding for
   * @param {object} options - Retry options
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateEmbeddingWithRetry(text, options = {}) {
    this.#ensureInitialized();

    const maxRetries = options.maxRetries ?? 3;
    const baseDelay = options.baseDelay ?? 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = this.#geminiClient.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);

        if (!result.embedding || !result.embedding.values) {
          throw new Error("No embedding returned from Gemini");
        }

        return result.embedding.values;

      } catch (error) {
        const isRetryable = this.#isRetryableError(error);

        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`generateEmbeddingWithRetry:: Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this.#sleep(delay);
          continue;
        }

        console.error('generateEmbeddingWithRetry:: Failed after retries:', error);
        throw error;
      }
    }
  }

  #PrepareModelContents(params = {}) {
    const { prompt, mimeType, fileUri } = params;

    const contents = [
      {
        parts: [
          { text: prompt },
          {
            fileData: {
              mimeType,
              fileUri,
            }
          }
        ]
      }
    ];

    return contents;
  }

  async #validateGeminiUri(document, awsService, DocumentModel) {
    let geminiFileUri;
    
    if (document?.geminiFileUri && document?.geminiUriExpirationDate && this.#isDateStillValid(document.geminiUriExpirationDate)) {
      geminiFileUri = document.geminiFileUri;
      return geminiFileUri;
    }

    const { extractedText } = document;
    if (!extractedText || !extractedText?.folder || !extractedText.fileName) {
      throw new Error('PDF document text S3 Data not exist');
    }

    const { folder, fileName, mimeType } = extractedText;

    let fileData = await awsService.readFile(folder, fileName);

    let blob = new Blob([fileData], { type: mimeType });

    const uploadResponse = await this.#geminiClient.fileManager.uploadFile(blob, {
      mimeType: mimeType,
      displayName: fileName,
    });

    geminiFileUri = uploadResponse.file.uri;
    const expirationTime = uploadResponse.file.expirationTime;

    fileData = blob = null;

    const updatedFields = {
      geminiFileUri,
      geminiUriExpirationDate: new Date(expirationTime)
    };

    await DocumentModel.updateOne({ _id: document._id }, { $set: updatedFields });

    return geminiFileUri;
  }

  #isDateStillValid(geminiUriExpirationDate) {
    const now = new Date();
    if (new Date(geminiUriExpirationDate).getTime() >= now.getTime())
      return true;
    else
      return false;
  }

  #isRetryableError(error) {
    if (error.message?.includes('fetch failed')) return true;
    if (error.message?.includes('ECONNRESET')) return true;
    if (error.message?.includes('ETIMEDOUT')) return true;
    if (error.message?.includes('socket hang up')) return true;

    if (error.status && [429, 500, 502, 503, 504].includes(error.status)) return true;

    return false;
  }

  #sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const geminiService = new GeminiService();
module.exports = geminiService;

