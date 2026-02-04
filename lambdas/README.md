# Lambda Functions

This folder contains all AWS Lambda functions for the AI-learner backend.

## Structure

```
lambdas/
└── pdf-processor/       # Processes PDFs uploaded to S3
    ├── index.js         # Lambda handler
    └── package.json     # Dependencies
```

## PDF Processor Lambda

**Trigger:** S3 ObjectCreated event (`.pdf` files in `pdf-documents/` folder)

**Purpose:**
- Downloads PDF from S3
- Extracts text content
- Generates flashcards and quizzes using Gemini AI
- Updates document status in MongoDB

**Environment Variables:**
- `S3_BUCKET_NAME`: S3 bucket name
- `AWS_REGION_NAME`: AWS region
- `MONGODB_URI`: MongoDB connection string (from Secrets Manager)
- `GEMINI_API_KEY`: Gemini API key (from Secrets Manager)

## Development

Each Lambda function has its own `package.json` and dependencies.

To install dependencies:
```bash
cd lambdas/pdf-processor
npm install
```

## Deployment

Lambdas are deployed via CDK. See `CDK/lib/S3_lambda-stack.ts` for infrastructure configuration.
