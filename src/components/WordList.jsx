import { useState, useMemo } from 'react';
import { getAudioPath } from '../utils/audioUtils';

export default function WordList({ masterData, selectedVoice, units, unitCounts, favorites = [], toggleFavorite }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localUnit, setLocalUnit] = useState('All');

  // Get words for the current unit
  const unitWords = useMemo(() => {
    let filtered = masterData;
    if (localUnit !== 'All') {
      if (localUnit === '⭐ Sevimlilar') {
        filtered = masterData.filter((w, i) => favorites.includes(i));
      } else {
        filtered = masterData.filter(w => w["Bo'lim (Unit)"] === localUnit);
      }
    }
    
    // Assign original indices to these words
    return filtered.map(w => {
      // Find true index in masterData
      const originalIndex = masterData.indexOf(w);
      return { ...w, originalIndex };
    });
  }, [masterData, localUnit, favorites]);

  // Filter by search query
  const displayWords = useMemo(() => {
    if (!searchQuery.trim()) return unitWords;
    
    const query = searchQuery.toLowerCase();
    return unitWords.filter(w => {
      const tr = (w["Turkcha (Türkçe)"] || w["Turkish"] || "").toLowerCase();
      const uz = (w["O'zbekcha (O'zbekcha)"] || w["Uzbek"] || "").toLowerCase();
      return tr.includes(query) || uz.includes(query);
    });
  }, [unitWords, searchQuery]);

  const playAudio = (wordData) => {
    const turkishWord = wordData["Turkcha (Türkçe)"] || wordData["Turkish"] || "N/A";
    
    if (turkishWord && selectedVoice) {
      const localAudio = new Audio(getAudioPath(turkishWord, selectedVoice));
      localAudio.play().catch(() => {
        const text = encodeURIComponent(turkishWord);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=tr&q=${text}`;
        new Audio(url).play().catch(() => {});
      });
    }
  };

  return (
    <div className="word-list-container glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--card-gradient)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Lug'at Ro'yxati</h2>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            value={localUnit} 
            onChange={(e) => setLocalUnit(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '20px', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--glass-border)', outline: 'none' }}
          >
            <option value="All">Barcha mavzular ({unitCounts['All'] || 0})</option>
            {units && units.filter(u => u !== 'All').map(u => (
              <option key={u} value={u}>{u} ({unitCounts[u] || 0})</option>
            ))}
          </select>
          
          <input
            type="text"
            placeholder="So'z qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '20px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-dark)',
              color: 'var(--text-main)',
              outline: 'none',
              minWidth: '200px'
            }}
          />
        </div>
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Jami: {displayWords.length} ta so'z
      </div>

      <div className="word-list-scroll" style={{ overflowY: 'auto', maxHeight: '500px', paddingRight: '0.5rem' }}>
        {displayWords.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Hech narsa topilmadi...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {displayWords.map((word, idx) => {
              const isFavorite = favorites.includes(word.originalIndex);
              return (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '12px',
                  transition: 'var(--transition)'
                }}
              >
                <button 
                  onClick={() => toggleFavorite && toggleFavorite(word.originalIndex)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: isFavorite ? '#ffd700' : 'var(--text-muted)',
                    marginRight: '1rem'
                  }}
                  title="Tanlanganlarga qo'shish"
                >
                  {isFavorite ? '⭐' : '☆'}
                </button>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
                      {word["Turkcha (Türkçe)"] || word["Turkish"]}
                    </strong>
                    {(() => {
                      let t = word["Turi (Type)"] || "General";
                      if (t === "Karma (Mixed)") t = "";
                      return t ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(128,128,128,0.1)', padding: '0.1rem 0.4rem', borderRadius: '8px' }}>
                          {t}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {word["O'zbekcha (O'zbekcha)"] || word["Uzbek"]}
                  </div>
                  {word["Misol gaplar"] && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                      {word["Misol gaplar"]}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => playAudio(word)}
                  style={{
                    background: 'var(--btn-transparent)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                    marginLeft: '1rem'
                  }}
                  title="Tinglash"
                >
                  🔊
                </button>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
