import * as cdk from 'aws-cdk-lib/core';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  public readonly bucket: s3.IBucket;  // Export for Lambda stack

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Configuration
    const bucketName = 'ai-learning-expressjs';
    const createNewBucket = this.node.tryGetContext('createBucket') === 'true';

    if (createNewBucket) {
      // Create new bucket with CORS configuration
      this.bucket = new s3.Bucket(this, 'AILearningBucket', {
        bucketName: bucketName,
        cors: [
          {
            allowedHeaders: ['*'],
            allowedMethods: [
              s3.HttpMethods.GET,
              s3.HttpMethods.PUT,
              s3.HttpMethods.POST,
              s3.HttpMethods.HEAD,
            ],
            allowedOrigins: [
              'http://localhost:5173',
              'http://localhost:3000'
            ],
            exposedHeaders: [],
            maxAge: 3000,
          },
        ],
        versioned: false,
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });

      console.log('✅ Created new S3 bucket with CORS policy');
    } else {
      // Import existing bucket (read-only reference)
      this.bucket = s3.Bucket.fromBucketName(this, 'AILearningBucket', bucketName);

      console.log('✅ Bucket already exists - imported successfully');
      console.log('⚠️  CORS policy must be configured manually in AWS Console');
    }

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket name',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'S3 Bucket ARN',
    });

    new cdk.CfnOutput(this, 'BucketStatus', {
      value: createNewBucket ? 'Created with CORS' : 'Imported (existing)',
      description: 'Bucket creation status',
    });
  }
}
