import { useState, useEffect, useRef, useMemo } from 'react';
import { generateCrossword } from '../utils/crosswordGenerator';

export default function CrosswordMode({ masterData, selectedUnit, learningDirection }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [wordCount, setWordCount] = useState(6);
  
  const [grid, setGrid] = useState([]);
  const [words, setWords] = useState([]);
  const [userGrid, setUserGrid] = useState([]);
  const [activeWordId, setActiveWordId] = useState(null);
  const [activeCell, setActiveCell] = useState(null); // {r, c}
  const [isWon, setIsWon] = useState(false);

  const containerRef = useRef(null);

  const startCrossword = () => {
    let filtered = masterData;
    if (selectedUnit !== 'All') {
      filtered = masterData.filter(w => w["Bo'lim (Unit)"] === selectedUnit);
    }
    
    // Filter out words with spaces or hyphens for simplicity in crossword
    filtered = filtered.filter(w => {
      const tr = w["Turkcha (Türkçe)"] || w["Turkish"] || "";
      const uz = w["O'zbekcha (O'zbekcha)"] || w["Uzbek"] || "";
      const isReverse = learningDirection === 'uz-tr';
      const targetWord = isReverse ? uz : tr;
      return targetWord && !targetWord.includes(' ') && !targetWord.includes('-');
    });

    if (filtered.length < wordCount) {
      alert(`Tanlangan mavzuda yetarli so'z yo'q. Faqat ${filtered.length} ta mavjud.`);
      return;
    }

    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, wordCount * 2);
    
    const wordList = shuffled.map(w => {
      const tr = w["Turkcha (Türkçe)"] || w["Turkish"] || "";
      const uz = w["O'zbekcha (O'zbekcha)"] || w["Uzbek"] || "";
      const isReverse = learningDirection === 'uz-tr';
      
      const targetWord = isReverse ? uz : tr;
      const targetClue = isReverse ? tr : uz;
      
      return {
        id: w.originalIndex || Math.random().toString(36),
        word: targetWord.toUpperCase(),
        clue: targetClue
      };
    });

    // Try generating. The generator might place fewer words if it can't fit them
    let result = generateCrossword(wordList.slice(0, wordCount));
    
    // If it couldn't place enough words, try a different shuffle
    let attempts = 0;
    while (result.words.length < Math.min(wordCount, 3) && attempts < 5) {
      const nextShuffled = [...wordList].sort(() => Math.random() - 0.5);
      result = generateCrossword(nextShuffled.slice(0, wordCount));
      attempts++;
    }

    if (result.words.length === 0) {
      alert("Krossvord tuzishda xatolik yuz berdi. Boshqa mavzu tanlab ko'ring.");
      return;
    }

    setGrid(result.grid);
    setWords(result.words);
    
    const initialUserGrid = result.grid.map(row => 
      row.map(cell => cell ? '' : null)
    );
    setUserGrid(initialUserGrid);
    
    setActiveWordId(result.words[0].id);
    setActiveCell({ r: result.words[0].startRow, c: result.words[0].startCol });
    setIsWon(false);
    setIsPlaying(true);
  };

  const checkWin = (newUserGrid) => {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) {
          if (newUserGrid[r][c] !== grid[r][c].char) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleInputChar = (char) => {
    if (!isPlaying || isWon || !activeCell || !activeWordId) return;
    const activeWord = words.find(w => w.id === activeWordId);
    if (!activeWord) return;

    const newGrid = [...userGrid];
    newGrid[activeCell.r][activeCell.c] = char.toUpperCase();
    setUserGrid(newGrid);

    if (checkWin(newGrid)) {
      setIsWon(true);
    } else {
      // Move forward
      const isHorizontal = activeWord.isHorizontal;
      const nextR = isHorizontal ? activeCell.r : activeCell.r + 1;
      const nextC = isHorizontal ? activeCell.c + 1 : activeCell.c;
      
      if (
        (isHorizontal && nextC < activeWord.startCol + activeWord.length) || 
        (!isHorizontal && nextR < activeWord.startRow + activeWord.length)
      ) {
        setActiveCell({ r: nextR, c: nextC });
      }
    }
  };

  const handleBackspace = () => {
    if (!isPlaying || isWon || !activeCell || !activeWordId) return;
    const activeWord = words.find(w => w.id === activeWordId);
    if (!activeWord) return;

    const newGrid = [...userGrid];
    newGrid[activeCell.r][activeCell.c] = '';
    setUserGrid(newGrid);

    // Move back
    const isHorizontal = activeWord.isHorizontal;
    const prevR = isHorizontal ? activeCell.r : activeCell.r - 1;
    const prevC = isHorizontal ? activeCell.c - 1 : activeCell.c;
    
    if (
      (isHorizontal && prevC >= activeWord.startCol) || 
      (!isHorizontal && prevR >= activeWord.startRow)
    ) {
      setActiveCell({ r: prevR, c: prevC });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // If typing in the hidden input, let its events handle characters/backspace
      if (document.activeElement && document.activeElement.classList.contains('mobile-input')) {
        // Arrow keys can still be handled globally
        if (e.key.startsWith('Arrow')) {
          e.preventDefault();
        } else {
          return; // Let onChange / onKeyDown of the input handle it
        }
      }

      if (!isPlaying || isWon || !activeCell || !activeWordId) return;
      const activeWord = words.find(w => w.id === activeWordId);
      if (!activeWord) return;

      if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key.length === 1 && e.key.match(/[a-zçğıöşüA-ZÇĞİÖŞÜ'O`oʻgʻ]/i)) {
        handleInputChar(e.key);
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const isHorizontal = activeWord.isHorizontal;
        if (e.key === 'ArrowRight' && isHorizontal && activeCell.c < activeWord.startCol + activeWord.length - 1) {
          setActiveCell({ r: activeCell.r, c: activeCell.c + 1 });
        } else if (e.key === 'ArrowLeft' && isHorizontal && activeCell.c > activeWord.startCol) {
          setActiveCell({ r: activeCell.r, c: activeCell.c - 1 });
        } else if (e.key === 'ArrowDown' && !isHorizontal && activeCell.r < activeWord.startRow + activeWord.length - 1) {
          setActiveCell({ r: activeCell.r + 1, c: activeCell.c });
        } else if (e.key === 'ArrowUp' && !isHorizontal && activeCell.r > activeWord.startRow) {
          setActiveCell({ r: activeCell.r - 1, c: activeCell.c });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isWon, activeCell, activeWordId, userGrid, words, grid]);

  const handleCellClick = (r, c) => {
    if (isWon) return;
    const cell = grid[r][c];
    if (!cell) return;

    if (cell.wordIds.includes(activeWordId) && cell.wordIds.length > 1) {
      // Toggle word if clicking on intersection
      const otherWordId = cell.wordIds.find(id => id !== activeWordId);
      setActiveWordId(otherWordId);
    } else {
      setActiveWordId(cell.wordIds[0]);
    }
    setActiveCell({ r, c });
    
    // focus a hidden input for mobile keyboard
    if (containerRef.current) {
      const input = containerRef.current.querySelector('.mobile-input');
      if (input) {
        input.focus();
      }
    }
  };

  const getCellClass = (r, c) => {
    if (!grid[r][c]) return 'cw-empty';
    let cls = 'cw-cell';
    
    const activeWord = words.find(w => w.id === activeWordId);
    let inActiveWord = false;
    if (activeWord) {
      if (activeWord.isHorizontal) {
        if (r === activeWord.startRow && c >= activeWord.startCol && c < activeWord.startCol + activeWord.length) {
          inActiveWord = true;
        }
      } else {
        if (c === activeWord.startCol && r >= activeWord.startRow && r < activeWord.startRow + activeWord.length) {
          inActiveWord = true;
        }
      }
    }

    if (activeCell && activeCell.r === r && activeCell.c === c) {
      cls += ' cw-active-cell';
    } else if (inActiveWord) {
      cls += ' cw-active-word';
    }

    // Check correctness loosely (only if filled)
    if (userGrid[r][c]) {
      if (userGrid[r][c] === grid[r][c].char) {
        cls += ' cw-correct';
      } else {
        cls += ' cw-error';
      }
    }

    return cls;
  };

  if (!isPlaying) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', margin: '0 auto', borderRadius: '20px' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1.5rem' }}>🧩 Krossvord Sozlamalari</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Joriy mavzudan tasodifiy so'zlar orqali krossvord tuzamiz. Qancha ko'p so'z bo'lsa, shuncha qiyin!
        </p>
        
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            So'zlar soni: <strong>{wordCount}</strong>
          </label>
          <input 
            type="range" 
            min="4" 
            max="12" 
            value={wordCount} 
            onChange={(e) => setWordCount(parseInt(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        <button 
          className="submit-btn" 
          onClick={startCrossword}
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
        >
          Krossvord Tuzish
        </button>
      </div>
    );
  }

  return (
    <div className="crossword-container glass-panel" ref={containerRef}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0 }}>🧩 Krossvord</h2>
        <button 
          onClick={() => setIsPlaying(false)}
          style={{ background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '12px', cursor: 'pointer' }}
        >
          Qaytish
        </button>
      </div>

      {isWon && (
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--success)', margin: 0 }}>Tabriklaymiz! Siz yutdingiz! 🎉</h3>
          <button 
            className="submit-btn" 
            onClick={startCrossword}
            style={{ marginTop: '1rem' }}
          >
            Yangi Krossvord
          </button>
        </div>
      )}

      {/* Hidden input to bring up mobile keyboard */}
      <input 
        type="text" 
        className="mobile-input" 
        style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}
        autoCapitalize="none"
        autoComplete="off"
        value=""
        onChange={(e) => {
          const val = e.target.value.slice(-1);
          if (val.match(/[a-zçğıöşüA-ZÇĞİÖŞÜ'O`oʻgʻ]/i)) {
            handleInputChar(val);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            handleBackspace();
          }
        }}
      />

      <div className="cw-layout">
        <div className="cw-grid-wrapper">
          <div 
            className="cw-grid" 
            style={{ 
              gridTemplateColumns: `repeat(${grid[0]?.length || 1}, 1fr)`,
              gridTemplateRows: `repeat(${grid.length}, 1fr)` 
            }}
          >
            {grid.map((row, r) => (
              row.map((cell, c) => (
                <div 
                  key={`${r}-${c}`} 
                  className={getCellClass(r, c)}
                  onClick={() => handleCellClick(r, c)}
                >
                  {cell && cell.number && (
                    <span className="cw-number">{cell.number}</span>
                  )}
                  {cell && (
                    <span className="cw-char">{userGrid[r][c]}</span>
                  )}
                </div>
              ))
            ))}
          </div>
        </div>

        <div className="cw-clues">
          <div className="cw-clues-section">
            <h3 style={{ color: 'var(--text-main)' }}>➡️ Yotiqasiga (Across)</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {words.filter(w => w.isHorizontal).map(w => (
                <li 
                  key={w.id} 
                  className={`cw-clue ${w.id === activeWordId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveWordId(w.id);
                    setActiveCell({ r: w.startRow, c: w.startCol });
                  }}
                >
                  <strong>{w.number}.</strong> {w.clue}
                </li>
              ))}
            </ul>
          </div>
          <div className="cw-clues-section">
            <h3 style={{ color: 'var(--text-main)' }}>⬇️ Tikasiga (Down)</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {words.filter(w => !w.isHorizontal).map(w => (
                <li 
                  key={w.id} 
                  className={`cw-clue ${w.id === activeWordId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveWordId(w.id);
                    setActiveCell({ r: w.startRow, c: w.startCol });
                  }}
                >
                  <strong>{w.number}.</strong> {w.clue}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
