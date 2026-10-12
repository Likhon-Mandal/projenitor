const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Ensure local upload directory exists as fallback (safe for serverless read-only filesystems)
const uploadDir = path.join(__dirname, '../uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
} catch (e) {
    // Read-only filesystem in serverless (e.g. Vercel)
}

// Check if Cloudinary is configured
const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('☁️ Cloudinary storage configured successfully.');
} else {
    console.log('📁 Cloudinary credentials not detected; using local disk storage fallback.');
}

// Storage Configuration
let storage;
if (isCloudinaryConfigured) {
    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            const isPdf = file.mimetype === 'application/pdf' || (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
            const isVideo = file.mimetype.startsWith('video/');
            const isImage = !isPdf && !isVideo;
            const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);

            const uploadParams = {
                folder: 'projenitor',
                resource_type: isPdf ? 'raw' : (isVideo ? 'video' : 'image'),
                public_id: uniqueName,
            };

            if (isPdf) {
                uploadParams.format = 'pdf';
            } else if (isImage) {
                // Intelligent compression: limits max dimensions to 2048px (downscaling huge raw photos)
                // and applies auto:good quality to slash file size by 70-85% while keeping visual fidelity crisp
                uploadParams.transformation = [
                    { width: 2048, height: 2048, crop: 'limit' },
                    { quality: 'auto:good' }
                ];
            }

            return uploadParams;
        }
    });
} else {
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
}

// Filter for images, videos, and PDF documents
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/pdf' ||
        (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'))
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type! Only image, video, and PDF files are supported.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit to accommodate short videos and documents
    },
    fileFilter: fileFilter
});

// Route: GET /api/upload/status (Check if Cloudinary or local storage is active)
router.get('/status', (req, res) => {
    res.json({
        storage: isCloudinaryConfigured ? 'cloudinary' : 'local_disk',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? `${process.env.CLOUDINARY_CLOUD_NAME.slice(0, 3)}***` : null
    });
});

// Route: POST /api/upload
router.post('/', (req, res) => {
    upload.any()(req, res, (err) => {
        if (err) {
            console.error('Upload multer error:', err);
            return res.status(400).json({ error: err.message || 'Error processing uploaded file' });
        }
        try {
            const file = req.files && req.files.length > 0 ? req.files[0] : req.file;
            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // 5MB limit enforcement for profile pictures
            const isProfilePic = req.body?.category === 'profile' || file.fieldname === 'image';
            const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
            if (isProfilePic && file.size > MAX_PROFILE_IMAGE_SIZE) {
                if (file.path && fs.existsSync(file.path)) {
                    try { fs.unlinkSync(file.path); } catch (unlinkErr) { console.error('Failed to unlink oversized file:', unlinkErr); }
                }
                return res.status(400).json({
                    error: 'Profile picture size must not exceed 5MB. / প্রোফাইল ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারে।'
                });
            }

            // Return URL: Cloudinary URL if available, else local server URL
            const isCloudinaryUrl = file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'));
            let fileUrl = isCloudinaryUrl
                ? file.path
                : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

            const isVideo = file.mimetype.startsWith('video/');
            const isPdf = file.mimetype === 'application/pdf' || (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));

            // Deliver Cloudinary images with auto-format (WebP/AVIF) and perceptual auto-quality
            if (isCloudinaryUrl && !isVideo && !isPdf && fileUrl.includes('/upload/') && !fileUrl.includes('/upload/f_auto,q_auto/')) {
                fileUrl = fileUrl.replace('/upload/', '/upload/f_auto,q_auto/');
            }

            res.json({
                message: 'File uploaded successfully',
                filePath: fileUrl,
                fileUrl: fileUrl,
                mediaType: isVideo ? 'video' : isPdf ? 'document' : 'photo',
                mimetype: file.mimetype,
                filename: file.filename || file.originalname,
                originalName: file.originalname,
                storage: isCloudinaryUrl ? 'cloudinary' : 'local'
            });
        } catch (serverErr) {
            console.error('Server error during upload:', serverErr);
            res.status(500).json({ error: 'Server error during upload' });
        }
    });
});

module.exports = router;
