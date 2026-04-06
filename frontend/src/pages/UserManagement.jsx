import React, { useEffect, useState } from 'react';
import axios from 'axios';

function UserManagement({ loggedInUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modál állapotok
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'new', 'edit', 'password', 'profile'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Űrlap
  const [formData, setFormData] = useState({ username: '', name: '', role: 'driver', password: '' });
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Hiba a felhasználók betöltésekor", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    setFormError('');

    if (type === 'new') {
      setFormData({ username: '', name: '', role: 'driver', password: '' });
    } else if (type === 'edit' || type === 'profile') {
      setFormData({ username: user.username, name: user.name, role: user.role, password: '' });
    } else if (type === 'password') {
      // Amikor az Edit modálból átkattintunk az Új jelszóra, csak a jelszó mezőt ürítjük
      setFormData({ ...formData, password: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (modalType === 'new') {
        if (!formData.password) return setFormError('Az új felhasználóhoz kötelező jelszót megadni!');
        await axios.post('http://localhost:5000/api/users', formData);
      } else if (modalType === 'edit' || modalType === 'profile') {
        await axios.put(`http://localhost:5000/api/users/${selectedUser.id}`, {
          username: formData.username,
          name: formData.name,
          role: formData.role
        });
        if (modalType === 'profile' && (formData.name !== loggedInUser.name || formData.username !== loggedInUser.username)) {
            alert('A saját adataid frissültek! A teljes érvényesüléshez lépj be újra.');
        }
      } else if (modalType === 'password') {
        if (formData.password.length < 4) return setFormError('A jelszónak legalább 4 karakternek kell lennie!');
        await axios.patch(`http://localhost:5000/api/users/${selectedUser.id}/password`, { password: formData.password });
        alert('Jelszó sikeresen módosítva!');
      }
      
      fetchUsers();
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Hiba történt a mentés során!');
    }
  };

  const handleDelete = async (id) => {
    if (id === loggedInUser?.id) {
      return alert('Saját magadat nem törölheted!');
    }
    if (window.confirm('Biztosan törlöd ezt a felhasználót? Ha van hozzárendelve jármű, a törlés nem fog sikerülni.')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        fetchUsers();
      } catch (err) { alert(err.response?.data?.error || 'Hiba a törléskor!'); }
    }
  };

  const getRoleStyle = (role) => {
    if (role === 'admin') return { label: 'Admin', bg: 'rgba(31, 92, 136, 0.2)', color: '#1F5C88' }; 
    if (role === 'operator') return { label: 'Diszpécser', bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }; 
    if (role === 'driver') return { label: 'Sofőr', bg: 'rgba(74, 222, 128, 0.2)', color: '#16a34a' }; 
    return { label: role, bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' };
  };

  const filteredUsers = users.filter(u => {
    if (u.id === loggedInUser?.id) return false; 
    
    const matchesSearch = `${u.name} ${u.username}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <div style={{ fontFamily: '"Space Grotesk"', fontSize: '24px', textAlign: 'center', marginTop: '50px' }}>Felhasználók betöltése...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', paddingBottom: '100px' }}>
      
      <div style={{ display: 'flex', width: '1320px', height: '100px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ color: '#000', fontFamily: '"Space Grotesk"', fontSize: '36px' }}>Munkatársak ({users.length} fő)</div>
        <button 
          onClick={() => openModal('new')}
          style={{ width: '220px', height: '50px', borderRadius: '20px', background: '#2D4353', color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '20px', fontWeight: '700', border: 'none', cursor: 'pointer' }}
        >
          + ÚJ MUNKATÁRS
        </button>
      </div>

      {loggedInUser && (
        <div style={{ width: '1320px', background: '#1F5C88', borderRadius: '20px', padding: '30px 40px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontFamily: '"Space Grotesk"', fontSize: '18px', marginBottom: '5px' }}>Saját Profil (Bejelentkezve)</div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ color: '#FFF', fontFamily: '"Space Grotesk"', fontSize: '32px', fontWeight: '700' }}>{loggedInUser.name}</div>
              <div style={{ padding: '5px 15px', borderRadius: '15px', background: 'rgba(255,255,255,0.2)', color: '#FFF', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700' }}>
                Admin
              </div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontFamily: '"Space Grotesk"', fontSize: '18px', marginTop: '5px' }}>Felhasználónév: {loggedInUser.username}</div>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={() => openModal('password', loggedInUser)} style={{ width: '160px', height: '45px', borderRadius: '20px', background: 'transparent', border: '2px solid #FFF', color: '#FFF', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>ÚJ JELSZÓ</button>
            <button onClick={() => openModal('profile', loggedInUser)} style={{ width: '160px', height: '45px', borderRadius: '20px', background: '#FFF', border: 'none', color: '#1F5C88', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>SZERKESZTÉS</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', width: '1320px', gap: '20px', alignItems: 'center', marginBottom: '30px', background: '#2D4353', padding: '15px 30px', borderRadius: '20px', boxSizing: 'border-box' }}>
        <input 
          type="text" 
          placeholder="Keresés név vagy felhasználónév alapján..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ flex: 1, height: '40px', borderRadius: '10px', border: 'none', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }} 
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: '200px', height: '40px', borderRadius: '10px', border: 'none', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }}>
          <option value="all">Minden munkatárs</option>
          <option value="operator">Diszpécserek</option>
          <option value="driver">Sofőrök</option>
          <option value="admin">Adminok</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '60px', width: '1320px' }}>
        {filteredUsers.map((u) => {
          const roleStyle = getRoleStyle(u.role);
          return (
            <div key={u.id} style={{ width: '400px', height: '240px', borderRadius: '20px', background: '#2D4353', padding: '30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#F4F8FA', fontFamily: '"Space Grotesk"', fontSize: '28px', fontWeight: '700' }}>{u.name}</div>
                  <div style={{ color: '#F4F8FA', opacity: 0.7, fontFamily: '"Space Grotesk"', fontSize: '18px', marginTop: '5px' }}>@{u.username}</div>
                </div>
                <div style={{ padding: '5px 15px', borderRadius: '15px', background: roleStyle.bg, color: roleStyle.color, fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700' }}>
                  {roleStyle.label}
                </div>
              </div>

              {/* ÚJ KÁRTYA GOMBOK: TÖRLÉS ÉS SZERKESZTÉS */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button onClick={() => handleDelete(u.id)} style={{ width: '160px', height: '40px', borderRadius: '20px', background: 'transparent', border: '2px solid #ef4444', color: '#ef4444', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>TÖRLÉS</button>
                <button onClick={() => openModal('edit', u)} style={{ width: '160px', height: '40px', borderRadius: '20px', background: '#F4F8FA', border: 'none', color: '#2D4353', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>SZERKESZTÉS</button>
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(23, 41, 54, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '500px', background: '#F4F8FA', borderRadius: '20px', padding: '40px', boxSizing: 'border-box', position: 'relative' }}>
            
            <button onClick={closeModal} style={{ position: 'absolute', top: '15px', right: '25px', background: 'transparent', border: 'none', fontSize: '30px', color: '#172936', cursor: 'pointer', fontFamily: '"Space Grotesk"' }}>✕</button>

            <h2 style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '28px', marginTop: 0, marginBottom: '20px' }}>
              {modalType === 'new' ? 'Új munkatárs' : modalType === 'password' ? 'Jelszó módosítása' : 'Adatok szerkesztése'}
            </h2>

            {formError && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontFamily: '"Space Grotesk"', fontWeight: '700' }}>⚠️ {formError}</div>}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {(modalType === 'new' || modalType === 'edit' || modalType === 'profile') && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px' }}>Teljes Név</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }} required />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px' }}>Felhasználónév (Belépéshez)</label>
                    <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase()})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }} required />
                  </div>

                  {modalType !== 'profile' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px' }}>Szerepkör</label>
                      <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }} required>
                        <option value="driver">Sofőr</option>
                        <option value="operator">Diszpécser</option>
                        <option value="admin">Adminisztrátor</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {(modalType === 'new' || modalType === 'password') && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontFamily: '"Space Grotesk"', color: '#172936', fontSize: '16px', marginBottom: '5px' }}>
                    {modalType === 'password' ? 'Új Jelszó' : 'Kezdeti Jelszó'}
                  </label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ height: '50px', borderRadius: '15px', border: '1px solid #172936', padding: '0 15px', fontFamily: '"Space Grotesk"', fontSize: '16px' }} required={modalType === 'new'} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                {/* ÚJ JELSZÓ GOMB KERÜLT A TÖRLÉS HELYÉRE A MODÁLBA */}
                {modalType === 'edit' ? (
                  <button type="button" onClick={() => openModal('password', selectedUser)} style={{ padding: '0 20px', height: '50px', background: 'transparent', color: '#1F5C88', border: '2px solid #1F5C88', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>ÚJ JELSZÓ</button>
                ) : <div></div>}
                
                <button type="submit" style={{ padding: '0 40px', height: '50px', background: '#1F5C88', color: '#F4F8FA', border: 'none', borderRadius: '15px', fontFamily: '"Space Grotesk"', fontSize: '18px', fontWeight: '700', cursor: 'pointer' }}>MENTÉS</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default UserManagement;