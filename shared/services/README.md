# Shared Services

This directory contains shared service packages that can be used across both the main application and Lambda functions in the MindMesh project.

## Structure

```
shared/services/
├── aws-service/          # AWS S3 operations
│   ├── package.json
│   ├── index.js
│   └── node_modules/
└── gemini-service/       # Gemini AI services
    ├── package.json
    ├── index.js
    └── node_modules/
```

## Services

### @mindmesh/shared-aws-service

Provides comprehensive AWS S3 utilities:

- `uploadFile({fileBuffer, folder, fileName, mimeType})` - Upload files to S3
- `downloadFile(folder, fileName)` - Download files from S3 as Buffer
- `readFile(folder, fileName)` - Read files as Uint8Array
- `readFileStream(folder, fileName)` - Read files as stream
- `getSignedUrl(folder, fileName, {expiresIn})` - Generate GET signed URLs
- `getPutSignedUrl(folder, fileName, mimeType, {expiresIn})` - Generate PUT signed URLs

**Usage:**

```javascript
const awsService = require("@mindmesh/shared-aws-service");

// Upload
await awsService.uploadFile({
  fileBuffer: buffer,
  folder: "pdf-documents",
  fileName: "file.pdf",
  mimeType: "application/pdf",
});

// Download
const buffer = await awsService.downloadFile("pdf-documents", "file.pdf");

// Signed URL
const url = await awsService.getSignedUrl("pdf-documents", "file.pdf", {
  expiresIn: 3600,
});
```

### @mindmesh/shared-gemini-service

Provides comprehensive Gemini AI functionality:

- `generateFlashcards({document, numberOfFlashcards, awsService, DocumentModel})` - Generate educational flashcards
- `generateQuiz({document, numQuestions, awsService, DocumentModel})` - Generate quiz questions
- `generateSummary({document, awsService, DocumentModel})` - Generate document summaries
- `chatWithContext({context, question})` - Answer questions based on context
- `explainConcept({context, concept})` - Explain concepts
- `generateEmbedding(text)` - Generate embeddings
- `generateEmbeddingWithRetry(text, options)` - Generate embeddings with retry logic

**Usage:**

```javascript
const GeminiService = require("@mindmesh/shared-gemini-service");

const geminiService = new GeminiService(apiKey);

// Generate embeddings
const embedding =
  await geminiService.generateEmbeddingWithRetry("text to embed");

// Chat
const answer = await geminiService.chatWithContext({
  context: "Document context...",
  question: "What is this about?",
});
```

## Adding to Your Project

### For Lambda Functions

1. Add to `package.json`:

```json
{
  "dependencies": {
    "@mindmesh/shared-aws-service": "file:../../shared/services/aws-service",
    "@mindmesh/shared-gemini-service": "file:../../shared/services/gemini-service"
  }
}
```

2. Run `npm install`

3. Import and use:

```javascript
const awsService = require("@mindmesh/shared-aws-service");
const GeminiService = require("@mindmesh/shared-gemini-service");
```

### For Main Application

The main application can also use these shared services instead of maintaining separate implementations in `src/services`.

## Benefits

- **Single Source of Truth**: One implementation shared across app and Lambdas
- **Consistency**: Same behavior everywhere
- **Maintainability**: Update once, apply everywhere
- **Dependency Management**: Centralized package versions
- **Code Reusability**: No duplicate code

## Environment Variables

### AWS Service

- `AWS_REGION` - AWS region (required)
- `BUCKET_NAME` - S3 bucket name (required)
- `AWS_ACCESS_KEY_ID` - AWS access key (optional for Lambda, uses execution role)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (optional for Lambda, uses execution role)

### Gemini Service

- API key is passed to constructor, typically from SSM Parameter Store or environment variables
