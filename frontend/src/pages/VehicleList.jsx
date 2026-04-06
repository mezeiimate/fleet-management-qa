import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [stickerTypes, setStickerTypes] = useState([]);
  const [users, setUsers] = useState([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const vehicleDialogRef = useRef(null);
  const stickerDialogRef = useRef(null);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const initialVehicleData = {
    license_plate: '', brand: '', model: '', year_of_manufacture: '',
    vin: '', fuel_type: 'Benzin', transmission: 'Manuális',
    engine_capacity: '', current_km: '', status: 'Aktív', technical_exam_until: '', user_id: '', category: 'D1'
  };
  const [vehicleData, setVehicleData] = useState(initialVehicleData);
  const [stickerData, setStickerData] = useState({ id: null, sticker_type_id: '', valid_until: '', purchase_price: 0 });
  const [isEditingSticker, setIsEditingSticker] = useState(false);

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

  const openVehicleModal = (vehicle = null) => {
    setErrorMessage('');
    if (vehicle) {
      setVehicleData({ ...vehicle, technical_exam_until: vehicle.technical_exam_until ? vehicle.technical_exam_until.split('T')[0] : '' });
      setEditingId(vehicle.id);
    } else {
      setVehicleData(initialVehicleData);
      setEditingId(null);
    }
    vehicleDialogRef.current?.showModal();
  };
  const closeVehicleModal = () => vehicleDialogRef.current?.close();

  const openStickerModal = (vehicleId, existingSticker = null) => {
    setErrorMessage(''); setSelectedVehicleId(vehicleId);
    if (existingSticker) {
      setIsEditingSticker(true);
      setStickerData({ id: existingSticker.id, sticker_type_id: existingSticker.type_id, valid_until: existingSticker.valid_until.split('T')[0], purchase_price: existingSticker.purchase_price || 0 });
    } else {
      setIsEditingSticker(false);
      setStickerData({ id: null, sticker_type_id: '', valid_until: '', purchase_price: 0 });
    }
    stickerDialogRef.current?.showModal();
  };
  const closeStickerModal = () => stickerDialogRef.current?.close();

  const handleVehicleSubmit = async (e) => {
    e.preventDefault(); setErrorMessage('');
    try {
      if (editingId) await axios.put(`http://localhost:5000/api/vehicles/${editingId}`, vehicleData);
      else await axios.post('http://localhost:5000/api/vehicles', vehicleData);
      closeVehicleModal(); fetchData();
    } catch (err) { setErrorMessage(err.response?.data?.error || "Hiba történt."); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Biztosan törlöd ezt a járművet?")) {
      await axios.delete(`http://localhost:5000/api/vehicles/${id}`); fetchData();
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const term = searchTerm.toLowerCase();
    const matchSearch = v.license_plate?.toLowerCase().includes(term) || v.brand?.toLowerCase().includes(term) || v.model?.toLowerCase().includes(term);
    const matchStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchCategory = filterCategory === 'all' || v.category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER ÉS KERESŐ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-4 text-slate-400">search</span>
            <input type="text" placeholder="Keresés rendszám vagy márka..." className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:border-slate-400 text-slate-900 font-bold" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-700 outline-none">
            <option value="all">Minden Státusz</option><option value="Aktív">Aktív</option><option value="Szervizben">Szervizben</option>
          </select>
        </div>
        <button onClick={() => openVehicleModal()} className="w-full lg:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-[20px]">add</span> ÚJ JÁRMŰ
        </button>
      </div>

      {/* KÁRTYÁK GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredVehicles.map(v => (
          <div key={v.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col justify-between group">
            
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{v.license_plate}</h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{v.brand} {v.model}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openVehicleModal(v)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-blue-600 transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                <button onClick={() => handleDelete(v.id)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">person</span>
                <span className="text-sm font-bold text-slate-700">{v.driver_name || 'Nincs sofőr kijelölve'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">speed</span>
                <span className="text-sm font-bold text-slate-700">{v.current_km ? `${v.current_km} km` : '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">event_available</span>
                <span className={`text-sm font-bold ${v.technical_exam_until && new Date(v.technical_exam_until) < new Date() ? 'text-red-500' : 'text-slate-700'}`}>
                  {v.technical_exam_until ? new Date(v.technical_exam_until).toLocaleDateString('hu-HU') : 'Nincs adat'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${v.status === 'Aktív' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{v.status}</span>
              <button onClick={() => openStickerModal(v.id)} className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">sell</span> Matricák ({v.stickers?.length || 0})
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* JÁRMŰ MODAL - TISZTA FEHÉR */}
      <dialog ref={vehicleDialogRef} onCancel={closeVehicleModal} className="p-0 rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-2xl bg-white backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm open:flex flex-col">
        <div className="bg-white flex flex-col w-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><span className="material-symbols-outlined">directions_car</span> {editingId ? 'Jármű Szerkesztése' : 'Új Jármű Felvétele'}</h2>
            <button type="button" onClick={closeVehicleModal} className="text-slate-400 hover:text-slate-900"><span className="material-symbols-outlined">close</span></button>
          </div>
          <form onSubmit={handleVehicleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
            <div className="grid grid-cols-2 gap-6">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Rendszám *</label><input type="text" required value={vehicleData.license_plate} onChange={e => setVehicleData({...vehicleData, license_plate: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase text-slate-900 outline-none focus:border-slate-400" /></div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Sofőr</label>
                <select value={vehicleData.user_id} onChange={e => setVehicleData({...vehicleData, user_id: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-slate-400">
                  <option value="">-- Nincs kijelölve --</option>
                  {users.filter(u => u.role === 'driver').map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                </select>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Márka *</label><input type="text" required value={vehicleData.brand} onChange={e => setVehicleData({...vehicleData, brand: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Modell *</label><input type="text" required value={vehicleData.model} onChange={e => setVehicleData({...vehicleData, model: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Km Állás</label><input type="number" value={vehicleData.current_km} onChange={e => setVehicleData({...vehicleData, current_km: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none" /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Műszaki érvényesség</label><input type="date" value={vehicleData.technical_exam_until} onChange={e => setVehicleData({...vehicleData, technical_exam_until: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none" /></div>
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl mt-4 transition-colors">ADATOK MENTÉSE</button>
          </form>
        </div>
      </dialog>

      {/* MATRICA MODAL - TISZTA FEHÉR */}
      <dialog ref={stickerDialogRef} onCancel={closeStickerModal} className="p-0 rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-sm bg-white backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm open:flex flex-col">
         <div className="bg-white flex flex-col w-full">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><span className="material-symbols-outlined">sell</span> Matrica kezelése</h2>
              <button type="button" onClick={closeStickerModal} className="text-slate-400 hover:text-slate-900"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-slate-500 mb-4">A részletes matricakezelőt fejlesztjük. Ez a felület az Apple-stílusú demó része.</p>
              <button onClick={closeStickerModal} className="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-xl">Bezárás</button>
            </div>
         </div>
      </dialog>

    </div>
  );
}

export default VehicleList;