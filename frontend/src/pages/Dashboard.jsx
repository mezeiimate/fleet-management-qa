import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard({ onChangePage }) {
  const [stats, setStats] = useState({ totalVehicles: 0, gasoline: 0, diesel: 0, electric: 0 });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, vehiclesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/stats').catch(() => ({ data: {} })),
          axios.get('http://localhost:5000/api/vehicles-full').catch(() => ({ data: [] }))
        ]);

        setStats(statsRes.data);
        const vehiclesData = vehiclesRes.data || [];
        const generatedAlerts = [];
        const today = new Date(); today.setHours(0, 0, 0, 0); 
        const next30Days = new Date(); next30Days.setDate(today.getDate() + 30);

        vehiclesData.forEach(v => {
          if (v.status && v.status.toLowerCase() === 'szervizben') {
            generatedAlerts.push({ id: `srv-${v.id}`, type: 'service', severity: 'red', vehicle: v.license_plate, brand: `${v.brand} ${v.model}`, message: 'A jármű jelenleg szervizben van.' });
          }
          if (v.technical_exam_until) {
            const examDate = new Date(v.technical_exam_until);
            if (examDate < today) {
              generatedAlerts.push({ id: `exam-exp-${v.id}`, type: 'exam', severity: 'red', vehicle: v.license_plate, brand: `${v.brand} ${v.model}`, message: 'LEJÁRT a műszaki vizsga!', date: examDate });
            } else if (examDate <= next30Days) {
              generatedAlerts.push({ id: `exam-warn-${v.id}`, type: 'exam', severity: 'orange', vehicle: v.license_plate, brand: `${v.brand} ${v.model}`, message: 'Műszaki vizsga 30 napon belül lejár.', date: examDate });
            }
          }
          let stickersArray = [];
          if (typeof v.stickers === 'string') { try { stickersArray = JSON.parse(v.stickers); } catch(e) {} } else if (Array.isArray(v.stickers)) { stickersArray = v.stickers; }
          stickersArray.forEach(st => {
            if (st && st.valid_until) {
              const expDate = new Date(st.valid_until);
              if (expDate < today) generatedAlerts.push({ id: `stk-exp-${st.id}`, type: 'sticker', severity: 'red', vehicle: v.license_plate, brand: `${v.brand} ${v.model}`, message: `LEJÁRT matrica (${st.type_name})`, date: expDate });
              else if (expDate <= next30Days) generatedAlerts.push({ id: `stk-warn-${st.id}`, type: 'sticker', severity: 'orange', vehicle: v.license_plate, brand: `${v.brand} ${v.model}`, message: `Matrica hamarosan lejár (${st.type_name})`, date: expDate });
            }
          });
        });
        generatedAlerts.sort((a, b) => {
          if (a.severity === 'red' && b.severity !== 'red') return -1;
          if (a.severity !== 'red' && b.severity === 'red') return 1;
          return (a.date?.getTime() || 0) - (b.date?.getTime() || 0);
        });
        setAlerts(generatedAlerts);
        setLoading(false);
      } catch (err) { console.error("Hiba", err); setLoading(false); }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-center text-slate-400 font-bold mt-32 animate-pulse text-lg">Adatok szinkronizálása...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Áttekintés</h2>
        <p className="text-slate-500 font-medium">A flotta aktuális állapota és a rendszer riasztásai.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* STATISZTIKA */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Fő statisztika kártya - Visszafogott kerekítés, kényelmes belső tér (p-8) */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
            <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[140px] opacity-10 group-hover:scale-110 transition-transform duration-500">directions_car</span>
            <div className="relative z-10">
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Regisztrált Járművek
              </p>
              <h3 className="text-6xl font-black tracking-tighter">{stats.totalVehicles || 0}</h3>
            </div>
          </div>
          
          {/* Másodlagos kártya - JAVÍTVA A BELÓGÓ SZÖVEG! */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">local_gas_station</span> Hajtásláncok
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-400"></span> Benzin</span>
                  <span className="text-slate-500">{stats.gasoline || 0} db</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.totalVehicles > 0 ? ((stats.gasoline||0) / stats.totalVehicles) * 100 : 0}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-800"></span> Dízel</span>
                  <span className="text-slate-500">{stats.diesel || 0} db</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-slate-800 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.totalVehicles > 0 ? ((stats.diesel||0) / stats.totalVehicles) * 100 : 0}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Elektromos</span>
                  <span className="text-slate-500">{stats.electric || 0} db</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${stats.totalVehicles > 0 ? ((stats.electric||0) / stats.totalVehicles) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* RIASZTÁSOK */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex-grow flex flex-col">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 border-b border-slate-100 pb-5">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500 text-2xl">error</span> Rendszer Riasztások
              </h3>
              {alerts.length > 0 && (
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg w-max">
                  {alerts.length} db aktív figyelmeztetés
                </span>
              )}
            </div>
            
            {alerts.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                   <span className="material-symbols-outlined text-4xl text-green-500">task_alt</span>
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">Minden rendben van!</h4>
                <p className="text-slate-500 text-center max-w-sm">Jelenleg nincsenek lejárt dokumentumok, és egyetlen jármű sem igényel azonnali beavatkozást.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div key={alert.id} className={`p-5 rounded-2xl border flex items-start sm:items-center gap-5 transition-all hover:shadow-md ${alert.severity === 'red' ? 'bg-white border-red-200 hover:border-red-300' : 'bg-white border-orange-200 hover:border-orange-300'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${alert.severity === 'red' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                      <span className="material-symbols-outlined text-2xl">
                        {alert.type === 'service' ? 'build' : alert.type === 'exam' ? 'description' : 'sell'}
                      </span>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1">
                        <h4 className="font-bold text-lg text-slate-900">
                          {alert.vehicle} <span className="text-sm font-medium text-slate-500 ml-2">{alert.brand}</span>
                        </h4>
                        {alert.date && (
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md w-max ${alert.severity === 'red' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                            Érv.: {new Date(alert.date).toLocaleDateString('hu-HU')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-600">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;