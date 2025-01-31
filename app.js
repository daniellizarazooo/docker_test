const express = require('express');
const db = require('better-sqlite3')('mydatabase.db'); // Directly use the filename

const app = express();
const port = process.env.PORT || 3000;

// Database initialization (runs on container startup)
// No need for path.resolve if you're using just the filename
// better-sqlite3 will create the database file in the current working directory
// which will be /app inside the Docker container.

// Create table if it doesn't exist.  Important for first run in Docker
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`);


app.use(express.json()); // To parse JSON request bodies

// Routes
app.get('/', (req, res) => {
    res.send('Hello from the Node.js/SQLite app!');
});

app.get('/items', (req, res) => {
    const items = db.prepare('SELECT * FROM items').all();
    res.json(items);
});

app.post('/items', (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const stmt = db.prepare('INSERT INTO items (name) VALUES (?)');
    const result = stmt.run(name);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Item created' }); // Send back the ID
});

app.delete('/items/:id', (req, res) => {
    const itemId = req.params.id;
    const stmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = stmt.run(itemId);

    if (result.changes > 0) {
        res.status(200).json({ message: 'Item deleted' });
    } else {
        res.status(404).json({ message: 'Item not found' });
    }
});



app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});


// Properly close the database connection on app exit (important for Docker)
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database closed.');
        }
        process.exit(0); // Exit after the db is closed
    });
});
