const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./kisan360.db');

const name = "Test Farmer";
const email = "test@farmer.com";
const password = "hashedpassword"; // Mock crypto
const village = "Test Village";
const state = "Test State";

db.run(`INSERT INTO farmers (name, email, password, village, state) VALUES (?, ?, ?, ?, ?)`, 
    [name, email, password, village, state], 
    function(err) {
        if (err) {
            return console.error("Insert Error:", err.message);
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`);
        
        // Now Verify
        db.get(`SELECT * FROM farmers WHERE id = ?`, [this.lastID], (err, row) => {
            if (err) return console.error(err.message);
            console.log("Retrieved Row:", row);
        });
    }
);
