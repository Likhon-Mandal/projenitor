const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique filename: timestamp + random + extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

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
            
            // Return the URL to access the file
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
            const isVideo = file.mimetype.startsWith('video/');
            const isPdf = file.mimetype === 'application/pdf' || (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
            
            res.json({ 
                message: 'File uploaded successfully',
                filePath: fileUrl,
                fileUrl: fileUrl,
                mediaType: isVideo ? 'video' : isPdf ? 'document' : 'photo',
                mimetype: file.mimetype,
                filename: file.filename,
                originalName: file.originalname
            });
        } catch (serverErr) {
            console.error('Server error during upload:', serverErr);
            res.status(500).json({ error: 'Server error during upload' });
        }
    });
});

module.exports = router;
