import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/VehicleList';
import UserManagement from './pages/UserManagement';
import ServiceBoard from './pages/ServiceBoard';
import MyCar from './pages/MyCar';
import logoImage from './assets/FFR_logo.svg'; 

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('Vezérlőpult');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.role === 'driver') {
    return <MyCar user={user} onLogout={() => setUser(null)} />;
  }

  const MenuButton = ({ title }) => {
    const isActive = currentPage === title;
    return (
      <button
        onClick={() => {
          if (title === 'Kijelentkezés') {
            setUser(null); 
          } else {
            setCurrentPage(title);
          }
        }}
        style={{
          display: 'flex',
          width: '180px',
          height: '60px',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: isActive && title !== 'Kijelentkezés' ? '#F4F8FA' : '#2D4353',
          color: isActive && title !== 'Kijelentkezés' ? '#2D4353' : '#F4F8FA',
          textAlign: 'center',
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: '20px',
          fontStyle: 'normal',
          fontWeight: '400',
          lineHeight: 'normal',
          border: 'none',
          cursor: 'pointer',
          padding: 0
        }}
      >
        {title}
      </button>
    );
  };

  return (
    <div style={{ backgroundColor: '#F4F8FA', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* 1. FEJLÉC MENÜ */}
      <div style={{ 
        width: '1440px', 
        height: '60px', 
        background: '#2D4353', 
        display: 'flex', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ display: 'flex' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: `url(${logoImage}) lightgray 50% / cover no-repeat` 
          }}></div>
          <MenuButton title="Vezérlőpult" />
          <MenuButton title="Járművek" />
          <MenuButton title="Szerviznaptár" />
          <MenuButton title="Beállítások" />
        </div>

        <div style={{ display: 'flex' }}>
          {user.role === 'admin' && <MenuButton title="Felhasználók" />}
          <MenuButton title="Kijelentkezés" />
        </div>
      </div>

      {/* 2. ÜDVÖZLŐ SZÖVEG */}
      <div style={{
        display: 'flex',
        width: '1380px',
        height: '100px',
        flexDirection: 'column',
        justifyContent: 'center',
        color: '#000',
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: '36px',
        fontStyle: 'normal',
        fontWeight: '400',
        lineHeight: 'normal'
      }}>
        Üdv, {user.name}
      </div>

      {/* 3. AZ AKTÍV OLDAL TARTALMA (Itt volt a hiányosság!) */}
      <div style={{ width: '1380px' }}>
        {currentPage === 'Vezérlőpult' && <Dashboard user={user} />}
        {currentPage === 'Járművek' && <VehicleList />}
        
        {/* BEKÖTÖTTÜK A SZERVIZNAPTÁRT */}
        {currentPage === 'Szerviznaptár' && <ServiceBoard />}
        
        {/* BEKÖTÖTTÜK A FELHASZNÁLÓKAT IS ELŐRE */}
        {currentPage === 'Felhasználók' && <UserManagement loggedInUser={user} />}
      </div>

    </div>
  ); 
}

export default App;