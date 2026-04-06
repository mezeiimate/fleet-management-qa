import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard({ user }) {
  // Üres alapállapot, amíg meg nem jönnek a DB adatok
  const [stats, setStats] = useState({ 
    totalVehicles: 0, gasoline: 0, diesel: 0, electric: 0, hybrid: 0,
    active: 0, service: 0, inactive: 0,
    d1: 0, d1m: 0, d2: 0, u: 0
  });
  
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ÉLŐ ADATOK LEKÉRÉSE A BACKENDRŐL (DBeaverből)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Párhuzamosan lekérjük a statisztikákat és a riasztásokat
        const [statsRes, alertsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/stats'),
          axios.get('http://localhost:5000/api/alerts') // Ehhez kell majd egy backend végpont!
        ]);
        
        setStats(statsRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error("Hiba az adatok betöltésekor", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div style={{ fontFamily: '"Space Grotesk"', fontSize: '24px', paddingTop: '50px', textAlign: 'center' }}>Adatok betöltése folyamatban...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '100px' }}>
      
      {/* --- FELSŐ SZEKCIÓ: 3 KÁRTYA --- */}
      <div style={{ 
        display: 'flex', 
        gap: '60px', 
        width: '1320px',
        justifyContent: 'center',
        marginBottom: '40px'
      }}>
        
        {/* 1. KÁRTYA: Regisztrált járművek */}
        <div style={{ width: '400px', height: '250px', borderRadius: '20px', background: '#2D4353', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: '400px', height: '60px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'center', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>
            Regisztrált járművek
          </div>
          <div style={{ display: 'flex', width: '400px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'center', fontFamily: '"Space Grotesk"', fontSize: '36px', fontWeight: '700', marginBottom: '20px' }}>
            {stats.totalVehicles || 0}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>Benzin</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.gasoline || 0} db</div>
            </div>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>Dízel</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.diesel || 0} db</div>
            </div>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>Elektromos</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.electric || 0} db</div>
            </div>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>Hibrid</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.hybrid || 0} db</div>
            </div>
          </div>
        </div>

        {/* 2. KÁRTYA: Flotta állapota */}
        <div style={{ width: '400px', height: '250px', borderRadius: '20px', background: '#2D4353', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: '400px', height: '60px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'center', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>
            Flotta állapota
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>Aktív</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.active || 0} db</div>
            </div>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>Szervizben</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.service || 0} db</div>
            </div>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>Inaktív</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.inactive || 0} db</div>
            </div>
          </div>
        </div>

        {/* 3. KÁRTYA: Jármű kategóriák */}
        <div style={{ width: '400px', height: '250px', borderRadius: '20px', background: '#2D4353', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', width: '400px', height: '60px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'center', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>
            Jármű kategóriák
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>D1 kategória</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.d1 || 0} db</div>
            </div>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>D1m kategória</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.d1m || 0} db</div>
            </div>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>D2 kategória</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.d2 || 0} db</div>
            </div>
            <div style={{ display: 'flex', width: '320px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>U kategória</div>
              <div style={{ display: 'flex', width: '160px', height: '30px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'right', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>{stats.u || 0} db</div>
            </div>
          </div>
        </div>

      </div>

      {/* --- ALSÓ SZEKCIÓ: RIASZTÁSOK --- */}
      
      <div style={{
        display: 'flex', width: '1320px', height: '100px', flexDirection: 'column',
        justifyContent: 'center', color: '#000', textAlign: 'center',
        fontFamily: '"Space Grotesk"', fontSize: '36px', fontWeight: '400'
      }}>
        Riasztások ({alerts.length} db)
      </div>

      {/* Riasztás Kártyák Listája */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {alerts.map((alert) => (
          <div key={alert.id} style={{
            width: '1320px',
            height: '200px',
            background: '#2D4353',
            borderRadius: '20px',
            padding: '30px 23px', 
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between' // Felső és alsó rész elszeparálása
          }}>
            
            {/* Kártya Felső Sora (Jobbra tolt sofőrrel) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              
              {/* Bal oldal: Rendszám és Márka/Modell */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ display: 'flex', width: '160px', height: '40px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '700' }}>
                  {alert.plate}
                </div>
                <div style={{ display: 'flex', width: '400px', height: '40px', flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '700' }}>
                  {alert.makeModel}
                </div>
              </div>

              {/* Jobb oldal: Sofőr */}
              <div style={{ color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '700' }}>
                {alert.driver}
              </div>

            </div>

            {/* Kártya Alsó Sora (Típusfüggő elrendezés) */}
            {alert.type === 'hiba' ? (
              // 1. Típus: Hibabejelentés
              <div style={{ 
                width: '1273px', height: '100px', color: '#F4F8FA', 
                fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400',
                overflow: 'hidden'
              }}>
                {alert.description}
              </div>
            ) : (
              // 2. Típus: Lejárat / Érvényesség
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Első sor: Mi járt le */}
                <div style={{ width: '1273px', height: '30px', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>
                  {alert.description}
                </div>
                {/* Második sor: Érvényesség szöveg és Dátum Kapszula */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '160px', height: '30px', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' }}>
                    Érvényesség:
                  </div>
                  <div style={{ 
                    display: 'flex', width: '180px', height: '36px', borderRadius: '20px', background: '#172936', 
                    flexDirection: 'column', justifyContent: 'center', color: '#F4F8FA', textAlign: 'center', 
                    fontFamily: '"Space Grotesk"', fontSize: '24px', fontWeight: '400' 
                  }}>
                    {alert.validityDate}
                  </div>
                </div>
              </div>
            )}
            
          </div>
        ))}
      </div>

    </div>
  );
}

export default Dashboard;