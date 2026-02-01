const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Adatbázis kapcsolat
const pool = new Pool({
  user: 'user',
  host: 'localhost',
  database: 'fleetdb',
  password: 'password123',
  port: 5432,
});

// --- ADATBÁZIS SÉMA LÉTREHOZÁSA ---
const initDb = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      license_plate VARCHAR(20) UNIQUE NOT NULL,
      brand VARCHAR(50) NOT NULL,
      model VARCHAR(50) NOT NULL,
      year_of_manufacture INTEGER,
      vin VARCHAR(17) UNIQUE,
      fuel_type VARCHAR(20),
      transmission VARCHAR(20),
      engine_capacity INTEGER,
      current_km INTEGER DEFAULT 0,
      status VARCHAR(30) DEFAULT 'available',
      technical_exam_until DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sticker_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      price_category VARCHAR(10)
    );

    CREATE TABLE IF NOT EXISTS vehicle_stickers (
      id SERIAL PRIMARY KEY,
      vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
      sticker_type_id INTEGER REFERENCES sticker_types(id),
      valid_until DATE NOT NULL,
      issued_at DATE DEFAULT CURRENT_DATE
    );
  `;
  try {
    await pool.query(queryText);
    console.log("✅ Profi, normalizált séma létrehozva!");
  } catch (err) {
    console.error("❌ Hiba az inicializáláskor:", err);
  }
};

const seedDb = async () => {
  try {
    // 1. Matrica típusok felvétele (ha még nincsenek)
    await pool.query(`
      INSERT INTO sticker_types (name, price_category) 
      VALUES ('Pest megyei', 'D1'), ('Országos éves', 'D1'), ('Hajdú megyei', 'D1')
      ON CONFLICT (name) DO NOTHING;
    `);

    // 2. Egy teszt autó felvétele
    const car = await pool.query(`
      INSERT INTO vehicles (license_plate, brand, model, year_of_manufacture, engine_capacity, fuel_type)
      VALUES ('ABC-123', 'Toyota', 'Corolla', 2022, 1798, 'Hybrid')
      ON CONFLICT (license_plate) DO NOTHING
      RETURNING id;
    `);

    if (car.rows.length > 0) {
      // 3. Matrica hozzárendelése az autóhoz (érvényesség: 2027-01-31)
      await pool.query(`
        INSERT INTO vehicle_stickers (vehicle_id, sticker_type_id, valid_until)
        VALUES ($1, 1, '2027-01-31');
      `, [car.rows[0].id]);
      
      console.log("🌱 Tesztadatok sikeresen elültetve!");
    }
  } catch (err) {
    console.error("❌ Hiba az adatok feltöltésekor:", err);
  }
};

// Hívd meg az initDb után
initDb().then(() => seedDb());

// --- ÚTVONALAK (ROUTES) ---

// Alap teszt
app.get('/api/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, dbTime: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Összes autó lekérése a matricáikkal együtt + OKOS SZŰRÉS
app.get('/api/vehicles-full', async (req, res) => {
  // 1. Kiszedjük a szűrési feltételeket a linkből
  const { brand, fuel_type, license_plate } = req.query;
  
  // 2. Alap lekérdezés felépítése
  let queryText = `
    SELECT 
      v.*, 
      COALESCE(
        json_agg(
          json_build_object(
            'type', st.name, 
            'valid_until', vs.valid_until
          )
        ) FILTER (WHERE st.name IS NOT NULL), '[]'
      ) AS stickers
    FROM vehicles v
    LEFT JOIN vehicle_stickers vs ON v.id = vs.vehicle_id
    LEFT JOIN sticker_types st ON vs.sticker_type_id = st.id
    WHERE 1=1
  `;

  const values = [];
  let paramCount = 1;

  // 3. Dinamikusan hozzáadjuk a szűrőket, ha vannak megadva
  if (brand) {
    queryText += ` AND v.brand ILIKE $${paramCount++}`;
    values.push(`%${brand}%`);
  }
  if (fuel_type) {
    queryText += ` AND v.fuel_type ILIKE $${paramCount++}`;
    values.push(`%${fuel_type}%`);
  }
  if (license_plate) {
    queryText += ` AND v.license_plate ILIKE $${paramCount++}`;
    values.push(`%${license_plate}%`);
  }

  // 4. Csoportosítás a végére
  queryText += ` GROUP BY v.id`;

  try {
    const result = await pool.query(queryText, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Szűrési hiba:", err);
    res.status(500).json({ error: err.message });
  }
});

// B OPCIÓ: Lejáró vagy már lejárt matricák lekérése
app.get('/api/alerts/expiring-stickers', async (req, res) => {
  // A napok számát a linkből vesszük (?days=30), vagy alapból 30 nap
  const days = req.query.days || 30; 

  const queryText = `
    SELECT 
      v.license_plate, 
      v.brand, 
      v.model, 
      st.name AS sticker_name, 
      vs.valid_until,
      vs.valid_until - CURRENT_DATE AS days_left
    FROM vehicle_stickers vs
    JOIN vehicles v ON vs.vehicle_id = v.id
    JOIN sticker_types st ON vs.sticker_type_id = st.id
    WHERE vs.valid_until <= CURRENT_DATE + CAST($1 AS INTEGER)
    ORDER BY vs.valid_until ASC;
  `;

  try {
    const result = await pool.query(queryText, [days]);
    res.json({
      description: `Matricák, amik ${days} napon belül lejárnak vagy már lejártak`,
      count: result.rows.length,
      alerts: result.rows
    });
  } catch (err) {
    console.error("Hiba a lekérdezésnél:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Szerver fut: http://localhost:${PORT}`);
});