import React, { useEffect, useState } from 'react';
import axios from 'axios';

function StickerSettings() {
  const [stickerTypes, setStickerTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modál állapotok
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('new'); // 'new' vagy 'edit'
  const [selectedSticker, setSelectedSticker] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', price_category: 'D1', price: 0 });

  const fetchStickerTypes = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/sticker-types');
      setStickerTypes(res.data);
    } catch (err) { console.error("Hiba", err); } 
    finally { setLoading(false); }
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
        await axios.post('http://localhost:5000/api/sticker-types', formData);
      } else {
        await axios.put(`http://localhost:5000/api/sticker-types/${selectedSticker.id}`, formData);
      }
      fetchStickerTypes();
      closeModal();
    } catch (err) { alert('Hiba történt mentéskor!'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Biztosan törlöd ezt a matrica típust? (Ha autókhoz van rendelve, a törlés sikertelen lesz.)')) {
      try {
        await axios.delete(`http://localhost:5000/api/sticker-types/${id}`);
        fetchStickerTypes();
      } catch (err) { alert(err.response?.data?.error || 'Hiba a törléskor!'); }
    }
  };

  const filteredStickers = stickerTypes.filter(s => categoryFilter === 'all' || s.price_category === categoryFilter);

  // Stílus a kategóriákhoz
  const getCategoryStyle = (cat) => {
    switch(cat) {
      case 'D1M': return { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }; // Lila
      case 'D1': return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };  // Kék
      case 'D2': return { bg: 'rgba(249, 115, 22, 0.2)', color: '#f97316' };  // Narancs
      case 'U': return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' };    // Zöld
      default: return { bg: 'rgba(156, 163, 175, 0.2)', color: '#6b7280' };
    }
  };

  if (loading) return <div style={{ fontFamily: '"Space Grotesk"', fontSize: '24px', textAlign: 'center', marginTop: '50px' }}>Adatok betöltése...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '100px' }}>
      
      {/* FEJLÉC */}
      <div style={{ display: 'flex', width: '1320px', height: '100px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ color: '#000', fontFamily: '"Space Grotesk"', fontSize: '36px' }}>Matrica Törzsadatok & Árak</div>
        <button onClick={() => openModal('new')} style={{ width: '220px', height: '50px', borderRadius: '20px', background: '#2D4353', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '20px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
          + ÚJ TÍPUS
        </button>
      </div>

      {/* SZŰRŐ ÉS TÁJÉKOZTATÓ SÁV */}
      <div style={{ display: 'flex', width: '1320px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: '#1F5C88', padding: '15px 30px', borderRadius: '20px', boxSizing: 'border-box' }}>
        <div style={{ color: '#FFF', fontFamily: '"Space Grotesk"', fontSize: '18px' }}>
          Az itt rögzített árak automatikusan betöltődnek, amikor új matricát adsz egy járműhöz!
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <span style={{ color: '#FFF', fontFamily: '"Space Grotesk"', fontWeight: 'bold' }}>Szűrés:</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ width: '150px', height: '40px', borderRadius: '10px', border: 'none', padding: '0 10px', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: 'bold' }}>
            <option value="all">Összes</option>
            <option value="D1M">D1M (Motor)</option>
            <option value="D1">D1 (Személy)</option>
            <option value="D2">D2 (Teher/Kisbusz)</option>
            <option value="U">U (Utánfutó)</option>
          </select>
        </div>
      </div>

      {/* TÁBLÁZAT */}
      <div style={{ width: '1320px', background: '#FFFFFF', borderRadius: '20px', border: '2px solid #2D4353', overflow: 'hidden' }}>
        {/* Táblázat Fejléc */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', background: '#2D4353', color: '#FFF', padding: '20px 30px', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: 'bold' }}>
          <div>Kategória</div>
          <div>Matrica Típusa</div>
          <div>Alapár (Bruttó)</div>
          <div style={{ textAlign: 'right' }}>Műveletek</div>
        </div>
        
        {/* Sorok */}
        {filteredStickers.map((s, index) => {
          const style = getCategoryStyle(s.price_category);
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr', padding: '20px 30px', borderBottom: index === filteredStickers.length - 1 ? 'none' : '1px solid #eee', alignItems: 'center', fontFamily: '"Space Grotesk"', fontSize: '18px' }}>
              <div>
                <span style={{ padding: '8px 15px', borderRadius: '15px', background: style.bg, color: style.color, fontWeight: 'bold' }}>{s.price_category}</span>
              </div>
              <div style={{ color: '#172936', fontWeight: 'bold' }}>{s.name}</div>
              <div style={{ color: '#1F5C88', fontWeight: 'bold', fontSize: '20px' }}>{s.price ? s.price.toLocaleString('hu-HU') : '0'} Ft</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => openModal('edit', s)} style={{ padding: '8px 20px', borderRadius: '10px', background: '#F4F8FA', border: 'none', color: '#1F5C88', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Space Grotesk"' }}>Szerkeszt</button>
                <button onClick={() => handleDelete(s.id)} style={{ padding: '8px 20px', borderRadius: '10px', background: '#fee2e2', border: 'none', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Space Grotesk"' }}>Töröl</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ÚJ/SZERKESZTŐ MODÁL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(23, 41, 54, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '500px', background: '#F4F8FA', borderRadius: '20px', padding: '40px', boxSizing: 'border-box', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '15px', right: '25px', background: 'transparent', border: 'none', fontSize: '30px', color: '#172936', cursor: 'pointer', fontFamily: '"Space Grotesk"' }}>✕</button>
            <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '28px', marginTop: 0, marginBottom: '20px' }}>
              {modalMode === 'new' ? 'Új Matrica Típus' : 'Matrica Szerkesztése'}
            </h2>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px', fontWeight: 'bold' }}>Járműkategória</label>
                <select value={formData.price_category} onChange={(e) => setFormData({...formData, price_category: e.target.value})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }}>
                  <option value="D1M">D1M (Motorkerékpár)</option>
                  <option value="D1">D1 (Személyautó)</option>
                  <option value="D2">D2 (Tehergépjármű / Kisbusz)</option>
                  <option value="U">U (Utánfutó)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px', fontWeight: 'bold' }}>Matrica Neve</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Pl. Éves Országos, 10 napos osztrák..." style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }} required />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px', fontWeight: 'bold' }}>Alapár (Bruttó Ft)</label>
                <input type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '20px' }} required />
              </div>

              <button type="submit" style={{ padding: '0 40px', height: '50px', background: '#1F5C88', color: '#F4F8FA', border: 'none', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}>
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