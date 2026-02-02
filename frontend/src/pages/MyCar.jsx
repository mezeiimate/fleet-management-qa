import { useEffect, useState } from 'react';
import axios from 'axios';

function MyCar({ onBack, userId }) { // Itt megkapjuk a bejelentkezett user ID-ját
  const [myCars, setMyCars] = useState([]);
  const [description, setDescription] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Most már a ténylegesen bejelentkezett userId alapján kérdezzük le az autókat
    axios.get(`http://localhost:5000/api/my-vehicles/${userId}`)
      .then(res => {
        setMyCars(res.data);
        if (res.data.length > 0) setSelectedVehicle(res.data[0].id);
        setLoading(false);
      })
      .catch(err => {
        console.error("Hiba az autók lekérésekor:", err);
        setLoading(false);
      });
  }, [userId]);

  const sendReport = (e) => {
    e.preventDefault();
    if (!description) return alert("Kérlek, írd le a hibát!");
    
    axios.post('http://localhost:5000/api/reports', {
      vehicle_id: selectedVehicle,
      description: description
    }).then(() => {
      alert("Hibajelentés sikeresen elküldve az adminisztrátornak!");
      setDescription('');
    }).catch(err => alert("Hiba történt a küldés során."));
  };

  if (loading) return <div className="p-8 text-center font-bold">Betöltés...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="mb-6 text-blue-600 font-bold hover:underline">← Vissza a Dashboardra</button>
        <h1 className="text-3xl font-black mb-8 text-gray-800 tracking-tighter uppercase italic">Saját Járműveim</h1>

        {myCars.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] shadow-sm text-center border-2 border-dashed border-gray-200">
            <div className="text-5xl mb-4">🚫</div>
            <p className="text-gray-500 font-bold text-lg">Jelenleg nincs hozzád rendelt jármű a rendszerben.</p>
            <p className="text-gray-400 text-sm mt-2">Amennyiben ez hiba, keresd fel a flottakezelőt.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Autók kártyái */}
            {myCars.map(car => (
              <div key={car.id} className="bg-white p-8 rounded-[2rem] shadow-xl border-l-8 border-blue-600 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-black italic select-none">
                   {car.brand}
                </div>
                <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-2">{car.brand} {car.model}</p>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter mb-2">{car.license_plate}</h2>
                <div className="flex gap-4 mt-4 text-sm font-bold text-gray-400 uppercase italic">
                    <span>{car.year}</span>
                    <span>•</span>
                    <span>{car.fuel_type}</span>
                </div>
              </div>
            ))}

            {/* Hibabejelentő form */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border-t-8 border-red-500 mt-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-red-100 text-red-600 p-3 rounded-2xl text-2xl">⚠️</div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Hiba vagy szerviz igény bejelentése</h3>
              </div>
              
              <form onSubmit={sendReport} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Válaszd ki az érintett járművet</label>
                  <select 
                     className="w-full border-2 border-gray-100 p-4 rounded-2xl bg-gray-50 outline-none focus:border-red-500 focus:bg-white transition-all font-bold text-gray-700"
                     value={selectedVehicle}
                     onChange={e => setSelectedVehicle(e.target.value)}
                  >
                    {myCars.map(car => <option key={car.id} value={car.id}>{car.license_plate} ({car.brand})</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Hiba leírása</label>
                  <textarea 
                    placeholder="Kérlek, részletezd a problémát (pl. kattogó hang a futóműből, olajnyomás lámpa kigyulladt...)"
                    className="w-full border-2 border-gray-100 p-5 rounded-3xl h-40 outline-none focus:border-red-500 focus:bg-white transition-all font-medium text-gray-600"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-100 hover:bg-red-700 hover:-translate-y-1 transition-all active:translate-y-0 uppercase tracking-widest">
                  Bejelentés küldése
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCar;