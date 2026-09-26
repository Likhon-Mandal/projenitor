async function test() {
    try {
        const res = await fetch('http://localhost:5001/api/family/household?home_name=' + encodeURIComponent('নিরঞ্জন মন্ডলের বাড়ি') + '&village=' + encodeURIComponent('ভেন্নাবাড়ী'));
        const data = await res.json();
        
        let members = data;
        if (data.obfuscated) {
            // Need to write a crypto-js decrypt here if it's obfuscated. 
            // Better yet, I'll just check the backend directly with db.
        }
        
    } catch (e) {
    }
}
