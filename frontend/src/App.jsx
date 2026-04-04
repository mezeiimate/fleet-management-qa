import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/VehicleList';
import UserManagement from './pages/UserManagement';
import ServiceBoard from './pages/ServiceBoard';
import MyCar from './pages/MyCar';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Belépéskor elmentjük a user adatait (név, szerepkör)
  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('dashboard');
  };

  // Ha nincs bejelentkezve senki, a Login oldalt mutatjuk
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Navigáció a Dashboardról a modulokba
  return (
    <>
      {currentPage === 'dashboard' && (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          onChangePage={setCurrentPage} 
        />
      )}
      {currentPage === 'vehicles' && <VehicleList onBack={() => setCurrentPage('dashboard')} />}
      {currentPage === 'users' && <UserManagement onBack={() => setCurrentPage('dashboard')} />}
      {currentPage === 'service' && <ServiceBoard onBack={() => setCurrentPage('dashboard')} />}
      {currentPage === 'my-car' && <MyCar userId={user.id} onBack={() => setCurrentPage('dashboard')} />}
    </>
  );
}

export default App;