import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { customErrors } from '../utils/index.js';


const { InternalServerError, BadRequestError, CustomError } = customErrors;



class AwsService {

  #region;
  #bucketName;
  #accessKeyId;
  #secretAccessKey;
  #s3Client;

  constructor() {

    // 1. Validation: Ensure ENV vars exist on startup
    if (!process.env?.AWS_REGION || !process.env?.AWS_BUCKET_NAME || !process.env?.AWS_ACCESS_KEY_ID || !process.env?.AWS_SECRET_ACCESS_KEY) {
      throw new InternalServerError(`One or more of the AWS creds is missing`);
    }

    this.#region = process.env.AWS_REGION;
    this.#bucketName = process.env.AWS_BUCKET_NAME;
    this.#accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.#secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;


    this.#s3Client = new S3Client({
      region: this.#region,
      credentials: {
        accessKeyId: this.#accessKeyId,
        secretAccessKey: this.#secretAccessKey,
      },
    });
  }

  //Private methods
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
   * @throws {BadRequestError} If required parameters are missing.
   * @throws {InternalServerError} If the upload fails.
   */
  async uploadFile(params = {}, options = {}) {
    try {

      console.log('aws::uploadFile started');

      const { fileBuffer, folder, fileName, mimeType } = params;

      if (!fileBuffer || !folder || !fileName || !mimeType)
        throw new BadRequestError('Missing one or more of the AWS uploading params');;

      const key = this.#getFileKey(folder, fileName);

      const command = new PutObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.#s3Client.send(command);

      return;

    } catch (error) {

      console.error(`aws::uploadFile  Error:\n`, error);

      if (error instanceof CustomError)
        throw error
      else
        throw new InternalServerError('Failed to upload file to S3');

    }
  }


  /**
   * Reads a file from the S3 bucket and returns its content as a byte array.
   * @param {string} folder - The folder path in the bucket.
   * @param {string} fileName - The name of the file.
   * @returns {Promise<Uint8Array>} The file content.
   * @throws {BadRequestError} If parameters are missing.
   * @throws {InternalServerError} If reading the file fails.
   */
  async readFile(folder, fileName) {
    try {

      console.log('aws::readFile started');

      if (!folder || !fileName)
        throw new BadRequestError('Missing one or more of the AWS reading file params');;


      const key = this.#getFileKey(folder, fileName);

      const command = new GetObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
      });

      const response = await this.#s3Client.send(command);

      // i need the full object not a file streamer
      return await response.Body.transformToByteArray();

    } catch (error) {

      console.error(`aws::readFile Error:\n`, error);

      if (error instanceof CustomError)
        throw error
      else
        throw new InternalServerError('Failed to read file from S3');
    }
  }

  /**
   * Reads a file from the S3 bucket and returns it as a stream.
   * @param {string} folder - The folder path in the bucket.
   * @param {string} fileName - The name of the file.
   * @returns {Promise<ReadableStream>} The file content stream.
   * @throws {BadRequestError} If parameters are missing.
   * @throws {InternalServerError} If getting the stream fails.
   */
  async readFileStream(folder, fileName) {
    try {
      console.log('aws::readFileStream started');

      if (!folder || !fileName)
        throw new BadRequestError('Missing one or more of the AWS readingfile as a stream params');;

      const key = this.#getFileKey(folder, fileName);
      const command = new GetObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
      });

      const response = await this.#s3Client.send(command);

      // return the file as a stream;
      return response.Body;

    } catch (error) {

      console.error(`aws::readFileStream Error:\n`, error);

      if (error instanceof CustomError)
        throw error
      else
        throw new InternalServerError('Failed to get file stream from S3');

    }
  }



  /**
   * Generates a signed URL for accessing a file in the S3 bucket.
   * @param {string} folder - The folder path in the bucket.
   * @param {string} fileName - The name of the file.
   * @param {Object} [options={}] - Options for the signed URL.
   * @param {number} [options.expiresIn=3600] - Expiration time in seconds.
   * @returns {Promise<string>} The signed URL.
   * @throws {BadRequestError} If parameters are missing.
   * @throws {InternalServerError} If generating the URL fails.
   */
  async getSignedUrl(folder, fileName, options = {}) {
    try {

      console.log('aws::getSignedUrl started');

      const { expiresIn = 3600 } = options;

      if (!folder || !fileName)
        throw new BadRequestError('Missing one or more of the AWS getSignedUrl params');;


      const key = this.#getFileKey(folder, fileName);

      const command = new GetObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
      });

      return await getSignedUrl(this.#s3Client, command, { expiresIn });

    } catch (error) {

      console.error(`aws::getSignedUrl:\n`, error);

      if (error instanceof CustomError)
        throw error
      else
        throw new InternalServerError('Failed to generate signed URL');
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
    try {
      console.log('aws::getPutSignedUrl started');
      const { expiresIn = 3600 } = options;

      if (!folder || !fileName || !mimeType)
        throw new BadRequestError('Missing AWS getPutSignedUrl params');

      const key = this.#getFileKey(folder, fileName);

      const command = new PutObjectCommand({
        Bucket: this.#bucketName,
        Key: key,
        ContentType: mimeType,
      });

      return await getSignedUrl(this.#s3Client, command, { expiresIn });

    } catch (error) {
      console.error(`aws::getPutSignedUrl:\n`, error);
      if (error instanceof CustomError) throw error;
      else throw new InternalServerError('Failed to generate PUT signed URL');
    }
  }

}


const awsService = new AwsService();

export default awsService;








































