const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./fleet.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, name TEXT, role TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (id INTEGER PRIMARY KEY AUTOINCREMENT, license_plate TEXT UNIQUE, brand TEXT, model TEXT, year INTEGER, vin TEXT, fuel_type TEXT, user_id INTEGER, FOREIGN KEY (user_id) REFERENCES users(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle_id INTEGER, description TEXT, status TEXT DEFAULT 'Pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (vehicle_id) REFERENCES vehicles(id))`);

    db.get("SELECT count(*) as count FROM users", (err, row) => {
        if (row.count === 0) {
            db.run("INSERT INTO users (username, password, name, role) VALUES ('admin', 'admin', 'Rendszergazda', 'admin')");
        }
    });
});

// LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT id, username, name, role FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
        if (user) res.json({ success: true, user });
        else res.status(401).json({ success: false, message: "Hibás adatok!" });
    });
});

// STATISZTIKA
app.get('/api/stats', (req, res) => {
    const sql = `SELECT count(*) as totalVehicles, 
                 sum(case when fuel_type = 'Benzin' then 1 else 0 end) as gasoline,
                 sum(case when fuel_type = 'Dízel' then 1 else 0 end) as diesel,
                 sum(case when fuel_type = 'Elektromos' then 1 else 0 end) as electric
                 FROM vehicles`;
    db.get(sql, [], (err, row) => res.json(row || {}));
});

// JÁRMŰVEK - Most már a hibajelentésekkel együtt!
app.get('/api/vehicles-full', (req, res) => {
    const sqlVehicles = "SELECT v.*, u.name as driver_name FROM vehicles v LEFT JOIN users u ON v.user_id = u.id";
    const sqlReports = "SELECT * FROM reports WHERE status = 'Pending'";

    db.all(sqlVehicles, [], (err, vehicles) => {
        db.all(sqlReports, [], (err, reports) => {
            const result = vehicles.map(v => ({
                ...v,
                reports: reports.filter(r => r.vehicle_id === v.id)
            }));
            res.json(result);
        });
    });
});

app.get('/api/my-vehicles/:userId', (req, res) => {
    db.all("SELECT * FROM vehicles WHERE user_id = ?", [req.params.userId], (err, rows) => res.json(rows));
});

app.post('/api/vehicles', (req, res) => {
    const { license_plate, brand, model, year, vin, fuel_type, user_id } = req.body;
    db.run(`INSERT INTO vehicles (license_plate, brand, model, year, vin, fuel_type, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
    [license_plate, brand, model, year, vin, fuel_type, user_id || null], () => res.json({ ok: true }));
});

app.put('/api/vehicles/:id', (req, res) => {
    const { license_plate, brand, model, year, vin, fuel_type, user_id } = req.body;
    db.run(`UPDATE vehicles SET license_plate=?, brand=?, model=?, year=?, vin=?, fuel_type=?, user_id=? WHERE id=?`, 
    [license_plate, brand, model, year, vin, fuel_type, user_id || null, req.params.id], () => res.json({ ok: true }));
});

app.delete('/api/vehicles/:id', (req, res) => {
    db.run("DELETE FROM vehicles WHERE id = ?", req.params.id, () => res.json({ ok: true }));
});

// USERS
app.get('/api/users', (req, res) => {
    db.all("SELECT id, username, password, name, role FROM users", [], (err, rows) => res.json(rows));
});

app.post('/api/users', (req, res) => {
    const { username, password, name, role } = req.body;
    db.run("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)", [username, password, name, role], () => res.json({ ok: true }));
});

app.delete('/api/users/:id', (req, res) => {
    db.run("UPDATE vehicles SET user_id = NULL WHERE user_id = ?", [req.params.id], () => {
        db.run("DELETE FROM users WHERE id = ?", req.params.id, () => res.json({ m: "ok" }));
    });
});

// REPORTS
app.get('/api/reports', (req, res) => {
    const sql = `SELECT r.*, v.license_plate, v.brand, v.model FROM reports r JOIN vehicles v ON r.vehicle_id = v.id ORDER BY r.created_at DESC`;
    db.all(sql, [], (err, rows) => res.json(rows));
});

app.post('/api/reports', (req, res) => {
    const { vehicle_id, description } = req.body;
    db.run("INSERT INTO reports (vehicle_id, description) VALUES (?, ?)", [vehicle_id, description], () => res.json({ ok: true }));
});

app.patch('/api/reports/:id', (req, res) => {
    db.run("UPDATE reports SET status = ? WHERE id = ?", [req.body.status, req.params.id], () => res.json({ ok: true }));
});

app.listen(PORT, () => console.log(`🚀 Szerver fut: http://localhost:${PORT}`));