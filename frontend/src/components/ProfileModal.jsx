import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function ProfileModal({ user, isOpen, onClose }) {
  const dialogRef = useRef(null);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Figyeljük, hogy mikor kell megnyitni vagy bezárni
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('');
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage('Az új jelszavak nem egyeznek!');
      return;
    }

    try {
      await axios.patch(`http://localhost:5000/api/users/${user.id}/password`, {
        currentPassword,
        newPassword
      });
      setIsError(false);
      setMessage('Jelszó sikeresen megváltoztatva!');
      
      // Sikeres mentés után 1.5 másodperccel bezárjuk az ablakot
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.error || 'Hiba a jelszó módosításakor.');
    }
  };

  return (
    <dialog ref={dialogRef} onCancel={onClose} className="bg-transparent p-0 w-full max-w-sm backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm rounded-[2rem] shadow-2xl open:flex flex-col">
      <div className="bg-white w-full h-full flex flex-col">
        <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-black text-white">Profil & Jelszó</h2>
          <button type="button" onClick={onClose} className="text-slate-400 font-bold text-xl hover:text-red-400 transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500 text-lg">
                {user?.name?.charAt(0)?.toUpperCase()}
             </div>
             <div>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{user?.role === 'driver' ? 'Sofőr' : user?.role}</p>
                <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-xs font-medium text-slate-400">@{user?.username}</p>
             </div>
          </div>

          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Jelszó módosítása</h3>

          {message && (
            <div className={`p-3 rounded-xl text-sm font-bold ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {isError ? '⚠️ ' : '✅ '} {message}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Jelenlegi Jelszó</label>
            <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Új Jelszó</label>
            <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Új Jelszó Megerősítése</label>
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
          </div>

          <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-xl mt-4 shadow-lg transition-colors">
            JELSZÓ MENTÉSE
          </button>
        </form>
      </div>
    </dialog>
  );
}