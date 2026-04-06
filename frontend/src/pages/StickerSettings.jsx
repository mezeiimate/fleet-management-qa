import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StickerSettings = () => {
  const [stickers, setStickers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price_category: 'D1',
    price: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchStickers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sticker-types');
      setStickers(response.data);
    } catch (error) {
      console.error("Hiba a matricák betöltésekor", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStickers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (sticker = null) => {
    if (sticker) {
      setEditingId(sticker.id);
      setFormData({
        name: sticker.name,
        price_category: sticker.price_category,
        price: sticker.price
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', price_category: 'D1', price: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/sticker-types/${editingId}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/sticker-types', formData);
      }
      fetchStickers();
      closeModal();
    } catch (error) {
      alert("Hiba történt a mentés során.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a matrica típust?')) {
      try {
        await axios.delete(`http://localhost:5000/api/sticker-types/${id}`);
        fetchStickers();
      } catch (error) {
        // A backend hibaüzenetének megjelenítése (pl. ha már van autóhoz rendelve)
        alert(error.response?.data?.error || "Hiba történt a törlés során.");
      }
    }
  };

  if (loading) return <div className="p-8 text-center font-['Space_Grotesk'] text-[#2D4353]">Betöltés...</div>;

  return (
    <div className="p-8 font-['Space_Grotesk'] w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#2D4353]">Matrica Típusok és Árak</h2>
        <button 
          onClick={() => openModal()}
          className="bg-[#2D4353] text-[#F4F8FA] px-6 py-3 rounded hover:bg-opacity-90 transition-colors"
        >
          + Új Matrica
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2D4353] text-[#F4F8FA]">
              <th className="p-4 border-b border-[#2D4353]">Megnevezés</th>
              <th className="p-4 border-b border-[#2D4353]">Kategória</th>
              <th className="p-4 border-b border-[#2D4353]">Ár (Ft)</th>
              <th className="p-4 border-b border-[#2D4353] text-right">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {stickers.map((sticker) => (
              <tr key={sticker.id} className="hover:bg-gray-50 border-b border-gray-200">
                <td className="p-4 text-[#2D4353] font-medium">{sticker.name}</td>
                <td className="p-4 text-[#2D4353]">{sticker.price_category}</td>
                <td className="p-4 text-[#2D4353]">{sticker.price.toLocaleString('hu-HU')} Ft</td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => openModal(sticker)}
                    className="text-blue-600 hover:text-blue-800 mr-4 font-medium"
                  >
                    Szerkesztés
                  </button>
                  <button 
                    onClick={() => handleDelete(sticker.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Törlés
                  </button>
                </td>
              </tr>
            ))}
            {stickers.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">Nincsenek rögzített matricák.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL / FELUGRÓ ABLAK MENTÉSHEZ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-[#2D4353] mb-6">
              {editingId ? 'Matrica Szerkesztése' : 'Új Matrica Hozzáadása'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[#2D4353] mb-2 font-medium">Megnevezés (pl. Éves Pest vármegyei)</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required
                  className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-[#2D4353]"
                />
              </div>
              <div className="mb-4">
                <label className="block text-[#2D4353] mb-2 font-medium">Kategória</label>
                <select 
                  name="price_category" 
                  value={formData.price_category} 
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-[#2D4353]"
                >
                  <option value="D1">D1</option>
                  <option value="D1m">D1m</option>
                  <option value="D2">D2</option>
                  <option value="B2">B2</option>
                  <option value="U">U</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-[#2D4353] mb-2 font-medium">Ár (Ft)</label>
                <input 
                  type="number" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleInputChange} 
                  required
                  min="0"
                  className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-[#2D4353]"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Mégse
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-[#2D4353] text-[#F4F8FA] rounded hover:bg-opacity-90 transition-colors"
                >
                  Mentés
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerSettings;