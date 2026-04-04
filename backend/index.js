const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'user',
    host: 'localhost',
    database: 'fleetdb',
    password: 'password123',
    port: 5432,
});

// --- ADATBÁZIS INICIALIZÁLÁSA ÉS BŐVÍTÉSE ---
const initDB = async () => {
    try {
        // 1. Felhasználók tábla
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator', 'driver'))
            )
        `);

        // 2. Szerviznapló tábla
        await pool.query(`
            CREATE TABLE IF NOT EXISTS service_logs (
                id SERIAL PRIMARY KEY,
                vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'Függőben',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Járművek tábla bővítése a sofőr azonosítójával (ha még nincs benne)
        try {
            await pool.query(`ALTER TABLE vehicles ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
            console.log('✅ Járművek tábla bővítve a user_id oszloppal!');
        } catch (err) {
            // Ha a hiba az, hogy már létezik az oszlop, azt csendben ignoráljuk
            if (err.code !== '42701') console.error("Hiba az oszlop hozzáadásakor:", err);
        }

        // 4. Alapértelmezett felhasználók feltöltése (ha üres a tábla)
        const userCheck = await pool.query("SELECT count(*) FROM users");
        if (parseInt(userCheck.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO users (username, password, name, role) VALUES 
                ('admin', 'admin', 'Rendszergazda', 'admin'),
                ('operator', 'operator', 'Diszpécser', 'operator'),
                ('sofor', 'sofor', 'Teszt Sofőr', 'driver')
            `);
            console.log('✅ 3 alapértelmezett teszt-fiók létrehozva!');
        }

        console.log('✅ Adatbázis inicializálás kész!');
    } catch (err) {
        console.error("Adatbázis inicializálási hiba:", err);
    }
};
initDB();

// --- VALÓDI BEJELENTKEZÉS ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT id, username, name, role FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: "Hibás felhasználónév vagy jelszó!" });
        }
    } catch (err) { res.status(500).json({ error: "Szerverhiba a bejelentkezéskor" }); }
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
    } catch (err) { res.status(500).json({ error: "Szerverhiba a statisztikánál" }); }
});

// --- FELHASZNÁLÓK KEZELÉSE ---
app.get('/api/users', async (req, res) => {
    try {
        // A jelszót direkt nem küldjük ki a böngészőnek biztonsági okokból!
        const result = await pool.query("SELECT id, username, name, role FROM users ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.post('/api/users', async (req, res) => {
    const { username, password, name, role } = req.body;
    try {
        await pool.query("INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)", [username, password, name, role]);
        res.json({ ok: true });
    } catch (err) { 
        if (err.code === '23505') return res.status(400).json({ error: "Ez a felhasználónév már foglalt!" });
        res.status(500).json({ error: "Szerverhiba" }); 
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        // Ha törlünk egy sofőrt, az autójánál a user_id automatikusan null-ra áll (ON DELETE SET NULL)
        await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});


// --- JÁRMŰVEK (Bővítve a sofőr nevével) ---
app.get('/api/vehicles-full', async (req, res) => {
    try {
        const sql = `
            SELECT v.*, u.name as driver_name,
                   COALESCE(
                       json_agg(
                           json_build_object('id', vs.id, 'type_name', st.name, 'valid_until', vs.valid_until)
                       ) FILTER (WHERE vs.id IS NOT NULL), '[]'
                   ) as stickers
            FROM vehicles v
            LEFT JOIN vehicle_stickers vs ON v.id = vs.vehicle_id
            LEFT JOIN sticker_types st ON vs.sticker_type_id = st.id
            LEFT JOIN users u ON v.user_id = u.id 
            GROUP BY v.id, u.name
            ORDER BY v.created_at DESC
        `;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.post('/api/vehicles', async (req, res) => {
    const { license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until, user_id } = req.body;
    try {
        const sql = `INSERT INTO vehicles (license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until, user_id, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP) RETURNING id`;
        const values = [license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status || 'Aktív', technical_exam_until || null, user_id || null];
        const result = await pool.query(sql, values);
        res.json({ ok: true, inserted_id: result.rows[0].id });
    } catch (err) { res.status(500).json({ error: "Szerverhiba mentéskor" }); }
});

app.put('/api/vehicles/:id', async (req, res) => {
    const { license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until, user_id } = req.body;
    try {
        const sql = `UPDATE vehicles SET 
            license_plate=$1, brand=$2, model=$3, year_of_manufacture=$4, vin=$5, fuel_type=$6, transmission=$7, engine_capacity=$8, current_km=$9, status=$10, technical_exam_until=$11, user_id=$12
            WHERE id=$13`;
        const values = [license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until || null, user_id || null, req.params.id];
        await pool.query(sql, values);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba módosításkor" }); }
});

app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM service_logs WHERE vehicle_id = $1", [req.params.id]);
        await pool.query("DELETE FROM vehicle_stickers WHERE vehicle_id = $1", [req.params.id]);
        await pool.query("DELETE FROM vehicles WHERE id = $1", [req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- MATRICÁK ---
app.get('/api/sticker-types', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM sticker_types ORDER BY name ASC");
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.post('/api/stickers', async (req, res) => {
    const { vehicle_id, sticker_type_id, valid_until } = req.body;
    try {
        await pool.query("INSERT INTO vehicle_stickers (vehicle_id, sticker_type_id, valid_until, issued_at) VALUES ($1, $2, $3, CURRENT_DATE)", [vehicle_id, sticker_type_id, valid_until]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- SZERVIZNAPLÓ ---
app.post('/api/service-logs', async (req, res) => {
    const { vehicle_id, description } = req.body;
    try {
        await pool.query("INSERT INTO service_logs (vehicle_id, description) VALUES ($1, $2)", [vehicle_id, description]);
        await pool.query("UPDATE vehicles SET status = 'Szervizben' WHERE id = $1", [vehicle_id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba a bejelentéskor" }); }
});

app.get('/api/service-logs', async (req, res) => {
    try {
        const sql = `SELECT s.*, v.license_plate, v.brand, v.model FROM service_logs s JOIN vehicles v ON s.vehicle_id = v.id ORDER BY s.created_at DESC`;
        const result = await pool.query(sql);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.patch('/api/service-logs/:id', async (req, res) => {
    const logId = req.params.id;
    try {
        const logRes = await pool.query("SELECT vehicle_id FROM service_logs WHERE id = $1", [logId]);
        if (logRes.rows.length === 0) return res.status(404).json({error: "Hiba nem található"});
        const vehicleId = logRes.rows[0].vehicle_id;

        await pool.query("UPDATE service_logs SET status = 'Megoldva' WHERE id = $1", [logId]);
        await pool.query("UPDATE vehicles SET status = 'Aktív' WHERE id = $1", [vehicleId]);
        res.json({ ok: true });
    } catch (err) { 
        console.error("❌ Hiba a szerviz frissítésekor:", err.message);
        res.status(500).json({ error: "Szerverhiba a státusz frissítésekor" }); 
    }
});

app.listen(PORT, () => console.log(`🚀 Flotta Backend fut: http://localhost:${PORT}`));