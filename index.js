const express = require('express');
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const DB_PATH = 'data/games.db'; // SQLite database file path

// Create SQLite database connection
const db = new sqlite3.Database(DB_PATH);

// Create 'games' table if it doesn't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS games (
        game_id INTEGER PRIMARY KEY,
        crash_value REAL NOT NULL,
        balance REAL DEFAULT 0
    )`);
});

app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static('public'));

app.post('/notify', (req, res) => {
    let { game_id, crash_value, balance } = req.body;
    if (!game_id || !crash_value) {
        res.status(400).json({ message: 'game_id and crash_value are required' });
        return;
    }

    // Check if the game with the same game_id exists
    const selectSql = 'SELECT * FROM games WHERE game_id = ?';
    db.get(selectSql, [game_id], (err, row) => {
        if (err) {
            res.status(500).json({ message: 'Error checking game existence', error: err });
            return;
        }

        // Game with the same game_id does not exist, insert a new record
        const insertSql = 'INSERT INTO games (game_id, crash_value, balance) VALUES (?, ?, ?)';
        const insertValues = [game_id, crash_value, balance];
        db.run(insertSql, insertValues, function(err) {
            if (err) {
                res.status(500).json({ message: 'Error inserting game record', error: err });
            } else {
                res.status(200).json({ message: `New game ${game_id}  record inserted successfully` });
            }
        });
   
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
