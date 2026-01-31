const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'kisan360.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Check tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Tables found:", tables);
    });

    // Check buyers schema
    db.all("PRAGMA table_info(buyers)", [], (err, rows) => {
        if (err) {
            console.log("Error checking buyers schema (maybe table doesn't exist):", err);
        } else {
            console.log("Buyers Table Schema:", rows);
        }
    });

    // List buyers
    db.all("SELECT * FROM buyers", [], (err, rows) => {
        if (err) {
            console.log("Error selecting buyers:", err);
        } else {
            console.log("Buyers count:", rows.length);
            console.log("Buyers:", rows);
        }
    });
});
