import React, { useEffect, useState } from 'react';
import axios from 'axios';

function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [stickerTypes, setStickerTypes] = useState([]);
  const [users, setUsers] = useState([]); // BEKERÜLT A FELHASZNÁLÓK ÁLLAPOT
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [activeTab, setActiveTab] = useState('adatlap'); 
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState(''); 
  const [stickerData, setStickerData] = useState({ sticker_type_id: '', valid_until: '', purchase_price: 0 });
  const [serviceData, setServiceData] = useState({ description: '' });

  const fetchData = async () => {
    try {
      // PÁRHUZAMOSAN LEKÉRJÜK A JÁRMŰVEKET, MATRICÁKAT ÉS A SOFŐRÖKET
      const [vehRes, stickRes, usersRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/vehicles-full?includeArchived=${showArchived}`),
        axios.get('http://localhost:5000/api/sticker-types'),
        axios.get('http://localhost:5000/api/users')
      ]);
      setVehicles(vehRes.data);
      setStickerTypes(stickRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Hiba az adatok betöltésekor", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [showArchived]);

  const openModal = (type, vehicle = null) => {
    setModalType(type);
    setSelectedVehicle(vehicle);
    setActiveTab('adatlap');
    setFormError(''); 
    
    if (type === 'new') {
      const defaultExamDate = new Date();
      defaultExamDate.setFullYear(defaultExamDate.getFullYear() + 4);
      const formattedDefaultExam = defaultExamDate.toISOString().split('T')[0];

      setFormData({ 
        license_plate: '', brand: '', model: '', year_of_manufacture: '', 
        vin: '', current_km: '', status: 'Aktív', technical_exam_until: formattedDefaultExam,
        category: 'D1', fuel_type: 'Benzin', user_id: '' // user_id HOZZÁADVA
      });
    } else if (vehicle) {
      const formattedDate = vehicle.technical_exam_until ? new Date(vehicle.technical_exam_until).toISOString().split('T')[0] : '';
      setFormData({ ...vehicle, technical_exam_until: formattedDate, user_id: vehicle.user_id || '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
    setFormError('');
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    setFormError('');

    const currentYear = new Date().getFullYear();
    if (formData.year_of_manufacture < 1900 || formData.year_of_manufacture > currentYear) {
      setFormError(`A gyártási évnek 1900 és ${currentYear} között kell lennie!`);
      return;
    }

    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    if (!vinRegex.test(formData.vin)) {
      setFormError('Az alvázszámnak (VIN) pontosan 17 karakterből kell állnia, és nem tartalmazhat I, O, Q betűket!');
      return;
    }

    let rawPlate = formData.license_plate.replace(/-/g, '').toUpperCase();
    let formattedPlate = formData.license_plate.toUpperCase();

    if (rawPlate.length < 6 || rawPlate.length > 7) {
      setFormError('A rendszám hossza (kötőjelek nélkül) 6 vagy 7 karakter kell legyen!');
      return;
    }

    if (/^[A-Z]{3}[0-9]{3}$/.test(rawPlate)) {
      formattedPlate = `${rawPlate.slice(0,3)}-${rawPlate.slice(3)}`;
    } else if (/^[A-Z]{4}[0-9]{3}$/.test(rawPlate)) {
      formattedPlate = `${rawPlate.slice(0,2)}-${rawPlate.slice(2,4)}-${rawPlate.slice(4)}`;
    } else if (!/^[A-Z]{3,6}[0-9]{1,4}$/.test(rawPlate)) {
      setFormError('Érvénytelen rendszám formátum!');
      return;
    }

    try {
      // Ha a user_id üres string, csináljunk belőle null-t az adatbázis számára
      const finalUserId = formData.user_id === '' ? null : formData.user_id;
      const dataToSave = { ...formData, license_plate: formattedPlate, vin: formData.vin.toUpperCase(), user_id: finalUserId };
      
      if (modalType === 'new') {
        await axios.post('http://localhost:5000/api/vehicles', dataToSave);
      } else {
        await axios.put(`http://localhost:5000/api/vehicles/${selectedVehicle.id}`, dataToSave);
      }
      fetchData();
      closeModal();
    } catch (err) { setFormError('Hiba a szerverrel való kommunikáció során.'); }
  };

  const handleDeleteVehicle = async (id) => {
    if (window.confirm('Biztosan archiválni akarod ezt a járművet?')) {
      try {
        await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
        fetchData();
        closeModal();
      } catch (err) { alert('Hiba a törléskor!'); }
    }
  };

  const handleAddSticker = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/stickers', { ...stickerData, vehicle_id: selectedVehicle.id });
      setStickerData({ sticker_type_id: '', valid_until: '', purchase_price: 0 });
      fetchData(); 
      const res = await axios.get(`http://localhost:5000/api/vehicles-full?includeArchived=${showArchived}`);
      setVehicles(res.data);
      setSelectedVehicle(res.data.find(v => v.id === selectedVehicle.id));
    } catch (err) { console.error(err); }
  };

  const handleDeleteSticker = async (id) => {
    if (window.confirm('Biztosan törlöd a matricát?')) {
      await axios.delete(`http://localhost:5000/api/stickers/${id}`);
      fetchData();
      const res = await axios.get(`http://localhost:5000/api/vehicles-full?includeArchived=${showArchived}`);
      setVehicles(res.data);
      setSelectedVehicle(res.data.find(v => v.id === selectedVehicle.id));
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/service-logs', { vehicle_id: selectedVehicle.id, description: serviceData.description });
      setServiceData({ description: '' });
      fetchData();
      alert('Hiba bejelentve! A jármű státusza Szervizben lett.');
      closeModal(); 
    } catch (err) { console.error(err); }
  };

  const getStatusStyle = (status) => {
    if (status === 'Aktív') return { bg: 'rgba(74, 222, 128, 0.2)', color: '#4ade80' };
    if (status === 'Szervizben') return { bg: 'rgba(251, 146, 60, 0.2)', color: '#fb923c' };
    if (status === 'Archivált') return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
    return { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' };
  };

  const filteredVehicles = vehicles.filter(v => {
    const searchString = `${v.license_plate} ${v.brand} ${v.model}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div style={{ fontFamily: '"Space Grotesk"', fontSize: '24px', textAlign: 'center', marginTop: '50px' }}>Járművek betöltése...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '100px' }}>
      
      <div style={{ display: 'flex', width: '1320px', height: '100px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#000', fontFamily: '"Space Grotesk"', fontSize: '36px' }}>JÁRMŰVEK ({filteredVehicles.length} DB)</div>
        <button 
          onClick={() => openModal('new')}
          style={{ width: '200px', height: '50px', borderRadius: '20px', background: '#2D4353', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '20px', fontWeight: '700', border: 'none', cursor: 'pointer' }}
        >
          + ÚJ JÁRMŰ
        </button>
      </div>

      <div style={{ display: 'flex', width: '1320px', gap: '20px', alignItems: 'center', marginBottom: '30px', background: '#2D4353', padding: '15px 30px', borderRadius: '20px', boxSizing: 'border-box' }}>
        <input type="text" placeholder="Keresés rendszám vagy márka alapján..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, height: '40px', borderRadius: '10px', border: 'none', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '200px', height: '40px', borderRadius: '10px', border: 'none', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }}>
          <option value="">Minden státusz</option>
          <option value="Aktív">Aktív</option>
          <option value="Szervizben">Szervizben</option>
          <option value="Inaktív">Inaktív</option>
          {showArchived && <option value="Archivált">Archivált</option>}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '16px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
          Archiváltak mutatása
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '60px', width: '1320px' }}>
        {filteredVehicles.map((vehicle) => {
          const statusStyle = getStatusStyle(vehicle.status);
          return (
            <div key={vehicle.id} style={{ width: '400px', height: '320px', borderRadius: '20px', background: '#2D4353', padding: '30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: vehicle.status === 'Archivált' ? '2px solid #ef4444' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '32px', fontWeight: '700', textDecoration: vehicle.status === 'Archivált' ? 'line-through' : 'none' }}>{vehicle.license_plate}</div>
                  <div style={{ color: '#F4F8FA', opacity: 0.7, fontFamily: '"Space Grotesk"', fontSize: '18px' }}>{vehicle.brand} {vehicle.model}</div>
                </div>
                <div style={{ padding: '5px 15px', borderRadius: '20px', background: statusStyle.bg, color: statusStyle.color, fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700' }}>
                  {vehicle.status}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '18px' }}><span style={{ opacity: 0.7 }}>Sofőr:</span> <span style={{ fontWeight: '700' }}>{vehicle.driver_name || 'Nincs'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '18px' }}><span style={{ opacity: 0.7 }}>Kategória:</span> <span style={{ fontWeight: '700' }}>{vehicle.category} • {vehicle.fuel_type}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={() => openModal('details', vehicle)} style={{ width: '160px', height: '40px', borderRadius: '20px', background: 'transparent', border: '2px solid #F4F8FA', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>RÉSZLETEK</button>
                <button onClick={() => openModal('edit', vehicle)} style={{ width: '160px', height: '40px', borderRadius: '20px', background: '#F4F8FA', border: 'none', color: '#2D4353', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>SZERKESZTÉS</button>
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(23, 41, 54, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '800px', background: '#F4F8FA', borderRadius: '20px', padding: '40px', boxSizing: 'border-box', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', fontSize: '30px', color: '#172936', cursor: 'pointer', fontFamily: '"Space Grotesk"' }}>✕</button>

            {modalType === 'details' && (
              <div style={{ display: 'flex', gap: '40px', borderBottom: '2px solid #ccc', marginBottom: '30px' }}>
                {['adatlap', 'matrica', 'szerviz'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'none', border: 'none', borderBottom: activeTab === tab ? '4px solid #1F5C88' : '4px solid transparent', paddingBottom: '10px', fontSize: '20px', fontFamily: '"Space Grotesk"', fontWeight: '700', color: activeTab === tab ? '#1F5C88' : '#888', cursor: 'pointer', textTransform: 'capitalize' }}>
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '32px', marginTop: 0 }}>
              {modalType === 'new' ? 'Új jármű felvitele' : modalType === 'edit' ? 'Jármű szerkesztése' : selectedVehicle.license_plate}
            </h2>

            {formError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontFamily: '"Space Grotesk"', fontWeight: '700' }}>⚠️ {formError}</div>}

            {(modalType === 'new' || modalType === 'edit') && (
              <form onSubmit={handleSaveVehicle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px' }}>Rendszám (Kötőjel nem kötelező)</label>
                  <input type="text" value={formData.license_plate || ''} onChange={(e) => setFormData({...formData, license_plate: e.target.value.toUpperCase()})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px', background: '#fff' }} placeholder="ABC123 vagy AABB123" required />
                </div>

                {[
                  { label: 'Márka', name: 'brand', type: 'text', req: true },
                  { label: 'Modell', name: 'model', type: 'text', req: true },
                  { label: 'Gyártási év', name: 'year_of_manufacture', type: 'number', req: true, min: 1900, max: new Date().getFullYear() },
                  { label: 'Alvázszám (17 karakter)', name: 'vin', type: 'text', req: true, maxLength: 17 },
                  { label: 'Aktuális Km', name: 'current_km', type: 'number', req: true, min: 0 },
                  { label: 'Műszaki érvényes', name: 'technical_exam_until', type: 'date', req: true }
                ].map((field) => (
                  <div key={field.name} style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px' }}>{field.label}</label>
                    <input type={field.type} value={formData[field.name] || ''} min={field.min} max={field.max} maxLength={field.maxLength} onChange={(e) => setFormData({...formData, [field.name]: e.target.value})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px', background: '#fff' }} required={field.req} />
                  </div>
                ))}
                
                {/* --- SOFŐR VÁLASZTÓ (ÚJ) --- */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px' }}>Kiosztott sofőr</label>
                  <select value={formData.user_id || ''} onChange={(e) => setFormData({...formData, user_id: e.target.value})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px', background: '#fff' }}>
                    <option value="">-- Nincs kiutalva --</option>
                    {users.filter(u => u.role === 'driver').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px' }}>Üzemanyag</label>
                  <select value={formData.fuel_type || 'Benzin'} onChange={(e) => setFormData({...formData, fuel_type: e.target.value})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px', background: '#fff' }} required>
                    <option value="Benzin">Benzin</option><option value="Dízel">Dízel</option><option value="Elektromos">Elektromos</option><option value="Hibrid">Hibrid</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px' }}>Kategória</label>
                  <select value={formData.category || 'D1'} onChange={(e) => setFormData({...formData, category: e.target.value})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px', background: '#fff' }} required>
                    <option value="D1">D1</option><option value="D1m">D1m</option><option value="D2">D2</option><option value="U">U</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  {modalType === 'edit' && selectedVehicle.status !== 'Archivált' ? (
                    <button type="button" onClick={() => handleDeleteVehicle(selectedVehicle.id)} style={{ padding: '0 20px', height: '50px', background: 'red', color: 'white', border: 'none', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: '700', cursor: 'pointer' }}>JÁRMŰ ARCHIVÁLÁSA</button>
                  ) : <div></div>}
                  <button type="submit" style={{ padding: '0 40px', height: '50px', background: '#1F5C88', color: '#F4F8FA', border: 'none', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: '700', cursor: 'pointer' }}>MENTÉS</button>
                </div>
              </form>
            )}

            {modalType === 'details' && activeTab === 'adatlap' && (
              <div style={{ fontFamily: '"Space Grotesk"', fontSize: '18px', color: '#172936', lineHeight: '2' }}>
                <p><strong>Márka és modell:</strong> {selectedVehicle.brand} {selectedVehicle.model}</p>
                <p><strong>Évjárat:</strong> {selectedVehicle.year_of_manufacture}</p>
                <p><strong>Alvázszám (VIN):</strong> {selectedVehicle.vin || '-'}</p>
                <p><strong>Km óra állása:</strong> {selectedVehicle.current_km.toLocaleString('hu-HU')} km</p>
                <p><strong>Műszaki érvényessége:</strong> {selectedVehicle.technical_exam_until ? new Date(selectedVehicle.technical_exam_until).toLocaleDateString('hu-HU') : 'Nincs adat'}</p>
              </div>
            )}

            {modalType === 'details' && activeTab === 'matrica' && (
              <div>
                <form onSubmit={handleAddSticker} style={{ display: 'flex', gap: '10px', marginBottom: '30px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontFamily: '"Space Grotesk"', fontSize: '14px' }}>Típus</label>
                    <select value={stickerData.sticker_type_id} onChange={(e) => setStickerData({...stickerData, sticker_type_id: e.target.value})} style={{ height: '40px', borderRadius: '10px', border: '1px solid #ccc' }} required>
                      <option value="">Típus kiválasztása</option>
                      {stickerTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontFamily: '"Space Grotesk"', fontSize: '14px' }}>Érvényes eddig</label>
                    <input type="date" value={stickerData.valid_until} onChange={(e) => setStickerData({...stickerData, valid_until: e.target.value})} style={{ height: '40px', borderRadius: '10px', border: '1px solid #ccc' }} required />
                  </div>
                  <div style={{ width: '100px', display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontFamily: '"Space Grotesk"', fontSize: '14px' }}>Ár (Ft)</label>
                    <input type="number" value={stickerData.purchase_price} onChange={(e) => setStickerData({...stickerData, purchase_price: e.target.value})} style={{ height: '40px', borderRadius: '10px', border: '1px solid #ccc' }} required />
                  </div>
                  <button type="submit" style={{ height: '40px', padding: '0 20px', background: '#1F5C88', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Hozzáadás</button>
                </form>

                {selectedVehicle.stickers.filter(s => s && s.id).map(sticker => (
                  <div key={sticker.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#fff', borderRadius: '10px', marginBottom: '10px', border: '1px solid #ddd', fontFamily: '"Space Grotesk"', alignItems: 'center' }}>
                    <div><strong>{sticker.type_name}</strong> - Érvényes: {new Date(sticker.valid_until).toLocaleDateString('hu-HU')} ({sticker.purchase_price} Ft)</div>
                    <button onClick={() => handleDeleteSticker(sticker.id)} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Törlés</button>
                  </div>
                ))}
              </div>
            )}

            {modalType === 'details' && activeTab === 'szerviz' && (
              <div>
                <form onSubmit={handleAddService} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                  <label style={{ fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: 'bold' }}>Új hiba/esemény jelentése:</label>
                  <textarea value={serviceData.description} onChange={(e) => setServiceData({description: e.target.value})} rows="3" style={{ borderRadius: '10px', border: '1px solid #ccc', padding: '10px', fontFamily: '"Space Grotesk"', fontSize: '16px' }} placeholder="Kérjük írja le a hibát/eseményt..." required />
                  <button type="submit" style={{ height: '50px', background: 'orange', color: 'white', border: 'none', borderRadius: '10px', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>HIBA/ESEMÉNY BEJELENTÉSE</button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default VehicleList;