import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/VehicleList';
import UserManagement from './pages/UserManagement';
import ServiceBoard from './pages/ServiceBoard';
import MyCar from './pages/MyCar';
import ProfileModal from './components/ProfileModal';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === 'driver') {
    return <MyCar user={user} onLogout={() => setUser(null)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- FIX FEJLÉC --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex justify-between items-center">
          
          <div className="flex items-center gap-10">
            <h1 
              onClick={() => setCurrentPage('dashboard')}
              className="text-2xl font-black tracking-tight text-slate-900 cursor-pointer flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-blue-600 text-3xl">directions_car</span>
              FLEET<span className="text-blue-600 font-medium">COMMAND</span>
            </h1>
            
            <nav className="hidden md:flex gap-8 text-sm font-bold text-slate-500 h-20 items-center">
              <button 
                onClick={() => setCurrentPage('vehicles')} 
                className={`h-full flex items-center border-b-2 hover:text-slate-900 transition-colors ${currentPage === 'vehicles' ? 'text-slate-900 border-slate-900' : 'border-transparent'}`}
              >
                Járműpark
              </button>
              <button 
                onClick={() => setCurrentPage('service')} 
                className={`h-full flex items-center border-b-2 hover:text-slate-900 transition-colors ${currentPage === 'service' ? 'text-slate-900 border-slate-900' : 'border-transparent'}`}
              >
                Szerviz & Pénzügy
              </button>
              {user.role === 'admin' && (
                <button 
                  onClick={() => setCurrentPage('users')} 
                  className={`h-full flex items-center border-b-2 hover:text-slate-900 transition-colors ${currentPage === 'users' ? 'text-slate-900 border-slate-900' : 'border-transparent'}`}
                >
                  Munkatársak
                </button>
              )}
            </nav>
          </div>
          
          <div className="flex items-center gap-5">
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="hidden sm:block text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role === 'admin' ? 'Admin' : 'Diszpécser'}</p>
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">{user.name}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-sm border-2 border-transparent group-hover:border-blue-100 group-hover:bg-blue-50 transition-all">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>
            
            <button 
              onClick={() => setUser(null)} 
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 w-10 h-10 rounded-full flex items-center justify-center transition-all" 
              title="Kijelentkezés"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* --- FŐ TARTALOM --- */}
      <main className="flex-grow w-full max-w-7xl mx-auto p-6 md:p-8">
        {currentPage === 'dashboard' && <Dashboard user={user} onChangePage={setCurrentPage} />}
        {currentPage === 'vehicles' && <VehicleList />}
        {currentPage === 'users' && <UserManagement />}
        {currentPage === 'service' && <ServiceBoard />}
      </main>

      {/* --- LÁBLÉC --- */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-medium">
          <p>© 2024 FleetCommand System. Minden jog fenntartva.</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5 hover:text-slate-800 cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[16px]">verified_user</span> Biztonságos kapcsolat
            </span>
            <span className="hover:text-slate-800 cursor-pointer transition-colors">Verzió 1.1.0</span>
          </div>
        </div>
      </footer>

      {/* GLOBÁLIS PROFIL MODÁL */}
      <ProfileModal user={user} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}

export default App;