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