import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

function Settings({ onBack }) {
  const [stickers, setStickers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  const dialogRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Módosított kezdőadatok: Név, Kategória, Ár
  const initialFormData = { id: null, name: '', price_category: 'D1', price: '' };
  const [formData, setFormData] = useState(initialFormData);

  const fetchStickers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/sticker-types');
      setStickers(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStickers(); }, []);

  const openModal = (sticker = null) => {
    setErrorMessage('');
    if (sticker) {
      setFormData({ id: sticker.id, name: sticker.name, price_category: sticker.price_category, price: sticker.price });
      setIsEditing(true);
    } else {
      setFormData(initialFormData);
      setIsEditing(false);
    }
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    dialogRef.current?.close();
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/sticker-types/${formData.id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/sticker-types', formData);
      }
      closeModal();
      fetchStickers();
    } catch (err) { setErrorMessage("Hiba történt a mentéskor."); }
  };

  const handleDelete = async (id, name) => {
    if(window.confirm(`Biztosan törlöd a(z) "${name}" matricát? Ezzel az összes autóról is lekerül, amihez hozzá volt rendelve!`)) {
      try {
        await axios.delete(`http://localhost:5000/api/sticker-types/${id}`);
        fetchStickers();
      } catch (err) { alert("Hiba a törléskor."); }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative pb-20">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">← VISSZA</button>
        <h1 className="text-xl font-black tracking-tight italic text-slate-800">RENDSZER <span className="text-emerald-600">BEÁLLÍTÁSOK</span></h1>
        <button onClick={() => openModal()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-black text-xs shadow-lg">
          + ÚJ MATRICA TÍPUS
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-8">
        <h2 className="text-2xl font-black text-slate-800 mb-6">Autópálya Matricák Kezelése</h2>
        
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Matrica Megnevezése</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Kategória</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aktuális Ár</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {stickers.map(st => (
                <tr key={st.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-700">{st.name}</td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-100 text-slate-600 font-black px-2 py-1 rounded border uppercase text-xs">{st.price_category || '-'}</span>
                  </td>
                  <td className="p-4 font-black text-emerald-600 text-right">
                    {new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(st.price || 0)}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openModal(st)} className="text-blue-400 hover:text-blue-600 font-bold">✏️</button>
                    <button onClick={() => handleDelete(st.id, st.name)} className="text-red-400 hover:text-red-600 font-bold">🗑️</button>
                  </td>
                </tr>
              ))}
              {stickers.length === 0 && (
                <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic font-medium">Nincs rögzítve matricatípus.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <dialog ref={dialogRef} onCancel={closeModal} className="bg-transparent p-0 w-full max-w-sm backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl open:flex flex-col">
        <div className="bg-white w-full h-full flex flex-col">
          <div className="bg-emerald-50 p-6 border-b border-emerald-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-emerald-800">{isEditing ? 'Matrica Szerkesztése' : 'Új Matrica'}</h2>
            <button type="button" onClick={closeModal} className="text-emerald-400 font-bold text-xl hover:text-emerald-600">✕</button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold">⚠️ {errorMessage}</div>}
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Matrica Megnevezése *</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Pl.: Éves Pest megyei" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Kategória *</label>
                <select required value={formData.price_category} onChange={e => setFormData({...formData, price_category: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase">
                  <option value="D1">D1 (Személyautó)</option>
                  <option value="D2">D2 (Teher/Kisbusz)</option>
                  <option value="U">U (Utánfutó)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Ár (HUF) *</label>
                <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Pl.: 6660" />
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl mt-4 shadow-lg transition-colors">
              {isEditing ? 'MÓDOSÍTÁS MENTÉSE' : 'LÉTREHOZÁS'}
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}

export default Settings;