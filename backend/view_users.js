const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database/lakshyamaarg.db');

db.all('SELECT id, name, email, phone, education_level, stream, otp_verified, created_at FROM users', [], (err, rows) => {
    if (err) {
        console.log('Error:', err.message);
    } else {
        console.log('\n========== REGISTERED USERS ==========\n');
        console.log('Total users:', rows.length);
        console.log('');
        rows.forEach(r => {
            console.log('#' + r.id + ' ' + r.name);
            console.log('   Email: ' + r.email);
            console.log('   Phone: ' + (r.phone || 'N/A'));
            console.log('   Education: ' + r.education_level + ' / ' + r.stream);
            console.log('   Verified: ' + (r.otp_verified ? 'Yes' : 'No'));
            console.log('   Joined: ' + r.created_at);
            console.log('');
        });
    }
    db.close();
});
