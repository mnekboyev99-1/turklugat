import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminPanel.css'; // Optional styling

export default function AdminPanel({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Settings state
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = [];
      usersSnap.forEach(doc => {
        usersData.push({ id: doc.id, ...doc.data() });
      });
      // Sort by lastLogin (newest first)
      usersData.sort((a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0));
      setUsers(usersData);

      // 2. Fetch Settings
      const settingsSnap = await getDocs(collection(db, 'settings'));
      settingsSnap.forEach(doc => {
        if (doc.id === 'general') {
          const data = doc.data();
          setMaintenance(data.maintenance || false);
          setAnnouncement(data.announcement || '');
        }
      });
    } catch (err) {
      console.error("Admin ma'lumotlarini olishda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), {
        maintenance,
        announcement
      }, { merge: true });
      alert("Sozlamalar saqlandi!");
    } catch (err) {
      alert("Xatolik: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Stats calculation
  const totalUsers = users.length;
  
  const now = new Date();
  const onlineUsers = users.filter(u => {
    if (!u.lastLogin) return false;
    const last = new Date(u.lastLogin);
    const diffMins = (now - last) / (1000 * 60);
    return diffMins <= 15;
  }).length;

  const todayActive = users.filter(u => {
    if (!u.lastLogin) return false;
    const last = new Date(u.lastLogin);
    return last.toDateString() === now.toDateString();
  }).length;

  if (loading) {
    return <div className="app-container" style={{padding: '2rem'}}>Admin Panel yuklanmoqda...</div>;
  }

  return (
    <div className="app-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', overflowY: 'auto', height: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--accent-primary)', margin: 0 }}>🛡️ Maxfiy Admin Panel</h1>
        <button className="btn" onClick={onClose}>Chiqish</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Jami o'quvchilar</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', margin: 0 }}>{totalUsers}</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Hozir Onlayn</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)', margin: 0 }}>{onlineUsers}</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Oxirgi 15 daqiqa)</span>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Bugungi faollar</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)', margin: 0 }}>{todayActive}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>⚙️ Dastur Sozlamalari</h2>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              style={{ width: '20px', height: '20px' }}
            />
            <strong style={{ color: maintenance ? 'var(--danger)' : 'white' }}>Texnik ishlar (Maintenance Mode)</strong>
          </label>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>- Odamlar kirolmaydi (Faqat sizdan tashqari)</span>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>📢 Global E'lon (Hammaga ko'rinadi):</label>
          <input 
            type="text" 
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="Masalan: Ertaga soat 20:00 da yangilanish bo'ladi..."
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white' }}
          />
        </div>

        <button 
          className="btn btn-know" 
          onClick={saveSettings}
          disabled={savingSettings}
        >
          {savingSettings ? 'Saqlanmoqda...' : '💾 Sozlamalarni Saqlash'}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>👥 Foydalanuvchilar ({totalUsers} ta)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '10px' }}>Ism / Email</th>
              <th style={{ padding: '10px' }}>Yodlanganlar</th>
              <th style={{ padding: '10px' }}>Streak</th>
              <th style={{ padding: '10px' }}>Oxirgi kirish</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent' }}>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {u.photoURL ? <img src={u.photoURL} alt="p" style={{width: '24px', height: '24px', borderRadius: '50%'}} /> : '👤'}
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{u.displayName || 'Anonim'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px', color: 'var(--success)', fontWeight: 'bold' }}>{u.learnedCount || 0} ta</td>
                <td style={{ padding: '10px', color: 'var(--warning)', fontWeight: 'bold' }}>{u.streak || 0} 🔥</td>
                <td style={{ padding: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Noma\'lum'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
