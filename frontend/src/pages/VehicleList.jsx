import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VehicleList({ onBack }) {
  const [vehicles, setVehicles] = useState([]);
  const [stickerTypes, setStickerTypes] = useState([]);
  const [users, setUsers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState(null);
  const [vehicleHistory, setVehicleHistory] = useState([]); 

  const initialVehicleData = {
    license_plate: '', brand: '', model: '', year_of_manufacture: '',
    vin: '', fuel_type: 'Benzin', transmission: 'Manuális',
    engine_capacity: '', current_km: '', status: 'Aktív', technical_exam_until: '', user_id: ''
  };
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [stickerData, setStickerData] = useState({ sticker_type_id: '', valid_until: '' });
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

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (editingId) await axios.put(`http://localhost:5000/api/vehicles/${editingId}`, vehicleData);
      else await axios.post('http://localhost:5000/api/vehicles', vehicleData);
      setShowVehicleModal(false);
      setVehicleData(initialVehicleData);
      setEditingId(null);
      fetchData();
    } catch (err) { setErrorMessage(err.response?.data?.error || "Hiba történt a mentéskor."); }
  };

  const handleEditClick = (vehicle) => {
    setVehicleData({
      license_plate: vehicle.license_plate || '', brand: vehicle.brand || '', model: vehicle.model || '',
      year_of_manufacture: vehicle.year_of_manufacture || '', vin: vehicle.vin || '', fuel_type: vehicle.fuel_type || 'Benzin',
      transmission: vehicle.transmission || 'Manuális', engine_capacity: vehicle.engine_capacity || '', current_km: vehicle.current_km || '',
      status: vehicle.status || 'Aktív', technical_exam_until: vehicle.technical_exam_until ? vehicle.technical_exam_until.split('T')[0] : '',
      user_id: vehicle.user_id || '' 
    });
    setEditingId(vehicle.id);
    setShowVehicleModal(true);
  };

  const handleStickerSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/stickers', { vehicle_id: selectedVehicleId, ...stickerData });
      setShowStickerModal(false);
      setStickerData({ sticker_type_id: '', valid_until: '' });
      fetchData();
    } catch (err) { setErrorMessage("Hiba a mentéskor."); }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/service-logs', { vehicle_id: selectedVehicleId, description: reportData.description });
      setShowReportModal(false);
      setReportData({ description: '' });
      fetchData();
      alert("Hiba sikeresen bejelentve a szerviznek!");
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

  const handleViewHistory = async (vehicle) => {
    setSelectedVehicleForHistory(vehicle);
    try {
      const res = await axios.get('http://localhost:5000/api/service-logs');
      const history = res.data.filter(log => log.vehicle_id === vehicle.id);
      setVehicleHistory(history || []);
      setShowHistoryModal(true);
    } catch (err) { console.error(err); }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] relative pb-20">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">← VISSZA</button>
        <h1 className="text-xl font-black tracking-tight italic text-slate-800">JÁRMŰ<span className="text-blue-600">PARK</span></h1>
        <button onClick={() => { setEditingId(null); setVehicleData(initialVehicleData); setShowVehicleModal(true); setErrorMessage(''); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-black text-xs shadow-lg">
          + ÚJ AUTÓ
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-8 relative">
          <input type="text" placeholder="Keresés rendszám vagy márka alapján..." className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-medium" onChange={(e) => setSearchTerm(e.target.value)} />
          <span className="absolute left-4 top-4 opacity-30 text-xl">🔍</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map(v => (
            <div key={v.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{v.brand} {v.model} ({v.year_of_manufacture})</p>
                  <div className="flex gap-3">
                    <button onClick={() => handleEditClick(v)} className="text-blue-400 hover:text-blue-600 text-xs font-bold" title="Szerkesztés">✏️</button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-600 text-xs font-bold" title="Törlés">🗑️</button>
                  </div>
                </div>
                
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic mb-1">{v.license_plate}</h2>
                
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
                        <div key={sticker.id} className={`text-[11px] p-2 mb-1 rounded-lg border flex justify-between ${isExpired ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                          <span className="font-bold">{sticker.type_name}</span>
                          <span>Érv.: {new Date(sticker.valid_until).toLocaleDateString('hu-HU')} {isExpired && '(Lejárt)'}</span>
                        </div>
                      );
                    })
                  ) : <p className="text-xs text-slate-400 italic">Nincs matrica.</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <button onClick={() => { setSelectedVehicleId(v.id); setShowReportModal(true); setErrorMessage(''); }} className="bg-red-50 hover:bg-red-100 text-red-600 font-black py-2 rounded-xl text-[10px] transition-colors" title="Hiba bejelentése">🛠️ HIBA</button>
                <button onClick={() => handleViewHistory(v)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black py-2 rounded-xl text-[10px] transition-colors" title="Szerviztörténet">📜 ELŐÉLET</button>
                <button onClick={() => { setSelectedVehicleId(v.id); setShowStickerModal(true); setErrorMessage(''); }} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-2 rounded-xl text-[10px] transition-colors" title="Új matrica">🏷️ MATRICA</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- ERŐSZAKOSAN KÖZÉPRE ZÁRT MODÁLOK --- */}
      
      {/* ELŐÉLET MODAL */}
      {showHistoryModal && selectedVehicleForHistory && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-indigo-50 p-6 border-b border-indigo-100 flex justify-between items-center shrink-0">
              <div><h2 className="text-xl font-black text-indigo-800">Szerviztörténet</h2></div>
              <button onClick={() => setShowHistoryModal(false)} className="text-indigo-400 font-bold text-xl hover:text-indigo-600">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {vehicleHistory && vehicleHistory.length === 0 ? (
                <p className="text-center text-slate-400 font-medium italic">Nincs bejegyzés.</p>
              ) : (
                <div className="space-y-4">
                  {vehicleHistory.map(log => (
                    <div key={log.id} className={`p-4 rounded-xl border ${log.status === 'Megoldva' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                      <p className="text-sm font-medium text-slate-700">{log.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUTÓ MODAL (Létrehozás és Szerkesztés) */}
      {showVehicleModal && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-slate-800">{editingId ? 'Jármű Szerkesztése' : 'Új Jármű Felvétele'}</h2>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 font-bold text-xl hover:text-red-500">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleVehicleSubmit} className="space-y-4">
                {errorMessage && <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold text-sm">⚠️ {errorMessage}</div>}
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Rendszám *</label><input type="text" value={vehicleData.license_plate} onChange={e => setVehicleData({...vehicleData, license_plate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" required /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Évjárat *</label><input type="number" value={vehicleData.year_of_manufacture} onChange={e => setVehicleData({...vehicleData, year_of_manufacture: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Márka *</label><input type="text" value={vehicleData.brand} onChange={e => setVehicleData({...vehicleData, brand: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required /></div>
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Modell *</label><input type="text" value={vehicleData.model} onChange={e => setVehicleData({...vehicleData, model: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required /></div>
                </div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Alvázszám</label><input type="text" value={vehicleData.vin} onChange={e => setVehicleData({...vehicleData, vin: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" /></div>
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
                  <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Motor</label><input type="number" value={vehicleData.engine_capacity} onChange={e => setVehicleData({...vehicleData, engine_capacity: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
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
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl mt-4 shrink-0">MENTÉS</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MATRICA MODAL */}
      {showStickerModal && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-slate-800">Új Matrica</h2>
              <button onClick={() => setShowStickerModal(false)} className="text-slate-400 font-bold text-xl hover:text-red-500">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleStickerSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Típus</label>
                  <select required value={stickerData.sticker_type_id} onChange={e => setStickerData({...stickerData, sticker_type_id: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="">-- Válassz típust --</option>
                    {stickerTypes && stickerTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Érvényesség (Lejárat)</label>
                  <input type="date" required value={stickerData.valid_until} onChange={e => setStickerData({...stickerData, valid_until: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl mt-4 shrink-0">MATRICA HOZZÁADÁSA</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HIBABEJELENTÉS MODAL */}
      {showReportModal && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-red-700">Szervizigény / Hiba</h2>
              <button onClick={() => setShowReportModal(false)} className="text-red-400 font-bold text-xl hover:text-red-600">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <textarea required value={reportData.description} onChange={e => setReportData({description: e.target.value})} rows="4" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium resize-none focus:border-red-300 outline-none" placeholder="Probléma leírása..."></textarea>
                </div>
                <button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-xl mt-4 shrink-0">JELENTÉS BEKÜLDÉSE</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleList;