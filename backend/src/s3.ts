import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';

function getS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT_URL;
  if (endpoint) {
    return new S3Client({
      endpoint,
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
      forcePathStyle: true,
    });
  }
  return new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
}

const BUCKET = () => process.env.S3_BUCKET_NAME!;

export async function uploadToS3(localPath: string, s3Key: string, mimeType: string): Promise<string> {
  const body = fs.readFileSync(localPath);
  await getS3Client().send(new PutObjectCommand({
    Bucket: BUCKET(),
    Key: s3Key,
    Body: body,
    ContentType: mimeType,
  }));
  return s3Key;
}

export async function generatePresignedUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET(), Key: s3Key });
  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
}

export async function ensureBucket(): Promise<void> {
  const client = getS3Client();
  const bucket = BUCKET();
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`[S3] Created bucket: ${bucket}`);
  }
}
