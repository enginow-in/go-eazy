const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

/**
 * Local-disk storage for dev. On a real deployment, swap this whole file
 * for an S3 (or Supabase Storage) upload: accept the file into memory
 * (multer.memoryStorage()) and pipe it to the bucket in the route handler
 * instead of writing to disk — local files don't survive most hosts'
 * ephemeral filesystems or horizontal scaling.
 */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 7 * 1024 * 1024; // 7MB, matching the product's stated limit
const MAX_FILES = 3; // 1-3 photos per listing, matching the product's stated limit

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${unique}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, or WebP images are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES }
});

module.exports = { upload, UPLOAD_DIR, MAX_FILES, MAX_FILE_BYTES };