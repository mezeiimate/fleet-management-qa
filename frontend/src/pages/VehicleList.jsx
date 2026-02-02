import { useEffect, useState } from 'react'
import axios from 'axios'

function VehicleList({ onBack }) {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newCar, setNewCar] = useState({ 
    license_plate: '', brand: '', model: '', year: '', vin: '', fuel_type: 'Benzin', user_id: '' 
  })

  const [searchTerm, setSearchTerm] = useState('');
  const [fuelFilter, setFuelFilter] = useState('Mind');

  const fetchData = async () => {
    try {
      const vRes = await axios.get('http://localhost:5000/api/vehicles-full');
      const dRes = await axios.get('http://localhost:5000/api/users');
      setVehicles(vRes.data);
      setDrivers(dRes.data.filter(u => u.role === 'driver'));
    } catch (err) { console.error(err); }
  }

  useEffect(() => { fetchData() }, [])

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFuel = fuelFilter === 'Mind' || v.fuel_type === fuelFilter;
    return matchesSearch && matchesFuel;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = editingId 
      ? axios.put(`http://localhost:5000/api/vehicles/${editingId}`, newCar)
      : axios.post('http://localhost:5000/api/vehicles', newCar);

    action.then(() => { fetchData(); resetForm(); });
  }

  const resetForm = () => {
    setShowForm(false); setEditingId(null);
    setNewCar({ license_plate: '', brand: '', model: '', year: '', vin: '', fuel_type: 'Benzin', user_id: '' });
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-600">
          <button onClick={onBack} className="font-bold text-gray-500 hover:text-blue-600">← Vissza</button>
          <h1 className="text-2xl font-black tracking-tight uppercase">Flotta Áttekintés</h1>
          <button onClick={() => { if(showForm) resetForm(); else setShowForm(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition">
            {showForm ? "Mégse" : "+ Új jármű"}
          </button>
        </div>

        {/* KERESŐ ÉS SZŰRŐ */}
        <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row gap-4">
            <input 
                placeholder="Rendszám vagy márka keresése..." 
                className="flex-1 bg-gray-50 border-2 border-transparent focus:border-blue-500 p-3 rounded-xl outline-none transition"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <select 
                className="bg-gray-50 border-2 border-transparent focus:border-blue-500 p-3 rounded-xl outline-none font-bold text-gray-600"
                value={fuelFilter}
                onChange={e => setFuelFilter(e.target.value)}
            >
                <option value="Mind">Összes üzemanyag</option>
                <option value="Benzin">Benzin</option>
                <option value="Dízel">Dízel</option>
                <option value="Elektromos">Elektromos</option>
            </select>
        </div>

        {showForm && (
          <div className="bg-white p-8 rounded-2xl shadow-xl mb-8 border-t-8 border-blue-500 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold mb-6 text-gray-700">{editingId ? 'Jármű szerkesztése' : 'Új jármű rögzítése'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input placeholder="Rendszám" className="border-2 p-3 rounded-xl font-bold" value={newCar.license_plate} onChange={e => setNewCar({...newCar, license_plate: e.target.value.toUpperCase()})} required />
              <input placeholder="Márka" className="border-2 p-3 rounded-xl" value={newCar.brand} onChange={e => setNewCar({...newCar, brand: e.target.value})} required />
              <input placeholder="Típus" className="border-2 p-3 rounded-xl" value={newCar.model} onChange={e => setNewCar({...newCar, model: e.target.value})} required />
              <select className="border-2 p-3 rounded-xl bg-white" value={newCar.user_id} onChange={e => setNewCar({...newCar, user_id: e.target.value})}>
                <option value="">Nincs kijelölve sofőr</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="border-2 p-3 rounded-xl bg-white" value={newCar.fuel_type} onChange={e => setNewCar({...newCar, fuel_type: e.target.value})}>
                <option value="Benzin">Benzin</option>
                <option value="Dízel">Dízel</option>
                <option value="Elektromos">Elektromos</option>
              </select>
              <button type="submit" className="md:col-span-3 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition">ADATOK MENTÉSE</button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVehicles.map(v => (
            <div key={v.id} className="bg-white rounded-[2rem] shadow-md p-6 relative border-2 border-transparent hover:border-blue-200 transition-all hover:shadow-2xl group">
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => {setNewCar(v); setEditingId(v.id); setShowForm(true);}} className="bg-gray-100 p-2 rounded-lg hover:bg-blue-100 transition">✏️</button>
                <button onClick={() => {if(window.confirm("Törlés?")) axios.delete(`http://localhost:5000/api/vehicles/${v.id}`).then(()=>fetchData())}} className="bg-gray-100 p-2 rounded-lg hover:bg-red-100 transition">🗑️</button>
              </div>

              <h2 className="text-3xl font-black text-gray-800 italic tracking-tighter">{v.license_plate}</h2>
              <p className="text-gray-400 font-bold text-sm uppercase mb-4">{v.brand} {v.model}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">{v.fuel_type}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 text-xs font-bold italic">{v.driver_name || "Nincs sofőr"}</span>
              </div>

              {/* JELENTETT HIBÁK MEGJELENÍTÉSE */}
              {v.reports && v.reports.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="animate-pulse">⚠️</span>
                    <span className="text-red-600 font-black text-[10px] uppercase tracking-tighter">Aktív hibajelentések ({v.reports.length})</span>
                  </div>
                  <ul className="space-y-1">
                    {v.reports.map(r => (
                      <li key={r.id} className="text-red-800 text-xs font-medium border-l-2 border-red-300 pl-2">
                        {r.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default VehicleList