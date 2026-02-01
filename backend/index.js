const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Adatbázis kapcsolat beállítása (A docker-compose.yml adatai alapján)
const pool = new Pool({
  user: 'user',
  host: 'localhost',
  database: 'fleetdb',
  password: 'password123',
  port: 5432,
});

// Teszt útvonal: Ellenőrizzük, hogy él-e a kapcsolat
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'A backend sikeresen csatlakozott az adatbázishoz!', 
      dbTime: result.rows[0].now 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 A szerver pörög a http://localhost:${PORT} címen`);
  console.log(`Kattints ide a teszthez: http://localhost:5000/api/test`);
});