# MindMesh - AWS CDK Infrastructure

This directory contains the AWS Cloud Development Kit (CDK) infrastructure code for the MindMesh application. It defines and deploys AWS resources including S3 buckets, Lambda functions, and IAM policies.

## 📦 Stacks

### S3Stack
Creates and configures the S3 bucket for document storage.

**Resources:**
- S3 Bucket: `ai-learning-expressjs`
- CORS configuration for frontend access
- Versioning enabled
- Server-side encryption

**Outputs:**
- Bucket name
- Bucket ARN

### S3LambdaStack
Deploys the PDF processing Lambda function and configures event triggers.

**Resources:**
- Lambda Function: PDF processor
- S3 Event Notification: Triggers on PDF upload
- IAM Role: Lambda execution role with permissions
- IAM Policies: SSM and S3 access

**Permissions:**
- Read from S3 bucket
- Read SSM parameters (`/mindMesh/mongoURI`, `/mindMesh/geminiAPIKey`)
- KMS decrypt for SecureString parameters

**Outputs:**
- Lambda function name
- Lambda function ARN

## 🛠️ Prerequisites

- AWS CLI configured with credentials
- Node.js v18 or higher
- AWS CDK CLI: `npm install -g aws-cdk`
- SSM parameters created (see below)

## 🔧 Setup

### 1. Install Dependencies
```bash
cd CDK
npm install
```

### 2. Configure SSM Parameters
Create the required SSM parameters in AWS Systems Manager:

```bash
# MongoDB URI
aws ssm put-parameter \
  --name "/mindMesh/mongoURI" \
  --value "your-mongodb-connection-string" \
  --type "SecureString" \
  --region eu-west-1

# Gemini API Key
aws ssm put-parameter \
  --name "/mindMesh/geminiAPIKey" \
  --value "your-gemini-api-key" \
  --type "SecureString" \
  --region eu-west-1
```

### 3. Bootstrap CDK (First Time Only)
```bash
npx cdk bootstrap aws://ACCOUNT-ID/REGION
```

## 🚀 Deployment

### Deploy All Stacks
```bash
npx cdk deploy --all
```

### Deploy Individual Stacks
```bash
# Deploy S3 bucket first
npx cdk deploy S3Stack

# Then deploy Lambda stack
npx cdk deploy S3LambdaStack
```

### Watch Mode (Auto-deploy on changes)
```bash
npx cdk watch S3LambdaStack
```

## 📋 Useful Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run watch` | Watch for changes and compile |
| `npm run test` | Run Jest unit tests |
| `npx cdk deploy` | Deploy stack to AWS |
| `npx cdk diff` | Compare deployed stack with current state |
| `npx cdk synth` | Synthesize CloudFormation template |
| `npx cdk destroy` | Delete stack from AWS |
| `npx cdk ls` | List all stacks |

## 📁 Project Structure

```
CDK/
├── bin/
│   └── cdk.ts              # CDK app entry point
├── lib/
│   ├── s3-stack.ts         # S3 bucket stack definition
│   └── S3_lambda-stack.ts  # Lambda function stack definition
├── test/
│   └── cdk.test.ts         # Stack tests
├── cdk.json                # CDK configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## 🔐 Security

### IAM Permissions
The Lambda function has the following permissions:

**S3 Access:**
- `s3:GetObject*`
- `s3:GetBucket*`
- `s3:List*`

**SSM Access:**
- `ssm:GetParameter`
- `ssm:GetParameters`
- `ssm:DescribeParameters`
- `ssm:GetParameterHistory`

**KMS Access:**
- `kms:Decrypt` (for SecureString parameters)

### Best Practices
- ✅ Uses least-privilege IAM policies
- ✅ Secrets stored in SSM Parameter Store (encrypted)
- ✅ No hardcoded credentials
- ✅ Environment-specific configurations
- ✅ Resource tagging for cost tracking

## 🔄 Lambda Function Details

### PDF Processor Lambda

**Configuration:**
- Runtime: Node.js 20.x
- Handler: `index.handler`
- Timeout: 5 minutes
- Memory: 256 MB
- Code Location: `../lambdas/pdf-processor`

**Trigger:**
- S3 Event: `ObjectCreated`
- Prefix: `pdf-documents/`
- Suffix: `.pdf`

**Environment Variables:**
- `S3_BUCKET_NAME`: S3 bucket name
- `AWS_REGION_NAME`: AWS region
- `MONGO_URI`: SSM parameter path for MongoDB URI
- `GEMINI_API_KEY`: SSM parameter path for Gemini API key

### Updating Lambda Code

Any changes to the Lambda source code require redeployment:

```bash
# Make changes to ../lambdas/pdf-processor/index.js
cd CDK
npx cdk deploy S3LambdaStack
```

For faster development:
```bash
npx cdk watch S3LambdaStack
```

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Synthesize CloudFormation Template
```bash
npx cdk synth
```

This generates CloudFormation templates in `cdk.out/` for review.

### Validate Changes
```bash
npx cdk diff
```

Shows what will change before deploying.

## 📊 Monitoring

### CloudWatch Logs
Lambda execution logs are available in CloudWatch:
- Log Group: `/aws/lambda/S3LambdaStack-PdfProcessorLambda*`

### Metrics
Monitor Lambda metrics:
- Invocations
- Duration
- Errors
- Throttles

## 🐛 Troubleshooting

### Deployment Fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify CDK bootstrap
npx cdk bootstrap

# Check for stack drift
npx cdk diff
```

### Lambda Errors
```bash
# View CloudWatch logs
aws logs tail /aws/lambda/FUNCTION-NAME --follow

# Check Lambda configuration
aws lambda get-function --function-name FUNCTION-NAME
```

### SSM Parameter Issues
```bash
# List parameters
aws ssm describe-parameters

# Get parameter value
aws ssm get-parameter --name "/mindMesh/mongoURI" --with-decryption
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy CDK
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx cdk deploy --all --require-approval never
    env:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 🗑️ Cleanup

To remove all resources:

```bash
# Destroy stacks (in reverse order)
npx cdk destroy S3LambdaStack
npx cdk destroy S3Stack

# Delete SSM parameters
aws ssm delete-parameter --name "/mindMesh/mongoURI"
aws ssm delete-parameter --name "/mindMesh/geminiAPIKey"
```

## 📚 Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SSM Documentation](https://docs.aws.amazon.com/systems-manager/)

## 📝 Notes

- The S3 bucket name is hardcoded as `ai-learning-expressjs`
- CORS configuration must be set manually in AWS Console
- Lambda function name is auto-generated by CDK
- SSM parameters must exist before deploying S3LambdaStack

## 👨‍💻 Author

Mahmoud Farag
