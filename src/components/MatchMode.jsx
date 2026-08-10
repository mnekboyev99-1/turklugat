import { useState, useEffect } from 'react';

export default function MatchMode({ allWords, onNext, refreshTrigger }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [isWrong, setIsWrong] = useState(false);

  useEffect(() => {
    // Select 5 random words
    const randomWords = [...allWords].sort(() => 0.5 - Math.random()).slice(0, 5);
    
    const newItems = [];
    randomWords.forEach((w) => {
      const id = w.originalIndex;
      newItems.push({ id, text: w["Turkcha (Türkçe)"] || w["Turkish"], lang: 'tr' });
      newItems.push({ id, text: w["O'zbekcha (O'zbekcha)"] || w["Uzbek"], lang: 'uz' });
    });
    
    // Shuffle the items
    setItems(newItems.sort(() => 0.5 - Math.random()));
    setMatchedIds([]);
    setSelectedItem(null);
  }, [allWords, refreshTrigger]);

  const handleSelect = (item) => {
    if (matchedIds.includes(item.id)) return;
    
    if (!selectedItem) {
      setSelectedItem(item);
      return;
    }
    
    if (selectedItem.id === item.id) {
      // Prevent clicking the exact same button twice
      if (selectedItem.lang === item.lang) {
        setSelectedItem(null);
        return;
      }
      // Match found!
      const newMatched = [...matchedIds, item.id];
      setMatchedIds(newMatched);
      setSelectedItem(null);
      
      // If all 5 matched, trigger next after short delay
      if (newMatched.length === 5) {
        setTimeout(() => {
          onNext(true); // they successfully matched
        }, 1000);
      }
    } else {
      // Wrong match
      setIsWrong(true);
      setTimeout(() => {
        setSelectedItem(null);
        setIsWrong(false);
      }, 500);
    }
  };

  return (
    <div className="match-container" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
      <p style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        So'zlarni o'zaro to'g'ri ulang
      </p>
      
      {items.map((item, index) => {
        const isSelected = selectedItem && selectedItem.text === item.text && selectedItem.lang === item.lang;
        const isMatched = matchedIds.includes(item.id);
        
        let btnStyle = {
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          border: '2px solid var(--glass-border)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '1.1rem',
          cursor: isMatched ? 'default' : 'pointer',
          opacity: isMatched ? 0 : 1, // Hide matched items
          transition: 'all 0.3s',
          pointerEvents: isMatched ? 'none' : 'auto'
        };
        
        if (isSelected) {
          btnStyle.background = 'var(--accent-primary)';
          btnStyle.borderColor = 'var(--accent-primary)';
          btnStyle.color = 'white';
          if (isWrong) {
            btnStyle.background = 'var(--danger)';
            btnStyle.borderColor = 'var(--danger)';
          }
        }

        return (
          <button 
            key={`${item.id}-${item.lang}-${index}`}
            onClick={() => handleSelect(item)}
            style={btnStyle}
          >
            {item.text}
          </button>
        );
      })}
    </div>
  );
}
