async function test() {
    try {
        const res = await fetch('http://localhost:5001/api/family/household?home_name=' + encodeURIComponent('নিরঞ্জন মন্ডলের বাড়ি') + '&village=' + encodeURIComponent('ভেন্নাবাড়ী'));
        const text = await res.text();
        console.log("Response:", text);
    } catch (err) {
        console.error(err);
    }
}
test();
