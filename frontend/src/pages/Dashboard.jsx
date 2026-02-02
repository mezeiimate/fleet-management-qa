import { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard({ userRole, onLogout, onNavigate }) {
  const [stats, setStats] = useState({ totalVehicles: 0, gasoline: 0, diesel: 0, electric: 0 });

  useEffect(() => {
    axios.get('http://localhost:5000/api/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error("Hiba a statisztikánál:", err));
  }, []);

  const menuItems = [
    { title: "Járműpark", roles: ["admin", "support"], icon: "🚗", target: 'vehicles' },
    { title: "Saját autóm", roles: ["driver"], icon: "🔑", target: 'my-car' },
    { title: "Felhasználók", roles: ["admin"], icon: "👥", target: 'users' },
    { title: "Szerviz naptár", roles: ["admin", "support"], icon: "📅", target: 'service' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Fejléc */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Üdvözöljük, {userRole}!</h1>
          <p className="text-gray-500 font-medium">Flotta Kezelő Rendszer v1.0</p>
        </div>
        <button onClick={onLogout} className="bg-white text-red-500 border-2 border-red-500 px-6 py-2 rounded-full font-bold hover:bg-red-500 hover:text-white transition">
          Kijelentkezés
        </button>
      </div>

      {/* STATISZTIKA SÁV (Csak Adminnak és Supportnak) */}
      {(userRole === 'admin' || userRole === 'support') && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-400 text-xs font-bold uppercase">Összes jármű</p>
            <p className="text-3xl font-black text-gray-800">{stats.totalVehicles} db</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-yellow-500">
            <p className="text-gray-400 text-xs font-bold uppercase">Benzines</p>
            <p className="text-3xl font-black text-gray-800">{stats.gasoline}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-gray-700">
            <p className="text-gray-400 text-xs font-bold uppercase">Dízel</p>
            <p className="text-3xl font-black text-gray-800">{stats.diesel}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
            <p className="text-gray-400 text-xs font-bold uppercase">Elektromos</p>
            <p className="text-3xl font-black text-gray-800">{stats.electric}</p>
          </div>
        </div>
      )}

      {/* MENÜ GOMBOK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems
          .filter(item => item.roles.includes(userRole))
          .map((item, index) => (
            <div 
              key={index} 
              onClick={() => onNavigate(item.target)} 
              className="bg-white p-10 rounded-3xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 flex flex-col items-center group"
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="text-xl font-black text-gray-700 uppercase tracking-tighter">{item.title}</h3>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Dashboard;