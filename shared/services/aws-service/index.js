const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Shared AWS Service for app and Lambda functions
 * Provides full S3 functionality including upload, download, read, and signed URLs
 */
class AwsService {
  #region;
  #bucketName;
  #accessKeyId;
  #secretAccessKey;
  #s3Client;

  constructor() {
    this.#region = process.env.AWS_REGION;
    this.#bucketName = process.env.BUCKET_NAME;
    this.#accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.#secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.#s3Client = null;
  }

  /**
   * Ensures S3 client is initialized before use
   * Validates environment variables and creates client on first call
   * @private
   */
  #ensureInitialized() {
    
    if (this.#s3Client) 
      return;
    this.#region = process.env.AWS_REGION;
    this.#bucketName = process.env.BUCKET_NAME;
    this.#accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.#secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!this.#region || !this.#bucketName) 
      throw new Error('AWS_REGION and BUCKET_NAME environment variables are required');
    

    if (!this.#accessKeyId || !this.#secretAccessKey) 
      throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables are required');
    


    const clientConfig = {
      region: this.#region,
    };


    if (this.#accessKeyId && this.#secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: this.#accessKeyId,
        secretAccessKey: this.#secretAccessKey,
      };
    }

    this.#s3Client = new S3Client(clientConfig);
  }

  // Private methods
  #getFileKey(folder, fileName) {
    const cleanFolder = folder.replace(/\/$/, '');
    return `${cleanFolder}/${fileName}`;
  }

  // Public methods

  /**
   * Uploads a file to the S3 bucket.
   * @param {Object} params - The upload parameters.
   * @param {Buffer} params.fileBuffer - The file content buffer.
   * @param {string} params.folder - The folder path in the bucket.
   * @param {string} params.fileName - The name of the file.
   * @param {string} params.mimeType - The MIME type of the file.
   * @param {Object} [options={}] - Additional options.
   * @returns {Promise<void>}
   * @throws {Error} If required parameters are missing or upload fails.
   */
  async uploadFile(params = {}, options = {}) {
    this.#ensureInitialized();

    try {
      console.log('awsService::uploadFile started');

      const { fileBuffer, folder, fileName, mimeType } = params;

      if (!fileBuffer || !folder || !fileName || !mimeType) {
        throw new Error('Missing one or more of the AWS uploading params');
      }

      const key = this.#getFileKey(folder, fileName);

      const command = new PutObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.#s3Client.send(command);
      console.log(`File uploaded successfully: ${key}`);

      return;

    } catch (error) {
      console.error(`awsService::uploadFile Error:\n`, error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Reads a file from the S3 bucket and returns its content as a byte array.
   * @param {string} folder - The folder path in the bucket.
   * @param {string} fileName - The name of the file.
   * @returns {Promise<Uint8Array>} The file content.
   * @throws {Error} If parameters are missing or reading fails.
   */
  async readFile(folder, fileName) {
    this.#ensureInitialized();

    try {
      console.log('awsService::readFile started');

      if (!folder || !fileName) {
        throw new Error('Missing one or more of the AWS reading file params');
      }

      const key = this.#getFileKey(folder, fileName);

      const command = new GetObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
      });

      const response = await this.#s3Client.send(command);

      // Return the full object as byte array
      return await response.Body.transformToByteArray();

    } catch (error) {
      console.error(`awsService::readFile Error:\n`, error);
      throw new Error(`Failed to read file from S3: ${error.message}`);
    }
  }

  /**
   * Reads a file from the S3 bucket and returns it as a stream.
   * @param {string} folder - The folder path in the bucket.
   * @param {string} fileName - The name of the file.
   * @returns {Promise<ReadableStream>} The file content stream.
   * @throws {Error} If parameters are missing or getting stream fails.
   */
  async readFileStream(folder, fileName) {
    this.#ensureInitialized();

    try {
      console.log('awsService::readFileStream started');

      if (!folder || !fileName) {
        throw new Error('Missing one or more of the AWS reading file as a stream params');
      }

      const key = this.#getFileKey(folder, fileName);
      const command = new GetObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
      });

      const response = await this.#s3Client.send(command);

      // Return the file as a stream
      return response.Body;

    } catch (error) {
      console.error(`awsService::readFileStream Error:\n`, error);
      throw new Error(`Failed to get file stream from S3: ${error.message}`);
    }
  }

  /**
   * Downloads a file from S3 and returns it as a Buffer
   * @param {string} folder - The folder path in the bucket.
   * @param {string} fileName - The name of the file.
   * @returns {Promise<Buffer>} File buffer
   */
  async downloadFile(folder, fileName) {
    this.#ensureInitialized();

    try {
      const key = `${folder}/${fileName}`;
      
      const command = new GetObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
      });

      const response = await this.#s3Client.send(command);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);

    } catch (error) {
      console.error(`awsService::downloadFile Error for ${folder}/${fileName}:`, error);
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  }

  /**
   * Generates a signed URL for accessing a file in the S3 bucket.
   * @param {string} folder - The folder path in the bucket.
   * @param {string} fileName - The name of the file.
   * @param {Object} [options={}] - Options for the signed URL.
   * @param {number} [options.expiresIn=3600] - Expiration time in seconds.
   * @returns {Promise<string>} The signed URL.
   * @throws {Error} If parameters are missing or generating URL fails.
   */
  async getSignedUrl(folder, fileName, options = {}) {
    this.#ensureInitialized();

    try {
      console.log('awsService::getSignedUrl started');

      const { expiresIn = 3600 } = options;

      if (!folder || !fileName) {
        throw new Error('Missing one or more of the AWS getSignedUrl params');
      }

      const key = this.#getFileKey(folder, fileName);

      const command = new GetObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
      });

      return await getSignedUrl(this.#s3Client, command, { expiresIn });

    } catch (error) {
      console.error(`awsService::getSignedUrl:\n`, error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Generates a signed URL for uploading a file to the S3 bucket (PUT).
   * @param {string} folder - The folder path in the bucket.
   * @param {string} fileName - The name of the file.
   * @param {string} mimeType - The MIME type of the file.
   * @param {Object} [options={}] - Options for the signed URL.
   * @param {number} [options.expiresIn=3600] - Expiration time in seconds.
   * @returns {Promise<string>} The signed URL.
   */
  async getPutSignedUrl(folder, fileName, mimeType, options = {}) {
    this.#ensureInitialized();

    try {
      console.log('awsService::getPutSignedUrl started');
      const { expiresIn = 3600 } = options;

      if (!folder || !fileName || !mimeType) {
        throw new Error('Missing AWS getPutSignedUrl params');
      }

      const key = this.#getFileKey(folder, fileName);

      const command = new PutObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
        ContentType: mimeType,
      });

      return await getSignedUrl(this.#s3Client, command, { expiresIn });

    } catch (error) {
      console.error(`awsService::getPutSignedUrl:\n`, error);
      throw new Error(`Failed to generate PUT signed URL: ${error.message}`);
    }
  }
}

// Export singleton instance
const awsService = new AwsService();
module.exports = awsService;


