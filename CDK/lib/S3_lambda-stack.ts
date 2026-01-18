import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface S3LambdaStackProps extends cdk.StackProps {
    bucket: s3.IBucket;  // S3 bucket from S3Stack
}

export class S3LambdaStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: S3LambdaStackProps) {
        super(scope, id, props);

        // Create Lambda function for PDF processing
        const pdfProcessorLambda = new lambda.Function(this, 'PdfProcessorLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../lambdas/pdf-processor'),
            timeout: cdk.Duration.minutes(5),
            memorySize: 256,
            description: 'Processes PDF files uploaded to S3',
            environment: {
                S3_BUCKET_NAME: props.bucket.bucketName,
                AWS_REGION_NAME: this.region,
                // ✅ Pass parameter NAMES (not values)
                MONGO_URI: '/mindMesh/mongoURI',
                GEMINI_API_KEY: '/mindMesh/geminiAPIKey',
            },
        });

        // Grant Lambda permission to read from S3 bucket
        props.bucket.grantRead(pdfProcessorLambda);

        // ✅ Grant Lambda permission to read SSM parameters (correct way)
        pdfProcessorLambda.addToRolePolicy(
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

        // ✅ Grant KMS decrypt permission for SecureString parameters
        pdfProcessorLambda.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:Decrypt'],
                resources: ['*'], // Or specify your KMS key ARN
            })
        );

        // Add S3 event notification to trigger Lambda
        props.bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(pdfProcessorLambda),
            {
                prefix: 'pdf-documents/',  // Only trigger for files in this folder
                suffix: '.pdf',             // Only trigger for PDF files
            }
        );

        // Outputs
        new cdk.CfnOutput(this, 'LambdaFunctionName', {
            value: pdfProcessorLambda.functionName,
            description: 'PDF Processor Lambda function name',
        });

        new cdk.CfnOutput(this, 'LambdaFunctionArn', {
            value: pdfProcessorLambda.functionArn,
            description: 'PDF Processor Lambda function ARN',
        });
    }
}