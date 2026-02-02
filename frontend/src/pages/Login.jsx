import { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/login', credentials);
      if (res.data.success) {
        onLogin(res.data.user); 
      }
    } catch (err) {
      setError('Hibás felhasználónév vagy jelszó!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-12 text-center">
          <h1 className="text-white text-4xl font-black italic tracking-tighter">FLEET CORE</h1>
          <p className="text-blue-200 text-xs font-bold uppercase mt-2 tracking-widest">Központi Autópark Kezelő</p>
        </div>
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border-l-4 border-red-500">{error}</div>}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Azonosító</label>
            <input 
              type="text" required
              className="w-full border-2 border-gray-100 bg-gray-50 p-4 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold"
              value={credentials.username}
              onChange={e => setCredentials({...credentials, username: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Jelszó</label>
            <input 
              type="password" required
              className="w-full border-2 border-gray-100 bg-gray-50 p-4 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all font-bold"
              value={credentials.password}
              onChange={e => setCredentials({...credentials, password: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95">
            BELÉPÉS A RENDSZERBE
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;