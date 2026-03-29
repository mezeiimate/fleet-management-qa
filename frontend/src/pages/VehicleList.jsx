import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VehicleList({ onBack }) {
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  // Űrlap állapota
  const [formData, setFormData] = useState({
    license_plate: '', brand: '', model: '', year: '', fuel_type: 'Benzin'
  });

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/vehicles-full');
      setVehicles(res.data);
    } catch (err) { console.error("Hiba az adatok lekérésekor:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Itt küldjük az adatot a backendnek
      await axios.post('http://localhost:5000/api/vehicles', formData);
      setShowModal(false);
      setFormData({ license_plate: '', brand: '', model: '', year: '', fuel_type: 'Benzin' });
      fetchData(); // Újratöltjük a listát
    } catch (err) {
      alert("Hiba történt a mentés során!"); // QA Teszt pont: Ezt majd le kell cserélni szebb hibaüzenetre!
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] relative">
      {/* Fejléc */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-500 font-bold flex items-center gap-2 hover:text-blue-600 transition-colors">
          <span>←</span> VISSZA
        </button>
        <h1 className="text-xl font-black tracking-tight italic text-slate-800">
          JÁRMŰ<span className="text-blue-600">PARK</span>
        </h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-black text-xs transition-all shadow-lg shadow-blue-200"
        >
          + ÚJ AUTÓ
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-8 relative">
          <input 
            type="text" 
            placeholder="Keresés rendszám vagy típus alapján..."
            className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-4 opacity-30 text-xl">🔍</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map(v => (
            <div key={v.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">
                {v.brand} {v.model}
              </p>
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic mb-4">
                {v.license_plate}
              </h2>
              <div className="bg-slate-50 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-100 inline-block">
                {v.fuel_type?.toUpperCase() || 'ISMERETLEN'}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL - Új autó felvétele */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Új Jármű Felvétele</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rendszám</label>
                  <input type="text" name="license_plate" value={formData.license_plate} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Pl. ABC-123" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Évjárat</label>
                  <input type="number" name="year" value={formData.year} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Pl. 2020" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Márka</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Pl. Ford" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Modell</label>
                  <input type="text" name="model" value={formData.model} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold" placeholder="Pl. Focus" required />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Üzemanyag</label>
                <select name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-700">
                  <option value="Benzin">Benzin</option>
                  <option value="Dízel">Dízel</option>
                  <option value="Elektromos">Elektromos</option>
                  <option value="Hibrid">Hibrid</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl mt-6 transition-all">
                JÁRMŰ MENTÉSE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleList;