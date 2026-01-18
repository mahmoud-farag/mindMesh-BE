# MindMesh Backend

An AI-powered study assistant backend that helps students learn more effectively through document analysis, flashcard generation, quiz creation, and intelligent chat interactions.

## 🚀 Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with password hashing
- **Document Management**: Upload, store, and manage PDF documents in AWS S3
- **AI-Powered Learning Tools**:
  - 📚 Generate flashcards from documents
  - 📝 Create quizzes with multiple-choice questions
  - 📄 Generate document summaries
  - 💬 Chat with your documents using AI
  - 🧠 Get AI explanations for complex concepts
- **Progress Tracking**: Track quiz attempts and learning progress
- **Secure Storage**: AWS S3 integration with presigned URLs

### Infrastructure
- **AWS CDK**: Infrastructure as Code for AWS resources
- **Lambda Functions**: Serverless PDF processing
- **S3 Event Triggers**: Automatic processing of uploaded PDFs
- **SSM Parameter Store**: Secure credential management

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Google Generative AI (Gemini)
- **Cloud Services**: AWS (S3, Lambda, SSM)
- **Authentication**: JWT + bcryptjs
- **PDF Processing**: pdf-parse

### Infrastructure (CDK)
- **AWS CDK**: TypeScript-based infrastructure
- **Lambda Runtime**: Node.js 20.x
- **IAM**: Fine-grained permissions for SSM and S3

## 📋 Prerequisites

- Node.js v20 or higher
- MongoDB instance (local or MongoDB Atlas)
- AWS Account with configured credentials
- Google Cloud Project with Generative AI API enabled
- AWS CLI configured

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR-USERNAME/mindMesh-BE.git
cd mindMesh-BE
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/mindmesh
JWT_SECRET=your_secure_jwt_secret_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-west-1
AWS_BUCKET_NAME=your-s3-bucket-name
GOOGLE_API_KEY=your_google_genai_api_key
```

### 4. Set Up AWS SSM Parameters
Store sensitive credentials in AWS Systems Manager Parameter Store:

```bash
aws ssm put-parameter \
  --name "/mindMesh/mongoURI" \
  --value "your-mongodb-connection-string" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/mindMesh/geminiAPIKey" \
  --value "your-gemini-api-key" \
  --type "SecureString"
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
The server will start on `http://localhost:3000` with hot-reload enabled.

### Production Mode
```bash
npm start
```

## ☁️ AWS Infrastructure Deployment

### Deploy CDK Stacks

1. **Navigate to CDK directory**:
   ```bash
   cd CDK
   ```

2. **Install CDK dependencies**:
   ```bash
   npm install
   ```

3. **Bootstrap CDK** (first time only):
   ```bash
   npx cdk bootstrap
   ```

4. **Deploy all stacks**:
   ```bash
   npx cdk deploy --all
   ```

   Or deploy individually:
   ```bash
   npx cdk deploy S3Stack
   npx cdk deploy S3LambdaStack
   ```

5. **Watch for changes** (development):
   ```bash
   npx cdk watch S3LambdaStack
   ```

### CDK Stacks Overview

#### S3Stack
- Creates S3 bucket for document storage
- Configures CORS for frontend access
- Enables versioning and encryption

#### S3LambdaStack
- Deploys Lambda function for PDF processing
- Sets up S3 event triggers (ObjectCreated)
- Configures IAM permissions for SSM and S3 access
- Grants KMS decrypt permissions for SecureString parameters

## 📡 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| GET | `/profile` | Get user profile | Yes |
| PATCH | `/change-password` | Change password | Yes |

### Documents (`/api/document`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload-pdf` | Upload PDF document | Yes |
| GET | `/` | Get all user documents | Yes |
| GET | `/:id` | Get specific document | Yes |
| DELETE | `/:id` | Delete document | Yes |

### AI Features (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/generate-flashcards` | Generate flashcards from document | Yes |
| POST | `/generate-quiz` | Generate quiz from document | Yes |
| POST | `/generate-summary` | Generate document summary | Yes |
| POST | `/chat` | Chat with document | Yes |
| POST | `/explain-concept` | Get AI explanation | Yes |
| GET | `/chat-history/:documentId` | Get chat history | Yes |

### Flashcards (`/api/flashcard`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all flashcard sets | Yes |
| GET | `/:id` | Get specific flashcard set | Yes |
| DELETE | `/:id` | Delete flashcard set | Yes |
| PATCH | `/:setId/flashcard/:flashcardId/favorite` | Toggle favorite | Yes |

### Quizzes (`/api/quiz`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all quizzes | Yes |
| GET | `/:id` | Get specific quiz | Yes |
| DELETE | `/:id` | Delete quiz | Yes |
| POST | `/:id/submit` | Submit quiz answers | Yes |

## 📁 Project Structure

```
mindMesh-BE/
├── CDK/                    # AWS CDK Infrastructure
│   ├── bin/               # CDK app entry point
│   ├── lib/               # Stack definitions
│   │   ├── s3-stack.ts           # S3 bucket stack
│   │   └── S3_lambda-stack.ts    # Lambda processing stack
│   └── package.json
├── lambdas/               # Lambda functions
│   └── pdf-processor/     # PDF processing Lambda
│       ├── index.js       # Lambda handler
│       └── package.json
├── src/
│   ├── common/           # Constants and enums
│   ├── config/           # Configuration (DB, Multer, Env)
│   ├── controllers/      # Route controllers
│   ├── data/             # Data access layer
│   ├── middlewares/      # Express middlewares
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── scripts/              # Utility scripts
├── app.js               # Express app entry point
└── package.json
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Configuration**: Controlled cross-origin access
- **SSM Parameter Store**: Encrypted credential storage
- **IAM Policies**: Least-privilege access for Lambda functions
- **Input Validation**: Express-validator for request validation

## 🧪 Lambda Function Details

### PDF Processor Lambda
- **Trigger**: S3 ObjectCreated events (`.pdf` files in `pdf-documents/` prefix)
- **Runtime**: Node.js 20.x
- **Timeout**: 5 minutes
- **Memory**: 256 MB
- **Permissions**:
  - Read from S3 bucket
  - Read SSM parameters (`/mindMesh/mongoURI`, `/mindMesh/geminiAPIKey`)
  - KMS decrypt for SecureString parameters

### Updating Lambda Code
Any changes to `/lambdas/pdf-processor/` require redeployment:

```bash
cd CDK
npx cdk deploy S3LambdaStack
```

For faster development, use watch mode:
```bash
npx cdk watch S3LambdaStack
```

## 📊 Database Models

- **User**: User accounts and authentication
- **Document**: PDF documents metadata
- **FlashCardSet**: Collections of flashcards
- **FlashCard**: Individual flashcards
- **Quiz**: Quiz metadata and questions
- **ChatHistory**: AI chat conversations
- **Summary**: Document summaries

## 🔄 Development Workflow

1. Make code changes in `src/` or `lambdas/`
2. Test locally with `npm run dev`
3. For Lambda changes, deploy with `npx cdk deploy S3LambdaStack`
4. Monitor CloudWatch logs for Lambda execution
5. Test API endpoints with Postman or frontend

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Yes |
| `AWS_REGION` | AWS region | Yes |
| `AWS_BUCKET_NAME` | S3 bucket name | Yes |
| `GOOGLE_API_KEY` | Google Generative AI API key | Yes |

## 🐛 Troubleshooting

### CDK Deployment Issues
- Ensure AWS credentials are configured: `aws configure`
- Check CDK bootstrap: `npx cdk bootstrap`
- Verify SSM parameters exist in the correct region

### Lambda Errors
- Check CloudWatch Logs for the Lambda function
- Verify IAM permissions are correctly set
- Ensure SSM parameters are accessible

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure network access (for MongoDB Atlas)

## 📄 License

ISC

## 👨‍💻 Author

Mahmoud Farag
