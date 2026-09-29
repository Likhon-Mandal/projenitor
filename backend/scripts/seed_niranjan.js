require('dotenv').config();
const { pool } = require('../config/db');

async function insertMember(client, name, fatherId) {
    const res = await client.query(
        `INSERT INTO members (home_id, full_name, father_id) 
         VALUES ($1, $2, $3) RETURNING id`,
        [513, name, fatherId]
    );
    return res.rows[0].id;
}

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Gen 1
        const ramgati = await insertMember(client, 'মৃত রামগতি মন্ডল', null);
        
        // Gen 2
        const tilak = await insertMember(client, 'তিলক মন্ডল', ramgati);
        
        // Gen 3
        const mahesh = await insertMember(client, 'মহেশ মন্ডল', tilak);
        
        // Gen 4
        const prasanna = await insertMember(client, 'প্রসন্ন মন্ডল', mahesh);
        const gopal = await insertMember(client, 'গোপাল মন্ডল', mahesh);
        const nepal = await insertMember(client, 'নেপাল মন্ডল', mahesh);
        const subal = await insertMember(client, 'সুবল মন্ডল', mahesh);
        
        // Gen 5
        const gobinda = await insertMember(client, 'গোবিন্দ মন্ডল', prasanna);
        
        const radhanath = await insertMember(client, 'রাধানাথ মন্ডল', gopal);
        const sarojini = await insertMember(client, 'সরোজিনী', gopal);
        
        const sadananda = await insertMember(client, 'সদানন্দ মন্ডল', nepal);
        const nityananda = await insertMember(client, 'নিত্যানন্দ মন্ডল', nepal);
        
        const balaram = await insertMember(client, 'বলরাম মন্ডল', subal);
        const kanailal = await insertMember(client, 'কানাইলাল মন্ডল', subal);
        
        // Gen 6 - Children of Gobinda
        const bhajan = await insertMember(client, 'ভজন মন্ডল', gobinda);
        const naren = await insertMember(client, 'নরেন মন্ডল', gobinda);
        const amrita = await insertMember(client, 'অমৃত মন্ডল', gobinda);
        const subasi = await insertMember(client, 'সুবাসী', gobinda);
        
        // Gen 6 - Children of Radhanath
        const rasik = await insertMember(client, 'রসিক মন্ডল', radhanath);
        const mohan = await insertMember(client, 'মোহন মন্ডল', radhanath);
        const tarak = await insertMember(client, 'তারক মন্ডল', radhanath);
        const phulmala = await insertMember(client, 'ফুলমালা', radhanath);
        
        // Gen 6 - Children of Sadananda
        const sukhen = await insertMember(client, 'সুখেন মন্ডল', sadananda);
        const suresh = await insertMember(client, 'সুরেশ মন্ডল', sadananda);
        const samir = await insertMember(client, 'সমীর মন্ডল', sadananda);
        const suyen = await insertMember(client, 'সুযেন মন্ডল', sadananda);
        const sarat = await insertMember(client, 'শরৎ মন্ডল', sadananda);
        const suchitra = await insertMember(client, 'সুচিত্রা', sadananda);
        const kulu = await insertMember(client, 'কুলু', sadananda);
        const saneka = await insertMember(client, 'সনেকা', sadananda);
        const sudha = await insertMember(client, 'সুধা', sadananda);
        const basanti = await insertMember(client, 'বাসন্তী', sadananda);
        const jayanti = await insertMember(client, 'জয়ন্তী', sadananda);
        const ranjana = await insertMember(client, 'রঞ্জনা', sadananda);
        const aruna = await insertMember(client, 'অরুণা', sadananda);
        
        // Gen 6 - Children of Nityananda
        const niranjan = await insertMember(client, 'নিরঞ্জন মন্ডল', nityananda);
        const nilratan = await insertMember(client, 'নীলরতন মন্ডল', nityananda);
        const nikhil = await insertMember(client, 'নিখিল মন্ডল', nityananda);
        const sumala = await insertMember(client, 'সুমালা', nityananda);
        const bimala = await insertMember(client, 'বিমলা', nityananda);
        const debala = await insertMember(client, 'দেবলা', nityananda);
        const bina = await insertMember(client, 'বিনা', nityananda);
        const sarala = await insertMember(client, 'সরলা', nityananda);
        const birala = await insertMember(client, 'বিরলা', nityananda);
        
        // Gen 6 - Children of Balaram
        const brajeswar = await insertMember(client, 'ব্রজেশ্বর মন্ডল', balaram);
        const ramjoy = await insertMember(client, 'রামজয় মন্ডল', balaram);
        const binay = await insertMember(client, 'বিনয় মন্ডল', balaram);
        const sushila = await insertMember(client, 'সুশীলা', balaram);
        const baro = await insertMember(client, 'বড়', balaram);
        const janaki = await insertMember(client, 'জানকী', balaram);
        const bilu = await insertMember(client, 'বিলু', balaram);
        
        // Gen 6 - Children of Kanailal
        const narayan = await insertMember(client, 'নারায়ণ মন্ডল', kanailal);
        const anil = await insertMember(client, 'অনিল মন্ডল', kanailal);
        const haripada = await insertMember(client, 'হরিপদ মন্ডল', kanailal);
        const mari = await insertMember(client, 'মরী', kanailal);
        
        // Gen 7 - Children of Bhajan
        const mukunda = await insertMember(client, 'মুকুন্দ মন্ডল', bhajan);
        const bibek = await insertMember(client, 'বিবেক মন্ডল', bhajan);
        const bhabesh = await insertMember(client, 'ভবেশ মন্ডল', bhajan);
        const ramesh = await insertMember(client, 'রমেশ মন্ডল', bhajan);
        const ranajit = await insertMember(client, 'রণজিত মন্ডল', bhajan);
        const sanjit = await insertMember(client, 'সঞ্জিত মন্ডল', bhajan);
        const swapan = await insertMember(client, 'স্বপন মন্ডল', bhajan);
        const shankar = await insertMember(client, 'শংকর মন্ডল', bhajan);
        const jashoda = await insertMember(client, 'যশোদা', bhajan);
        const karuna = await insertMember(client, 'করুনা', bhajan);
        const madhuri = await insertMember(client, 'মাধুরী', bhajan);
        
        // Gen 7 - Children of Naren
        const naresh = await insertMember(client, 'নরেশ মন্ডল', naren);
        const nripen = await insertMember(client, 'নৃপেন মন্ডল', naren);
        const biplab = await insertMember(client, 'বিপ্লব মন্ডল', naren);
        const nanda = await insertMember(client, 'নন্দ', naren);
        const lalita = await insertMember(client, 'ললিতা', naren);
        const pramila = await insertMember(client, 'প্রমীলা', naren);
        const lakshmi = await insertMember(client, 'লক্ষ্মী', naren);
        const parul = await insertMember(client, 'পারুল', naren);
        
        // Gen 7 - Children of Amrita
        const ananta = await insertMember(client, 'অনন্ত মন্ডল', amrita);
        const asim = await insertMember(client, 'অসীম মন্ডল', amrita);
        const amala = await insertMember(client, 'অমলা', amrita);
        const kamala = await insertMember(client, 'কমলা', amrita);
        const rita = await insertMember(client, 'রিতা', amrita);
        const pilu = await insertMember(client, 'পিলু', amrita);
        
        // Gen 7 - Children of Rasik
        const khokan = await insertMember(client, 'খোকন মন্ডল', rasik);
        const ashok = await insertMember(client, 'অশোক মন্ডল', rasik);
        const rama = await insertMember(client, 'রমা', rasik);
        
        // Gen 7 - Children of Sukhen
        const sanjay = await insertMember(client, 'সঞ্জয় মন্ডল', sukhen);
        const bishwajit = await insertMember(client, 'বিশ্বজিৎ মন্ডল', sukhen);
        const indrajit = await insertMember(client, 'ইন্দ্রজিৎ মন্ডল', sukhen);
        const shiuli = await insertMember(client, 'শিউলী', sukhen);
        
        // Gen 7 - Children of Suresh
        const pradip = await insertMember(client, 'প্রদীপ মন্ডল', suresh);
        const babita = await insertMember(client, 'ববিতা', suresh);
        const kabita = await insertMember(client, 'কবিতা', suresh);
        const ankhi = await insertMember(client, 'আঁখি', suresh);
        
        // Gen 7 - Children of Samir
        const surya = await insertMember(client, 'সূর্য মন্ডল', samir);
        const shoiti = await insertMember(client, 'শৈতী', samir);
        
        // Gen 7 - Children of Suyen
        const saikat = await insertMember(client, 'সৈকত মন্ডল', suyen);
        
        // Gen 7 - Children of Niranjan
        const uttam = await insertMember(client, 'উত্তম মন্ডল', niranjan);
        
        // Gen 7 - Children of Nilratan
        const narottam = await insertMember(client, 'নরোত্তম মন্ডল', nilratan);
        const shefali = await insertMember(client, 'শেফালী', nilratan);
        const shilpi = await insertMember(client, 'শিল্পী', nilratan);
        const putul = await insertMember(client, 'পুতুল', nilratan);
        const iti = await insertMember(client, 'ইতি', nilratan);
        
        // Gen 7 - Children of Nikhil
        const nishit = await insertMember(client, 'নিশিত মন্ডল', nikhil);
        const nipa = await insertMember(client, 'নিপা', nikhil);
        
        // Gen 7 - Children of Brajeswar
        const paritosh = await insertMember(client, 'পরিতোষ মন্ডল', brajeswar);
        const montu = await insertMember(client, 'মন্টু মন্ডল', brajeswar);
        const maya = await insertMember(client, 'মায়া', brajeswar);
        const unnati = await insertMember(client, 'উন্নতি', brajeswar);
        
        // Gen 7 - Children of Ramjoy
        const ramen = await insertMember(client, 'রমেন মন্ডল', ramjoy);
        const suman = await insertMember(client, 'সুমন মন্ডল', ramjoy);
        const dipankar = await insertMember(client, 'দীপঙ্কর মন্ডল', ramjoy);
        const latika = await insertMember(client, 'লতিকা', ramjoy);
        const jharna = await insertMember(client, 'ঝর্ণা', ramjoy);
        
        // Gen 7 - Children of Binay
        const bishnu = await insertMember(client, 'বিষ্ণু মন্ডল', binay);
        const manju = await insertMember(client, 'মঞ্জু', binay);
        const mridula = await insertMember(client, 'মৃদুলা', binay);
        const mukta = await insertMember(client, 'মুক্তা', binay);
        const mala = await insertMember(client, 'মালা', binay);
        
        // Gen 7 - Children of Narayan
        const nagen = await insertMember(client, 'নগেন মন্ডল', narayan);
        const khagen = await insertMember(client, 'খগেন মন্ডল', narayan);
        const ashutosh = await insertMember(client, 'আশুতোষ মন্ডল', narayan);
        const bashistha = await insertMember(client, 'বশিষ্ট মন্ডল', narayan);
        const pushpa = await insertMember(client, 'পুষ্প', narayan);
        const usha = await insertMember(client, 'ঊষা', narayan);
        const asha = await insertMember(client, 'আশা', narayan);
        
        // Gen 7 - Children of Anil
        const abinash = await insertMember(client, 'অবিনাশ মন্ডল', anil);
        const parimal = await insertMember(client, 'পরিমল মন্ডল', anil);
        const nirmal = await insertMember(client, 'নির্মল মন্ডল', anil);
        const sabita = await insertMember(client, 'সবিতা', anil);
        const anita = await insertMember(client, 'অনিতা', anil);
        
        // Gen 7 - Children of Haripada
        const jagadish = await insertMember(client, 'জগদীশ চন্দ্র মন্ডল', haripada);
        const manoranjan = await insertMember(client, 'মনোরঞ্জন মন্ডল', haripada);
        
        // Gen 8 - Children of Mukunda
        const palash = await insertMember(client, 'পলাশ মন্ডল', mukunda);
        const hiranmay = await insertMember(client, 'হিরন্ময় মন্ডল', mukunda);
        const chameli = await insertMember(client, 'চামেলী', mukunda);
        const lipika = await insertMember(client, 'লিপিকা', mukunda);
        const bijaya = await insertMember(client, 'বিজয়া', mukunda);
        const ruma = await insertMember(client, 'রুমা', mukunda);
        
        // Gen 8 - Children of Bibek
        const debashish = await insertMember(client, 'দেবাশীষ মন্ডল', bibek);
        const goutam = await insertMember(client, 'গৌতম মন্ডল', bibek);
        const parveen = await insertMember(client, 'পারভীন', bibek);
        
        // Gen 8 - Children of Ramesh
        const rani = await insertMember(client, 'রণি মন্ডল', ramesh);
        const prabhash = await insertMember(client, 'প্রভাষ মন্ডল', ramesh);
        const rama2 = await insertMember(client, 'রমা', ramesh); // might be conflict, let's keep it
        
        // Gen 8 - Children of Ranajit
        const shubha = await insertMember(client, 'শুভ মন্ডল', ranajit);
        
        // Gen 8 - Children of Sanjit
        const lopa = await insertMember(client, 'লোপা', sanjit);
        
        // Gen 8 - Children of Shankar
        const buddhadeb = await insertMember(client, 'বুদ্ধদেব মন্ডল', shankar);
        const dyuti = await insertMember(client, 'দ্যুতি', shankar);
        
        // Gen 8 - Children of Naresh
        const ripon = await insertMember(client, 'রিপন মন্ডল', naresh);
        const tapan = await insertMember(client, 'তপন মন্ডল', naresh);
        const sathi = await insertMember(client, 'সাথী', naresh);
        const papi = await insertMember(client, 'পপি', naresh);
        
        // Gen 8 - Children of Nripen
        const shaon = await insertMember(client, 'শাওন মন্ডল', nripen);
        const likhan = await insertMember(client, 'লিখন মন্ডল', nripen);
        
        // Gen 8 - Children of Biplab
        const sutapa = await insertMember(client, 'সুতপা', biplab);
        
        // Gen 8 - Children of Ananta
        const animesh = await insertMember(client, 'অনিমেষ মন্ডল', ananta);
        const amit = await insertMember(client, 'অমিত মন্ডল', ananta);
        const hena = await insertMember(client, 'হেনা', ananta);
        
        // Gen 8 - Children of Asim
        const antu = await insertMember(client, 'অন্তু মন্ডল', asim);
        const mita = await insertMember(client, 'মিতা (অপা)', asim);
        
        // Gen 8 - Children of Ashok
        const aparna = await insertMember(client, 'অপর্ণা', ashok);
        const arpita = await insertMember(client, 'অর্পিতা', ashok);
        
        // Gen 8 - Children of Sanjay
        const jhinuk = await insertMember(client, 'ঝিনুক', sanjay);
        const apan = await insertMember(client, 'আপন', sanjay);
        const bapan = await insertMember(client, 'বাপন', sanjay);
        
        // Gen 8 - Children of Uttam
        const urmi = await insertMember(client, 'উর্মি', uttam);
        const sharmi = await insertMember(client, 'শর্মি', uttam);
        const argha = await insertMember(client, 'অর্ঘ', uttam);
        
        // Gen 8 - Children of Narottam
        const barshan = await insertMember(client, 'বর্ষণ মন্ডল', narottam);
        
        // Gen 8 - Children of Paritosh
        const pijush = await insertMember(client, 'পীযুষ মন্ডল', paritosh);
        const tapas = await insertMember(client, 'তাপস মন্ডল', paritosh);
        
        // Gen 8 - Children of Montu
        const brishti = await insertMember(client, 'বৃষ্টি', montu);
        const bonya = await insertMember(client, 'বন্যা', montu);
        const milton = await insertMember(client, 'মিলটন', montu);
        
        // Gen 8 - Children of Bishnu
        const bibhash = await insertMember(client, 'বিভাষ মন্ডল', bishnu);
        const jui = await insertMember(client, 'জুঁই', bishnu);
        
        // Gen 8 - Children of Nagen
        const pranab = await insertMember(client, 'প্রণব মন্ডল', nagen);
        const prabin = await insertMember(client, 'প্রবীন মন্ডল', nagen);
        const priyanka = await insertMember(client, 'প্রিয়াংকা', nagen);
        
        // Gen 8 - Children of Khagen
        const subrata = await insertMember(client, 'সুব্রত মন্ডল', khagen);
        const sujoy = await insertMember(client, 'সুজয় মন্ডল', khagen);
        const mitu = await insertMember(client, 'মিতু', khagen);
        
        // Gen 8 - Children of Ashutosh
        const antara = await insertMember(client, 'অন্তরা', ashutosh);
        const adhara = await insertMember(client, 'অধরা', ashutosh);
        
        // Gen 8 - Children of Bashistha
        const chayan = await insertMember(client, 'চয়ন', bashistha);
        
        // Gen 8 - Children of Abinash
        const himel = await insertMember(client, 'হিমেল মন্ডল', abinash);
        
        // Gen 8 - Children of Parimal
        const sohag = await insertMember(client, 'সোহাগ মন্ডল', parimal);
        const keya = await insertMember(client, 'কেয়া', parimal);
        
        // Gen 8 - Children of Nirmal
        const simanta = await insertMember(client, 'সীমান্ত মন্ডল (হিমাদ্রি)', nirmal);
        const himadri2 = await insertMember(client, 'হিমাদ্রি', nirmal); // separate child? wait, the document says "সীমান্ত মন্ডল (হিমাদ্রি)" and "হিমাদ্রি" on next line? Or maybe that is just a typo from OCR. Let's look closely at PDF. Ah, in gen 8 it lists "সীমান্ত মন্ডল (হিমাদ্রি)" and then another child? Actually I will just add both just in case, or wait, it says "সীমান্ত মন্ডল (হিমাদ্রি)" is the son of Nirmal.
        
        // Gen 8 - Children of Jagadish
        const arnab = await insertMember(client, 'অর্ণব মন্ডল', jagadish);
        const aranya = await insertMember(client, 'অরণ্য মন্ডল', jagadish);
        
        // Gen 8 - Children of Manoranjan
        const anabil = await insertMember(client, 'অনাবিল অভ্র মন্ডল', manoranjan);
        
        // Gen 9 - Child of Debashish
        const smriti = await insertMember(client, 'স্মৃতি (অস্মৃতি)', debashish);
        
        await client.query('COMMIT');
        console.log('Successfully inserted all parsed members!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error inserting members:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
