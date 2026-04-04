import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard({ onLogout, onChangePage, user }) {
  const [stats, setStats] = useState({ totalVehicles: 0, gasoline: 0, diesel: 0, electric: 0 });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gombkattintás védelme (ha az App.jsx nincs frissítve)
  const handleNavigation = (page) => {
    if (typeof onChangePage === 'function') {
      onChangePage(page);
    } else {
      alert("Fejlesztői infó: Az App.jsx-ben add hozzá a Dashboardhoz az onChangePage={setCurrentPage} propot!");
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Megpróbáljuk lekérni a statisztikákat
        try {
          const statsRes = await axios.get('http://localhost:5000/api/stats');
          setStats(statsRes.data);
        } catch (e) { console.error("Nem sikerült betölteni a statisztikát", e); }

        // 2. Lekérjük a járműveket a riasztásokhoz
        const vehiclesRes = await axios.get('http://localhost:5000/api/vehicles-full');
        const vehiclesData = vehiclesRes.data || [];

        // --- INTELLIGENS RIASZTÁS GENERÁTOR ---
        const generatedAlerts = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const next30Days = new Date();
        next30Days.setDate(today.getDate() + 30);

        vehiclesData.forEach(v => {
          // 1. Szervizes riasztások (kisbetűsítve a biztonság kedvéért)
          if (v.status && v.status.toLowerCase() === 'szervizben') {
            generatedAlerts.push({
              id: `srv-${v.id}`, type: 'service', severity: 'red',
              vehicle: v.license_plate, brand: `${v.brand} ${v.model}`,
              message: 'A jármű jelenleg szervizben van (használaton kívül).'
            });
          }

          // 2. Műszaki vizsga riasztások
          if (v.technical_exam_until) {
            const examDate = new Date(v.technical_exam_until);
            if (examDate < today) {
              generatedAlerts.push({
                id: `exam-exp-${v.id}`, type: 'exam', severity: 'red',
                vehicle: v.license_plate, brand: `${v.brand} ${v.model}`,
                message: 'LEJÁRT a műszaki vizsga!', date: examDate
              });
            } else if (examDate <= next30Days) {
              generatedAlerts.push({
                id: `exam-warn-${v.id}`, type: 'exam', severity: 'orange',
                vehicle: v.license_plate, brand: `${v.brand} ${v.model}`,
                message: 'A műszaki vizsga 30 napon belül lejár.', date: examDate
              });
            }
          } else {
             generatedAlerts.push({
                id: `exam-miss-${v.id}`, type: 'exam', severity: 'orange',
                vehicle: v.license_plate, brand: `${v.brand} ${v.model}`,
                message: 'Nincs megadva műszaki vizsga érvényesség!'
              });
          }

          // 3. Matrica riasztások (Biztonságos JSON feldolgozás)
          let stickersArray = [];
          if (typeof v.stickers === 'string') {
            try { stickersArray = JSON.parse(v.stickers); } catch(e) {}
          } else if (Array.isArray(v.stickers)) {
            stickersArray = v.stickers;
          }

          stickersArray.forEach(st => {
            if (st && st.valid_until) {
              const expDate = new Date(st.valid_until);
              if (expDate < today) {
                generatedAlerts.push({
                  id: `stk-exp-${st.id}`, type: 'sticker', severity: 'red',
                  vehicle: v.license_plate, brand: `${v.brand} ${v.model}`,
                  message: `LEJÁRT matrica (${st.type_name})`, date: expDate
                });
              } else if (expDate <= next30Days) {
                generatedAlerts.push({
                  id: `stk-warn-${st.id}`, type: 'sticker', severity: 'orange',
                  vehicle: v.license_plate, brand: `${v.brand} ${v.model}`,
                  message: `Matrica hamarosan lejár (${st.type_name})`, date: expDate
                });
              }
            }
          });
        });

        // Riasztások rendezése: Pirosak (kritikus) felülre
        generatedAlerts.sort((a, b) => {
          if (a.severity === 'red' && b.severity !== 'red') return -1;
          if (a.severity !== 'red' && b.severity === 'red') return 1;
          return (a.date?.getTime() || 0) - (b.date?.getTime() || 0);
        });

        setAlerts(generatedAlerts);
        setLoading(false);

      } catch (err) {
        console.error("Hiba a Dashboard betöltésekor", err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight italic text-slate-800">
          FLEET<span className="text-blue-600">COMMAND</span>
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center font-black text-slate-400 text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{user?.role || 'Admin'}</p>
              <p className="text-sm font-bold text-slate-700 leading-tight">{user?.name || 'Rendszergazda'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors border-l border-slate-200 pl-6">
            Kijelentkezés
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">Vezérlőpult</h2>
            <p className="text-slate-500 font-medium">Itt az aktuális flottaállapot egy pillantással.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleNavigation('vehicles')} className="bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-600 font-bold px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2">
              <span>🚗</span> Járműpark
            </button>
            <button onClick={() => handleNavigation('service')} className="bg-white border border-slate-200 hover:border-red-500 hover:text-red-600 text-slate-600 font-bold px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2">
              <span>🛠️</span> Szerviznapló
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 font-bold mt-20 animate-pulse">Adatok szinkronizálása...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Statisztika oszlop */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-blue-200 font-black text-xs uppercase tracking-widest mb-1">Regisztrált Járművek</p>
                  <h3 className="text-6xl font-black italic tracking-tighter">{stats.totalVehicles || 0} db</h3>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Hajtáslánc megoszlás</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-600 mb-1"><span>⛽ Benzin</span><span>{stats.gasoline || 0} db</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-orange-400 h-2 rounded-full" style={{ width: `${stats.totalVehicles > 0 ? ((stats.gasoline||0) / stats.totalVehicles) * 100 : 0}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-600 mb-1"><span>🛢️ Dízel</span><span>{stats.diesel || 0} db</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-slate-700 h-2 rounded-full" style={{ width: `${stats.totalVehicles > 0 ? ((stats.diesel||0) / stats.totalVehicles) * 100 : 0}%` }}></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-600 mb-1"><span>⚡ Elektromos</span><span>{stats.electric || 0} db</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.totalVehicles > 0 ? ((stats.electric||0) / stats.totalVehicles) * 100 : 0}%` }}></div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Riasztások oszlop */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 min-h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight"><span>🚨</span> Rendszer Riasztások</h3>
                  <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-lg">{alerts.length} db aktív</span>
                </div>
                {alerts.length === 0 ? (
                  <div className="text-center py-20">
                    <span className="text-5xl mb-4 block">✅</span>
                    <h4 className="text-lg font-black text-slate-700 mb-1">Minden rendben!</h4>
                    <p className="text-sm font-medium text-slate-400">Nincsenek lejárt dokumentumok vagy szervizigények.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <div key={alert.id} className={`p-4 rounded-xl border flex items-center gap-4 ${alert.severity === 'red' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                        <div className={`text-2xl ${alert.severity === 'red' ? 'text-red-500' : 'text-orange-500'}`}>
                          {alert.type === 'service' ? '🛠️' : alert.type === 'exam' ? '📜' : '🏷️'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-black text-lg leading-none tracking-tight">{alert.vehicle} <span className="text-xs font-bold opacity-60 ml-2 uppercase tracking-widest">{alert.brand}</span></h4>
                            {alert.date && <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${alert.severity === 'red' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>Érv.: {new Date(alert.date).toLocaleDateString('hu-HU')}</span>}
                          </div>
                          <p className="text-sm font-medium opacity-80 mt-1">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;