import { useEffect, useState } from 'react';
import axios from 'axios';

function UserManagement({ onBack }) {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'driver' });

  const fetchUsers = () => {
    axios.get('http://localhost:5000/api/users').then(res => setUsers(res.data));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/users', newUser)
      .then(() => {
        fetchUsers();
        setNewUser({ name: '', username: '', password: '', role: 'driver' });
      })
      .catch(err => alert(err.response.data.error));
  };

  const handleDelete = (id) => {
    if (window.confirm("Biztosan törlöd?")) {
      axios.delete(`http://localhost:5000/api/users/${id}`).then(() => fetchUsers());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-6 text-blue-600 font-bold hover:underline">← Vissza a Dashboardra</button>
        <h1 className="text-3xl font-black mb-8 text-gray-800 uppercase italic tracking-tighter">Felhasználók és Jogosultságok</h1>

        {/* Új felhasználó létrehozása űrlap */}
        <div className="bg-white p-8 rounded-3xl shadow-xl mb-10 border-t-8 border-blue-600">
          <h2 className="text-xl font-bold mb-6 text-gray-700">Új munkatárs regisztrálása</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input 
              placeholder="Teljes név" 
              className="border-2 p-3 rounded-xl outline-none focus:border-blue-500"
              value={newUser.name}
              onChange={e => setNewUser({...newUser, name: e.target.value})}
              required
            />
            <input 
              placeholder="Felhasználónév" 
              className="border-2 p-3 rounded-xl outline-none focus:border-blue-500"
              value={newUser.username}
              onChange={e => setNewUser({...newUser, username: e.target.value})}
              required
            />
            <input 
              type="password"
              placeholder="Jelszó" 
              className="border-2 p-3 rounded-xl outline-none focus:border-blue-500"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              required
            />
            <select 
              className="border-2 p-3 rounded-xl bg-white outline-none focus:border-blue-500 font-bold"
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value})}
            >
              <option value="driver">Sofőr</option>
              <option value="support">Ügyfélszolgálat</option>
              <option value="admin">Adminisztrátor</option>
            </select>
            <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">Hozzáadás</button>
          </form>
        </div>

        {/* Felhasználói lista táblázatban */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-5 text-xs font-black uppercase tracking-widest">Név</th>
                <th className="p-5 text-xs font-black uppercase tracking-widest">Felhasználónév</th>
                <th className="p-5 text-xs font-black uppercase tracking-widest">Jelszó (Vizuális)</th>
                <th className="p-5 text-xs font-black uppercase tracking-widest">Szerepkör</th>
                <th className="p-5 text-xs font-black uppercase tracking-widest text-right">Művelet</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-blue-50/50 transition">
                  <td className="p-5 font-bold text-gray-800">{u.name}</td>
                  <td className="p-5 text-gray-500 font-mono text-sm">{u.username}</td>
                  <td className="p-5 text-gray-400 font-mono text-xs italic">{u.password}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 
                      u.role === 'support' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    {u.username !== 'admin' && (
                      <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 font-bold">Törlés</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;