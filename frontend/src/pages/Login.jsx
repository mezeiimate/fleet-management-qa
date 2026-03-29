import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { username, password });
      
      // JAVÍTÁS: Itt kezeljük le, ha a backend máshogy (pl. objektumba csomagolva) küldi a user adatokat
      onLogin(res.data.user || res.data); 
      
    } catch (err) {
      setError('Hibás felhasználónév vagy jelszó!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl shadow-blue-100/50 p-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-blue-200">
            🚛
          </div>
          <h1 className="text-3xl font-black tracking-tighter italic text-slate-800">
            FLEET<span className="text-blue-600">CORE</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-2">Vállalati Flottakezelő Rendszer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Felhasználónév</label>
            <input 
              type="text" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
              placeholder="admin / driver"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Jelszó</label>
            <input 
              type="password" 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Szuper-látható piros hibaüzenet QA teszteléshez */}
          {error && (
            <div className="bg-red-600 text-white text-xs font-black p-4 rounded-2xl text-center shadow-lg shadow-red-200 border-b-4 border-red-800 uppercase tracking-widest">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            BEJELENTKEZÉS
          </button>
        </form>

        <p className="text-center text-slate-400 text-[10px] mt-8 font-medium">
          © 2026 FleetCore QA Testing Environment
        </p>
      </div>
    </div>
  );
}

export default Login;