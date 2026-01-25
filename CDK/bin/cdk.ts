#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PdfProcessingStack } from '../lib/pdfProcessing-stack';

const app = new cdk.App();

// PDF Processing Stack - S3 bucket + Lambda for PDF processing
new PdfProcessingStack(app, 'PdfProcessingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT ?? 'AI-project',
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
  },

  description: 'PDF Processing - S3 bucket and Lambda',
});
