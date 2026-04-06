import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function StickerSettings() {
  const [stickerTypes, setStickerTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Szűrők állapotai (Összhangban a többi oldaladdal)
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [nameFilter, setNameFilter] = useState('');

  // Modál állapotok
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('new');
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [formData, setFormData] = useState({ name: '', price_category: 'D1', price: 0 });

  const fetchStickerTypes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sticker-types`);
      setStickerTypes(res.data);
    } catch (err) { 
        console.error("Hiba az adatok betöltésekor:", err); 
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchStickerTypes(); }, []);

  const openModal = (mode, sticker = null) => {
    setModalMode(mode);
    if (mode === 'edit' && sticker) {
      setSelectedSticker(sticker);
      setFormData({ name: sticker.name, price_category: sticker.price_category, price: sticker.price || 0 });
    } else {
      setSelectedSticker(null);
      setFormData({ name: '', price_category: 'D1', price: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'new') {
        await axios.post(`${API_URL}/api/sticker-types`, formData);
      } else {
        await axios.put(`${API_URL}/api/sticker-types/${selectedSticker.id}`, formData);
      }
      fetchStickerTypes();
      closeModal();
    } catch (err) { alert('Hiba történt a mentés során!'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Biztosan törlöd ezt a matrica típust?')) {
      try {
        await axios.delete(`${API_URL}/api/sticker-types/${id}`);
        fetchStickerTypes();
      } catch (err) { alert('Hiba: A matrica típus valószínűleg már használatban van!'); }
    }
  };

  // Komplex szűrés (Név + Kategória)
  const filteredStickers = stickerTypes.filter(s => {
    const matchesCategory = categoryFilter === 'all' || s.price_category === categoryFilter;
    const matchesName = s.name.toLowerCase().includes(nameFilter.toLowerCase());
    return matchesCategory && matchesName;
  });

  const getCategoryStyle = (cat) => {
    switch(cat) {
      case 'D1M': return { bg: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '#a855f7' };
      case 'D1': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '#3b82f6' };
      case 'D2': return { bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316', border: '#f97316' };
      case 'U': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '#10b981' };
      default: return { bg: 'rgba(156, 163, 175, 0.1)', color: '#6b7280', border: '#6b7280' };
    }
  };

  if (loading) return <div style={{ fontFamily: '"Space Grotesk"', fontSize: '24px', textAlign: 'center', marginTop: '50px' }}>Adatok betöltése...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '100px' }}>
      
      {/* FEJLÉC */}
      <div style={{ display: 'flex', width: '1320px', height: '100px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ color: '#000', fontFamily: '"Space Grotesk"', fontSize: '36px' }}>MATRICÁK</div>
        <button onClick={() => openModal('new')} style={{ padding: '0 30px', height: '50px', borderRadius: '20px', background: '#2D4353', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
          + ÚJ TÍPUS FELVÉTELE
        </button>
      </div>

      {/* KOMPLEX SZŰRŐ SÁV (Dizájn fixálva) */}
      <div style={{ display: 'flex', width: '1320px', gap: '15px', alignItems: 'center', marginBottom: '40px', background: '#2D4353', padding: '15px 30px', borderRadius: '20px', boxSizing: 'border-box' }}>
        
        <input 
          type="text" 
          placeholder="Keresés matrica neve alapján..." 
          value={nameFilter} 
          onChange={(e) => setNameFilter(e.target.value)} 
          style={{ flex: 1, height: '40px', borderRadius: '10px', border: 'none', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px', outline: 'none' }} 
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontWeight: 'bold' }}>Kategória:</span>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)} 
            style={{ width: '220px', height: '40px', borderRadius: '10px', border: 'none', padding: '0 10px', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: 'bold', outline: 'none' }}
          >
            <option value="all">Minden kategória</option>
            <option value="D1">D1 (Személyautó)</option>
            <option value="D1M">D1m (Motorkerékpár)</option>
            <option value="D2">D2 (Teher / Kisbusz)</option>
            <option value="U">U (Utánfutó)</option>
          </select>
        </div>
      </div>

      {/* KÁRTYA LISTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '1320px' }}>
        {filteredStickers.map((s) => {
          const style = getCategoryStyle(s.price_category);
          return (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: '#FFFFFF', border: '2px solid #2D4353', borderRadius: '20px', padding: '20px 30px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
              
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', background: style.border }}></div>

              <div style={{ flex: 1, paddingLeft: '15px' }}>
                <span style={{ color: style.color, fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', padding: '8px 15px', background: style.bg, borderRadius: '12px', border: `1px solid ${style.border}` }}>
                  {s.price_category}
                </span>
              </div>
              
              <div style={{ flex: 2, color: '#172936', fontFamily: '"Space Grotesk"', fontSize: '22px', fontWeight: '700' }}>
                {s.name}
              </div>

              <div style={{ flex: 1, color: '#1F5C88', fontFamily: '"Space Grotesk"', fontSize: '26px', fontWeight: '700' }}>
                {s.price ? s.price.toLocaleString('hu-HU') : '0'} Ft
              </div>

              <div style={{ flex: 1, display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button onClick={() => openModal('edit', s)} style={{ padding: '0 20px', height: '40px', borderRadius: '12px', background: '#F4F8FA', border: '2px solid #1F5C88', color: '#1F5C88', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
                  Szerkesztés
                </button>
                <button onClick={() => handleDelete(s.id)} style={{ padding: '0 20px', height: '40px', borderRadius: '12px', background: 'transparent', border: '2px solid #ef4444', color: '#ef4444', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
                  Törlés
                </button>
              </div>
            </div>
          )
        })}

        {filteredStickers.length === 0 && (
          <div style={{ width: '100%', boxSizing: 'border-box', background: '#FFFFFF', border: '2px dashed #2D4353', borderRadius: '20px', padding: '50px', textAlign: 'center', fontFamily: '"Space Grotesk"', fontSize: '20px', color: '#888' }}>
            Nincs a keresési feltételeknek megfelelő matrica típus.
          </div>
        )}
      </div>

      {/* MODÁL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(23, 41, 54, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '500px', background: '#F4F8FA', borderRadius: '20px', padding: '40px', boxSizing: 'border-box', position: 'relative', border: '2px solid #2D4353' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '15px', right: '25px', background: 'transparent', border: 'none', fontSize: '30px', color: '#172936', cursor: 'pointer', fontFamily: '"Space Grotesk"' }}>✕</button>
            <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '28px', marginTop: 0, marginBottom: '25px' }}>
              {modalMode === 'new' ? 'Új Matrica Típus' : 'Matrica Szerkesztése'}
            </h2>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '8px', fontWeight: 'bold' }}>Járműkategória</label>
                <select value={formData.price_category} onChange={(e) => setFormData({...formData, price_category: e.target.value})} style={{ height: '50px', borderRadius: '15px', border: '2px solid #1F5C88', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '18px', background: '#fff', outline: 'none' }}>
                  <option value="D1">D1 (Személyautó)</option>
                  <option value="D1M">D1m (Motorkerékpár)</option>
                  <option value="D2">D2 (Teher / Kisbusz)</option>
                  <option value="U">U (Utánfutó)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '8px', fontWeight: 'bold' }}>Matrica Neve</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Pl. Éves Országos..." style={{ height: '50px', borderRadius: '15px', border: '2px solid #1F5C88', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '18px', background: '#fff', outline: 'none' }} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '8px', fontWeight: 'bold' }}>Alapár (Bruttó Ft)</label>
                <input type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})} style={{ height: '50px', borderRadius: '15px', border: '2px solid #1F5C88', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '20px', background: '#fff', color: '#1F5C88', fontWeight: 'bold', outline: 'none' }} required />
              </div>

              <button type="submit" style={{ marginTop: '10px', height: '50px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: '700', cursor: 'pointer' }}>
                MENTÉS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StickerSettings;