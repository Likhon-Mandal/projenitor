/**
 * Demo data for local testing — বাড়ৈ বংশের ইতিবৃত্ত
 *
 *   node scripts/seed_demo_data.js
 *
 * Wipes and refills the LOCAL database with realistic, clearly-fictional data:
 *   • locations (country → division → district → upazila → village → home)
 *   • a 7-generation family tree descending from ভগবান চন্দ্র বাড়ৈ,
 *     with spouses, birth/death dates, occupations, blood groups …
 *   • committees, eminent figures, events, notices, help requests,
 *     sammelans (gatherings), history chapters, student requests
 *   • demo login accounts (see DEMO_ACCOUNTS below)
 *
 * The admin_users super-admin created by seedSuperAdmin.js is left untouched.
 * Refuses to run unless DB_HOST is a local host, so it can never wipe a cloud DB.
 * Output is deterministic (seeded random), so every run produces the same data.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');
const bcrypt = require('bcrypt');

// ── Safety: local databases only ──────────────────────────────────────────────
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'host.docker.internal'];
if (!LOCAL_HOSTS.includes(String(process.env.DB_HOST || '').toLowerCase()) || process.env.DATABASE_URL) {
  console.error('Refusing to run: demo seeding is only allowed against a local database (DB_HOST=localhost, no DATABASE_URL).');
  process.exit(1);
}

// ── Demo login accounts (local testing only) ─────────────────────────────────
const DEMO_PASSWORD = 'Demo@12345';
const DEMO_ACCOUNTS = {
  member: { email: 'demo.member@example.com', mobile: '01700000001' },     // active member account
  pending: { email: 'demo.pending@example.com', mobile: '01700000002' },   // awaiting approval
  admin: { email: 'demo.admin@example.com', name: 'ডেমো এডমিন', name_en: 'Demo Admin' }, // admin_users (role admin)
};

// ── Deterministic random ─────────────────────────────────────────────────────
let seed = 20261119;
const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => a + Math.floor(rand() * (b - a + 1));
const chance = (p) => rand() < p;
const isoDate = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).replace(/\d/g, (d) => BN_DIGITS[d]);

// ── Names [Bangla, English] ──────────────────────────────────────────────────
const MALE = [
  ['হরিপদ', 'Haripada'], ['গোপাল', 'Gopal'], ['নিত্যানন্দ', 'Nityananda'], ['রাধাকান্ত', 'Radhakanta'], ['কৃষ্ণপদ', 'Krishnapada'],
  ['শ্যামল', 'Shyamal'], ['বিমল', 'Bimal'], ['নির্মল', 'Nirmal'], ['অমল', 'Amal'], ['সুধীর', 'Sudhir'],
  ['প্রফুল্ল', 'Prafulla'], ['জগদীশ', 'Jagadish'], ['মনোরঞ্জন', 'Manoranjan'], ['নারায়ণ', 'Narayan'], ['গৌরাঙ্গ', 'Gouranga'],
  ['বিনয়', 'Binoy'], ['সুনীল', 'Sunil'], ['অনিল', 'Anil'], ['দিলীপ', 'Dilip'], ['প্রদীপ', 'Pradip'],
  ['তপন', 'Tapan'], ['স্বপন', 'Swapan'], ['উত্তম', 'Uttam'], ['অসীম', 'Asim'], ['সুব্রত', 'Subrata'],
  ['দেবাশীষ', 'Debashish'], ['পার্থ', 'Partha'], ['সঞ্জয়', 'Sanjoy'], ['বিকাশ', 'Bikash'], ['রতন', 'Ratan'],
  ['শংকর', 'Shankar'], ['মৃণাল', 'Mrinal'], ['অরুণ', 'Arun'], ['তরুণ', 'Tarun'], ['কমল', 'Kamal'],
  ['অর্ণব', 'Arnab'], ['সৌরভ', 'Sourav'], ['অনিক', 'Anik'], ['রাহুল', 'Rahul'], ['তন্ময়', 'Tanmoy'],
  ['প্রিয়াংকর', 'Priyankar'], ['শুভজিৎ', 'Subhajit'], ['অভিজিৎ', 'Avijit'], ['সাগর', 'Sagar'], ['আকাশ', 'Akash'],
  ['লিখন', 'Likhon'], ['জয়ন্ত', 'Joyanta'], ['দীপঙ্কর', 'Dipankar'], ['হৃদয়', 'Hridoy'], ['অনুপম', 'Anupam'],
];
const FEMALE = [
  ['লক্ষ্মী', 'Lakshmi'], ['সরস্বতী', 'Saraswati'], ['দুর্গা', 'Durga'], ['কমলা', 'Kamala'], ['পার্বতী', 'Parboti'],
  ['সন্ধ্যা', 'Sandhya'], ['গীতা', 'Gita'], ['মীরা', 'Mira'], ['শান্তি', 'Shanti'], ['অঞ্জলি', 'Anjali'],
  ['বাসন্তী', 'Basanti'], ['নমিতা', 'Namita'], ['সুমিত্রা', 'Sumitra'], ['রেবা', 'Reba'], ['শিখা', 'Shikha'],
  ['মিতালী', 'Mitali'], ['দীপালি', 'Dipali'], ['পূর্ণিমা', 'Purnima'], ['চম্পা', 'Champa'], ['রত্না', 'Ratna'],
  ['সোমা', 'Soma'], ['শম্পা', 'Shampa'], ['তুম্পা', 'Tumpa'], ['মৌসুমী', 'Mousumi'], ['প্রিয়াঙ্কা', 'Priyanka'],
  ['অদিতি', 'Aditi'], ['ঐশী', 'Oishi'], ['তৃষা', 'Trisha'], ['দেবশ্রী', 'Debashree'], ['শ্রেয়া', 'Shreya'],
  ['অন্বেষা', 'Anwesha'], ['ঋতু', 'Ritu'], ['স্নেহা', 'Sneha'], ['পূজা', 'Puja'], ['বর্ণা', 'Borna'],
];
const IN_LAW_SURNAMES = [['মণ্ডল', 'Mondal'], ['বিশ্বাস', 'Biswas'], ['হালদার', 'Halder'], ['রায়', 'Roy'], ['গাইন', 'Gain'],
  ['সরকার', 'Sarkar'], ['মজুমদার', 'Majumder'], ['বালা', 'Bala'], ['মিস্ত্রী', 'Mistry'], ['ঢালী', 'Dhali']];
const SURNAME = ['বাড়ৈ', 'Barai'];

// ── Locations (Bangla, English) ──────────────────────────────────────────────
const GEO = [
  { div: ['ঢাকা', 'Dhaka'], districts: [
    { name: ['মাদারীপুর', 'Madaripur'], upazilas: [
      { name: ['কালকিনি', 'Kalkini'], villages: [['এনায়েতনগর', 'Enayetnagar'], ['সাহেবরামপুর', 'Sahebrampur']] },
      { name: ['রাজৈর', 'Rajoir'], villages: [['কদমবাড়ি', 'Kadambari'], ['খালিয়া', 'Khalia']] },
    ] },
    { name: ['গোপালগঞ্জ', 'Gopalganj'], upazilas: [
      { name: ['কোটালীপাড়া', 'Kotalipara'], villages: [['রামশীল', 'Ramshil'], ['কান্দি', 'Kandi']] },
      { name: ['মুকসুদপুর', 'Muksudpur'], villages: [['বাটিকামারী', 'Batikamari']] },
    ] },
  ] },
  { div: ['বরিশাল', 'Barishal'], districts: [
    { name: ['বরিশাল', 'Barishal'], upazilas: [
      { name: ['আগৈলঝাড়া', 'Agailjhara'], villages: [['গৈলা', 'Gaila'], ['রাজিহার', 'Rajihar']] },
      { name: ['উজিরপুর', 'Wazirpur'], villages: [['সাতলা', 'Satla']] },
    ] },
    { name: ['পিরোজপুর', 'Pirojpur'], upazilas: [
      { name: ['নাজিরপুর', 'Nazirpur'], villages: [['মাটিভাঙ্গা', 'Matibhanga']] },
    ] },
  ] },
];
const HOME_NAMES = ['বড় বাড়ি', 'মাঝের বাড়ি', 'উত্তর বাড়ি', 'দক্ষিণ বাড়ি', 'পূর্ব বাড়ি', 'ঠাকুর বাড়ি', 'পুকুরপাড় বাড়ি', 'তালতলা বাড়ি'];

const OCC_ELDER_M = ['Farmer', 'Teacher', 'Merchant', 'Businessman', 'Farmer', 'Civil Servant'];
const OCC_ADULT_M = ['Teacher', 'Businessman', 'Civil Servant', 'Private Service', 'Doctor', 'Engineer', 'Banker', 'Lawyer', 'Expatriate', 'Farmer', 'Software Developer', 'Police Officer', 'Journalist', 'Accountant', 'NGO Worker'];
const OCC_ADULT_F = ['Housewife', 'Housewife', 'Housewife', 'Teacher', 'Nurse', 'Doctor', 'Banker', 'Private Service', 'Civil Servant'];
const WORKPLACES = ['ঢাকা বিশ্ববিদ্যালয়', 'সোনালী ব্যাংক, মাদারীপুর শাখা', 'গৈলা উচ্চ বিদ্যালয়', 'শের-ই-বাংলা মেডিকেল কলেজ হাসপাতাল', 'বাংলাদেশ সচিবালয়', 'গ্রামীণফোন লিমিটেড', 'কোটালীপাড়া উপজেলা পরিষদ', 'জেলা জজ আদালত, বরিশাল', 'রূপালী ব্যাংক, গোপালগঞ্জ', 'ব্র্যাক', 'বসুন্ধরা গ্রুপ', 'দুবাই, সংযুক্ত আরব আমিরাত'];
const EDU = { old: ['প্রাথমিক', 'অষ্টম শ্রেণি', 'এসএসসি', null], mid: ['এসএসসি', 'এইচএসসি', 'বিএ', 'বিএসসি', 'বিকম', 'এমএ'], young: ['এইচএসসি', 'বিএসসি (ইঞ্জিনিয়ারিং)', 'এমবিবিএস', 'এমএসসি', 'বিবিএ', 'এমবিএ', 'এলএলবি'], kid: ['প্রাথমিক', 'অষ্টম শ্রেণি', 'এসএসসি পরীক্ষার্থী'] };
const BLOOD = ['A+', 'A+', 'B+', 'B+', 'B+', 'O+', 'O+', 'O+', 'AB+', 'A-', 'B-', 'O-'];

const GEN_BIRTH = { 1: 1858, 2: 1885, 3: 1912, 4: 1940, 5: 1966, 6: 1992, 7: 2014 };
const MAX_GEN = 7;
const TODAY = new Date('2026-11-19');

async function main() {
  const db = new Client({
    user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT),
  });
  await db.connect();
  const q = (text, params) => db.query(text, params);
  const one = async (text, params) => (await q(text, params)).rows[0];

  try {
    await q('BEGIN');
    console.log('Clearing existing data…');
    await q(`TRUNCATE brilliant_student_requests, event_memories, events, notices, help_requests, eminent_figures,
             committee_members, committees, sammelans, history_records, admin_requests, users, member_spouses, members,
             homes, villages, upazilas, districts, divisions, countries RESTART IDENTITY CASCADE`);
    await q('DELETE FROM admin_users WHERE email = $1', [DEMO_ACCOUNTS.admin.email]);

    // ── Locations ────────────────────────────────────────────────────────────
    const country = await one('INSERT INTO countries (name) VALUES ($1) RETURNING id', ['বাংলাদেশ']);
    const homes = []; // { id, name, village, villageEn, upazila, district, ids… }
    for (const d of GEO) {
      const div = await one('INSERT INTO divisions (name, country_id) VALUES ($1,$2) RETURNING id', [d.div[0], country.id]);
      for (const dist of d.districts) {
        const di = await one('INSERT INTO districts (name, division_id) VALUES ($1,$2) RETURNING id', [dist.name[0], div.id]);
        for (const up of dist.upazilas) {
          const u = await one('INSERT INTO upazilas (name, district_id) VALUES ($1,$2) RETURNING id', [up.name[0], di.id]);
          for (const vil of up.villages) {
            const v = await one('INSERT INTO villages (name, upazila_id) VALUES ($1,$2) RETURNING id', [vil[0], u.id]);
            const nHomes = between(2, 3);
            const names = [...HOME_NAMES].sort(() => rand() - 0.5).slice(0, nHomes);
            for (const hn of names) {
              const mapLink = `https://maps.google.com/?q=${encodeURIComponent(`${vil[1]}, ${up.name[1]}, ${dist.name[1]}, Bangladesh`)}`;
              const h = await one('INSERT INTO homes (name, village_id, map_link) VALUES ($1,$2,$3) RETURNING id', [hn, v.id, mapLink]);
              homes.push({ id: h.id, name: hn, village: vil[0], upazila: up.name[0], district: dist.name[0],
                country_id: country.id, division_id: div.id, district_id: di.id, upazila_id: u.id, village_id: v.id });
            }
          }
        }
      }
    }
    console.log(`  ${homes.length} homes across ${GEO.reduce((n, d) => n + d.districts.length, 0)} districts`);

    // ── Family tree ──────────────────────────────────────────────────────────
    const all = [];
    const usedNames = new Set();
    const uniqueName = (pool) => {
      for (let i = 0; i < 20; i++) { const n = pick(pool); if (!usedNames.has(n[0]) || i === 19) { usedNames.add(n[0]); return n; } }
      return pick(pool);
    };

    const lifeFor = (gen, gender) => {
      const by = GEN_BIRTH[gen] + between(-4, 6);
      const birth = isoDate(by, between(1, 12), between(1, 28));
      const age = TODAY.getFullYear() - by;
      let dead = false;
      if (gen <= 3) dead = true;
      else if (gen === 4) dead = chance(0.75);
      else if (gen === 5) dead = chance(0.15);
      let death = null;
      if (dead) {
        const dy = Math.min(TODAY.getFullYear() - 1, by + between(gender === 'Male' ? 58 : 62, 88));
        death = isoDate(dy, between(1, 12), between(1, 28));
      }
      return { birth, age, dead, death };
    };

    const profileFor = (gen, gender, age, home) => {
      const alive = true;
      let occupation; let education; let workplace = null;
      if (age < 18) { occupation = 'Student'; education = pick(EDU.kid); }
      else if (age < 25) { occupation = 'Student'; education = pick(EDU.young); }
      else if (gen <= 4) { occupation = gender === 'Male' ? pick(OCC_ELDER_M) : 'Housewife'; education = pick(EDU.old); }
      else { occupation = gender === 'Male' ? pick(OCC_ADULT_M) : pick(OCC_ADULT_F); education = gen === 5 ? pick(EDU.mid) : pick(EDU.young); }
      if (age >= 66 && gen >= 5 && occupation !== 'Housewife') occupation = 'Retired';
      if (age >= 25 && !['Farmer', 'Housewife', 'Retired', 'Student'].includes(occupation) && chance(0.7)) workplace = pick(WORKPLACES);
      const permanent = `${home.name}, গ্রাম: ${home.village}, উপজেলা: ${home.upazila}, জেলা: ${home.district}`;
      const present = age >= 25 && chance(0.35) ? pick(['মিরপুর, ঢাকা', 'বরিশাল সদর', 'গোপালগঞ্জ সদর', 'খুলনা', 'যাত্রাবাড়ী, ঢাকা', 'দুবাই, সংযুক্ত আরব আমিরাত']) : permanent;
      return { occupation, education, workplace, permanent, present, alive };
    };

    let phoneSeq = 100;
    const insertMember = async (p) => {
      const row = await one(`INSERT INTO members (full_name, name_bangla, name_english, gender, blood_group, occupation, education,
          birth_date, death_date, is_alive, contact_number, present_address, permanent_address, father_id, mother_id,
          level, bio, home_id, country_id, division_id, district_id, upazila_id, village_id, workplace)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24) RETURNING id`, [
        p.bn, p.bn, p.en, p.gender, p.blood, p.occupation, p.education, p.birth, p.death, !p.dead, p.phone,
        p.present, p.permanent, p.father_id || null, p.mother_id || null, p.gen, p.bio || null,
        p.home.id, p.home.country_id, p.home.division_id, p.home.district_id, p.home.upazila_id, p.home.village_id, p.workplace,
      ]);
      const m = { ...p, id: row.id };
      all.push(m);
      return m;
    };

    const makePerson = async ({ gen, gender, home, father, mother, inLaw, forcedName }) => {
      const life = lifeFor(gen, gender);
      const prof = profileFor(gen, gender, life.age, home);
      const given = forcedName || uniqueName(gender === 'Male' ? MALE : FEMALE);
      const sur = inLaw ? pick(IN_LAW_SURNAMES) : SURNAME;
      const showPhone = !life.dead && life.age >= 20 && chance(0.6);
      return insertMember({
        gen, gender, home, bn: `${given[0]} ${sur[0]}`, en: `${given[1]} ${sur[1]}`,
        blood: chance(0.85) ? pick(BLOOD) : null, ...life, ...prof,
        phone: showPhone ? `017${String(10000000 + phoneSeq++).slice(-8)}` : null,
        father_id: father?.id, mother_id: mother?.id,
      });
    };

    const marry = async (a, b) => {
      await q('UPDATE members SET spouse_id = $1 WHERE id = $2', [b.id, a.id]);
      await q('UPDATE members SET spouse_id = $1 WHERE id = $2', [a.id, b.id]);
      await q('INSERT INTO member_spouses (member_id, spouse_id) VALUES ($1,$2),($2,$1) ON CONFLICT DO NOTHING', [a.id, b.id]);
    };

    // Generation 1: the founding ancestor
    const rootHome = homes[0];
    const root = await insertMember({
      gen: 1, gender: 'Male', home: rootHome, bn: 'ভগবান চন্দ্র বাড়ৈ', en: 'Bhagaban Chandra Barai',
      blood: null, birth: '1858-04-14', death: '1931-02-23', dead: true, age: 168,
      occupation: 'Farmer', education: null, workplace: null, phone: null,
      permanent: `${rootHome.name}, গ্রাম: ${rootHome.village}, উপজেলা: ${rootHome.upazila}, জেলা: ${rootHome.district}`,
      present: `${rootHome.name}, গ্রাম: ${rootHome.village}, উপজেলা: ${rootHome.upazila}, জেলা: ${rootHome.district}`,
      bio: 'বাড়ৈ বংশের আদিপুরুষ। পরম শ্রদ্ধেয় এই কৃষক ও সমাজসেবক গ্রামে প্রথম নামঘর প্রতিষ্ঠা করেন এবং তাঁর উত্তরসূরিরা আজ দেশ-বিদেশে ছড়িয়ে আছেন।',
    });
    const rootWife = await makePerson({ gen: 1, gender: 'Female', home: rootHome, inLaw: true, forcedName: ['শ্রীমতী রাধারানী', 'Radharani'] });
    await marry(root, rootWife);

    // Grow the tree: each married son founds the next generation
    const homeQueue = homes.slice(1);
    let couples = [{ father: root, mother: rootWife, home: rootHome }];
    for (let gen = 2; gen <= MAX_GEN; gen++) {
      const next = [];
      for (const c of couples) {
        const kids = gen === 2 ? 5 : gen >= 6 ? between(2, 3) : between(3, 6);
        let sons = 0;
        for (let i = 0; i < kids; i++) {
          const gender = (i === 0 || (sons < 3 && chance(0.6))) ? 'Male' : 'Female';
          // Grandsons of the founder spread out to new homesteads
          const home = gender === 'Male' && gen === 3 && homeQueue.length ? homeQueue.shift()
            : gender === 'Male' && gen === 4 && chance(0.4) && homeQueue.length ? homeQueue.shift() : c.home;
          const child = await makePerson({ gen, gender, home, father: c.father, mother: c.mother });
          if (gender === 'Male') {
            sons++;
            const age = TODAY.getFullYear() - Number(child.birth.slice(0, 4));
            if (gen < MAX_GEN && age >= 24 && chance(gen >= 6 ? 0.55 : 0.95)) {
              const wife = await makePerson({ gen, gender: 'Female', home, inLaw: true });
              await marry(child, wife);
              next.push({ father: child, mother: wife, home });
            }
          }
        }
      }
      couples = next;
      console.log(`  Generation ${gen}: ${all.filter((m) => m.gen === gen).length} people`);
    }
    console.log(`  ${all.length} members in total`);

    const living = all.filter((m) => !m.dead);
    const blood = (m) => m.bn.endsWith(SURNAME[0]);
    const livingMen = living.filter((m) => m.gender === 'Male' && blood(m) && m.gen <= 6 && TODAY.getFullYear() - Number(m.birth.slice(0, 4)) >= 30);
    const youth = living.filter((m) => blood(m) && m.gen >= 6 && TODAY.getFullYear() - Number(m.birth.slice(0, 4)) <= 24 && TODAY.getFullYear() - Number(m.birth.slice(0, 4)) >= 15);
    const takeFrom = (arr) => arr.splice(Math.floor(rand() * arr.length), 1)[0];

    // ── Committees ───────────────────────────────────────────────────────────
    const ROLES = ['সভাপতি', 'সহ-সভাপতি', 'সহ-সভাপতি', 'সাধারণ সম্পাদক', 'যুগ্ম-সাধারণ সম্পাদক', 'সাংগঠনিক সম্পাদক', 'কোষাধ্যক্ষ',
      'দপ্তর সম্পাদক', 'প্রচার সম্পাদক', 'ধর্ম বিষয়ক সম্পাদক', 'শিক্ষা ও স্বাস্থ্য বিষয়ক সম্পাদক', 'যুব বিষয়ক সম্পাদক',
      'সাহিত্য ও সাংস্কৃতিক সম্পাদক', 'তথ্য ও যোগাযোগ প্রযুক্তি সম্পাদক', 'সদস্য', 'সদস্য', 'সদস্য'];
    const pool = [...livingMen].sort((a, b) => a.birth.localeCompare(b.birth));
    const current = await one('INSERT INTO committees (name, start_date, end_date, is_current) VALUES ($1,$2,$3,true) RETURNING id',
      ['কার্যনির্বাহী পরিষদ ২০২৫–২০২৭', '2025-03-01', '2027-02-28']);
    const officers = {};
    for (const [i, role] of ROLES.entries()) {
      const m = i < 3 ? pool.splice(i === 0 ? 0 : 1, 1)[0] : takeFrom(pool);
      if (!m) break;
      if (!officers[role]) officers[role] = m;
      await q('INSERT INTO committee_members (committee_id, member_id, role, order_index) VALUES ($1,$2,$3,$4)', [current.id, m.id, role, i]);
    }
    const prev = await one('INSERT INTO committees (name, start_date, end_date, is_current) VALUES ($1,$2,$3,false) RETURNING id',
      ['কার্যনির্বাহী পরিষদ ২০২২–২০২৫', '2022-03-01', '2025-02-28']);
    for (const [i, role] of ROLES.slice(0, 9).entries()) {
      const m = takeFrom(pool) || pick(livingMen);
      await q('INSERT INTO committee_members (committee_id, member_id, role, order_index) VALUES ($1,$2,$3,$4)', [prev.id, m.id, role, i]);
    }
    const president = officers['সভাপতি'];
    const secretary = officers['সাধারণ সম্পাদক'];
    console.log('  2 committees');

    // ── Eminent figures ──────────────────────────────────────────────────────
    const STUDENT_FEATS = [
      ['এসএসসি ২০২৫-এ জিপিএ ৫.০০', 'কোটালীপাড়া পাইলট উচ্চ বিদ্যালয়'], ['এইচএসসি ২০২৫-এ জিপিএ ৫.০০', 'সরকারি ব্রজমোহন কলেজ, বরিশাল'],
      ['ঢাকা বিশ্ববিদ্যালয়ে ভর্তির সুযোগ', 'ঢাকা বিশ্ববিদ্যালয়'], ['মেডিকেল কলেজে ভর্তির সুযোগ', 'শের-ই-বাংলা মেডিকেল কলেজ'],
      ['বুয়েটে ভর্তির সুযোগ', 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)'], ['জাতীয় বিজ্ঞান মেলায় প্রথম স্থান', 'গোপালগঞ্জ সরকারি বালিকা উচ্চ বিদ্যালয়'],
    ];
    const eminentStudents = [];
    for (const [title, inst] of STUDENT_FEATS) {
      const m = takeFrom(youth); if (!m) break;
      eminentStudents.push(m);
      await q('INSERT INTO eminent_figures (member_id, category, title, reason, institution) VALUES ($1,$2,$3,$4,$5)',
        [m.id, 'কৃতি শিক্ষার্থী', title, 'অসাধারণ মেধা ও অধ্যবসায়ের স্বীকৃতিস্বরূপ', inst]);
    }
    const deceasedElders = all.filter((m) => m.dead && blood(m) && m.gender === 'Male' && m.gen >= 3 && m.gen <= 4);
    for (const reason of ['গ্রামে প্রথম প্রাথমিক বিদ্যালয় প্রতিষ্ঠায় অবদান', 'মুক্তিযুদ্ধে সাহসী ভূমিকা ও আশ্রয়দান', 'বংশের প্রথম লিখিত বংশলতিকা সংকলন']) {
      const m = takeFrom(deceasedElders); if (!m) break;
      await q('INSERT INTO eminent_figures (member_id, category, title, reason, institution) VALUES ($1,$2,$3,$4,$5)',
        [m.id, 'মরণোত্তর জ্ঞাতি', 'মরণোত্তর সম্মাননা', reason, null]);
    }
    const elders = living.filter((m) => blood(m) && m.gen === 5);
    for (const reason of ['চার দশক ধরে বার্ষিক সম্মেলন আয়োজনে নিরলস ভূমিকা', 'বংশের দরিদ্র শিক্ষার্থীদের বৃত্তি তহবিল প্রতিষ্ঠা', 'চিকিৎসাসেবায় আজীবন অবদান']) {
      const m = takeFrom(elders); if (!m) break;
      await q('INSERT INTO eminent_figures (member_id, category, title, reason, institution) VALUES ($1,$2,$3,$4,$5)',
        [m.id, 'আজীবন জ্ঞাতি', 'আজীবন সম্মাননা', reason, null]);
    }
    console.log('  eminent figures');

    // ── Sammelans (annual gatherings; 45th was in 1977) ──────────────────────
    const FALGUN = (y) => `১০ ফাল্গুন ${bn(y - 594)}`;
    for (let edition = 86; edition <= 95; edition++) {
      const year = 1932 + edition; // 45th → 1977
      const home = homes[(edition * 7) % homes.length];
      const isNext = edition === 95;
      await q(`INSERT INTO sammelans (edition, title, bengali_date, date, time, home_id, venue_name, venue_address, map_link,
          president_name, secretary_name, description, special_notes, is_next) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
        edition, `${bn(edition)}তম বার্ষিক বাড়ৈ বংশ জ্ঞাতি সম্মেলন`, FALGUN(year), isoDate(year, 2, 23), 'সকাল ১০:০০',
        home.id, `${home.name}, ${home.village}`, `গ্রাম: ${home.village}, উপজেলা: ${home.upazila}, জেলা: ${home.district}`,
        `https://maps.google.com/?q=${encodeURIComponent(`${home.village}, ${home.upazila}, Bangladesh`)}`,
        isNext ? president?.bn : pick(livingMen).bn, isNext ? secretary?.bn : pick(livingMen).bn,
        isNext
          ? 'আসন্ন বার্ষিক জ্ঞাতি সম্মেলনে সকল জ্ঞাতিবর্গকে সপরিবারে আমন্ত্রণ। সকালে পূজা-অর্চনা, দুপুরে মহাপ্রসাদ এবং বিকেলে কৃতি শিক্ষার্থী সংবর্ধনা ও সাংস্কৃতিক অনুষ্ঠান।'
          : `${bn(edition)}তম সম্মেলনে প্রায় ${bn(between(300, 900))} জন জ্ঞাতি অংশ নেন। নামসংকীর্তন, মহাপ্রসাদ ও কৃতি শিক্ষার্থী সংবর্ধনা অনুষ্ঠিত হয়।`,
        isNext ? 'অংশগ্রহণের জন্য নিবন্ধন আবশ্যক। প্রবীণ জ্ঞাতিদের জন্য যাতায়াতের ব্যবস্থা থাকবে।' : null,
        isNext,
      ]);
    }
    console.log('  10 sammelans (next: 95th)');

    // ── Events ───────────────────────────────────────────────────────────────
    const EVENTS = [
      ['৯৫তম বার্ষিক জ্ঞাতি সম্মেলন — প্রস্তুতি সভা', '2026-12-12', 'বিকাল ৪:০০', 'বড় বাড়ি, এনায়েতনগর, কালকিনি', 'আসন্ন ৯৫তম সম্মেলনের প্রস্তুতি নিয়ে আলোচনা। সকল উপ-কমিটির সদস্যদের উপস্থিতি কাম্য।'],
      ['কৃতি শিক্ষার্থী সংবর্ধনা ২০২৬', '2027-01-10', 'সকাল ১১:০০', 'গৈলা উচ্চ বিদ্যালয় মিলনায়তন, আগৈলঝাড়া', 'এসএসসি ও এইচএসসি ২০২৬-এ জিপিএ ৫.০০ প্রাপ্ত জ্ঞাতি শিক্ষার্থীদের ক্রেস্ট ও বৃত্তি প্রদান।'],
      ['সরস্বতী পূজা ও শিশু-কিশোর আনন্দমেলা', '2027-02-02', 'সকাল ৯:০০', 'ঠাকুর বাড়ি, রামশীল, কোটালীপাড়া', 'বিদ্যাদেবীর আরাধনা, অঞ্জলি ও শিশুদের চিত্রাঙ্কন প্রতিযোগিতা।'],
      ['বিনামূল্যে চিকিৎসা ও রক্তদান শিবির', '2026-10-05', 'সকাল ৯:০০ – বিকাল ৩:০০', 'কদমবাড়ি, রাজৈর', 'জ্ঞাতি চিকিৎসকদের উদ্যোগে বিনামূল্যে চিকিৎসা পরামর্শ ও রক্তের গ্রুপ নির্ণয়।'],
      ['দুর্গাপূজা উপলক্ষে জ্ঞাতি পুনর্মিলনী', '2026-10-20', 'সন্ধ্যা ৬:০০', 'মাঝের বাড়ি, গৈলা', 'বিজয়া দশমীর শুভেচ্ছা বিনিময় ও প্রীতিভোজ।'],
      ['বৃক্ষরোপণ কর্মসূচি', '2026-07-15', 'সকাল ১০:০০', 'সাহেবরামপুর, কালকিনি', 'প্রতিটি বাড়িতে একটি করে ফলজ গাছ রোপণ।'],
    ];
    for (const [title, date, time, location, description] of EVENTS) {
      await q('INSERT INTO events (title, date, time, location, description, map_link) VALUES ($1,$2,$3,$4,$5,$6)',
        [title, date, time, location, description, `https://maps.google.com/?q=${encodeURIComponent(location.split(',').slice(-2).join(','))}`]);
    }
    console.log(`  ${EVENTS.length} events`);

    // ── Notices ──────────────────────────────────────────────────────────────
    const deceasedRecent = all.find((m) => m.dead && m.gen === 5) || all.find((m) => m.dead && m.gen === 4);
    const baby = all.filter((m) => m.gen === 7).sort((a, b) => b.birth.localeCompare(a.birth))[0];
    const NOTICES = [
      ['৯৫তম বার্ষিক সম্মেলনের নিবন্ধন শুরু', 'General', 'আগামী ১০ ফাল্গুন অনুষ্ঠিতব্য ৯৫তম সম্মেলনে অংশগ্রহণের জন্য নিবন্ধন শুরু হয়েছে। নিজ নিজ বাড়ির প্রতিনিধির কাছে নাম জমা দিন।', '2026-11-15'],
      [`শোক সংবাদ: ${deceasedRecent?.bn || 'একজন প্রবীণ জ্ঞাতি'}`, 'Death', 'আমাদের পরম শ্রদ্ধেয় জ্ঞাতি পরলোকগমন করেছেন। তাঁর আত্মার সদ্গতি কামনা করি। শ্রাদ্ধানুষ্ঠানের তারিখ পরে জানানো হবে।', '2026-11-02'],
      [`নবজাতকের আগমন`, 'New Born', `${baby?.bn ? baby.bn.split(' ')[0] : 'নবজাতক'}-এর পরিবারে নতুন অতিথির আগমনে সকলকে শুভেচ্ছা। মা ও শিশু সুস্থ আছে।`, '2026-10-28'],
      ['এইচএসসি ২০২৬ ফলাফল: ৭ জন জ্ঞাতি জিপিএ ৫.০০', 'Good Result', 'এবারের এইচএসসি পরীক্ষায় বংশের ৭ জন শিক্ষার্থী জিপিএ ৫.০০ পেয়েছে। সকলকে অভিনন্দন!', '2026-10-16'],
      ['বিবাহের নিমন্ত্রণ', 'Invitation', 'আগামী ২৪ অগ্রহায়ণ বড় বাড়িতে শুভ বিবাহ অনুষ্ঠানে সকল জ্ঞাতিবর্গকে সবান্ধবে আমন্ত্রণ।', '2026-11-10'],
      ['রক্তদান শিবির সফলভাবে সম্পন্ন', 'Event', 'চিকিৎসা ও রক্তদান শিবিরে ১২০ জন জ্ঞাতি সেবা গ্রহণ করেছেন এবং ৩৫ ব্যাগ রক্ত সংগৃহীত হয়েছে।', '2026-10-06'],
      ['বংশলতিকা হালনাগাদ করুন', 'General', 'আপনার পরিবারের নতুন সদস্য, বিবাহ বা ঠিকানা পরিবর্তনের তথ্য অ্যাপের মাধ্যমে বা কমিটির কাছে জানান।', '2026-09-01'],
    ];
    for (const [title, type, content, date] of NOTICES) {
      await q('INSERT INTO notices (title, type, content, date, posted_by) VALUES ($1,$2,$3,$4,$5)', [title, type, content, date, secretary?.bn || 'কমিটি']);
    }
    console.log(`  ${NOTICES.length} notices`);

    // ── Help requests ────────────────────────────────────────────────────────
    const seekers = living.filter((m) => blood(m) && m.gen >= 5);
    const HELP = [
      ['জরুরি ভিত্তিতে বি-নেগেটিভ রক্ত প্রয়োজন', 'Medical', 'alert', 'ঢাকা মেডিকেল কলেজ হাসপাতালে অস্ত্রোপচারের জন্য ২ ব্যাগ B− রক্ত প্রয়োজন।'],
      ['কিডনি চিকিৎসার জন্য আর্থিক সহায়তা', 'Financial', 'alert', 'দীর্ঘদিন ধরে ডায়ালাইসিস চলছে। চিকিৎসা ব্যয় মেটাতে জ্ঞাতিবর্গের সহযোগিতা কামনা করছি।'],
      ['বিশ্ববিদ্যালয় ভর্তি পরীক্ষার প্রস্তুতি নিয়ে পরামর্শ', 'Advice', 'info', 'মেডিকেল ও বুয়েট ভর্তি পরীক্ষার প্রস্তুতি নিয়ে অভিজ্ঞ জ্ঞাতিদের পরামর্শ চাই।'],
      ['পুরোনো দলিল ও বংশ-ইতিহাস সংগ্রহ', 'Research', 'info', '১৯৩০-এর আগের জমির দলিল, চিঠি বা ছবি থাকলে বংশ-ইতিহাস গবেষণার জন্য শেয়ার করুন।'],
      ['বিদেশে চাকরির ভিসা প্রক্রিয়া', 'Other', 'info', 'দুবাইয়ে কর্মরত কোনো জ্ঞাতি ভিসা প্রক্রিয়া সম্পর্কে তথ্য দিলে উপকৃত হব।'],
    ];
    for (const [title, tag, type, content] of HELP) {
      const s = takeFrom(seekers);
      await q(`INSERT INTO help_requests (title, tag, type, content, posted_by, help_seeker, contact_number, help_seeker_id, posted_by_member_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [title, tag, type, content, s.bn, s.bn, s.phone || '01700000099', s.id, s.id]);
    }
    console.log(`  ${HELP.length} help requests`);

    // ── History chapters ─────────────────────────────────────────────────────
    const HISTORY = [
      ['বংশের সূচনা', 'The Beginning', 'উনিশ শতকের মাঝামাঝি মাদারীপুরের এনায়েতনগর গ্রামে ভগবান চন্দ্র বাড়ৈ কৃষিকাজ ও সমাজসেবার মাধ্যমে এই বংশের ভিত্তি স্থাপন করেন। তাঁর চার সন্তান থেকেই আজকের বিস্তৃত পরিবারের সূচনা।', 'In the mid-nineteenth century Bhagaban Chandra Barai laid the foundation of the lineage in Enayetnagar, Madaripur, through farming and service to the community.', true],
      ['নতুন বসতি ও বিস্তার', 'New Homesteads', 'বিংশ শতকের শুরুতে তাঁর পৌত্ররা কোটালীপাড়া, আগৈলঝাড়া, রাজৈর ও নাজিরপুরে নতুন বাড়ি গড়ে তোলেন। প্রতিটি বাড়ি আজ বংশের একেকটি শাখা।', 'In the early twentieth century his grandsons founded new homesteads across Kotalipara, Agailjhara, Rajoir and Nazirpur.', false],
      ['বার্ষিক জ্ঞাতি সম্মেলন', 'The Annual Gathering', '১৯৩৩ সাল থেকে প্রতি বছর ফাল্গুন মাসে সকল শাখার জ্ঞাতিরা একত্র হন। নামসংকীর্তন, মহাপ্রসাদ ও প্রবীণদের আশীর্বাদ এই সম্মেলনের প্রাণ।', 'Since 1933 every branch has gathered each Falgun for kirtan, prasad and the blessings of the elders.', false],
      ['আধুনিক যুগে বংশ', 'The Lineage Today', 'আজ বংশের সদস্যরা শিক্ষক, চিকিৎসক, প্রকৌশলী, ব্যবসায়ী ও প্রবাসী হিসেবে দেশ-বিদেশে প্রতিষ্ঠিত। এই অ্যাপ সেই শতবর্ষের বন্ধনকে ডিজিটাল রূপে সংরক্ষণের প্রয়াস।', 'Members now serve as teachers, doctors, engineers and entrepreneurs at home and abroad; this app preserves that century-old bond.', false],
    ];
    for (const [i, [tbn, ten, cbn, cen, lead]] of HISTORY.entries()) {
      await q('INSERT INTO history_records (title_bn, title_en, content_bn, content_en, display_order, is_lead) VALUES ($1,$2,$3,$4,$5,$6)', [tbn, ten, cbn, cen, i + 1, lead]);
    }
    console.log(`  ${HISTORY.length} history chapters`);

    // ── Demo accounts ────────────────────────────────────────────────────────
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const memberAcc = living.find((m) => blood(m) && m.gen === 6 && m.gender === 'Male');
    const pendingAcc = living.find((m) => blood(m) && m.gen === 6 && m.gender === 'Female');
    const user = await one(`INSERT INTO users (email, mobile_number, password_hash, role, member_id, status) VALUES ($1,$2,$3,'member',$4,'active') RETURNING id`,
      [DEMO_ACCOUNTS.member.email, DEMO_ACCOUNTS.member.mobile, hash, memberAcc.id]);
    await q(`INSERT INTO users (email, mobile_number, password_hash, role, member_id, status) VALUES ($1,$2,$3,'member',$4,'pending')`,
      [DEMO_ACCOUNTS.pending.email, DEMO_ACCOUNTS.pending.mobile, hash, pendingAcc.id]);
    await q(`INSERT INTO admin_users (name, email, password_hash, role, name_bangla, name_english) VALUES ($1,$2,$3,'admin',$4,$5)`,
      [DEMO_ACCOUNTS.admin.name, DEMO_ACCOUNTS.admin.email, hash, DEMO_ACCOUNTS.admin.name, DEMO_ACCOUNTS.admin.name_en]);

    // ── Brilliant-student requests (for the admin review screen) ─────────────
    for (const [m, ach, inst, grade] of [
      [youth[0], 'SSC', 'রাজৈর পাইলট উচ্চ বিদ্যালয়', 'GPA 5.00'],
      [youth[1], 'HSC', 'সরকারি বঙ্গবন্ধু কলেজ, গোপালগঞ্জ', 'GPA 5.00'],
    ].filter(([m]) => m)) {
      await q(`INSERT INTO brilliant_student_requests (applicant_user_id, applicant_name, applicant_email, applicant_phone, applicant_role,
          applicant_member_id, member_id, achievement_type, exam_year, institution, result_grade, description, status)
        VALUES ($1,$2,$3,$4,'member',$5,$6,$7,'2026',$8,$9,$10,'pending')`,
        [user.id, memberAcc.bn, DEMO_ACCOUNTS.member.email, DEMO_ACCOUNTS.member.mobile, memberAcc.id, m.id, ach, inst, grade, 'কৃতি শিক্ষার্থী হিসেবে স্বীকৃতির আবেদন।']);
    }
    console.log('  demo accounts and student requests');

    await q('COMMIT');
    console.log('\nDone. Demo logins (local only) — password for all three is in DEMO_PASSWORD in this script:');
    console.log(`  member  : ${DEMO_ACCOUNTS.member.email}  (linked to ${memberAcc.en})`);
    console.log(`  pending : ${DEMO_ACCOUNTS.pending.email}  (awaiting approval)`);
    console.log(`  admin   : ${DEMO_ACCOUNTS.admin.email}`);
  } catch (err) {
    await q('ROLLBACK');
    console.error('Seeding failed, nothing was changed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
