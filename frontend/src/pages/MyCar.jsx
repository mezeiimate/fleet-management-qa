import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logoImage from '../assets/FFR_logo.svg'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function MyCar({ user, onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicleIndex, setActiveVehicleIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modál állapotok (Hiba, KM frissítés, Jelszócsere)
  const [modalType, setModalType] = useState(''); // 'issue', 'km', 'password'
  const [issueText, setIssueText] = useState('');
  const [newKm, setNewKm] = useState('');
  
  // Jelszó állapotok
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchMyVehicles = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/my-vehicles/${user.id}`);
      setVehicles(res.data);
    } catch (err) {
      console.error("Hiba", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyVehicles(); }, []);

  const activeVehicle = vehicles[activeVehicleIndex];

  // --- MENTÉSEK (Hiba / KM) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'issue') {
        await axios.post(`${API_URL}/api/service-logs`, { vehicle_id: activeVehicle.id, description: issueText });
        alert('Hiba bejelentve! Kérlek, egyeztess a diszpécserrel.');
      } else if (modalType === 'km') {
        await axios.post(`${API_URL}/api/update-km`, { vehicle_id: activeVehicle.id, new_km: newKm });
        alert('Kilométeróra frissítve!');
      }
      setModalType('');
      setIssueText('');
      setNewKm('');
      fetchMyVehicles(); 
    } catch (err) {
      alert('Szerverhiba történt mentés közben.');
    }
  };

  // --- JELSZÓCSERE MENTÉSE ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return alert('A két jelszó nem egyezik!');
    }
    if (newPassword.length < 4) {
      return alert('A jelszónak legalább 4 karakter hosszú kell legyen!');
    }
    
    try {
      await axios.patch(`${API_URL}/api/users/${user.id}/password`, { password: newPassword });
      alert('A jelszavad sikeresen frissült!');
      setModalType('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert('Hiba történt a jelszó módosításakor.');
    }
  };

  // Nincs hozzárendelt autó kezelése
  if (!loading && vehicles.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F8FA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936' }}>Nincs hozzád rendelt gépjármű.</h2>
        <button onClick={onLogout} style={{ padding: '15px 30px', background: '#2D4353', color: '#FFF', borderRadius: '15px', border: 'none', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Kijelentkezés</button>
      </div>
    );
  }

  if (loading) return <div style={{ fontFamily: '"Space Grotesk"', textAlign: 'center', marginTop: '50px' }}>Betöltés...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F4F8FA', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* MOBILBARÁT KONTÉNER (Max 600px) */}
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box' }}>
        
        {/* MOBIL FEJLÉC ÉS JELSZÓ GOMB */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '50px', height: '50px', background: `url(${logoImage}) lightgray 50% / cover no-repeat` }}></div>
            <div style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '18px', fontWeight: 'bold' }}>Szia, {user.name}!</div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setModalType('password')} style={{ background: 'transparent', border: '2px solid #1F5C88', borderRadius: '10px', padding: '10px', color: '#1F5C88', cursor: 'pointer' }} title="Jelszó módosítása">
              ⚙️
            </button>
            <button onClick={onLogout} style={{ background: 'transparent', border: '2px solid #2D4353', borderRadius: '10px', padding: '10px 15px', color: '#2D4353', fontFamily: '"Space Grotesk"', fontWeight: 'bold', cursor: 'pointer' }}>
              KILÉPÉS
            </button>
          </div>
        </div>

        {/* HA TÖBB AUTÓJA VAN: LAPOZÓ */}
        {vehicles.length > 1 && (
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
            {vehicles.map((v, index) => (
              <button 
                key={v.id} 
                onClick={() => setActiveVehicleIndex(index)}
                style={{ flexShrink: 0, padding: '10px 20px', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: 'bold', border: 'none', background: index === activeVehicleIndex ? '#1F5C88' : '#e5e7eb', color: index === activeVehicleIndex ? '#FFF' : '#374151', cursor: 'pointer' }}
              >
                {v.license_plate}
              </button>
            ))}
          </div>
        )}

        {/* FŐ KÁRTYA (AKTÍV AUTÓ) */}
        <div style={{ background: '#2D4353', borderRadius: '25px', padding: '30px', color: '#FFF', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: '"Space Grotesk"', fontSize: '42px', fontWeight: '700', letterSpacing: '2px' }}>{activeVehicle.license_plate}</div>
              <div style={{ fontFamily: '"Space Grotesk"', fontSize: '20px', opacity: 0.8 }}>{activeVehicle.brand} {activeVehicle.model}</div>
            </div>
            <div style={{ padding: '8px 15px', borderRadius: '20px', background: activeVehicle.status === 'Aktív' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 146, 60, 0.2)', color: activeVehicle.status === 'Aktív' ? '#4ade80' : '#fb923c', fontFamily: '"Space Grotesk"', fontWeight: 'bold' }}>
              {activeVehicle.status}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.6, fontFamily: '"Space Grotesk"' }}>Aktuális KM</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: '"Space Grotesk"' }}>{activeVehicle.current_km.toLocaleString('hu-HU')}</div>
            </div>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.6, fontFamily: '"Space Grotesk"' }}>Üzemanyag</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: '"Space Grotesk"' }}>{activeVehicle.fuel_type}</div>
            </div>
          </div>

          {/* AKCIÓ GOMBOK (MOBILON NAGYOK) */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button onClick={() => setModalType('km')} style={{ flex: 1, padding: '20px 0', borderRadius: '15px', border: 'none', background: '#F4F8FA', color: '#1F5C88', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <span style={{ fontSize: '24px' }}>⏱️</span> KM FRISSÍTÉS
            </button>
            <button onClick={() => setModalType('issue')} style={{ flex: 1, padding: '20px 0', borderRadius: '15px', border: 'none', background: '#ef4444', color: '#FFF', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span> HIBA/ESEMÉNY
            </button>
          </div>
        </div>

        {/* MATRICÁK LISTÁJA */}
        <h3 style={{ fontFamily: '"Space Grotesk"', color: '#172936', marginTop: '30px', marginBottom: '15px' }}>Érvényes Matricák</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeVehicle.stickers.filter(s => s && s.id).length === 0 ? (
            <div style={{ color: '#888', fontFamily: '"Space Grotesk"' }}>Nincs érvényes matrica rögzítve.</div>
          ) : (
            activeVehicle.stickers.filter(s => s && s.id).map(st => (
              <div key={st.id} style={{ background: '#FFF', padding: '15px 20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ fontFamily: '"Space Grotesk"', fontWeight: 'bold', color: '#1F5C88', fontSize: '18px' }}>{st.type_name}</div>
                <div style={{ fontFamily: '"Space Grotesk"', color: '#888' }}>Érvényes: {new Date(st.valid_until).toLocaleDateString('hu-HU')}</div>
              </div>
            ))
          )}
        </div>

        {/* SZERVIZTÖRTÉNET (LOGOK) */}
        <h3 style={{ fontFamily: '"Space Grotesk"', color: '#172936', marginTop: '30px', marginBottom: '15px' }}>Utolsó Események</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeVehicle.service_history && activeVehicle.service_history.filter(h => h && h.id).length > 0 ? (
            activeVehicle.service_history
              .filter(h => h && h.id)
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 5)
              .map(hist => (
              <div key={hist.id} style={{ background: '#FFF', padding: '15px 20px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '5px', borderLeft: hist.status === 'Függőben' ? '5px solid #ef4444' : '5px solid #10b981', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: '"Space Grotesk"', fontWeight: 'bold', color: '#172936' }}>{hist.status}</div>
                  <div style={{ fontFamily: '"Space Grotesk"', color: '#888', fontSize: '14px' }}>{new Date(hist.created_at).toLocaleDateString('hu-HU')}</div>
                </div>
                <div style={{ fontFamily: '"Space Grotesk"', color: '#555' }}>{hist.description}</div>
              </div>
            ))
          ) : (
            <div style={{ color: '#888', fontFamily: '"Space Grotesk"' }}>Nincs rögzített esemény.</div>
          )}
        </div>

      </div>

      {/* --- MODÁLOK --- */}
      {modalType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(23, 41, 54, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '500px', background: '#F4F8FA', borderRadius: '25px', padding: '30px', position: 'relative' }}>
            
            <button onClick={() => { setModalType(''); setNewPassword(''); setConfirmPassword(''); }} style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', fontSize: '30px', color: '#172936', cursor: 'pointer' }}>✕</button>
            
            <h2 style={{ fontFamily: '"Space Grotesk"', marginTop: 0 }}>
              {modalType === 'km' ? 'Kilométeróra frissítése' : modalType === 'issue' ? 'Hiba / Esemény jelentése' : 'Jelszó módosítása'}
            </h2>
            
            <form onSubmit={modalType === 'password' ? handlePasswordChange : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              
              {/* KM MODÁL */}
              {modalType === 'km' && (
                <input type="number" min={activeVehicle.current_km} placeholder="Új óraállás..." value={newKm} onChange={(e) => setNewKm(e.target.value)} style={{ height: '60px', borderRadius: '15px', border: '2px solid #1F5C88', padding: '0 20px', fontSize: '24px', fontFamily: '"Space Grotesk"' }} required />
              )}

              {/* HIBA MODÁL */}
              {modalType === 'issue' && (
                <textarea rows="4" placeholder="Mi történt az autóval?" value={issueText} onChange={(e) => setIssueText(e.target.value)} style={{ borderRadius: '15px', border: '2px solid #ef4444', padding: '20px', fontSize: '18px', fontFamily: '"Space Grotesk"' }} required />
              )}

              {/* JELSZÓ MODÁLl */}
              {modalType === 'password' && (
                <>
                  <input type="password" placeholder="Új jelszó" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 20px', fontSize: '18px', fontFamily: '"Space Grotesk"' }} required />
                  <input type="password" placeholder="Új jelszó megerősítése" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 20px', fontSize: '18px', fontFamily: '"Space Grotesk"' }} required />
                </>
              )}

              <button type="submit" style={{ height: '60px', background: modalType === 'km' || modalType === 'password' ? '#1F5C88' : '#ef4444', color: '#FFF', borderRadius: '15px', border: 'none', fontSize: '20px', fontWeight: 'bold', fontFamily: '"Space Grotesk"', cursor: 'pointer' }}>
                {modalType === 'password' ? 'MENTÉS' : 'KÜLDÉS'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default MyCar;