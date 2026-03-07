import AWS from 'aws-sdk';

// Настройка S3 клиента для Railway Storage
const s3 = new AWS.S3({
  endpoint: process.env.ENDPOINT || '',
  accessKeyId: process.env.BUCKET_ACCESS_KEY || '',
  secretAccessKey: process.env.BUCKET_SECRET_KEY || '',
  region: process.env.REGION || 'auto',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const bucketName = process.env.IMGPROXY_BUCKET_NAME || '';

export async function uploadFileToBucket(file: Buffer, fileName: string, mimeType: string): Promise<string> {
  const key = `groups/${Date.now()}-${fileName}`;
  
  await s3.putObject({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: mimeType,
    ACL: 'public-read'
  }).promise();

  return key;
}

export async function deleteFileFromBucket(key: string): Promise<void> {
  await s3.deleteObject({
    Bucket: bucketName,
    Key: key
  }).promise();
}