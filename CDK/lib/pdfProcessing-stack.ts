import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs'; 
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Unified stack that creates both S3 bucket and PDF processing Lambda
 * in the same stack to avoid circular dependencies with event notifications.
 */
export class PdfProcessingStack extends cdk.Stack {
    public readonly bucket: s3.Bucket;
    public readonly pdfProcessorLambda: NodejsFunction;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const bucketName = 'mindmesh';


        this.bucket = new s3.Bucket(this, 'MindMeshDocumentsBucket', {
            bucketName: bucketName,
            versioned: false,
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep bucket on stack delete
            autoDeleteObjects: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            cors: [
                {
                    allowedHeaders: ['*'],
                    allowedMethods: [
                        s3.HttpMethods.PUT, // Only PUT for uploading PDFs from React
                    ],
                    allowedOrigins: [
                        'http://localhost:5173',
                        'http://localhost:3000',
                        'https://mindmeshf.vercel.app'
                        // Add production domains here
                    ],
                    exposedHeaders: ['ETag'],
                    maxAge: 3000,
                },
            ],
        });

        console.log('--Creating S3 bucket:', bucketName);


        this.pdfProcessorLambda = new NodejsFunction(this, 'PdfProcessorLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            entry: path.join(__dirname, '../../lambdas/pdf-processor/index.js'),
            handler: 'handler',
            bundling: {
                minify: true,
                format: OutputFormat.ESM,
                externalModules: ['@aws-sdk/*'],
                // Provide a `require` function for dependencies that use it internally
                banner: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
            },
            timeout: cdk.Duration.minutes(5),
            memorySize: 256,
            description: 'Processes PDF files uploaded to S3',
            environment: {
                BUCKET_NAME: this.bucket.bucketName,
                MONGO_URI_PARAM: '/mindMesh/mongoURI',
                GEMINI_API_KEY_PARAM: '/mindMesh/geminiAPIKey',
                CHUNK_SIZE: '60',
                OVERLAP: '10',
            },
        });



        // Grant Lambda permission to read and write to S3 bucket
        this.bucket.grantReadWrite(this.pdfProcessorLambda);

        // Grant Lambda permission to read SSM parameters
        this.pdfProcessorLambda.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'ssm:GetParameter',
                    'ssm:GetParameters',
                ],
                resources: [
                    `arn:aws:ssm:${this.region}:${this.account}:parameter/mindMesh/mongoURI`,
                    `arn:aws:ssm:${this.region}:${this.account}:parameter/mindMesh/geminiAPIKey`,
                ],
            })
        );

        // Grant KMS decrypt permission for SecureString parameters
        this.pdfProcessorLambda.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:Decrypt'],
                resources: ['*'],
            })
        );


        this.bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(this.pdfProcessorLambda),
            {
                prefix: 'pdf-documents/',
                suffix: '.pdf',
            }
        );
        console.log('--S3 event notification configured');


        new cdk.CfnOutput(this, 'BucketName', {
            value: this.bucket.bucketName,
            description: 'S3 Bucket name for documents',
        });

        new cdk.CfnOutput(this, 'LambdaFunctionName', {
            value: this.pdfProcessorLambda.functionName,
            description: 'PDF Processor Lambda function name',
        });

        new cdk.CfnOutput(this, 'LambdaFunctionArn', {
            value: this.pdfProcessorLambda.functionArn,
            description: 'PDF Processor Lambda function ARN',
        });
    }
}
