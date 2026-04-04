import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

function ServiceBoard({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const dialogRef = useRef(null);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [repairCost, setRepairCost] = useState('');

  const fetchData = async () => {
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/service-logs'),
        axios.get('http://localhost:5000/api/vehicles-full')
      ]);
      setLogs(logsRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setLoading(false);
    } catch (err) { console.error("Hiba az adatok lekérésekor:", err); setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalServiceCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const totalStickerCost = vehicles.reduce((sum, vehicle) => {
    const stickers = vehicle.stickers || [];
    return sum + stickers.reduce((s, sticker) => s + (sticker.purchase_price || 0), 0);
  }, 0);
  const grandTotal = totalServiceCost + totalStickerCost;

  const openCostModal = (logId) => { setSelectedLogId(logId); setRepairCost(''); dialogRef.current?.showModal(); };
  const closeCostModal = () => { dialogRef.current?.close(); setSelectedLogId(null); };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`http://localhost:5000/api/service-logs/${selectedLogId}`, { cost: parseInt(repairCost) || 0 });
      closeCostModal();
      fetchData(); 
    } catch (err) { alert("Hiba történt a mentéskor!"); }
  };

  const filteredLogs = logs.filter(l => {
    const term = searchTerm.toLowerCase();
    return (l.license_plate?.toLowerCase().includes(term) || 
            l.brand?.toLowerCase().includes(term) || 
            l.model?.toLowerCase().includes(term) || 
            l.description?.toLowerCase().includes(term));
  });

  const pendingLogs = filteredLogs.filter(l => l.status === 'Függőben');
  const solvedLogs = filteredLogs.filter(l => l.status === 'Megoldva');

  // --- ÚJ: CSV EXPORTÁLÁS FUNKCIÓ A SZERVIZHEZ ---
  const exportToCSV = () => {
    const headers = ["Rendszam", "Marka_Modell", "Bejelentes_Datuma", "Statusz", "Hiba_leirasa", "Koltseg_HUF"];
    
    const rows = filteredLogs.map(log => [
      log.license_plate,
      `${log.brand} ${log.model}`,
      new Date(log.created_at).toLocaleDateString('hu-HU'),
      log.status,
      log.description.replace(/(\r\n|\n|\r)/gm, " "), // Sortörések eltávolítása, hogy ne törje meg az excelt
      log.cost || 0
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(item => `"${item}"`).join(";"))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `szerviznaplo_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">← VISSZA</button>
        <h1 className="text-xl font-black tracking-tight italic text-slate-800">SZERVIZ & <span className="text-red-600">PÉNZÜGY</span></h1>
        <div className="w-24"></div> 
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-[2rem] text-white shadow-lg">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Teljes Flotta Költség</p>
            <h3 className="text-4xl font-black tracking-tighter">{new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(grandTotal)}</h3>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Ebből Szerviz & Javítás</p>
            <h3 className="text-3xl font-black tracking-tighter text-red-600">{new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(totalServiceCost)}</h3>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Ebből Matricák</p>
            <h3 className="text-3xl font-black tracking-tighter text-blue-600">{new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(totalStickerCost)}</h3>
          </div>
        </div>

        {/* --- KERESŐSÁV ÉS EXPORT GOMB --- */}
        <div className="mb-8 flex gap-4">
          <div className="relative flex-1">
            <input type="text" placeholder="Keresés rendszám, márka vagy hibaleírás alapján..." className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:border-red-400 font-medium shadow-sm transition-colors" onChange={(e) => setSearchTerm(e.target.value)} />
            <span className="absolute left-4 top-4 opacity-30 text-xl">🔍</span>
          </div>
          <button onClick={exportToCSV} className="bg-slate-800 hover:bg-slate-900 text-white font-black px-6 rounded-2xl shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap">
             📥 EXPORT (.CSV)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div>
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><span className="text-2xl">⚠️</span> Aktív Hibabejelentések ({pendingLogs.length})</h2>
            <div className="space-y-4">
              {pendingLogs.map(log => (
                <div key={log.id} className="bg-white p-6 rounded-3xl border-2 border-orange-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-orange-400"></div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">{log.brand} {log.model}</p>
                      <h3 className="text-2xl font-black italic text-slate-800 leading-none">{log.license_plate}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{new Date(log.created_at).toLocaleDateString('hu-HU')}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">{log.description}</p>
                  <button onClick={() => openCostModal(log.id)} className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2">✅ JAVÍTÁS KÉSZ</button>
                </div>
              ))}
              {pendingLogs.length === 0 && <div className="text-center p-10 bg-slate-50 rounded-3xl border border-slate-100 border-dashed"><p className="font-bold text-slate-400">Nincs a keresésnek megfelelő aktív hiba.</p></div>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><span className="text-2xl">📜</span> Szerviztörténet ({solvedLogs.length})</h2>
            <div className="space-y-3">
              {solvedLogs.map(log => (
                <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="text-lg font-black italic text-slate-800 mb-1">{log.license_plate}</h3>
                    <p className="text-xs font-medium text-slate-500 line-clamp-1">{log.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(log.created_at).toLocaleDateString('hu-HU')}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="bg-green-50 text-green-600 text-[10px] font-black uppercase px-2 py-1 rounded mb-1 inline-block">Megoldva</span>
                    <p className="font-black text-red-500">{new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(log.cost || 0)}</p>
                  </div>
                </div>
              ))}
              {solvedLogs.length === 0 && <div className="text-center p-10 bg-slate-50 rounded-3xl border border-slate-100 border-dashed"><p className="font-bold text-slate-400">Nincs a keresésnek megfelelő előélet.</p></div>}
            </div>
          </div>
        </div>
      </main>

      <dialog ref={dialogRef} onCancel={closeCostModal} className="bg-transparent p-0 w-full max-w-sm backdrop:bg-slate-900/70 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl open:flex flex-col mx-auto">
        <div className="bg-white w-full h-full flex flex-col">
          <div className="bg-green-50 p-6 border-b border-green-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-green-700">Javítás Rögzítése</h2>
            <button type="button" onClick={closeCostModal} className="text-green-400 font-bold text-xl hover:text-green-600">✕</button>
          </div>
          <form onSubmit={handleResolve} className="p-6 space-y-4">
            <p className="text-sm font-medium text-slate-500 mb-4">Az autó státusza "Aktív" lesz, és ismét használható. Kérlek, add meg a javítás bruttó költségét!</p>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Javítás Költsége (HUF) *</label>
              <input type="number" required value={repairCost} onChange={e => setRepairCost(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg focus:border-green-400 outline-none" placeholder="Pl.: 125000" />
            </div>
            <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl mt-2 shadow-lg transition-colors">MENTÉS ÉS LEZÁRÁS</button>
          </form>
        </div>
      </dialog>
    </div>
  );
}

export default ServiceBoard;