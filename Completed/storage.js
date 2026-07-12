const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DRIVER = process.env.STORAGE_DRIVER || 'local'; // 'local' | 's3'

// ---------------------------------------------------------------------------
// Local disk driver — the default, zero-config option for dev. Does NOT
// survive redeploys or horizontal scaling on most hosts; switch to 's3'
// (below) before relying on this for anything real.
// ---------------------------------------------------------------------------
const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });

async function saveLocal(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
  await fs.promises.writeFile(path.join(LOCAL_UPLOAD_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}

// ---------------------------------------------------------------------------
// S3-compatible driver — works with AWS S3, Supabase Storage's S3 protocol,
// Cloudflare R2, or MinIO, since they all speak the same API. Set:
//   STORAGE_DRIVER=s3
//   S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
//   S3_ENDPOINT       (omit for real AWS; required for R2/Supabase/MinIO)
//   S3_PUBLIC_BASE_URL (e.g. a CDN domain or the bucket's public URL prefix)
// ---------------------------------------------------------------------------
let s3Client = null;
function getS3Client() {
  if (!s3Client) {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT), // needed for R2/MinIO/Supabase
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
      }
    });
  }
  return s3Client;
}

async function saveS3(file) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const ext = path.extname(file.originalname).toLowerCase();
  const key = `${crypto.randomBytes(16).toString('hex')}${ext}`;

  await getS3Client().send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }));

  const base = process.env.S3_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error('S3_PUBLIC_BASE_URL is not set — needed to build a URL callers can actually load.');
  }
  return `${base.replace(/\/$/, '')}/${key}`;
}

// ---------------------------------------------------------------------------
// Public API — routes/uploads.js and routes/serviceProviders.js only ever
// call this, never the driver-specific functions above directly.
// ---------------------------------------------------------------------------
async function saveFile(file) {
  if (DRIVER === 's3') {
    if (!process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      throw new Error('STORAGE_DRIVER=s3 but S3_BUCKET/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY are not all set.');
    }
    return saveS3(file);
  }
  return saveLocal(file);
}

module.exports = { saveFile, DRIVER, LOCAL_UPLOAD_DIR };