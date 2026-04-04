import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/VehicleList';
import UserManagement from './pages/UserManagement';
import ServiceBoard from './pages/ServiceBoard';
import MyCar from './pages/MyCar';
import Settings from './pages/Settings';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = (userData) => {
    setUser(userData);
    // ÚJ LOGIKA: Ha sofőr lép be, a MyCar oldalra megy, mindenki más a Dashboardra
    if (userData.role === 'driver') {
      setCurrentPage('mycar');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      {currentPage === 'dashboard' && (
        <Dashboard user={user} onLogout={handleLogout} onChangePage={setCurrentPage} />
      )}
      {currentPage === 'vehicles' && <VehicleList onBack={() => setCurrentPage('dashboard')} />}
      {currentPage === 'users' && <UserManagement onBack={() => setCurrentPage('dashboard')} />}
      {currentPage === 'service' && <ServiceBoard onBack={() => setCurrentPage('dashboard')} />}
      {currentPage === 'settings' && <Settings onBack={() => setCurrentPage('dashboard')} />}
      
      {/* ÚJ OLDAL A SOFŐRÖKNEK */}
      {currentPage === 'mycar' && (
        <MyCar user={user} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;