const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./kisan360.db');

db.serialize(() => {
    db.all("PRAGMA table_info(farmers)", (err, rows) => {
        if (err) console.error(err);
        console.log("Farmers Table Schema:", rows);
    });
    db.all("PRAGMA table_info(buyers)", (err, rows) => {
        if (err) console.error(err);
        console.log("Buyers Table Schema:", rows);
    });
});
