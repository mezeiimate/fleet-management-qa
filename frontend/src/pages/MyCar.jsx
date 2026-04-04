import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ProfileModal from '../components/ProfileModal'; // <-- AZ ÚJ PROFIL MODÁL IMPORTJA

function MyCar({ user, onLogout }) {
  const [myVehicles, setMyVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // <-- ITT VAN AZ ÚJ ÁLLAPOT A PROFIL ABLAKHOZ -->
  const [showProfile, setShowProfile] = useState(false);
  
  // A HTML5 Dialog a hibabejelentéshez
  const reportDialogRef = useRef(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [reportData, setReportData] = useState({ description: '' });

  const fetchMyVehicles = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/vehicles-full');
      // Csak azokat az autókat tartjuk meg, amik a bejelentkezett felhasználóhoz tartoznak
      const filtered = res.data.filter(v => v.user_id === user.id);
      setMyVehicles(filtered);
      setLoading(false);
    } catch (err) { 
      console.error("Hiba a járművek lekérésekor:", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyVehicles(); }, []);

  // --- HIBABEJELENTÉS MODÁL VEZÉRLÉSE ---
  const openReportModal = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    setReportData({ description: '' });
    reportDialogRef.current?.showModal();
  };
  const closeReportModal = () => reportDialogRef.current?.close();

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/service-logs', { 
        vehicle_id: selectedVehicleId, 
        description: reportData.description 
      });
      closeReportModal();
      fetchMyVehicles(); // Újratöltjük, hogy látszódjon, ha a státusz "Szervizben"-re váltott
      alert("Hiba bejelentve! A diszpécser hamarosan felveszi veled a kapcsolatot.");
    } catch (err) { 
      alert("Hiba történt a bejelentéskor."); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      
      {/* --- FEJLÉC: MOST MÁR KATTINTHATÓ A PROFIL RÉSZ! --- */}
      <nav className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <div 
          onClick={() => setShowProfile(true)} 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity bg-slate-700/50 px-3 py-2 rounded-xl"
          title="Kattints a profilod szerkesztéséhez"
        >
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-black text-slate-200 text-sm">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Profilom (Szerkesztés)</p>
            <p className="text-sm font-bold leading-tight">{user?.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-[10px] font-black text-slate-400 hover:text-red-400 uppercase tracking-widest transition-colors bg-slate-700 px-4 py-2 rounded-lg">
          Kijelentkezés
        </button>
      </nav>

      <main className="max-w-3xl mx-auto p-6 mt-4">
        <h1 className="text-2xl font-black text-slate-800 mb-6">Saját Járműveim</h1>

        {loading ? (
          <p className="text-center text-slate-400 font-bold mt-10 animate-pulse">Adatok betöltése...</p>
        ) : myVehicles.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100 mt-10">
            <span className="text-6xl mb-4 block opacity-50">🚶‍♂️</span>
            <h2 className="text-xl font-black text-slate-700 mb-2">Nincs hozzád rendelve jármű</h2>
            <p className="text-sm text-slate-500 font-medium">Kérlek, vedd fel a kapcsolatot a diszpécserrel, hogy kiutaljon neked egy autót!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {myVehicles.map(v => (
              <div key={v.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">{v.brand} {v.model}</p>
                    <h2 className="text-4xl font-black italic tracking-tighter">{v.license_plate}</h2>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${v.status === 'Aktív' ? 'bg-green-500/20 text-green-100 border border-green-500/30' : v.status === 'Szervizben' ? 'bg-red-500/20 text-red-100 border border-red-500/30' : 'bg-orange-500/20 text-orange-100 border border-orange-500/30'}`}>
                    {v.status}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Műszaki vizsga</p>
                      <p className={`font-bold ${new Date(v.technical_exam_until) < new Date() ? 'text-red-600' : 'text-slate-800'}`}>
                        {v.technical_exam_until ? new Date(v.technical_exam_until).toLocaleDateString('hu-HU') : 'Nincs adat'}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Jelenlegi Km</p>
                      <p className="font-bold text-slate-800">{v.current_km ? `${v.current_km} km` : 'Nincs adat'}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase mb-3 border-b border-slate-100 pb-2">Aktív Matricák</h3>
                    {v.stickers && v.stickers.length > 0 ? (
                      <div className="space-y-2">
                        {v.stickers.map(sticker => {
                          const isExpired = new Date(sticker.valid_until) < new Date();
                          return (
                            <div key={sticker.id} className={`p-3 rounded-xl border flex justify-between items-center ${isExpired ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                              <span className="font-bold text-sm">{sticker.type_name}</span>
                              <span className="text-xs font-bold bg-white/50 px-2 py-1 rounded">Érv.: {new Date(sticker.valid_until).toLocaleDateString('hu-HU')}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-sm text-slate-400 italic">Nincs érvényes matrica az autón.</p>}
                  </div>

                  {v.status !== 'Szervizben' && (
                    <button onClick={() => openReportModal(v.id)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <span className="text-lg">🛠️</span> HIBABEJELETÉS / SZERVIZIGÉNY
                    </button>
                  )}
                  {v.status === 'Szervizben' && (
                    <div className="w-full bg-orange-50 text-orange-600 border border-orange-200 font-black py-4 rounded-xl flex items-center justify-center text-sm text-center px-4">
                      ⏳ Az autó jelenleg szervizben van. Nem tudsz új hibát bejelenteni.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* NATÍV HTML5 DIALOG HIBABEJELENTÉSHEZ */}
      <dialog 
        ref={reportDialogRef} 
        onCancel={closeReportModal} 
        className="bg-transparent p-0 w-full max-w-md backdrop:bg-slate-900/80 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl open:flex flex-col mx-auto"
      >
        <div className="bg-white w-full h-full flex flex-col">
          <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-red-700">Hiba bejelentése</h2>
            <button type="button" onClick={closeReportModal} className="text-red-400 font-bold text-xl hover:text-red-600">✕</button>
          </div>
          <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Probléma részletes leírása</label>
              <textarea 
                required 
                value={reportData.description} 
                onChange={e => setReportData({description: e.target.value})} 
                rows="5" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium resize-none outline-none focus:border-red-400 focus:bg-white transition-colors" 
                placeholder="Pl.: Világít a check engine lámpa, vagy defektet kaptam a jobb első keréken..."
              ></textarea>
            </div>
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl mt-2 shadow-lg transition-colors">
              BEJELENTÉS KÜLDÉSE
            </button>
          </form>
        </div>
      </dialog>

      {/* --- ITT A LÉNYEG: A BEILLESZTETT PROFIL MODÁL --- */}
      <ProfileModal 
        user={user} 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />

    </div>
  );
}

export default MyCar;