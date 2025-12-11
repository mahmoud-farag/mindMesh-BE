# AI Learner Backend

A web application backend that serves as an AI study assistant. It provides features for document management, flashcard generation, quiz generation, and AI-powered chat.

## Features

-   **Authentication**: User registration, login, and profile management using JWT.
-   **Document Management**: Upload (PDF), list, retrieve, and delete documents.
-   **AI Features**:
    -   Generate flashcards from documents.
    -   Generate quizzes from documents.
    -   Generate summaries of documents.
    -   Chat with your documents using AI.
    -   Explain concepts.
-   **Security**: Password hashing, JWT authentication, and secure headers.

## Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (with Mongoose)
-   **AI Integration**: Google GenAI
-   **Storage**: AWS S3 (for document storage)
-   **PDF Processing**: pdf-parse
-   **Authentication**: jsonwebtoken, bcryptjs

## Prerequisites

-   Node.js (v20+ recommended)
-   MongoDB instance (local or Atlas)
-   AWS Account (for S3)
-   Google Cloud Project (for GenAI API)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd ai-learner-be
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory and add the following:
    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/ai-learner
    JWT_SECRET=your_jwt_secret
    AWS_ACCESS_KEY_ID=your_aws_access_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret_key
    AWS_REGION=your_aws_region
    AWS_BUCKET_NAME=your_s3_bucket_name
    GOOGLE_API_KEY=your_google_genai_api_key
    ```

## Running the Application

-   **Development Mode** (with nodemon):
    ```bash
    npm run dev
    ```

-   **Production Mode**:
    ```bash
    npm start
    ```

## API Endpoints

### Auth
-   `POST /api/auth/register` - Register a new user
-   `POST /api/auth/login` - Login user
-   `GET /api/auth/profile` - Get user profile
-   `PATCH /api/auth/change-password` - Change password

### Documents
-   `POST /api/document/upload-pdf` - Upload a PDF document
-   `GET /api/document` - Get all documents
-   `GET /api/document/:id` - Get a specific document
-   `DELETE /api/document/:id` - Delete a document

### AI
-   `POST /api/ai/generate-flashcards` - Generate flashcards
-   `POST /api/ai/generate-quiz` - Generate quiz
-   `POST /api/ai/generate-summary` - Generate summary
-   `POST /api/ai/chat` - Chat with AI
-   `POST /api/ai/explain-concept` - Explain a concept
-   `GET /api/ai/chat-history/:documentId` - Get chat history

## Project Structure

```
src/
├── common/         # Common constants and utilities
├── config/         # Configuration (DB, Multer, Env)
├── controllers/    # Route controllers
├── data/           # Data access layer / repositories
├── middlewares/    # Express middlewares (Auth, Error Handler)
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
└── utils/          # Utility functions
```

## License

ISC
