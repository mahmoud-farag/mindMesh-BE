#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { S3Stack } from '../lib/s3-stack';
import { S3LambdaStack } from '../lib/S3_lambda-stack';

const app = new cdk.App();

// Deploy S3 Stack first
const s3Stack = new S3Stack(app, 'S3Stack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

// Deploy Lambda Stack with reference to S3 bucket
new S3LambdaStack(app, 'S3LambdaStack', {
  bucket: s3Stack.bucket,  // Cross-stack reference
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
