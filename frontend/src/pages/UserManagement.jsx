import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UserManagement({ onBack }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const initialFormData = { username: '', password: '', name: '', role: 'driver' };
  const [formData, setFormData] = useState(initialFormData);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) { console.error("Hiba a felhasználók lekérésekor:", err); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await axios.post('http://localhost:5000/api/users', formData);
      setShowModal(false);
      setFormData(initialFormData);
      fetchUsers();
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Hiba történt a mentéskor.");
    }
  };

  const handleDelete = async (id, name) => {
    if(window.confirm(`Biztosan törlöd ${name} felhasználót a rendszerből?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        fetchUsers();
      } catch (err) { alert("Hiba a törléskor"); }
    }
  };

  // Jogosultságok szép magyar nevei és színei
  const roleDisplay = {
    admin: { label: 'Rendszergazda', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    operator: { label: 'Diszpécser', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    driver: { label: 'Sofőr', color: 'bg-slate-100 text-slate-700 border-slate-200' }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative pb-20">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">← VISSZA</button>
        <h1 className="text-xl font-black tracking-tight italic text-slate-800">FELHASZNÁLÓ<span className="text-blue-600">KEZELÉS</span></h1>
        <button onClick={() => { setShowModal(true); setErrorMessage(''); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-black text-xs shadow-lg">
          + ÚJ MUNKATÁRS
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative flex flex-col items-center text-center">
              <button onClick={() => handleDelete(u.id, u.name)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 font-bold">✕</button>
              
              <div className="w-16 h-16 rounded-full bg-slate-50 border-4 border-white shadow-sm flex items-center justify-center font-black text-slate-400 text-xl mb-4">
                {u.name.charAt(0).toUpperCase()}
              </div>
              
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1">{u.name}</h3>
              <p className="text-sm font-bold text-slate-400 mb-4">@{u.username}</p>
              
              <div className={`px-4 py-1.5 rounded-xl text-xs font-black border uppercase tracking-widest ${roleDisplay[u.role]?.color || 'bg-slate-100'}`}>
                {roleDisplay[u.role]?.label || u.role}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ÚJ FELHASZNÁLÓ MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center rounded-t-[2rem]">
              <h2 className="text-xl font-black text-slate-800">Új Munkatárs</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold text-xl hover:text-red-500">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold">⚠️ {errorMessage}</div>}
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Teljes Név *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Pl.: Kovács Béla" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Felhasználónév *</label>
                  <input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Jelszó *</label>
                  <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Szerepkör (Jogosultság) *</label>
                <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
                  <option value="driver">Sofőr (Csak a saját autóját látja)</option>
                  <option value="operator">Diszpécser (Kezeli a flottát)</option>
                  <option value="admin">Rendszergazda (Teljes hozzáférés)</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl mt-4">MENTÉS</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;