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

// --- ADATBÁZIS INICIALIZÁLÁSA ÉS OKOSÍTÁSA ---
const initDB = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(100) NOT NULL, name VARCHAR(100) NOT NULL, role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator', 'driver')))`);
        await pool.query(`CREATE TABLE IF NOT EXISTS sticker_types (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, price_category VARCHAR(50))`);
        await pool.query(`CREATE TABLE IF NOT EXISTS service_logs (id SERIAL PRIMARY KEY, vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE, description TEXT NOT NULL, status VARCHAR(50) DEFAULT 'Függőben', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        
        // BIZTONSÁGOS OSZLOP-HOZZÁADÁSOK (Ha már létezik, csendben továbbmegy)
        try { await pool.query(`ALTER TABLE vehicles ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`); } catch (e) {}
        try { await pool.query(`ALTER TABLE vehicles ADD COLUMN category VARCHAR(10) DEFAULT 'D1'`); } catch (e) {}
        try { await pool.query(`ALTER TABLE sticker_types ADD COLUMN price INTEGER DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE vehicle_stickers ADD COLUMN purchase_price INTEGER DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE service_logs ADD COLUMN cost INTEGER DEFAULT 0`); } catch (e) {}

        const userCheck = await pool.query("SELECT count(*) FROM users");
        if (parseInt(userCheck.rows[0].count) === 0) {
            await pool.query(`INSERT INTO users (username, password, name, role) VALUES ('admin', 'admin', 'Rendszergazda', 'admin'), ('operator', 'operator', 'Diszpécser', 'operator'), ('sofor', 'sofor', 'Teszt Sofőr', 'driver')`);
        }
        
        console.log('✅ Adatbázis inicializálva és kibővítve (Kategóriák + Történelmi árak)!');
    } catch (err) { console.error("Adatbázis hiba:", err.message); }
};
initDB();

// --- VALÓDI BEJELENTKEZÉS ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT id, username, name, role FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (result.rows.length > 0) res.json({ success: true, user: result.rows[0] });
        else res.status(401).json({ success: false, message: "Hibás felhasználónév vagy jelszó!" });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- STATISZTIKA ---
app.get('/api/stats', async (req, res) => {
    try {
        const sql = `SELECT count(*) as "totalVehicles", sum(case when fuel_type = 'Benzin' then 1 else 0 end) as gasoline, sum(case when fuel_type = 'Dízel' then 1 else 0 end) as diesel, sum(case when fuel_type = 'Elektromos' then 1 else 0 end) as electric FROM vehicles`;
        const result = await pool.query(sql);
        res.json(result.rows[0] || {});
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- FELHASZNÁLÓK ---
app.get('/api/users', async (req, res) => {
    try { res.json((await pool.query("SELECT id, username, name, role FROM users ORDER BY name ASC")).rows); } 
    catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.post('/api/users', async (req, res) => {
    const { username, password, name, role } = req.body;
    try {
        await pool.query("INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)", [username, password, name, role]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.put('/api/users/:id', async (req, res) => {
    const { username, password, name, role } = req.body;
    try {
        if (password) await pool.query("UPDATE users SET username=$1, password=$2, name=$3, role=$4 WHERE id=$5", [username, password, name, role, req.params.id]);
        else await pool.query("UPDATE users SET username=$1, name=$2, role=$3 WHERE id=$4", [username, name, role, req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- JELSZÓCSERE VÉGPONT ---
app.patch('/api/users/:id/password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        // 1. Ellenőrizzük a jelenlegi jelszót
        const userRes = await pool.query("SELECT password FROM users WHERE id = $1", [req.params.id]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: "Felhasználó nem található!" });
        if (userRes.rows[0].password !== currentPassword) return res.status(401).json({ error: "Hibás jelenlegi jelszó!" });

        // 2. Ha minden jó, felülírjuk az újra
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [newPassword, req.params.id]);
        res.json({ ok: true });
    } catch (err) { 
        console.error("Hiba jelszócserekor:", err.message);
        res.status(500).json({ error: "Szerverhiba" }); 
    }
});

// --- JÁRMŰVEK (Bővítve a Kategóriával és a Matrica árakkal) ---
app.get('/api/vehicles-full', async (req, res) => {
    try {
        const sql = `
            SELECT v.*, u.name as driver_name,
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', vs.id, 
                               'type_id', st.id,
                               'type_name', st.name, 
                               'valid_until', vs.valid_until,
                               'purchase_price', vs.purchase_price
                           )
                       ) FILTER (WHERE vs.id IS NOT NULL), '[]'
                   ) as stickers
            FROM vehicles v
            LEFT JOIN vehicle_stickers vs ON v.id = vs.vehicle_id
            LEFT JOIN sticker_types st ON vs.sticker_type_id = st.id
            LEFT JOIN users u ON v.user_id = u.id 
            GROUP BY v.id, u.name ORDER BY v.created_at DESC
        `;
        res.json((await pool.query(sql)).rows);
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.post('/api/vehicles', async (req, res) => {
    const { license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until, user_id, category } = req.body;
    try {
        await pool.query(
            `INSERT INTO vehicles (license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until, user_id, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, 
            [license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until || null, user_id || null, category || 'D1']
        );
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.put('/api/vehicles/:id', async (req, res) => {
    const { license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until, user_id, category } = req.body;
    try {
        await pool.query(
            `UPDATE vehicles SET license_plate=$1, brand=$2, model=$3, year_of_manufacture=$4, vin=$5, fuel_type=$6, transmission=$7, engine_capacity=$8, current_km=$9, status=$10, technical_exam_until=$11, user_id=$12, category=$13 WHERE id=$14`, 
            [license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until || null, user_id || null, category || 'D1', req.params.id]
        );
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM service_logs WHERE vehicle_id = $1", [req.params.id]);
        await pool.query("DELETE FROM vehicle_stickers WHERE vehicle_id = $1", [req.params.id]);
        await pool.query("DELETE FROM vehicles WHERE id = $1", [req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- MATRICA BEÁLLÍTÁSOK (Bővítve árral) ---
app.get('/api/sticker-types', async (req, res) => {
    try { res.json((await pool.query("SELECT * FROM sticker_types ORDER BY name ASC")).rows); } 
    catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.post('/api/sticker-types', async (req, res) => {
    try {
        await pool.query("INSERT INTO sticker_types (name, price_category, price) VALUES ($1, $2, $3)", [req.body.name, req.body.price_category, req.body.price]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.put('/api/sticker-types/:id', async (req, res) => {
    try {
        await pool.query("UPDATE sticker_types SET name=$1, price_category=$2, price=$3 WHERE id=$4", [req.body.name, req.body.price_category, req.body.price, req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.delete('/api/sticker-types/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM vehicle_stickers WHERE sticker_type_id = $1", [req.params.id]);
        await pool.query("DELETE FROM sticker_types WHERE id = $1", [req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- AKTÍV MATRICÁK KEZELÉSE (Új PUT és DELETE végpontok!) ---
app.post('/api/stickers', async (req, res) => {
    try {
        await pool.query(
            "INSERT INTO vehicle_stickers (vehicle_id, sticker_type_id, valid_until, purchase_price, issued_at) VALUES ($1, $2, $3, $4, CURRENT_DATE)", 
            [req.body.vehicle_id, req.body.sticker_type_id, req.body.valid_until, req.body.purchase_price || 0]
        );
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.put('/api/stickers/:id', async (req, res) => {
    try {
        await pool.query(
            "UPDATE vehicle_stickers SET sticker_type_id=$1, valid_until=$2, purchase_price=$3 WHERE id=$4", 
            [req.body.sticker_type_id, req.body.valid_until, req.body.purchase_price, req.params.id]
        );
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.delete('/api/stickers/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM vehicle_stickers WHERE id = $1", [req.params.id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- SZERVIZNAPLÓ ---
app.post('/api/service-logs', async (req, res) => {
    try {
        await pool.query("INSERT INTO service_logs (vehicle_id, description) VALUES ($1, $2)", [req.body.vehicle_id, req.body.description]);
        await pool.query("UPDATE vehicles SET status = 'Szervizben' WHERE id = $1", [req.body.vehicle_id]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.get('/api/service-logs', async (req, res) => {
    try { res.json((await pool.query("SELECT s.*, v.license_plate, v.brand, v.model FROM service_logs s JOIN vehicles v ON s.vehicle_id = v.id ORDER BY s.created_at DESC")).rows); } 
    catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.patch('/api/service-logs/:id', async (req, res) => {
    try {
        // VÉDŐHÁLÓ: Ha nincs req.body, vagy nincs benne cost, akkor 0 legyen.
        const cost = (req.body && req.body.cost) ? req.body.cost : 0; 
        
        const vehicleIdRes = await pool.query("SELECT vehicle_id FROM service_logs WHERE id = $1", [req.params.id]);
        
        if (vehicleIdRes.rows.length > 0) {
            await pool.query("UPDATE service_logs SET status = 'Megoldva', cost = $1 WHERE id = $2", [cost, req.params.id]);
            await pool.query("UPDATE vehicles SET status = 'Aktív' WHERE id = $1", [vehicleIdRes.rows[0].vehicle_id]);
        }
        res.json({ ok: true });
    } catch (err) { 
        console.error("Hiba a szerviz megoldásakor:", err.message);
        res.status(500).json({ error: "Szerverhiba" }); 
    }
});

app.listen(PORT, () => console.log(`🚀 Flotta Backend fut: http://localhost:${PORT}`));