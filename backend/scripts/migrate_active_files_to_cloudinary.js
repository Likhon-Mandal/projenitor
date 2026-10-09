require('dotenv').config();
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { pool } = require('../config/db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadDir = path.join(__dirname, '../uploads');

const ACTIVE_FILES = [
  '1790686574630-678427489.jpg',
  '1790775416772-530844694.jpg',
  '1790923778568-153331674.png',
  '1790931196907-53830796.png',
  '1790931586303-239721067.png'
];

async function migrate() {
  console.log('🚀 Starting Cloudinary migration for 5 active database files...\n');

  const urlMap = {}; // oldFileName -> newCloudinaryUrl

  for (const filename of ACTIVE_FILES) {
    const fullPath = path.join(uploadDir, filename);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ File not found on disk: ${filename}`);
      continue;
    }

    const baseName = path.parse(filename).name;
    const isPdf = filename.toLowerCase().endsWith('.pdf');

    console.log(`📤 Uploading ${filename} to Cloudinary folder "projenitor"...`);
    try {
      const uploadResult = await cloudinary.uploader.upload(fullPath, {
        folder: 'projenitor',
        public_id: baseName,
        resource_type: isPdf ? 'raw' : 'image',
        overwrite: true
      });

      console.log(`✅ Uploaded: ${uploadResult.secure_url}`);
      urlMap[filename] = uploadResult.secure_url;
    } catch (uploadErr) {
      console.error(`❌ Upload failed for ${filename}:`, uploadErr);
      process.exit(1);
    }
  }

  console.log('\n🔄 Updating database records...');

  for (const [filename, newUrl] of Object.entries(urlMap)) {
    const pattern = `%${filename}%`;

    // 1. Members
    const mRes = await pool.query(
      `UPDATE members 
       SET profile_image_url = $1 
       WHERE profile_image_url LIKE $2 
       RETURNING id, name_bangla, name_english`,
      [newUrl, pattern]
    );
    if (mRes.rowCount > 0) {
      console.log(`  Updated members table (${mRes.rowCount} row(s)):`, mRes.rows.map(r => r.name_bangla || r.name_english));
    }

    // 2. Admin Users
    const aRes = await pool.query(
      `UPDATE admin_users 
       SET profile_image_url = $1 
       WHERE profile_image_url LIKE $2 
       RETURNING id, name, email`,
      [newUrl, pattern]
    );
    if (aRes.rowCount > 0) {
      console.log(`  Updated admin_users table (${aRes.rowCount} row(s)):`, aRes.rows.map(r => r.name || r.email));
    }

    // 3. Event Memories
    const emRes = await pool.query(
      `UPDATE event_memories 
       SET media_url = $1 
       WHERE media_url LIKE $2 
       RETURNING id, event_id`,
      [newUrl, pattern]
    );
    if (emRes.rowCount > 0) {
      console.log(`  Updated event_memories table (${emRes.rowCount} row(s)):`, emRes.rows.map(r => r.id));
    }

    // 4. Brilliant Student Requests (document_url)
    const bsRes = await pool.query(
      `UPDATE brilliant_student_requests 
       SET document_url = $1 
       WHERE document_url LIKE $2 
       RETURNING id, applicant_name`,
      [newUrl, pattern]
    );
    if (bsRes.rowCount > 0) {
      console.log(`  Updated brilliant_student_requests document_url (${bsRes.rowCount} row(s)):`, bsRes.rows.map(r => r.applicant_name));
    }
  }

  // 5. Brilliant Student Requests (documents JSONB array)
  const bsRows = await pool.query(`SELECT id, applicant_name, documents FROM brilliant_student_requests WHERE documents IS NOT NULL`);
  for (const row of bsRows.rows) {
    if (Array.isArray(row.documents)) {
      let changed = false;
      const updatedDocs = row.documents.map(doc => {
        if (doc && doc.url) {
          for (const [filename, newUrl] of Object.entries(urlMap)) {
            if (doc.url.includes(filename)) {
              changed = true;
              return { ...doc, url: newUrl };
            }
          }
        }
        return doc;
      });

      if (changed) {
        await pool.query(
          `UPDATE brilliant_student_requests 
           SET documents = $1 
           WHERE id = $2`,
          [JSON.stringify(updatedDocs), row.id]
        );
        console.log(`  Updated brilliant_student_requests documents array for student: ${row.applicant_name}`);
      }
    }
  }

  console.log('\n🎉 Migration complete! All 5 active files are now hosted on Cloudinary and DB records are updated.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
