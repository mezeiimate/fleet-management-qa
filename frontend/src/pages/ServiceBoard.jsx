import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ServiceBoard({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVehicleId, setFilterVehicleId] = useState(''); // ÚJ: Szűrő állapota

  const fetchLogs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/service-logs');
      setLogs(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Hiba a szerviznapló lekérésekor:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleResolve = async (id) => {
    if (window.confirm("Biztosan elhárítottátok a hibát? A jármű ezzel újra 'Aktív' státuszba kerül a flottában!")) {
      try {
        await axios.patch(`http://localhost:5000/api/service-logs/${id}`);
        fetchLogs(); 
      } catch (err) {
        alert("Hiba történt a művelet során.");
      }
    }
  };

  // ÚJ: Egyedi járművek kigyűjtése a legördülő menühöz
  const uniqueVehicles = [];
  const map = new Map();
  for (const item of logs) {
      if(!map.has(item.vehicle_id)){
          map.set(item.vehicle_id, true);
          uniqueVehicles.push({
              id: item.vehicle_id,
              license_plate: item.license_plate,
              brand: item.brand,
              model: item.model
          });
      }
  }

  // ÚJ: Szűrés alkalmazása
  const filteredLogs = filterVehicleId 
    ? logs.filter(log => log.vehicle_id.toString() === filterVehicleId.toString())
    : logs;

  // Szétválogatjuk a (már szűrt) logokat státusz szerint
  const pendingLogs = filteredLogs.filter(log => log.status !== 'Megoldva');
  const resolvedLogs = filteredLogs.filter(log => log.status === 'Megoldva');

  return (
    <div className="min-h-screen bg-[#f8fafc] relative pb-20">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">
          ← VISSZA
        </button>
        <h1 className="text-xl font-black tracking-tight italic text-slate-800">
          SZERVIZ<span className="text-red-600">NAPLÓ</span>
        </h1>
        <div className="w-20"></div> 
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div className="text-center text-slate-500 font-bold mt-20 animate-pulse">Adatok betöltése...</div>
        ) : (
          <>
            {/* ÚJ: Kereső / Szűrő sáv */}
            <div className="mb-8 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 w-full md:w-1/2">
                <span className="text-2xl ml-2">🔍</span>
                <select 
                  value={filterVehicleId} 
                  onChange={(e) => setFilterVehicleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-700"
                >
                  <option value="">Összes jármű szerviznaplója</option>
                  {uniqueVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.license_plate} - {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* BAL OSZLOP: FÜGGŐBEN */}
              <div>
                <h2 className="text-lg font-black text-red-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span>🛠️</span> Kijavítandó Hibák ({pendingLogs.length})
                </h2>
                
                <div className="space-y-4">
                  {pendingLogs.length === 0 ? (
                    <p className="text-slate-400 italic text-sm font-medium">Nincs megjeleníthető adat.</p>
                  ) : (
                    pendingLogs.map(log => (
                      <div key={log.id} className="bg-white border-l-4 border-red-500 shadow-sm rounded-2xl p-6 relative">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-2 py-1 rounded-md">
                            Függőben
                          </div>
                          <div className="text-[10px] font-bold text-slate-400">
                            {new Date(log.created_at).toLocaleDateString('hu-HU')}
                          </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic mb-1">{log.license_plate}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-4">{log.brand} {log.model}</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 mb-6">
                          "{log.description}"
                        </div>
                        <button onClick={() => handleResolve(log.id)} className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl transition-colors text-xs shadow-lg shadow-green-500/20">
                          ✔ JAVÍTÁS KÉSZ (Autó Aktíválása)
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* JOBB OSZLOP: MEGOLDVA */}
              <div>
                <h2 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span>✅</span> Korábbi Szervizelések ({resolvedLogs.length})
                </h2>
                <div className="space-y-4 opacity-75 hover:opacity-100 transition-opacity">
                  {resolvedLogs.length === 0 ? (
                    <p className="text-slate-400 italic text-sm font-medium">Nincs megjeleníthető adat.</p>
                  ) : (
                    resolvedLogs.map(log => (
                      <div key={log.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-black text-slate-700 italic">{log.license_plate}</h3>
                          <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                            {new Date(log.created_at).toLocaleDateString('hu-HU')}
                          </div>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">{log.brand} {log.model}</p>
                        <p className="text-sm font-medium text-slate-600 italic">Elhárítva: {log.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ServiceBoard;