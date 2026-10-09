const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Ensure Cloudinary is configured
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
}

/**
 * Extracts public_id and resource_type from a Cloudinary URL.
 * e.g. https://res.cloudinary.com/cloud/image/upload/v12345/projenitor/filename.jpg
 * returns { resourceType: 'image', publicId: 'projenitor/filename' }
 */
function parseCloudinaryUrl(url) {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;

    try {
        const match = url.match(/\/([a-z]+)\/upload\/(?:v[0-9]+\/)?(.+)$/i);
        if (!match) return null;

        const resourceType = match[1]; // 'image', 'video', 'raw'
        const rest = match[2];

        // For images and videos, public_id excludes the extension
        // For raw documents (PDFs etc.), Cloudinary retains the extension in the public_id
        let publicId = rest;
        if (resourceType === 'image' || resourceType === 'video') {
            const lastDot = rest.lastIndexOf('.');
            if (lastDot !== -1) {
                publicId = rest.substring(0, lastDot);
            }
        }

        return { resourceType, publicId };
    } catch (err) {
        console.warn('Failed to parse Cloudinary URL:', url, err);
        return null;
    }
}

/**
 * Deletes a media file from Cloudinary (or local uploads directory if it's a local file).
 * Never throws; logs warning on failure so calling transactions do not break.
 */
async function deleteMediaFile(fileUrl) {
    if (!fileUrl || typeof fileUrl !== 'string') return;

    // 1. Cloudinary File
    const parsed = parseCloudinaryUrl(fileUrl);
    if (parsed && isCloudinaryConfigured) {
        try {
            console.log(`🗑️ Destroying Cloudinary asset: ${parsed.publicId} (${parsed.resourceType})`);
            const res = await cloudinary.uploader.destroy(parsed.publicId, {
                resource_type: parsed.resourceType
            });
            console.log(`Cloudinary destroy result for ${parsed.publicId}:`, res);
            return res;
        } catch (err) {
            console.error(`Failed to delete Cloudinary asset ${parsed.publicId}:`, err.message);
            return null;
        }
    }

    // 2. Local Disk File Fallback
    if (fileUrl.includes('/uploads/')) {
        try {
            const filename = fileUrl.split('/uploads/').pop();
            if (filename) {
                const localPath = path.join(__dirname, '../uploads', filename);
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                    console.log(`🗑️ Removed local disk file: ${filename}`);
                }
            }
        } catch (err) {
            console.warn(`Failed to unlink local file for ${fileUrl}:`, err.message);
        }
    }
}

/**
 * Deletes multiple media files in parallel.
 */
async function deleteMultipleMediaFiles(urls) {
    if (!Array.isArray(urls)) return;
    const validUrls = urls.filter(u => u && typeof u === 'string');
    if (validUrls.length === 0) return;

    await Promise.allSettled(validUrls.map(url => deleteMediaFile(url)));
}

module.exports = {
    parseCloudinaryUrl,
    deleteMediaFile,
    deleteMultipleMediaFiles
};
