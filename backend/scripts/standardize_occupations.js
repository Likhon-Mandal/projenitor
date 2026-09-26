/**
 * Script to standardize existing member occupations to the dual "বাংলা / English" format.
 *
 * Usage:
 *   Dry-run (preview only):
 *     node -r dotenv/config scripts/standardize_occupations.js
 *
 *   Apply updates to database:
 *     node -r dotenv/config scripts/standardize_occupations.js --apply
 */

const { pool } = require('../config/db');

const STANDARDIZATION_MAP = {
  // English single-words
  'farmer': 'কৃষক / Farmer',
  'teacher': 'শিক্ষক / Teacher',
  'teacher (retired)': 'অবসরপ্রাপ্ত শিক্ষক / Retired Teacher',
  'doctor': 'ডাক্তার / Doctor',
  'engineer': 'প্রকৌশলী / Engineer',
  'lawyer': 'আইনজীবী / Lawyer',
  'banker': 'ব্যাংকার / Banker',
  'merchant': 'ব্যবসায়ী / Merchant',
  'pilot': 'পাইলট / Pilot',
  'nurse': 'নার্স / Nurse',
  'civil servant': 'সরকারি চাকরিজীবী / Civil Servant',
  'scientist': 'বিজ্ঞানী / Scientist',
  'carpenter': 'ছুতার / কাঠমিস্ত্রী / Carpenter',
  'artist': 'শিল্পী / Artist',
  'soldier': 'সেনাবাহিনী / Soldier',
  'police inspector': 'পুলিশ কর্মকর্তা / Police Officer',
  'student': 'ছাত্র / ছাত্রী / Student',

  // Bangla single-words
  'কৃষক': 'কৃষক / Farmer',
  'শিক্ষক': 'শিক্ষক / Teacher',
  'ব্যবসায়ী': 'ব্যবসায়ী / Businessman',
  'ব্যবসায়ী': 'ব্যবসায়ী / Businessman',
  'ব্যবসায়ী (প্রাক্তন মেম্বার)': 'ব্যবসায়ী / Businessman (Ex-Member)',
  'ইঞ্জিনিয়ার': 'প্রকৌশলী / Engineer',
  'ডিপ্লোমা ইঞ্জিনিয়ার': 'ডিপ্লোমা প্রকৌশলী / Diploma Engineer',
  'ব্যাংক কর্মকর্তা': 'ব্যাংকার / Banker',
  'ব্যাংক  কর্মকর্তা': 'ব্যাংকার / Banker',
  'ছাত্র': 'ছাত্র / ছাত্রী / Student',
  'প্রবাসী': 'প্রবাসী / Expatriate',
  'ফায়ার সার্ভিস': 'ফায়ার সার্ভিস কর্মী / Fire Fighter',
  'সংস্থা কর্মী': 'সংস্থা কর্মী / NGO Worker',
  'চাকুরীজীবী': 'চাকরিজীবী / Service Holder',
  'বেসরকারী চাকুরীজীবী': 'বেসরকারি চাকরিজীবী / Private Service',
  'বেসরকারি চাকুরীজীবি': 'বেসরকারি চাকরিজীবী / Private Service',
  'সেনাবাহিনী': 'সেনাবাহিনী / Soldier',
  'কাঠমিস্ত্রী': 'ছুতার / কাঠমিস্ত্রী / Carpenter',
  'তসিলদার': 'তহশিলদার / Revenue Officer (Tahsildar)',

  // Meaningless / test occupations replaced with meaningful existing occupations
  'hh': 'গৃহিণী / Homemaker',
  'ee': 'ব্যবসায়ী / Businessman',
  'ttutu': 'কৃষক / Farmer',
  'shs shs': 'শিক্ষক / Teacher',
  'we': 'বেসরকারি চাকরিজীবী / Private Service',
};

async function run() {
  const isApply = process.argv.includes('--apply');
  console.log('='.repeat(65));
  console.log(`Occupation Standardization Script (${isApply ? 'APPLY MODE' : 'DRY RUN'})`);
  console.log('='.repeat(65));

  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, full_name, name_bangla, occupation 
       FROM members 
       WHERE occupation IS NOT NULL AND TRIM(occupation) != '' 
       ORDER BY id ASC`
    );

    const members = res.rows;
    console.log(`Found ${members.length} members with an occupation assigned.\n`);

    let toUpdate = [];
    let alreadyStandard = 0;
    let unmapped = [];

    for (const m of members) {
      const current = m.occupation.trim();
      const lower = current.toLowerCase();

      // Check if already in "বাংলা / English" format
      if (current.includes('/') && /[\u0980-\u09FF]/.test(current) && /[a-zA-Z]/.test(current)) {
        alreadyStandard++;
        continue;
      }

      const standard = STANDARDIZATION_MAP[lower] || STANDARDIZATION_MAP[current];
      if (standard) {
        toUpdate.push({
          id: m.id,
          name: m.name_bangla || m.full_name,
          oldOccupation: current,
          newOccupation: standard
        });
      } else {
        unmapped.push({
          id: m.id,
          name: m.name_bangla || m.full_name,
          occupation: current
        });
      }
    }

    console.log(`Status Summary:`);
    console.log(`  - Already in bilingual format: ${alreadyStandard}`);
    console.log(`  - Can be upgraded to standard: ${toUpdate.length}`);
    console.log(`  - Custom/unmapped values:       ${unmapped.length}`);
    console.log('');

    if (toUpdate.length > 0) {
      console.log('Sample upgrades:');
      toUpdate.slice(0, 10).forEach(u => {
        console.log(`  [ID ${u.id}] ${u.name}: "${u.oldOccupation}" -> "${u.newOccupation}"`);
      });
      if (toUpdate.length > 10) {
        console.log(`  ... and ${toUpdate.length - 10} more.`);
      }
      console.log('');
    }

    if (unmapped.length > 0) {
      console.log('Custom/unmapped entries left untouched:');
      const uniqueUnmapped = [...new Set(unmapped.map(u => u.occupation))];
      console.log(`  ${uniqueUnmapped.join(', ')}\n`);
    }

    if (isApply) {
      console.log(`Applying ${toUpdate.length} updates...`);
      await client.query('BEGIN');
      for (const item of toUpdate) {
        await client.query('UPDATE members SET occupation = $1 WHERE id = $2', [item.newOccupation, item.id]);
      }
      await client.query('COMMIT');
      console.log(`Successfully updated ${toUpdate.length} members to standard bilingual occupations!`);
    } else {
      console.log('DRY RUN complete. No changes were made.');
      console.log('To apply these changes, run with: --apply');
    }
  } catch (err) {
    if (isApply) await client.query('ROLLBACK');
    console.error('Error during execution:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
