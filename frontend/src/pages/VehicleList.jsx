import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VehicleList({ onBack }) {
  const [vehicles, setVehicles] = useState([]);
  const [stickerTypes, setStickerTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modálok és hibaüzenetek
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Autó űrlap adatai
  const initialVehicleData = {
    license_plate: '', brand: '', model: '', year_of_manufacture: '',
    vin: '', fuel_type: 'Benzin', transmission: 'Manuális',
    engine_capacity: '', current_km: '', status: 'Aktív', technical_exam_until: ''
  };
  const [vehicleData, setVehicleData] = useState(initialVehicleData);

  // Matrica űrlap adatai
  const [stickerData, setStickerData] = useState({ sticker_type_id: '', valid_until: '' });

  const fetchData = async () => {
    try {
      const [vehRes, stickRes] = await Promise.all([
        axios.get('http://localhost:5000/api/vehicles-full'),
        axios.get('http://localhost:5000/api/sticker-types')
      ]);
      setVehicles(vehRes.data);
      setStickerTypes(stickRes.data);
    } catch (err) { console.error("Hiba az adatok lekérésekor:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- ÚJ AUTÓ MENTÉSE ---
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await axios.post('http://localhost:5000/api/vehicles', vehicleData);
      setShowVehicleModal(false);
      setVehicleData(initialVehicleData);
      fetchData();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Hiba történt a mentéskor.");
    }
  };

  // --- MATRICA MENTÉSE AZ AUTÓRA ---
  const handleStickerSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await axios.post('http://localhost:5000/api/stickers', {
        vehicle_id: selectedVehicleId,
        ...stickerData
      });
      setShowStickerModal(false);
      setStickerData({ sticker_type_id: '', valid_until: '' });
      fetchData();
    } catch (err) {
      setErrorMessage("Hiba történt a matrica mentésekor.");
    }
  };

  // --- AUTÓ TÖRLÉSE ---
  const handleDelete = async (id) => {
    if(window.confirm("Biztosan törlöd ezt a járművet? A hozzá tartozó matricák is törlődnek!")) {
      try {
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
        fetchData();
      } catch (err) { alert("Hiba a törléskor"); }
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] relative pb-20">
      {/* Fejléc */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">← VISSZA</button>
        <h1 className="text-xl font-black tracking-tight italic text-slate-800">JÁRMŰ<span className="text-blue-600">PARK</span></h1>
        <button onClick={() => { setShowVehicleModal(true); setErrorMessage(''); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-black text-xs shadow-lg">
          + ÚJ AUTÓ
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-8 relative">
          <input type="text" placeholder="Keresés rendszám vagy márka alapján..." className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-medium" onChange={(e) => setSearchTerm(e.target.value)} />
          <span className="absolute left-4 top-4 opacity-30 text-xl">🔍</span>
        </div>

        {/* JÁRMŰ KÁRTYÁK */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map(v => (
            <div key={v.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{v.brand} {v.model} ({v.year_of_manufacture})</p>
                  <button onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-600 text-xs font-bold">Törlés</button>
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic mb-4">{v.license_plate}</h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200">{v.fuel_type}</span>
                  <span className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200">{v.transmission}</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${v.status === 'Aktív' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>{v.status}</span>
                </div>

                <div className="text-xs text-slate-500 mb-4 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p><strong>Km állás:</strong> {v.current_km ? `${v.current_km} km` : '-'}</p>
                  <p><strong>Műszaki:</strong> {v.technical_exam_until ? new Date(v.technical_exam_until).toLocaleDateString('hu-HU') : '-'}</p>
                </div>

                {/* MATRICÁK LISTÁJA */}
                <div className="mb-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">Aktív Matricák</h3>
                  {v.stickers && v.stickers.length > 0 ? (
                    v.stickers.map(sticker => {
                      const isExpired = new Date(sticker.valid_until) < new Date();
                      return (
                        <div key={sticker.id} className={`text-xs font-bold p-2 mb-1 rounded-lg border flex justify-between ${isExpired ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                          <span>{sticker.type_name}</span>
                          <span>{new Date(sticker.valid_until).toLocaleDateString('hu-HU')} {isExpired && ' (Lejárt)'}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nincs matrica az autón.</p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => { setSelectedVehicleId(v.id); setShowStickerModal(true); setErrorMessage(''); }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs transition-colors mt-2"
              >
                + ÚJ MATRICA
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* AUTÓ FELVÉTELE MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-20">
              <h2 className="text-xl font-black text-slate-800">Új Jármű Felvétele</h2>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 font-bold text-xl hover:text-red-500">✕</button>
            </div>
            <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4">
              {errorMessage && <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold text-sm">⚠️ {errorMessage}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Rendszám *</label>
                  <input type="text" value={vehicleData.license_plate} onChange={e => setVehicleData({...vehicleData, license_plate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Évjárat *</label>
                  <input type="number" value={vehicleData.year_of_manufacture} onChange={e => setVehicleData({...vehicleData, year_of_manufacture: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Márka *</label>
                  <input type="text" value={vehicleData.brand} onChange={e => setVehicleData({...vehicleData, brand: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Modell *</label>
                  <input type="text" value={vehicleData.model} onChange={e => setVehicleData({...vehicleData, model: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Alvázszám (VIN)</label>
                <input type="text" value={vehicleData.vin} onChange={e => setVehicleData({...vehicleData, vin: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Üzemanyag</label>
                  <select value={vehicleData.fuel_type} onChange={e => setVehicleData({...vehicleData, fuel_type: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option>Benzin</option><option>Dízel</option><option>Elektromos</option><option>Hibrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Váltó</label>
                  <select value={vehicleData.transmission} onChange={e => setVehicleData({...vehicleData, transmission: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option>Manuális</option><option>Automata</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Motor (cm3)</label>
                  <input type="number" value={vehicleData.engine_capacity} onChange={e => setVehicleData({...vehicleData, engine_capacity: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Km Állás</label>
                  <input type="number" value={vehicleData.current_km} onChange={e => setVehicleData({...vehicleData, current_km: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Műszaki érv.</label>
                  <input type="date" value={vehicleData.technical_exam_until} onChange={e => setVehicleData({...vehicleData, technical_exam_until: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl mt-4">AUTÓ MENTÉSE</button>
            </form>
          </div>
        </div>
      )}

      {/* MATRICA HOZZÁRENDELÉSE MODAL */}
      {showStickerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center rounded-t-[2rem]">
              <h2 className="text-xl font-black text-slate-800">Új Matrica</h2>
              <button onClick={() => setShowStickerModal(false)} className="text-slate-400 font-bold text-xl hover:text-red-500">✕</button>
            </div>
            <form onSubmit={handleStickerSubmit} className="p-6 space-y-4">
              {errorMessage && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold">⚠️ {errorMessage}</div>}
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Matrica Típusa</label>
                <select 
                  required
                  value={stickerData.sticker_type_id} 
                  onChange={e => setStickerData({...stickerData, sticker_type_id: e.target.value})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="">-- Válassz típust --</option>
                  {stickerTypes.map(st => (
                    <option key={st.id} value={st.id}>{st.name} ({st.price_category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Érvényességi idő (Lejárat)</label>
                <input 
                  type="date" required
                  value={stickerData.valid_until} 
                  onChange={e => setStickerData({...stickerData, valid_until: e.target.value})} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" 
                />
              </div>

              <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl mt-4 transition-colors">
                MATRICA HOZZÁADÁSA
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleList;