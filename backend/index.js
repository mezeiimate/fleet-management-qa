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

const initDB = async () => {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(100) NOT NULL, name VARCHAR(100) NOT NULL, role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator', 'driver')))`);
        await pool.query(`CREATE TABLE IF NOT EXISTS sticker_types (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, price_category VARCHAR(50))`);
        await pool.query(`CREATE TABLE IF NOT EXISTS service_logs (id SERIAL PRIMARY KEY, vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE, description TEXT NOT NULL, status VARCHAR(50) DEFAULT 'Függőben', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        
        try { await pool.query(`ALTER TABLE vehicles ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`); } catch (e) {}
        try { await pool.query(`ALTER TABLE vehicles ADD COLUMN category VARCHAR(10) DEFAULT 'D1'`); } catch (e) {}
        try { await pool.query(`ALTER TABLE sticker_types ADD COLUMN price INTEGER DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE vehicle_stickers ADD COLUMN purchase_price INTEGER DEFAULT 0`); } catch (e) {}
        try { await pool.query(`ALTER TABLE service_logs ADD COLUMN cost INTEGER DEFAULT 0`); } catch (e) {}

        const userCheck = await pool.query("SELECT count(*) FROM users");
        if (parseInt(userCheck.rows[0].count) === 0) {
            await pool.query(`INSERT INTO users (username, password, name, role) VALUES ('admin', 'admin', 'Rendszergazda', 'admin'), ('operator', 'operator', 'Diszpécser', 'operator'), ('sofor', 'sofor', 'Teszt Sofőr', 'driver')`);
        }
        console.log('✅ Adatbázis inicializálva!');
    } catch (err) { console.error("Adatbázis hiba:", err.message); }
};
initDB();

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT id, username, name, role FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (result.rows.length > 0) res.json({ success: true, user: result.rows[0] });
        else res.status(401).json({ success: false, message: "Hibás felhasználónév vagy jelszó!" });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- STATISZTIKA & RIASZTÁSOK ---
app.get('/api/stats', async (req, res) => { /*...marad, ahogy volt...*/ 
    try { const sql = `SELECT count(*) as "totalVehicles", COALESCE(sum(case when fuel_type = 'Benzin' then 1 else 0 end), 0) as gasoline, COALESCE(sum(case when fuel_type = 'Dízel' then 1 else 0 end), 0) as diesel, COALESCE(sum(case when fuel_type = 'Elektromos' then 1 else 0 end), 0) as electric, COALESCE(sum(case when fuel_type = 'Hibrid' then 1 else 0 end), 0) as hybrid, COALESCE(sum(case when status = 'Aktív' then 1 else 0 end), 0) as active, COALESCE(sum(case when status = 'Szervizben' then 1 else 0 end), 0) as service, COALESCE(sum(case when status = 'Inaktív' then 1 else 0 end), 0) as inactive, COALESCE(sum(case when category = 'D1' then 1 else 0 end), 0) as d1, COALESCE(sum(case when category = 'D1m' then 1 else 0 end), 0) as d1m, COALESCE(sum(case when category = 'D2' then 1 else 0 end), 0) as d2, COALESCE(sum(case when category = 'U' then 1 else 0 end), 0) as u FROM vehicles WHERE status != 'Archivált'`; res.json((await pool.query(sql)).rows[0] || {}); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});
app.get('/api/alerts', async (req, res) => { /*...marad...*/ 
    try { let alerts = []; let counter = 1; const serviceRes = await pool.query(`SELECT s.description, v.license_plate, v.brand, v.model, COALESCE(u.name, 'Nincs kiutalva') as driver_name FROM service_logs s JOIN vehicles v ON s.vehicle_id = v.id LEFT JOIN users u ON v.user_id = u.id WHERE s.status = 'Függőben' AND v.status != 'Archivált'`); serviceRes.rows.forEach(row => alerts.push({ id: counter++, type: 'hiba', plate: row.license_plate, makeModel: `${row.brand} ${row.model}`, driver: row.driver_name, description: row.description })); const examRes = await pool.query(`SELECT v.license_plate, v.brand, v.model, COALESCE(u.name, 'Nincs kiutalva') as driver_name, TO_CHAR(v.technical_exam_until, 'YYYY. MM. DD.') as formatted_date FROM vehicles v LEFT JOIN users u ON v.user_id = u.id WHERE v.technical_exam_until IS NOT NULL AND v.technical_exam_until <= CURRENT_DATE + INTERVAL '30 days' AND v.status != 'Archivált'`); examRes.rows.forEach(row => alerts.push({ id: counter++, type: 'lejarat', plate: row.license_plate, makeModel: `${row.brand} ${row.model}`, driver: row.driver_name, description: 'Műszaki vizsga', validityDate: row.formatted_date })); const stickerRes = await pool.query(`SELECT v.license_plate, v.brand, v.model, COALESCE(u.name, 'Nincs kiutalva') as driver_name, st.name as sticker_name, TO_CHAR(vs.valid_until, 'YYYY. MM. DD.') as formatted_date FROM vehicle_stickers vs JOIN vehicles v ON vs.vehicle_id = v.id JOIN sticker_types st ON vs.sticker_type_id = st.id LEFT JOIN users u ON v.user_id = u.id WHERE vs.valid_until IS NOT NULL AND vs.valid_until <= CURRENT_DATE + INTERVAL '30 days' AND v.status != 'Archivált'`); stickerRes.rows.forEach(row => alerts.push({ id: counter++, type: 'lejarat', plate: row.license_plate, makeModel: `${row.brand} ${row.model}`, driver: row.driver_name, description: row.sticker_name, validityDate: row.formatted_date })); res.json(alerts); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

// --- FELHASZNÁLÓK ---
app.get('/api/users', async (req, res) => { try { res.json((await pool.query("SELECT id, username, name, role FROM users ORDER BY name ASC")).rows); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.post('/api/users', async (req, res) => { try { await pool.query("INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)", [req.body.username, req.body.password, req.body.name, req.body.role]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba vagy a felhasználónév már foglalt!" }); } });
app.put('/api/users/:id', async (req, res) => { try { await pool.query("UPDATE users SET username=$1, name=$2, role=$3 WHERE id=$4", [req.body.username, req.body.name, req.body.role, req.params.id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba vagy a felhasználónév már foglalt!" }); } });
app.patch('/api/users/:id/password', async (req, res) => { try { await pool.query("UPDATE users SET password=$1 WHERE id=$2", [req.body.password, req.params.id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.delete('/api/users/:id', async (req, res) => { try { await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Hiba! Lehet, hogy a felhasználóhoz még van rendelve jármű." }); } });

// --- JÁRMŰVEK ---
app.get('/api/vehicles-full', async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const whereClause = includeArchived ? "" : "WHERE v.status != 'Archivált'";
        const sql = `SELECT v.*, u.name as driver_name, COALESCE(json_agg(json_build_object('id', vs.id, 'type_id', st.id, 'type_name', st.name, 'valid_until', vs.valid_until, 'purchase_price', vs.purchase_price)) FILTER (WHERE vs.id IS NOT NULL), '[]') as stickers FROM vehicles v LEFT JOIN vehicle_stickers vs ON v.id = vs.vehicle_id LEFT JOIN sticker_types st ON vs.sticker_type_id = st.id LEFT JOIN users u ON v.user_id = u.id ${whereClause} GROUP BY v.id, u.name ORDER BY v.created_at DESC`;
        res.json((await pool.query(sql)).rows);
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});
app.post('/api/vehicles', async (req, res) => { try { await pool.query(`INSERT INTO vehicles (license_plate, brand, model, year_of_manufacture, vin, fuel_type, transmission, engine_capacity, current_km, status, technical_exam_until, user_id, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [req.body.license_plate, req.body.brand, req.body.model, req.body.year_of_manufacture, req.body.vin, req.body.fuel_type, req.body.transmission, req.body.engine_capacity, req.body.current_km, req.body.status, req.body.technical_exam_until || null, req.body.user_id || null, req.body.category || 'D1']); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.put('/api/vehicles/:id', async (req, res) => { try { await pool.query(`UPDATE vehicles SET license_plate=$1, brand=$2, model=$3, year_of_manufacture=$4, vin=$5, fuel_type=$6, transmission=$7, engine_capacity=$8, current_km=$9, status=$10, technical_exam_until=$11, user_id=$12, category=$13 WHERE id=$14`, [req.body.license_plate, req.body.brand, req.body.model, req.body.year_of_manufacture, req.body.vin, req.body.fuel_type, req.body.transmission, req.body.engine_capacity, req.body.current_km, req.body.status, req.body.technical_exam_until || null, req.body.user_id || null, req.body.category || 'D1', req.params.id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.delete('/api/vehicles/:id', async (req, res) => { try { await pool.query("UPDATE vehicles SET status = 'Archivált' WHERE id = $1", [req.params.id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });

// --- MATRICÁK (Járművekhez rendelt) ---
app.post('/api/stickers', async (req, res) => { try { await pool.query("INSERT INTO vehicle_stickers (vehicle_id, sticker_type_id, valid_until, purchase_price, issued_at) VALUES ($1, $2, $3, $4, CURRENT_DATE)", [req.body.vehicle_id, req.body.sticker_type_id, req.body.valid_until, req.body.purchase_price || 0]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.delete('/api/stickers/:id', async (req, res) => { try { await pool.query("DELETE FROM vehicle_stickers WHERE id = $1", [req.params.id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });

// --- MATRICA TÖRZSDATOK (Árak és Kategóriák kezelése) ---
app.get('/api/sticker-types', async (req, res) => { try { res.json((await pool.query("SELECT * FROM sticker_types ORDER BY price_category ASC, price ASC")).rows); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.post('/api/sticker-types', async (req, res) => { try { await pool.query("INSERT INTO sticker_types (name, price_category, price) VALUES ($1, $2, $3)", [req.body.name, req.body.price_category, req.body.price]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.put('/api/sticker-types/:id', async (req, res) => { try { await pool.query("UPDATE sticker_types SET name=$1, price_category=$2, price=$3 WHERE id=$4", [req.body.name, req.body.price_category, req.body.price, req.params.id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.delete('/api/sticker-types/:id', async (req, res) => { try { await pool.query("DELETE FROM sticker_types WHERE id=$1", [req.params.id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Hiba! Lehet, hogy ezt a matrica típust már hozzárendelted egy autóhoz." }); } });
// --- SZERVIZ ÉS ESEMÉNYEK ---
app.get('/api/service-logs', async (req, res) => { try { const sql = `SELECT s.*, v.license_plate, v.brand, v.model FROM service_logs s JOIN vehicles v ON s.vehicle_id = v.id ORDER BY s.created_at DESC`; res.json((await pool.query(sql)).rows); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.post('/api/service-logs', async (req, res) => { try { await pool.query("INSERT INTO service_logs (vehicle_id, description) VALUES ($1, $2)", [req.body.vehicle_id, req.body.description]); await pool.query("UPDATE vehicles SET status = 'Szervizben' WHERE id = $1", [req.body.vehicle_id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.delete('/api/service-logs/:id', async (req, res) => { try { await pool.query("DELETE FROM service_logs WHERE id = $1", [req.params.id]); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });
app.patch('/api/service-logs/:id', async (req, res) => { try { const cost = (req.body && req.body.cost) ? req.body.cost : 0; const vehicleIdRes = await pool.query("SELECT vehicle_id FROM service_logs WHERE id = $1", [req.params.id]); if (vehicleIdRes.rows.length > 0) { await pool.query("UPDATE service_logs SET status = 'Megoldva', cost = $1 WHERE id = $2", [cost, req.params.id]); await pool.query("UPDATE vehicles SET status = 'Aktív' WHERE id = $1", [vehicleIdRes.rows[0].vehicle_id]); } res.json({ ok: true }); } catch (err) { res.status(500).json({ error: "Szerverhiba" }); } });

// --- SOFŐR NÉZET VÉGPONTOK (ÚJ!) ---
app.get('/api/my-vehicles/:userId', async (req, res) => {
    try {
        const sql = `
            SELECT v.*, 
                   COALESCE(json_agg(json_build_object('id', vs.id, 'type_name', st.name, 'valid_until', vs.valid_until)) FILTER (WHERE vs.id IS NOT NULL), '[]') as stickers,
                   (SELECT json_agg(json_build_object('id', s.id, 'description', s.description, 'status', s.status, 'created_at', s.created_at)) FROM service_logs s WHERE s.vehicle_id = v.id) as service_history
            FROM vehicles v
            LEFT JOIN vehicle_stickers vs ON v.id = vs.vehicle_id
            LEFT JOIN sticker_types st ON vs.sticker_type_id = st.id
            WHERE v.user_id = $1 AND v.status != 'Archivált'
            GROUP BY v.id ORDER BY v.created_at DESC
        `;
        res.json((await pool.query(sql, [req.params.userId])).rows);
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.post('/api/update-km', async (req, res) => {
    const { vehicle_id, new_km } = req.body;
    try {
        await pool.query("UPDATE vehicles SET current_km = $1 WHERE id = $2", [new_km, vehicle_id]);
        // Azonnal "Megoldva" státusszal mentjük az eseményt 0 Ft-tal, hogy a Pénzügyi Történetbe menjen!
        await pool.query("INSERT INTO service_logs (vehicle_id, description, status, cost) VALUES ($1, $2, 'Megoldva', 0)", [vehicle_id, `Kilométeróra frissítés: ${new_km} km`]);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: "Szerverhiba" }); }
});

app.listen(PORT, () => console.log(`🚀 Flotta Backend fut: http://localhost:${PORT}`));