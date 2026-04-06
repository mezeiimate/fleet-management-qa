import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          axios.get(`${API_URL}/api/stats`),
          axios.get(`${API_URL}/api/alerts`)
        ]);
        setStats(statsRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error("Hiba a Vezérlőpult adatainak betöltésekor", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ fontFamily: '"Space Grotesk"', fontSize: '24px', textAlign: 'center', marginTop: '50px' }}>Vezérlőpult betöltése...</div>;
  }

  const total = parseInt(stats.totalVehicles) || 1; // 0-val osztás elkerülése
  const petrolPct = (stats.gasoline / total) * 100;
  const dieselPct = (stats.diesel / total) * 100;
  const electricPct = (stats.electric / total) * 100;
  const hybridPct = (stats.hybrid / total) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '100px' }}>
      
      {/* FEJLÉC */}
      <div style={{ display: 'flex', width: '1320px', height: '100px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ color: '#000', fontFamily: '"Space Grotesk"', fontSize: '36px', fontWeight: 'bold' }}>ÁTTEKINTÉS</div>
        <div style={{ color: '#172936', fontFamily: '"Space Grotesk"', fontSize: '18px', opacity: 0.7 }}>
          {new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      {/* KPI KÁRTYÁK (Felső 4 doboz) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', width: '1320px', marginBottom: '40px' }}>
        
        {/* Összes jármű */}
        <div style={{ background: '#FFFFFF', border: '2px solid #2D4353', borderRadius: '20px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ color: '#888', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Összes Jármű</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ color: '#172936', fontFamily: '"Space Grotesk"', fontSize: '48px', fontWeight: 'bold', lineHeight: '1' }}>{stats.totalVehicles}</div>
            <div style={{ fontSize: '32px' }}>🚗</div>
          </div>
        </div>

        {/* Aktív */}
        <div style={{ background: '#FFFFFF', border: '2px solid #10b981', borderRadius: '20px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)' }}>
          <div style={{ color: '#10b981', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Aktív / Úton</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ color: '#172936', fontFamily: '"Space Grotesk"', fontSize: '48px', fontWeight: 'bold', lineHeight: '1' }}>{stats.active}</div>
            <div style={{ fontSize: '32px' }}>✅</div>
          </div>
        </div>

        {/* Szervizben */}
        <div style={{ background: '#FFFFFF', border: '2px solid #f59e0b', borderRadius: '20px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.1)' }}>
          <div style={{ color: '#f59e0b', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Szervizben</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ color: '#172936', fontFamily: '"Space Grotesk"', fontSize: '48px', fontWeight: 'bold', lineHeight: '1' }}>{stats.service}</div>
            <div style={{ fontSize: '32px' }}>🔧</div>
          </div>
        </div>

        {/* Riasztások */}
        <div style={{ background: '#FFFFFF', border: '2px solid #ef4444', borderRadius: '20px', padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)' }}>
          <div style={{ color: '#ef4444', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Riasztások (30 nap)</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ color: '#172936', fontFamily: '"Space Grotesk"', fontSize: '48px', fontWeight: 'bold', lineHeight: '1' }}>{alerts.length}</div>
            <div style={{ fontSize: '32px' }}>⚠️</div>
          </div>
        </div>

      </div>

      {/* ALSÓ SZEKCIÓ (2 oszlop: Statisztikák és Riasztások) */}
      <div style={{ display: 'flex', gap: '40px', width: '1320px', alignItems: 'flex-start' }}>
        
        {/* BAL OSZLOP: Grafikonok és bontások */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '640px' }}>
          
          {/* Üzemanyag statisztika */}
          <div style={{ background: '#2D4353', borderRadius: '20px', padding: '30px', color: '#F4F8FA', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontFamily: '"Space Grotesk"', fontSize: '22px', margin: 0, fontWeight: 'bold' }}>Megoszlás (üzemanyag)</h2>
            
            {/* Progress Bar Container */}
            <div style={{ width: '100%', height: '30px', background: 'rgba(255,255,255,0.1)', borderRadius: '15px', display: 'flex', overflow: 'hidden' }}>
              {stats.gasoline > 0 && <div style={{ width: `${petrolPct}%`, background: '#3b82f6', transition: 'width 1s' }} title={`Benzin: ${stats.gasoline}`}></div>}
              {stats.diesel > 0 && <div style={{ width: `${dieselPct}%`, background: '#f59e0b', transition: 'width 1s' }} title={`Dízel: ${stats.diesel}`}></div>}
              {stats.electric > 0 && <div style={{ width: `${electricPct}%`, background: '#10b981', transition: 'width 1s' }} title={`Elektromos: ${stats.electric}`}></div>}
              {stats.hybrid > 0 && <div style={{ width: `${hybridPct}%`, background: '#8b5cf6', transition: 'width 1s' }} title={`Hibrid: ${stats.hybrid}`}></div>}
            </div>

            {/* Jelmagyarázat */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"Space Grotesk"', fontSize: '14px', fontWeight: 'bold' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div> Benzin: {stats.gasoline}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div> Dízel: {stats.diesel}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div> Elektromos: {stats.electric}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }}></div> Hibrid: {stats.hybrid}</div>
            </div>
          </div>

          {/* Járműkategóriák bontása */}
          <div style={{ background: '#FFFFFF', border: '2px solid #2D4353', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '22px', margin: 0, fontWeight: 'bold' }}>Megoszlás (kategória)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ padding: '15px', background: '#F4F8FA', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 'bold', color: '#1F5C88' }}>D1 (Személyautó)</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#172936' }}>{stats.d1} db</span>
              </div>
              <div style={{ padding: '15px', background: '#F4F8FA', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 'bold', color: '#1F5C88' }}>D2 (Teher / Kisbusz)</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#172936' }}>{stats.d2} db</span>
              </div>
              <div style={{ padding: '15px', background: '#F4F8FA', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 'bold', color: '#1F5C88' }}>D1m (Motorkerékpár)</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#172936' }}>{stats.d1m} db</span>
              </div>
              <div style={{ padding: '15px', background: '#F4F8FA', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '"Space Grotesk"', fontWeight: 'bold', color: '#1F5C88' }}>U (Utánfutó)</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#172936' }}>{stats.u} db</span>
              </div>
            </div>
          </div>

        </div>

        {/* JOBB OSZLOP: Riasztások és Teendők (Görgethető) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '640px', background: '#FFFFFF', border: '2px solid #2D4353', borderRadius: '20px', padding: '30px', boxSizing: 'border-box', height: '620px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '10px' }}>
            <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '22px', margin: 0, fontWeight: 'bold' }}>SÜRGŐS TEENDŐK</h2>
            <span style={{ background: '#ef4444', color: '#FFF', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold', fontFamily: '"Space Grotesk"' }}>{alerts.length} tétel</span>
          </div>

          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '10px' }}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', fontFamily: '"Space Grotesk"', fontSize: '18px' }}>
                🎉 Jelenleg nincs sürgős teendő vagy közelgő lejárat a flottában!
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} style={{ background: '#F4F8FA', borderLeft: `6px solid ${alert.type === 'hiba' ? '#f59e0b' : '#ef4444'}`, padding: '15px 20px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span style={{ fontFamily: '"Space Grotesk"', fontSize: '20px', fontWeight: 'bold', color: '#172936' }}>{alert.plate}</span>
                      <span style={{ fontFamily: '"Space Grotesk"', fontSize: '14px', color: '#888' }}>{alert.makeModel}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: alert.type === 'hiba' ? '#f59e0b' : '#ef4444' }}>
                      {alert.type === 'hiba' ? 'Hiba / Szerviz' : 'Lejárat'}
                    </span>
                  </div>
                  
                  <div style={{ fontFamily: '"Space Grotesk"', fontSize: '16px', color: '#2D4353' }}>
                    <strong>{alert.description}</strong>
                    {alert.validityDate && ` (Lejár: ${alert.validityDate})`}
                  </div>
                  
                  <div style={{ fontFamily: '"Space Grotesk"', fontSize: '12px', color: '#888', marginTop: '5px' }}>
                    👤 Felelős sofőr: {alert.driver}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;