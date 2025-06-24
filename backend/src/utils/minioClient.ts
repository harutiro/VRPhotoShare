import { Client as MinioClient } from 'minio';

export const MINIO_ROOT_USER = process.env.MINIO_ROOT_USER || 'minioadmin';
export const MINIO_ROOT_PASSWORD = process.env.MINIO_ROOT_PASSWORD || 'minioadmin123';
export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'vrphotoshare';
export const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'minio';
export const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
export const MINIO_USE_SSL = false;

export const minio = new MinioClient({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ROOT_USER,
  secretKey: MINIO_ROOT_PASSWORD,
}); 

// Initialize bucket if it doesn't exist
const initializeBucket = async () => {
  try {
    const bucketExists = await minio.bucketExists(MINIO_BUCKET);
    if (!bucketExists) {
      await minio.makeBucket(MINIO_BUCKET, 'us-east-1');
      console.log(`Bucket ${MINIO_BUCKET} created successfully`);
    } else {
      console.log(`Bucket ${MINIO_BUCKET} already exists`);
    }
  } catch (error) {
    console.error('Error initializing bucket:', error);
  }
};

// Initialize bucket on startup
initializeBucket();