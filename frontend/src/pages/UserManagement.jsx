import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

function UserManagement({ onBack }) {
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  
  // --- ÚJ SZŰRŐ ÁLLAPOTOK ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const dialogRef = useRef(null);
  const initialFormData = { id: null, username: '', password: '', name: '', role: 'driver' };
  const [formData, setFormData] = useState(initialFormData);
  const [isEditing, setIsEditing] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) { console.error("Hiba a felhasználók lekérésekor:", err); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openModal = (user = null) => {
    setErrorMessage('');
    if (user) {
      setFormData({ id: user.id, username: user.username, password: '', name: user.name, role: user.role });
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
    setErrorMessage('');
    try {
      if (isEditing) await axios.put(`http://localhost:5000/api/users/${formData.id}`, formData);
      else await axios.post('http://localhost:5000/api/users', formData);
      closeModal();
      fetchUsers();
    } catch (err) { setErrorMessage(err.response?.data?.error || "Hiba történt a mentéskor."); }
  };

  const handleDelete = async (id, name) => {
    if(window.confirm(`Biztosan törlöd ${name} felhasználót a rendszerből?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        fetchUsers();
      } catch (err) { alert("Hiba a törléskor"); }
    }
  };

  const roleDisplay = {
    admin: { label: 'Rendszergazda', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    operator: { label: 'Diszpécser', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    driver: { label: 'Sofőr', color: 'bg-slate-100 text-slate-700 border-slate-200' }
  };

  // --- ÚJ SZŰRÉSI LOGIKA ---
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(term) || u.username.toLowerCase().includes(term);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] relative pb-20">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="text-slate-500 font-bold hover:text-blue-600 transition-colors">← VISSZA</button>
        <h1 className="text-xl font-black tracking-tight italic text-slate-800">FELHASZNÁLÓ<span className="text-purple-600">KEZELÉS</span></h1>
        <button onClick={() => openModal()} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-black text-xs shadow-lg">
          + ÚJ MUNKATÁRS
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-8">
        
        {/* --- ÚJ SZŰRŐSÁV --- */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input type="text" placeholder="Keresés név vagy felhasználónév alapján..." className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl outline-none focus:border-purple-400 font-medium shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
            <span className="absolute left-4 top-4 opacity-30 text-xl">🔍</span>
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-white border border-slate-200 p-4 rounded-2xl font-bold text-slate-600 shadow-sm outline-none focus:border-purple-400 min-w-[200px] cursor-pointer">
            <option value="all">Minden Jogosultság</option>
            <option value="admin">Rendszergazda</option>
            <option value="operator">Diszpécser</option>
            <option value="driver">Sofőr</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(u => (
            <div key={u.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 relative flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-lg">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(u)} className="text-blue-400 hover:text-blue-600 font-bold">✏️</button>
                  <button onClick={() => handleDelete(u.id, u.name)} className="text-red-400 hover:text-red-600 font-bold">🗑️</button>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{u.name}</h3>
                <div className="text-xs font-bold text-slate-500 mt-2 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p>Felhasználó: <span className="text-slate-800">{u.username}</span></p>
                  <p>Jelszó: <span className="text-slate-400 tracking-widest">••••••••</span></p>
                </div>
              </div>
              <div className="flex">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${roleDisplay[u.role]?.color || 'bg-slate-100'}`}>
                  {roleDisplay[u.role]?.label || u.role}
                </span>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
             <div className="col-span-full p-10 text-center text-slate-400 font-bold bg-white rounded-3xl border border-slate-100">Nincs a keresésnek megfelelő munkatárs.</div>
          )}
        </div>
      </main>

      {/* DIALOG (Változatlan) */}
      <dialog ref={dialogRef} onCancel={closeModal} className="bg-transparent p-0 w-full max-w-md backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl open:flex flex-col">
        <div className="bg-white w-full h-full flex flex-col">
          <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800">{isEditing ? 'Munkatárs Szerkesztése' : 'Új Munkatárs'}</h2>
            <button type="button" onClick={closeModal} className="text-slate-400 font-bold text-xl hover:text-red-500">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold">⚠️ {errorMessage}</div>}
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Teljes Név *</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Felhasználónév *</label><input type="text" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
            <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Jelszó {isEditing && '(Opcionális)'}</label><input type="password" required={!isEditing} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={isEditing ? "Hagyd üresen, ha nem változik" : ""} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" /></div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Jogosultság *</label>
              <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                <option value="driver">Sofőr (Csak a saját autóját látja)</option>
                <option value="operator">Diszpécser (Kezeli a flottát)</option>
                <option value="admin">Rendszergazda (Teljes hozzáférés)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-xl mt-4 shadow-lg">{isEditing ? 'MÓDOSÍTÁSOK MENTÉSE' : 'MUNKATÁRS LÉTREHOZÁSA'}</button>
          </form>
        </div>
      </dialog>
    </div>
  );
}

export default UserManagement;