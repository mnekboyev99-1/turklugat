import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import wordsData from '../data/words.json';
import { useAuth } from '../contexts/AuthContext';

const TOTAL_WORDS = wordsData.length;
const VOICES = ['Emel', 'Ahmet'];

export default function StatsModal({ onClose, totalLearned, streak }) {
  const { currentUser } = useAuth();
  const [data, setData] = useState([]);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    // Read daily history
    const historyData = JSON.parse(localStorage.getItem(`turk_vocab_${currentUser?.uid || 'guest'}_history`) || '{}');
    
    // Generate last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const shortDay = d.toLocaleDateString('uz-UZ', { weekday: 'short' });
      
      chartData.push({
        name: shortDay,
        s: historyData[dateStr] || 0
      });
    }
    
    setData(chartData);
  }, []);

  const handleGlobalReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    
    localStorage.removeItem(`turk_vocab_${currentUser?.uid || 'guest'}_learned`);
    localStorage.removeItem(`turk_vocab_${currentUser?.uid || 'guest'}_streak`);
    localStorage.removeItem(`turk_vocab_${currentUser?.uid || 'guest'}_last_active`);
    localStorage.removeItem(`turk_vocab_${currentUser?.uid || 'guest'}_history`);
    
    for (let i = 0; i < TOTAL_WORDS; i++) {
      localStorage.removeItem(`turk_vocab_${currentUser?.uid || 'guest'}_word_${i}`);
    }

    if (currentUser && !currentUser.isGuest) {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        await deleteDoc(doc(db, 'users', currentUser.uid));
      } catch (err) {
        console.error("Failed to delete cloud data", err);
      }
    }
    
    setConfirmReset(false);
    window.location.reload();
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          ✕
        </button>
        
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--accent-secondary)' }}>
          Sizning Natijalaringiz 📊
        </h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Jami O'rganilgan</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>{totalLearned}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Kunlik Seriya</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>🔥 {streak}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Jami So'zlar</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{TOTAL_WORDS}</p>
          </div>
        </div>

        <h3 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
          So'nggi 7 kundagi faollik
        </h3>
        
        <div style={{ width: '100%', height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--accent-primary)' }}
              />
              <Bar dataKey="s" name="So'zlar" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <button 
            onClick={handleGlobalReset}
            style={{
              background: confirmReset ? 'var(--danger)' : 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              color: confirmReset ? 'white' : 'var(--danger)',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s',
              width: '100%'
            }}
          >
            {confirmReset ? "Barchasini o'chirishga ishonchingiz komilmi?" : "🔄 Barcha natijalarni tozalash (Restart)"}
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Ogohlantirish: Bu barcha yutuqlaringizni nolga tushiradi!
          </p>
        </div>
      </div>
    </div>
  );
}
