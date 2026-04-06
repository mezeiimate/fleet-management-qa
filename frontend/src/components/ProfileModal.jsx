import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function ProfileModal({ user, isOpen, onClose }) {
  const dialogRef = useRef(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setIsError(true); setMessage('Az új jelszavak nem egyeznek!'); return;
    }
    try {
      await axios.patch(`http://localhost:5000/api/users/${user.id}/password`, { currentPassword, newPassword });
      setIsError(false); setMessage('Jelszó sikeresen megváltoztatva!');
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setIsError(true); setMessage(err.response?.data?.error || 'Hiba történt.');
    }
  };

  return (
    <dialog 
      ref={dialogRef} 
      onCancel={onClose} 
      className="p-0 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[440px] bg-white backdrop:bg-slate-900/40 open:flex flex-col m-auto"
    >
      <div className="bg-white flex flex-col w-full rounded-3xl">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">manage_accounts</span>
            Profil beállítások
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
             <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 text-xl">
                {user?.name?.charAt(0)?.toUpperCase()}
             </div>
             <div>
                <p className="text-lg font-black text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-sm font-medium text-slate-500">@{user?.username}</p>
             </div>
          </div>

          <div className="space-y-4">
            {message && (
              <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${isError ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                <span className="material-symbols-outlined text-[18px]">{isError ? 'error' : 'check_circle'}</span> {message}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Jelenlegi jelszó</label>
              <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 transition-all" />
            </div>
            
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Új jelszó</label>
              <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 transition-all" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Új jelszó megerősítése</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3.5 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 transition-all" />
            </div>
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all mt-2">
            Módosítások mentése
          </button>
        </form>
      </div>
    </dialog>
  );
}

//a