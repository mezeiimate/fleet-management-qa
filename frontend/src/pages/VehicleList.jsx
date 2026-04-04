import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

function VehicleList({ onBack }) {
  const [vehicles, setVehicles] = useState([]);
  const [stickerTypes, setStickerTypes] = useState([]);
  const [users, setUsers] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFuel, setFilterFuel] = useState('all');
  
  const vehicleDialogRef = useRef(null);
  const stickerDialogRef = useRef(null);
  const reportDialogRef = useRef(null);
  const historyDialogRef = useRef(null);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState([]); 

  const initialVehicleData = {
    license_plate: '', brand: '', model: '', year_of_manufacture: '',
    vin: '', fuel_type: 'Benzin', transmission: 'Manuális',
    engine_capacity: '', current_km: '', status: 'Aktív', technical_exam_until: '', user_id: '', category: 'D1'
  };
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  
  const [stickerData, setStickerData] = useState({ id: null, sticker_type_id: '', valid_until: '', purchase_price: 0 });
  const [isEditingSticker, setIsEditingSticker] = useState(false);
  const [reportData, setReportData] = useState({ description: '' });

  const fetchData = async () => {
    try {
      const [vehRes, stickRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/vehicles-full'),
        axios.get('http://localhost:5000/api/sticker-types'),
        axios.get('http://localhost:5000/api/users')
      ]);
      setVehicles(vehRes.data || []);
      setStickerTypes(stickRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) { console.error("Hiba az adatok lekérésekor:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  const calculateValidUntil = (stickerName) => {
    const today = new Date();
    const name = stickerName.toLowerCase();
    if (name.includes('heti') || name.includes('10 napos')) {
        today.setDate(today.getDate() + 9); 
    } else if (name.includes('havi')) {
        today.setMonth(today.getMonth() + 1);
    } else if (name.includes('éves')) {
        today.setFullYear(today.getFullYear() + 1);
        today.setMonth(0); 
        today.setDate(31);
    }
    return today.toISOString().split('T')[0];
  };

  const openVehicleModal = (vehicle = null) => {
    setErrorMessage('');
    if (vehicle) {
      setVehicleData({
        license_plate: vehicle.license_plate || '', brand: vehicle.brand || '', model: vehicle.model || '',
        year_of_manufacture: vehicle.year_of_manufacture || '', vin: vehicle.vin || '', fuel_type: vehicle.fuel_type || 'Benzin',
        transmission: vehicle.transmission || 'Manuális', engine_capacity: vehicle.engine_capacity || '', current_km: vehicle.current_km || '',
        status: vehicle.status || 'Aktív', technical_exam_until: vehicle.technical_exam_until ? vehicle.technical_exam_until.split('T')[0] : '',
        user_id: vehicle.user_id || '', category: vehicle.category || 'D1'
      });
      setEditingId(vehicle.id);
    } else {
      setVehicleData(initialVehicleData);
      setEditingId(null);
    }
    vehicleDialogRef.current?.showModal();
  };
  const closeVehicleModal = () => vehicleDialogRef.current?.close();

  const openStickerModal = (vehicleId, existingSticker = null) => {
    setErrorMessage('');
    setSelectedVehicleId(vehicleId);
    if (existingSticker) {
      setIsEditingSticker(true);
      setStickerData({
        id: existingSticker.id,
        sticker_type_id: existingSticker.type_id,
        valid_until: existingSticker.valid_until.split('T')[0],
        purchase_price: existingSticker.purchase_price || 0
      });
    } else {
      setIsEditingSticker(false);
      setStickerData({ id: null, sticker_type_id: '', valid_until: '', purchase_price: 0 });
    }
    stickerDialogRef.current?.showModal();
  };
  const closeStickerModal = () => stickerDialogRef.current?.close();

  const openReportModal = (vehicleId) => {
    setErrorMessage('');
    setSelectedVehicleId(vehicleId);
    setReportData({ description: '' });
    reportDialogRef.current?.showModal();
  };
  const closeReportModal = () => reportDialogRef.current?.close();

  const openHistoryModal = async (vehicle) => {
    setSelectedVehicleForHistory(vehicle);
    try {
      const res = await axios.get('http://localhost:5000/api/service-logs');
      const history = res.data.filter(log => log.vehicle_id === vehicle.id);
      setVehicleHistory(history || []);
      historyDialogRef.current?.showModal();
    } catch (err) { console.error(err); }
  };
  const closeHistoryModal = () => historyDialogRef.current?.close();

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (editingId) await axios.put(`http://localhost:5000/api/vehicles/${editingId}`, vehicleData);
      else await axios.post('http://localhost:5000/api/vehicles', vehicleData);
      closeVehicleModal();
      fetchData();
    } catch (err) { setErrorMessage(err.response?.data?.error || "Hiba történt a mentéskor."); }
  };

  const handleStickerSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingSticker) await axios.put(`http://localhost:5000/api/stickers/${stickerData.id}`, stickerData);
      else await axios.post('http://localhost:5000/api/stickers', { vehicle_id: selectedVehicleId, ...stickerData });
      closeStickerModal();
      fetchData();
    } catch (err) { setErrorMessage("Hiba a mentéskor."); }
  };

  const handleStickerDelete = async (stickerId) => {
    if(window.confirm("Biztosan törlöd ezt a matricát az autóról?")) {
      try {
        await axios.delete(`http://localhost:5000/api/stickers/${stickerId}`);
        fetchData();
      } catch (err) { alert("Hiba a törléskor"); }
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/service-logs', { vehicle_id: selectedVehicleId, description: reportData.description });
      closeReportModal();
      fetchData();
      alert("Hiba sikeresen bejelentve!");
    } catch (err) { setErrorMessage("Hiba a bejelentéskor."); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Biztosan törlöd ezt a járművet? A hozzá tartozó adatok is elvesznek!")) {
      try {
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
        fetchData();
      } catch (err) { alert("Hiba a törléskor"); }
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    const matchSearch = v.license_plate?.toLowerCase().includes(term) || 
                        v.brand?.toLowerCase().includes(term) || 
                        v.model?.toLowerCase().includes(term);
                        
    const matchStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchCategory = filterCategory === 'all' || v.category === filterCategory;
    const matchFuel = filterFuel === 'all' || v.fuel_type === filterFuel;

    return matchSearch && matchStatus && matchCategory && matchFuel;
  });

  // --- ÚJ: CSV EXPORTÁLÁS FUNKCIÓ ---
  const exportToCSV = () => {
    const headers = ["Rendszam", "Kategoria", "Marka", "Modell", "Evjarat", "Uzemanyag", "Km_allas", "Statusz", "Muszaki_ervenyesseg", "Sofor"];
    
    const rows = filteredVehicles.map(v => [
      v.license_plate,
      v.category || 'D1',
      v.brand,
      v.model,
      v.year_of_manufacture,
      v.fuel_type,
      v.current_km || 'N/A',
      v.status,
      v.technical_exam_until ? new Date(v.technical_exam_until).toLocaleDateString('hu-HU') : 'Nincs',
      v.driver_name || 'Nincs kiutalva'
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(item => `"${item}"`).join(";"))
    ].join("\n");

    // UTF-8 BOM a magyar karakterek Excel kompatibilitásához
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `flotta_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative pb-20">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">← VISSZA</button>
        <h1 className="text-xl font-black tracking-tight italic text-slate-800">JÁRMŰ<span className="text-blue-600">PARK</span></h1>
        <button onClick={() => openVehicleModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-black text-xs shadow-lg">
          + ÚJ AUTÓ
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input type="text" placeholder="Keresés rendszám, márka vagy modell alapján..." className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:border-blue-400 font-medium shadow-sm transition-colors" onChange={(e) => setSearchTerm(e.target.value)} />
              <span className="absolute left-4 top-4 opacity-30 text-xl">🔍</span>
            </div>
            {/* ÚJ EXPORTÁLÁS GOMB */}
            <button onClick={exportToCSV} className="bg-slate-800 hover:bg-slate-900 text-white font-black px-6 rounded-2xl shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap">
              📥 EXPORT (.CSV)
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-sm text-slate-600 shadow-sm outline-none focus:border-blue-400 cursor-pointer">
              <option value="all">Minden Státusz</option>
              <option value="Aktív">Aktív</option>
              <option value="Szervizben">Szervizben</option>
              <option value="Inaktív">Inaktív</option>
            </select>
            
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-sm text-slate-600 shadow-sm outline-none focus:border-blue-400 cursor-pointer">
              <option value="all">Minden Kategória</option>
              <option value="D1">D1 (Személy)</option>
              <option value="D2">D2 (Teher/Kisbusz)</option>
              <option value="U">U (Utánfutó)</option>
            </select>

            <select value={filterFuel} onChange={e => setFilterFuel(e.target.value)} className="bg-white border border-slate-200 p-3 rounded-xl font-bold text-sm text-slate-600 shadow-sm outline-none focus:border-blue-400 cursor-pointer">
              <option value="all">Minden Üzemanyag</option>
              <option value="Benzin">Benzin</option>
              <option value="Dízel">Dízel</option>
              <option value="Elektromos">Elektromos</option>
              <option value="Hibrid">Hibrid</option>
            </select>
            
            {(searchTerm || filterStatus !== 'all' || filterCategory !== 'all' || filterFuel !== 'all') && (
              <button onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterCategory('all'); setFilterFuel('all'); document.querySelector('input[type="text"]').value = ''; }} className="p-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                ✕ Szűrők törlése
              </button>
            )}
          </div>
        </div>

        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Találatok: {filteredVehicles.length} jármű</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map(v => (
            <div key={v.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{v.brand} {v.model} ({v.year_of_manufacture})</p>
                  <div className="flex gap-3">
                    <button onClick={() => openVehicleModal(v)} className="text-blue-400 hover:text-blue-600 text-xs font-bold" title="Szerkesztés">✏️</button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-600 text-xs font-bold" title="Törlés">🗑️</button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">{v.license_plate}</h2>
                  <span className="bg-slate-800 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">{v.category || 'D1'}</span>
                </div>
                
                {v.driver_name ? (
                  <p className="text-xs font-bold text-blue-600 mb-4 flex items-center gap-1"><span>👤</span> {v.driver_name}</p>
                ) : (
                  <p className="text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">Nincs sofőr kiutalva</p>
                )}
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200">{v.fuel_type}</span>
                  <span className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200">{v.transmission}</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${v.status === 'Aktív' ? 'bg-green-50 text-green-600 border-green-200' : v.status === 'Szervizben' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{v.status}</span>
                </div>

                <div className="text-xs text-slate-500 mb-4 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p><strong>Km:</strong> {v.current_km ? `${v.current_km}` : '-'}</p>
                  <p><strong>Műszaki:</strong> {v.technical_exam_until ? new Date(v.technical_exam_until).toLocaleDateString('hu-HU') : '-'}</p>
                </div>

                <div className="mb-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">Aktív Matricák</h3>
                  {v.stickers && v.stickers.length > 0 ? (
                    v.stickers.map(sticker => {
                      const isExpired = new Date(sticker.valid_until) < new Date();
                      return (
                        <div key={sticker.id} className={`text-[11px] p-2 mb-1 rounded-lg border flex justify-between items-center ${isExpired ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                          <div>
                            <span className="font-bold block">{sticker.type_name}</span>
                            <span className="opacity-80">Érv.: {new Date(sticker.valid_until).toLocaleDateString('hu-HU')} {isExpired && '(Lejárt)'}</span>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => openStickerModal(v.id, sticker)} className="hover:opacity-60" title="Matrica szerkesztése">✏️</button>
                             <button onClick={() => handleStickerDelete(sticker.id)} className="hover:opacity-60" title="Matrica levétele">🗑️</button>
                          </div>
                        </div>
                      );
                    })
                  ) : <p className="text-xs text-slate-400 italic">Nincs matrica.</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <button onClick={() => openReportModal(v.id)} className="bg-red-50 hover:bg-red-100 text-red-600 font-black py-2 rounded-xl text-[10px] transition-colors" title="Hiba bejelentése">🛠️ HIBA</button>
                <button onClick={() => openHistoryModal(v)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black py-2 rounded-xl text-[10px] transition-colors" title="Szerviztörténet">📜 ELŐÉLET</button>
                <button onClick={() => openStickerModal(v.id)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-2 rounded-xl text-[10px] transition-colors" title="Új matrica">🏷️ MATRICA</button>
              </div>
            </div>
          ))}
          {filteredVehicles.length === 0 && (
             <div className="col-span-full p-10 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-100">Nincs a szűrésnek megfelelő jármű.</div>
          )}
        </div>
      </main>

      {/* --- 1. AUTÓ MODAL --- */}
      <dialog ref={vehicleDialogRef} onCancel={closeVehicleModal} className="bg-transparent p-0 w-full max-w-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl open:flex flex-col">
        <div className="bg-white w-full h-full flex flex-col">
          <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800">{editingId ? 'Jármű Szerkesztése' : 'Új Jármű Felvétele'}</h2>
            <button type="button" onClick={closeVehicleModal} className="text-slate-400 font-bold text-xl hover:text-red-500">✕</button>
          </div>
          <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
            {errorMessage && <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold text-sm">⚠️ {errorMessage}</div>}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Rendszám *</label><input type="text" value={vehicleData.license_plate} onChange={e => setVehicleData({...vehicleData, license_plate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" required /></div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Kategória</label>
                <select value={vehicleData.category} onChange={e => setVehicleData({...vehicleData, category: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="D1">D1 (Személy)</option><option value="D2">D2 (Teher)</option><option value="U">U (Utánfutó)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Évjárat *</label><input type="number" value={vehicleData.year_of_manufacture} onChange={e => setVehicleData({...vehicleData, year_of_manufacture: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Alvázszám</label><input type="text" value={vehicleData.vin} onChange={e => setVehicleData({...vehicleData, vin: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Márka *</label><input type="text" value={vehicleData.brand} onChange={e => setVehicleData({...vehicleData, brand: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Modell *</label><input type="text" value={vehicleData.model} onChange={e => setVehicleData({...vehicleData, model: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Üzemanyag</label>
                <select value={vehicleData.fuel_type} onChange={e => setVehicleData({...vehicleData, fuel_type: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"><option>Benzin</option><option>Dízel</option><option>Elektromos</option><option>Hibrid</option></select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Váltó</label>
                <select value={vehicleData.transmission} onChange={e => setVehicleData({...vehicleData, transmission: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"><option>Manuális</option><option>Automata</option></select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Motor (cm3)</label><input type="number" value={vehicleData.engine_capacity} onChange={e => setVehicleData({...vehicleData, engine_capacity: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Km Állás</label><input type="number" value={vehicleData.current_km} onChange={e => setVehicleData({...vehicleData, current_km: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Műszaki</label><input type="date" value={vehicleData.technical_exam_until} onChange={e => setVehicleData({...vehicleData, technical_exam_until: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Státusz</label>
                <select value={vehicleData.status} onChange={e => setVehicleData({...vehicleData, status: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"><option>Aktív</option><option>Szervizben</option><option>Inaktív</option></select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Sofőr</label>
                <select value={vehicleData.user_id} onChange={e => setVehicleData({...vehicleData, user_id: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="">-- Nincs kijelölve --</option>
                  {users && users.filter(u => u.role === 'driver').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl mt-4">MENTÉS</button>
          </form>
        </div>
      </dialog>

      {/* --- 2. MATRICA MODAL --- */}
      <dialog ref={stickerDialogRef} onCancel={closeStickerModal} className="bg-transparent p-0 w-full max-w-sm backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl open:flex flex-col">
        <div className="bg-white w-full h-full flex flex-col">
          <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800">{isEditingSticker ? 'Matrica Módosítása' : 'Új Matrica'}</h2>
            <button type="button" onClick={closeStickerModal} className="text-slate-400 font-bold text-xl hover:text-red-500">✕</button>
          </div>
          <form onSubmit={handleStickerSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Típus</label>
              <select required value={stickerData.sticker_type_id} onChange={(e) => {
                  const selectedId = e.target.value;
                  const selectedType = stickerTypes.find(st => st.id.toString() === selectedId);
                  if (selectedType) {
                    setStickerData({...stickerData, sticker_type_id: selectedId, valid_until: calculateValidUntil(selectedType.name), purchase_price: selectedType.price || 0});
                  } else {
                    setStickerData({...stickerData, sticker_type_id: ''});
                  }
                }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                <option value="">-- Válassz típust --</option>
                {stickerTypes && stickerTypes.map(st => <option key={st.id} value={st.id}>{st.name} ({st.price_category})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Lejárat</label><input type="date" required value={stickerData.valid_until} onChange={e => setStickerData({...stickerData, valid_until: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Könyvelt Ár</label><input type="number" required value={stickerData.purchase_price} onChange={e => setStickerData({...stickerData, purchase_price: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-500" /></div>
            </div>
            <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl mt-4">MENTÉS</button>
          </form>
        </div>
      </dialog>

      {/* --- 3. HIBABEJELENTÉS MODAL --- */}
      <dialog ref={reportDialogRef} onCancel={closeReportModal} className="bg-transparent p-0 w-full max-w-md backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl open:flex flex-col">
        <div className="bg-white w-full h-full flex flex-col">
          <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-red-700">Szervizigény / Hiba</h2>
            <button type="button" onClick={closeReportModal} className="text-red-400 font-bold text-xl hover:text-red-600">✕</button>
          </div>
          <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
            <div><textarea required value={reportData.description} onChange={e => setReportData({description: e.target.value})} rows="4" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium resize-none focus:border-red-300 outline-none" placeholder="Probléma leírása..."></textarea></div>
            <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-xl mt-4">JELENTÉS BEKÜLDÉSE</button>
          </form>
        </div>
      </dialog>

      {/* --- 4. ELŐÉLET MODAL --- */}
      <dialog ref={historyDialogRef} onCancel={closeHistoryModal} className="bg-transparent p-0 w-full max-w-lg backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl open:flex flex-col">
        <div className="bg-white w-full h-full flex flex-col max-h-[85vh]">
          <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-center shrink-0">
            <div><h2 className="text-xl font-black text-indigo-800">Szerviztörténet</h2></div>
            <button type="button" onClick={closeHistoryModal} className="text-indigo-400 font-bold text-xl hover:text-indigo-600">✕</button>
          </div>
          <div className="p-6 overflow-y-auto">
            {vehicleHistory && vehicleHistory.length === 0 ? <p className="text-center text-slate-400 font-medium italic">Nincs bejegyzés.</p> : (
              <div className="space-y-4">
                {vehicleHistory.map(log => (
                  <div key={log.id} className={`p-4 rounded-xl border ${log.status === 'Megoldva' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${log.status === 'Megoldva' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                      <span className="text-xs font-bold text-slate-400">{new Date(log.created_at).toLocaleDateString('hu-HU')}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default VehicleList;