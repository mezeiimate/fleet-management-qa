const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 1. PostgreSQL Kapcsolat
const pool = new Pool({
    user: 'user',
    host: 'localhost',
    database: 'fleetdb',
    password: 'password123',
    port: 5432,
});

pool.on('connect', () => {
    console.log('✅ Sikeres csatlakozás a PostgreSQL adatbázishoz!');
});

// --- IDEIGLENES LOGIN (Mivel a users tábla megszűnt) ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin') {
        res.json({ success: true, user: { id: 1, username: 'admin', name: 'Flottamenedzser', role: 'admin' } });
    } else {
        res.status(401).json({ success: false, message: "Hibás adatok!" });
    }
});

// --- STATISZTIKA ---
app.get('/api/stats', async (req, res) => {
    try {
        const sql = `SELECT 
            count(*) as "totalVehicles", 
            sum(case when fuel_type = 'Benzin' then 1 else 0 end) as gasoline,
            sum(case when fuel_type = 'Dízel' then 1 else 0 end) as diesel,
            sum(case when fuel_type = 'Elektromos' then 1 else 0 end) as electric
            FROM vehicles`;
        const result = await pool.query(sql);
        res.json(result.rows[0] || {});
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- JÁRMŰVEK LISTÁZÁSA (Matricákkal együtt) ---
app.get('/api/vehicles-full', async (req, res) => {
    try {
        // Lekérjük a járműveket, és hozzácsapjuk a hozzájuk tartozó matricákat
        const sql = `
            SELECT v.*, 
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', vs.id,
                               'type_name', st.name,
                               'valid_until', vs.valid_until
                           )
                       ) FILTER (WHERE vs.id IS NOT NULL), '[]'
                   ) as stickers
            FROM vehicles v
            LEFT JOIN vehicle_stickers vs ON v.id = vs.vehicle_id
            LEFT JOIN sticker_types st ON vs.sticker_type_id = st.id
            GROUP BY v.id
            ORDER BY v.created_at DESC
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Szerverhiba a listázáskor" });
    }
});

// --- ÚJ JÁRMŰ FELVÉTELE ---
app.post('/api/vehicles', async (req, res) => {
    const { 
        license_plate, brand, model, year_of_manufacture, 
        vin, fuel_type, transmission, engine_capacity, 
        current_km, status, technical_exam_until 
    } = req.body;

    // --- 1. QA: VALIDÁCIÓ ---
    const currentYear = new Date().getFullYear();
    
    if (!year_of_manufacture || year_of_manufacture < 1900 || year_of_manufacture > currentYear + 1) {
        return res.status(400).json({ error: `Az évjáratnak 1900 és ${currentYear + 1} között kell lennie!` });
    }

    if (!license_plate) {
        return res.status(400).json({ error: "A rendszám megadása kötelező!" });
    }

    const cleanPlate = license_plate.toUpperCase().replace(/[-\s]/g, ''); 
    const isValidLength = cleanPlate.length === 6 || cleanPlate.length === 7;
    const isCorrectFormat = /^[A-Z]{3,6}[0-9]{1,4}$/.test(cleanPlate);
    const isNotOnlyZeroes = !/[A-Z]0+$/.test(cleanPlate); 

    if (!isValidLength || !isCorrectFormat || !isNotOnlyZeroes) {
        return res.status(400).json({ error: "Érvénytelen rendszám formátum!" });
    }

    // --- 2. MENTÉS ---
    try {
        const sql = `
            INSERT INTO vehicles (
                license_plate, brand, model, year_of_manufacture, 
                vin, fuel_type, transmission, engine_capacity, 
                current_km, status, technical_exam_until, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP) 
            RETURNING id
        `;
        
        const values = [
            cleanPlate, brand, model, year_of_manufacture, 
            vin, fuel_type, transmission, engine_capacity, 
            current_km, status || 'Aktív', technical_exam_until || null
        ];

        const result = await pool.query(sql, values);
        res.json({ ok: true, inserted_id: result.rows[0].id });
    } catch (err) {
        console.error("Hiba:", err.message);
        if (err.code === '23505') { // Postgres Unique constraint hiba (pl. már létező rendszám)
            return res.status(400).json({ error: "Ez a rendszám vagy alvázszám már létezik!" });
        }
        res.status(500).json({ error: "Adatbázis hiba mentéskor" });
    }
});

// --- JÁRMŰ TÖRLÉSE ---
app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        // Először a matricákat kell törölni a foreign key miatt
        await pool.query("DELETE FROM vehicle_stickers WHERE vehicle_id = $1", [req.params.id]);
        await pool.query("DELETE FROM vehicles WHERE id = $1", [req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- MATRICA TÍPUSOK LISTÁZÁSA ---
app.get('/api/sticker-types', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM sticker_types ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- ÚJ MATRICA HOZZÁRENDELÉSE AUTÓHOZ ---
app.post('/api/stickers', async (req, res) => {
    const { vehicle_id, sticker_type_id, valid_until, issued_at } = req.body;
    try {
        await pool.query(
            "INSERT INTO vehicle_stickers (vehicle_id, sticker_type_id, valid_until, issued_at) VALUES ($1, $2, $3, $4)",
            [vehicle_id, sticker_type_id, valid_until, issued_at || new Date()]
        );
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.listen(PORT, () => console.log(`🚀 Flotta Backend fut (PostgreSQL): http://localhost:${PORT}`));