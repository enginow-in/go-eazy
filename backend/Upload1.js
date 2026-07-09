const express = require('express');
const { requireAuth } = require('./auth');
const { upload, MAX_FILES, MAX_FILE_BYTES } = require('../middleware/upload');

const router = express.Router();

// POST /api/uploads — multipart/form-data, field name "photos" (1-3 files).
// Returns public URLs to attach to a property's `photos` array on create.
router.post('/', requireAuth, (req, res) => {
  if (req.user.role !== 'landlord') {
    return res.status(403).json({ error: 'Only landlord accounts can upload listing photos.' });
  }

  upload.array('photos', MAX_FILES)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `Each photo must be under ${MAX_FILE_BYTES / (1024 * 1024)}MB.` });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: `Upload at most ${MAX_FILES} photos.` });
      }
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Attach at least one photo (field name "photos").' });
    }

    const urls = req.files.map(f => `/uploads/${f.filename}`);
    res.status(201).json({ urls });
  });
});

module.exports = router;