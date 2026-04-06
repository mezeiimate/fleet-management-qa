import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ServiceBoard() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Szűrők állapotai (Tól-ig dátummal)
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');    

  // Modál állapotok a javítás lezárásához
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [repairCost, setRepairCost] = useState('');

  const fetchData = async () => {
    try {
      const [logsRes, vehRes] = await Promise.all([
        axios.get('http://localhost:5000/api/service-logs'),
        axios.get('http://localhost:5000/api/vehicles-full?includeArchived=true')
      ]);
      setLogs(logsRes.data);
      setVehicles(vehRes.data);
    } catch (err) {
      console.error("Hiba az adatok betöltésekor", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openResolveModal = (log) => {
    setSelectedLog(log);
    setRepairCost(''); 
    setIsModalOpen(true);
  };

  const closeResolveModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`http://localhost:5000/api/service-logs/${selectedLog.id}`, { 
        cost: parseInt(repairCost) || 0 
      });
      fetchData(); 
      closeResolveModal();
    } catch (err) { alert('Hiba a lezárás során!'); }
  };

  const handleDeleteItem = async (type, id) => {
    // Ha Szerviz VAGY Esemény (mindkettő a service_logs táblában van)
    const isServiceOrEvent = type === 'Szerviz' || type === 'Esemény';
    
    if (window.confirm(`Biztosan törlöd ezt a tételt? Ez a művelet nem visszavonható!`)) {
      try {
        if (isServiceOrEvent) {
          await axios.delete(`http://localhost:5000/api/service-logs/${id}`);
        } else {
          await axios.delete(`http://localhost:5000/api/stickers/${id}`);
        }
        fetchData();
      } catch (err) { alert('Hiba a törléskor!'); }
    }
  };

  // --- ADATOK EGYESÍTÉSE ÉS SZŰRÉSE ---
  
  let costItems = [];
  
  logs.filter(log => log.status === 'Megoldva').forEach(log => {
    // HA EZ EGY KM FRISSÍTÉS, ZÖLD 'ESEMÉNY' LESZ BELŐLE
    const isKmEvent = log.description.includes('Kilométeróra frissítés');
    costItems.push({
      type: isKmEvent ? 'Esemény' : 'Szerviz',
      id: log.id,
      plate: log.license_plate,
      brand: log.brand,
      model: log.model,
      description: log.description,
      cost: log.cost || 0,
      date: new Date(log.created_at)
    });
  });

  vehicles.forEach(v => {
    if (v.stickers && Array.isArray(v.stickers)) {
      v.stickers.forEach(st => {
        if (st && st.id) {
          costItems.push({
            type: 'Matrica',
            id: st.id,
            plate: v.license_plate,
            brand: v.brand,
            model: v.model,
            description: st.type_name,
            cost: st.purchase_price || 0,
            date: new Date(st.valid_until) 
          });
        }
      });
    }
  });

  // Rendezzük csökkenő sorrendbe dátum alapján
  costItems.sort((a, b) => b.date - a.date);

  const filteredCosts = costItems.filter(item => {
    const searchString = `${item.plate} ${item.brand} ${item.model} ${item.description}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && item.date >= new Date(startDate);
    }
    if (endDate) {
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && item.date <= endD;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const totalCost = filteredCosts.reduce((sum, item) => sum + item.cost, 0);

  const pendingLogs = logs.filter(log => {
    if (log.status !== 'Függőben') return false;
    const searchString = `${log.license_plate} ${log.brand} ${log.model} ${log.description}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "Típus;Rendszám;Jármű;Leírás;Dátum;Költség (Ft)\n";
    filteredCosts.forEach(item => {
      const formattedDate = item.date.toLocaleDateString('hu-HU');
      const row = `${item.type};${item.plate};${item.brand} ${item.model};"${item.description}";${formattedDate};${item.cost}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `flotta_penzugyek_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // STÍLUS GENERÁTOR A TÍPUSOKHOZ (Matrica, Szerviz, Esemény)
  const getTypeStyle = (type) => {
    if (type === 'Matrica') return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '#3b82f6' };
    if (type === 'Esemény') return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '#10b981' }; // ZÖLD
    return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '#f59e0b' }; // NARANCS Szerviz
  };

  if (loading) return <div style={{ fontFamily: '"Space Grotesk"', fontSize: '24px', textAlign: 'center', marginTop: '50px' }}>Adatok betöltése...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '100px' }}>
      
      {/* FEJLÉC ÉS DINAMIKUS ÖSSZEGZŐ */}
      <div style={{ display: 'flex', width: '1320px', height: '100px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ color: '#000', fontFamily: '"Space Grotesk"', fontSize: '36px' }}>Szerviz & Pénzügyek</div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ padding: '10px 20px', background: 'rgba(251, 146, 60, 0.2)', color: '#ea580c', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontWeight: '700', fontSize: '18px' }}>
            Függőben: {pendingLogs.length} db
          </div>
          <div style={{ padding: '10px 20px', background: '#1F5C88', color: '#FFF', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontWeight: '700', fontSize: '24px', border: '2px solid #172936' }}>
            Költség: {totalCost.toLocaleString('hu-HU')} Ft
          </div>
        </div>
      </div>

      {/* SZŰRŐSÁV */}
      <div style={{ display: 'flex', width: '1320px', gap: '15px', alignItems: 'center', marginBottom: '40px', background: '#2D4353', padding: '15px 30px', borderRadius: '20px', boxSizing: 'border-box' }}>
        <input 
          type="text" 
          placeholder="Rendszám, márka, modell vagy leírás..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ flex: 1, height: '40px', borderRadius: '10px', border: 'none', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }} 
        />
        
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: '160px', height: '40px', borderRadius: '10px', border: 'none', padding: '0 10px', fontFamily: '"Space Grotesk"', fontSize: '16px' }}>
          <option value="all">Minden típus</option>
          <option value="Szerviz">Csak Szerviz</option>
          <option value="Matrica">Csak Matrica</option>
          <option value="Esemény">Csak Esemény</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '16px' }}>Tól:</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ height: '40px', borderRadius: '10px', border: 'none', padding: '0 10px', fontFamily: '"Space Grotesk"', fontSize: '14px' }} />
          <span style={{ color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '16px' }}>Ig:</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ height: '40px', borderRadius: '10px', border: 'none', padding: '0 10px', fontFamily: '"Space Grotesk"', fontSize: '14px' }} />
        </div>

        <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '150px', height: '40px', background: '#16a34a', color: 'white', borderRadius: '10px', border: 'none', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
          ⬇ EXPORT
        </button>
      </div>

      {/* 2 OSZLOPOS ELRENDEZÉS */}
      <div style={{ display: 'flex', gap: '40px', width: '1320px', alignItems: 'flex-start' }}>
        
        {/* BAL OSZLOP: FOLYAMATBAN LÉVŐK */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '640px' }}>
          <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '24px', margin: '0 0 10px 0', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
            ⚠️ Függőben lévő javítások
          </h2>
          
          {pendingLogs.length === 0 ? (
            <div style={{ fontFamily: '"Space Grotesk"', fontSize: '18px', color: '#888' }}>Nincs aktív hibabejelentés a szűrés alapján.</div>
          ) : (
            pendingLogs.map(log => (
              <div key={log.id} style={{ width: '100%', background: '#2D4353', borderRadius: '20px', padding: '25px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'baseline' }}>
                    <div style={{ color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '28px', fontWeight: '700' }}>{log.license_plate}</div>
                    <div style={{ color: '#F4F8FA', opacity: 0.7, fontFamily: '"Space Grotesk"', fontSize: '18px' }}>{log.brand} {log.model}</div>
                  </div>
                  <div style={{ color: '#F4F8FA', opacity: 0.5, fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700' }}>
                    {new Date(log.created_at).toLocaleDateString('hu-HU')}
                  </div>
                </div>
                <div style={{ color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '20px', lineHeight: '1.5', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '15px' }}>
                  "{log.description}"
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <button onClick={() => handleDeleteItem('Szerviz', log.id)} style={{ width: '160px', height: '40px', borderRadius: '20px', background: 'transparent', border: '2px solid #ef4444', color: '#ef4444', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>ELVETÉS / TÖRLÉS</button>
                  <button onClick={() => openResolveModal(log)} style={{ padding: '0 30px', height: '40px', borderRadius: '20px', background: '#F4F8FA', border: 'none', color: '#2D4353', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>JAVÍTÁS LEZÁRÁSA</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* JOBB OSZLOP: KÖLTSÉGEK ÉS TÖRTÉNET */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '640px' }}>
          <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '24px', margin: '0 0 10px 0', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
            ✅ Pénzügyi Történet ({filteredCosts.length} tétel)
          </h2>
          
          {filteredCosts.length === 0 ? (
            <div style={{ fontFamily: '"Space Grotesk"', fontSize: '18px', color: '#888' }}>Nincs a szűrésnek megfelelő tétel.</div>
          ) : (
            filteredCosts.map(item => {
              const style = getTypeStyle(item.type);
              return (
                <div key={`${item.type}_${item.id}`} style={{ width: '100%', background: '#FFFFFF', border: '2px solid #2D4353', borderRadius: '20px', padding: '25px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', overflow: 'hidden' }}>
                  
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', background: style.border }}></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: '10px' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'baseline' }}>
                      <div style={{ color: '#2D4353', fontFamily: '"Space Grotesk"', fontSize: '28px', fontWeight: '700' }}>{item.plate}</div>
                      <div style={{ color: '#2D4353', opacity: 0.7, fontFamily: '"Space Grotesk"', fontSize: '18px' }}>{item.brand} {item.model}</div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                      <div style={{ color: style.color, fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', padding: '5px 10px', background: style.bg, borderRadius: '10px' }}>
                        {item.type}
                      </div>
                      <div style={{ color: '#2D4353', opacity: 0.5, fontFamily: '"Space Grotesk"', fontSize: '14px', fontWeight: '700' }}>
                        {item.date.toLocaleDateString('hu-HU')}
                      </div>
                    </div>
                  </div>

                  <div style={{ color: '#172936', fontFamily: '"Space Grotesk"', fontSize: '18px', lineHeight: '1.5', paddingLeft: '10px' }}>
                    <strong>{item.type === 'Matrica' ? 'Típus:' : 'Leírás:'}</strong> {item.description}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '15px', borderTop: '1px solid #eee', paddingLeft: '10px' }}>
                    <div style={{ fontFamily: '"Space Grotesk"', fontSize: '20px', color: '#172936' }}>
                      Költség: <span style={{ fontWeight: '700', color: '#1F5C88' }}>{item.cost ? item.cost.toLocaleString('hu-HU') : '0'} Ft</span>
                    </div>
                    <button onClick={() => handleDeleteItem(item.type, item.id)} style={{ width: '100px', height: '35px', borderRadius: '10px', background: '#fee2e2', border: 'none', color: '#ef4444', fontFamily: '"Space Grotesk"', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>TÖRLÉS</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* --- KÖLTSÉG BEKÉRŐ MODÁL ---- */}
      {isModalOpen && selectedLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(23, 41, 54, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '500px', background: '#F4F8FA', borderRadius: '20px', padding: '40px', boxSizing: 'border-box', position: 'relative' }}>
            <button onClick={closeResolveModal} style={{ position: 'absolute', top: '15px', right: '25px', background: 'transparent', border: 'none', fontSize: '30px', color: '#172936', cursor: 'pointer', fontFamily: '"Space Grotesk"' }}>✕</button>
            <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '28px', marginTop: 0, marginBottom: '20px' }}>Javítás lezárása</h2>
            
            <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px', fontWeight: 'bold' }}>Javítás költsége (Ft)</label>
                <input type="number" min="0" value={repairCost} onChange={(e) => setRepairCost(e.target.value)} style={{ height: '50px', borderRadius: '15px', border: '2px solid #1F5C88', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '20px', background: '#fff' }} placeholder="Pl. 45000" required />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" style={{ padding: '0 40px', height: '50px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: '700', cursor: 'pointer', width: '100%' }}>KÉSZ ÉS AKTIVÁLÁS</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ServiceBoard;