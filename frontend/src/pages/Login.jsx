import React, { useState } from 'react';
import axios from 'axios';
// BEHOZZUK A PONTOS SVG LOGÓT
import logoImage from '../assets/FFR_logo.svg';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { username, password });
      onLogin(res.data.user);
    } catch (err) {
      setError('Hibás felhasználónév vagy jelszó!');
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{ 
        backgroundColor: '#F4F8FA', // Figma háttér
        fontFamily: '"Space Grotesk", sans-serif', // Figma betűtípus
        gap: '79px' // Figma fő távolság
      }}
    >
      {/* 1. LOGÓ ÉS CÍM SZEKCIÓ */}
      <div className="flex flex-col items-center gap-[20px]">
        {/* Logó Container - Frissítve az SVG használatához */}
        <div 
          style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%',
            boxShadow: '0 4px 4px 0 #1F5C88', // A Figma árnyékod
            backgroundImage: `url(${logoImage})`, // Betöltjük az FFR_logo.svg-t
            backgroundPosition: 'center',
            backgroundSize: 'contain', // Használjunk 'contain'-t, hogy az egész SVG beleférjen
            backgroundRepeat: 'no-repeat',
            backgroundColor: 'transparent' // Átlátszó háttér
          }}
        ></div>
        
        {/* Oldal címe */}
        <h1 
          style={{ 
            color: '#1F5C88',
            textAlign: 'center',
            fontSize: '64px',
            fontWeight: '700',
            letterSpacing: '6.4px',
            lineHeight: 'normal',
            margin: 0
          }}
        >
          mFLEET FLOTTAKEZEŐ RENDSZER
        </h1>
      </div>

      {/* 2. BEJELENTKEZŐ FORM (a form kezdetéig kérted, de itt a teljes, működő fájl) */}
      <form 
        onSubmit={handleSubmit}
        className="flex flex-col"
        style={{ width: '400px', gap: '20px' }}
      >
        {error && <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>}

        {/* Felhasználónév blokk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label 
            style={{ 
              color: '#172936',
              fontSize: '20px',
              fontWeight: '400'
            }}
          >
            Felhasználónév
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '400px',
              height: '60px',
              borderRadius: '20px',
              border: '1px solid #172936',
              background: '#F4F8FA',
              padding: '0 20px',
              boxSizing: 'border-box', // EZ TARTJA EGYBEN A SZÉLESSÉGET (400px)
              outline: 'none',
              fontSize: '18px',
              color: '#172936'
            }}
          />
        </div>

        {/* Jelszó blokk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label 
            style={{ 
              color: '#172936',
              fontSize: '20px',
              fontWeight: '400'
            }}
          >
            Jelszó
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '400px',
              height: '60px',
              borderRadius: '20px',
              border: '1px solid #172936',
              background: '#F4F8FA',
              padding: '0 20px',
              boxSizing: 'border-box', // EZ TARTJA EGYBEN A SZÉLESSÉGET (400px)
              outline: 'none',
              fontSize: '18px',
              color: '#172936'
            }}
          />
        </div>

        {/* Bejelentkezés gomb */}
        <button
          type="submit"
          style={{
            width: '400px', // Hajszálpontosan megegyezik a mezőkkel
            height: '60px',
            borderRadius: '20px',
            border: '1px solid #172936',
            background: '#1F5C88',
            color: '#F4F8FA',
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '2.4px',
            cursor: 'pointer',
            marginTop: '10px',
            transition: 'opacity 0.2s',
            boxSizing: 'border-box'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.9'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          BEJELENTKEZÉS
        </button>
      </form>
    </div>
  );
};

export default Login;