import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './contexts/AuthContext'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import LoginScreen from './components/LoginScreen'
import Flashcard from './components/Flashcard'
import Controls from './components/Controls'
import ProgressBar from './components/ProgressBar'
import QuizMode from './components/QuizMode'
import TypingMode from './components/TypingMode'
import SwipeMode from './components/SwipeMode'
import MatchMode from './components/MatchMode'
import ResultsScreen from './components/ResultsScreen'
import StatsModal from './components/StatsModal'
import WordList from './components/WordList'
import ReloadPrompt from './components/ReloadPrompt'
import CrosswordMode from './components/CrosswordMode'
import ScrambleMode from './components/ScrambleMode'
import HangmanMode from './components/HangmanMode'
import defaultWordsData from './data/words.json'
import './App.css'

function App() {
  const { currentUser, logout } = useAuth();
  
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.isGuest) {
      setLoadingData(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.favorites) setLocalAndCloud(`turk_vocab_${currentUser.uid}_favorites`, JSON.stringify(data.favorites));
          if (data.mistakes) setLocalAndCloud(`turk_vocab_${currentUser.uid}_mistakes`, JSON.stringify(data.mistakes));
          if (data.learnedCount) setLocalAndCloud(`turk_vocab_${currentUser.uid}_learned`, data.learnedCount.toString());
          if (data.streak) setLocalAndCloud(`turk_vocab_${currentUser.uid}_streak`, data.streak.toString());
          if (data.history) setLocalAndCloud(`turk_vocab_${currentUser.uid}_history`, JSON.stringify(data.history));
          if (data.lastActive) setLocalAndCloud(`turk_vocab_${currentUser.uid}_last_active`, data.lastActive);
          if (data.words) {
            Object.keys(data.words).forEach(idx => {
               setLocalAndCloud(`turk_vocab_${currentUser.uid}_word_${idx}`, JSON.stringify(data.words[idx]));
            });
          }
          
          if (data.favorites) setFavorites(data.favorites);
          if (data.mistakes) setMistakes(data.mistakes);
          if (data.learnedCount) setLearnedCount(data.learnedCount);
          if (data.streak) setStreak(data.streak);
        }
      } catch (err) {
        console.error("Error fetching cloud data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const setLocalAndCloud = (key, value) => {
    setLocalAndCloud(key, value);
    if (!currentUser || currentUser.isGuest) return;
    
    const fieldMap = {
      [`turk_vocab_${currentUser.uid}_favorites`]: { favorites: JSON.parse(value || '[]') },
      [`turk_vocab_${currentUser.uid}_mistakes`]: { mistakes: JSON.parse(value || '[]') },
      [`turk_vocab_${currentUser.uid}_learned`]: { learnedCount: parseInt(value || '0') },
      [`turk_vocab_${currentUser.uid}_streak`]: { streak: parseInt(value || '0') },
      [`turk_vocab_${currentUser.uid}_history`]: { history: JSON.parse(value || '{}') },
      [`turk_vocab_${currentUser.uid}_last_active`]: { lastActive: value },
      [`turk_vocab_${currentUser.uid}_theme`]: { theme: value }
    };
    
    let updateData = fieldMap[key];
    if (!updateData && key.includes('_word_')) {
      const idx = key.split('_word_')[1];
      updateData = { [`words.${idx}`]: JSON.parse(value || '{}') };
    }
    
    if (updateData) {
      const docRef = doc(db, 'users', currentUser.uid);
      setDoc(docRef, updateData, { merge: true }).catch(console.error);
    }
  };

  const removeLocalAndCloud = (key) => {
    removeLocalAndCloud(key);
    // Complex to delete specific fields in Firestore without updateDoc with deleteField().
    // We will just handle the StatsModal clear all case separately.
  };

  const [masterData, setMasterData] = useState(defaultWordsData);
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState('Emel');
  const [selectedUnit, setSelectedUnit] = useState('All');
  const [learningMode, setLearningMode] = useState('flashcard');
  const [learningDirection, setLearningDirection] = useState('tr-uz'); // 'tr-uz' or 'uz-tr'
  const [confirmReset, setConfirmReset] = useState(false);
  const [streak, setStreak] = useState(0);
  
  // Phase 3 states
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Phase 6 Theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem(`turk_vocab_${currentUser?.uid || 'guest'}_theme`);
    return savedTheme !== 'light';
  });

  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem(`turk_vocab_${currentUser?.uid || 'guest'}_favorites`) || '[]');
  });

  const [mistakes, setMistakes] = useState(() => {
    return JSON.parse(localStorage.getItem(`turk_vocab_${currentUser?.uid || 'guest'}_mistakes`) || '[]');
  });

  const toggleFavorite = (originalIndex) => {
    setFavorites(prev => {
      const newFavs = prev.includes(originalIndex)
        ? prev.filter(i => i !== originalIndex)
        : [...prev, originalIndex];
      setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_favorites`, JSON.stringify(newFavs));
      return newFavs;
    });
  };
  
  const SESSION_SIZE = 20;

  // Extract unique units and their word counts from the data
  const { units, unitCounts } = useMemo(() => {
    const counts = { 'All': masterData.length };
    const uniqueUnits = new Set();
    
    masterData.forEach(w => {
      const unit = w["Bo'lim (Unit)"];
      if (unit) {
        uniqueUnits.add(unit);
        counts[unit] = (counts[unit] || 0) + 1;
      }
    });

    if (favorites.length > 0) {
      counts['⭐ Sevimlilar'] = favorites.length;
    }
    if (mistakes.length > 0) {
      counts['❌ Xatolar'] = mistakes.length;
    }
    
    return {
      units: ['All', ...(favorites.length > 0 ? ['⭐ Sevimlilar'] : []), ...(mistakes.length > 0 ? ['❌ Xatolar'] : []), ...Array.from(uniqueUnits)],
      unitCounts: counts
    };
  }, [masterData, favorites, mistakes]);

  // Initialize and filter words
  useEffect(() => {
    const wordsWithIndex = masterData.map((word, index) => ({ ...word, originalIndex: index }));
    const now = Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    
    const wordsNeedingReview = wordsWithIndex.filter(w => {
      const savedData = localStorage.getItem(`turk_vocab_${currentUser?.uid || 'guest'}_word_${w.originalIndex}`);
      if (savedData) {
        try {
          const { knew, date } = JSON.parse(savedData);
          if (knew && (now - date < msInDay)) return false;
        } catch(e) {}
      }
      return true;
    });
    
    const filteredWords = selectedUnit === 'All' 
      ? wordsNeedingReview 
      : selectedUnit === '⭐ Sevimlilar'
        ? wordsNeedingReview.filter(w => favorites.includes(w.originalIndex))
        : selectedUnit === '❌ Xatolar'
          ? wordsNeedingReview.filter(w => mistakes.includes(w.originalIndex))
          : wordsNeedingReview.filter(w => w["Bo'lim (Unit)"] === selectedUnit);
      
    const finalWords = filteredWords.length > 0 
      ? filteredWords 
      : (selectedUnit === 'All' 
          ? wordsWithIndex 
          : selectedUnit === '⭐ Sevimlilar'
            ? wordsWithIndex.filter(w => favorites.includes(w.originalIndex))
            : selectedUnit === '❌ Xatolar'
              ? wordsWithIndex.filter(w => mistakes.includes(w.originalIndex))
              : wordsWithIndex.filter(w => w["Bo'lim (Unit)"] === selectedUnit));

    const shuffled = [...finalWords].sort(() => 0.5 - Math.random());
    setWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionScore(0);
    setSessionCount(0);
    setIsSessionComplete(false);
  }, [selectedUnit, masterData]);

  useEffect(() => {
    // Load stats
    const savedLearned = localStorage.getItem(`turk_vocab_${currentUser?.uid || 'guest'}_learned`);
    if (savedLearned) setLearnedCount(parseInt(savedLearned, 10));

    // Daily Streak Logic
    const lastActiveDate = localStorage.getItem(`turk_vocab_${currentUser?.uid || 'guest'}_last_active`);
    const savedStreak = parseInt(localStorage.getItem(`turk_vocab_${currentUser?.uid || 'guest'}_streak`) || '0', 10);
    const todayStr = new Date().toDateString();
    
    if (lastActiveDate) {
      if (lastActiveDate !== todayStr) {
        const lastActive = new Date(lastActiveDate);
        const diffTime = Math.abs(new Date() - lastActive);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          setStreak(savedStreak + 1);
          setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_streak`, (savedStreak + 1).toString());
        } else if (diffDays > 1) {
          setStreak(1);
          setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_streak`, '1');
        }
        setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_last_active`, todayStr);
      } else {
        setStreak(savedStreak);
      }
    } else {
      setStreak(1);
      setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_streak`, '1');
      setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_last_active`, todayStr);
    }
  }, []);

  useEffect(() => {
    // Theme logic
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
      setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_theme`, 'dark');
    } else {
      document.body.classList.add('light-mode');
      setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_theme`, 'light');
    }
  }, [isDarkMode]);

  const handleNext = (knewWord) => {
    const currentWordIndex = words[currentIndex].originalIndex;

    if (knewWord) {
      const newCount = learnedCount + 1;
      setLearnedCount(newCount);
      setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_learned`, newCount.toString());
      
      // SRS - remember they knew it
      setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_word_${currentWordIndex}`, JSON.stringify({ knew: true, date: Date.now() }));
      
      // If they knew it, remove from mistakes if it was there
      if (mistakes.includes(currentWordIndex)) {
        const newMistakes = mistakes.filter(i => i !== currentWordIndex);
        setMistakes(newMistakes);
        setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_mistakes`, JSON.stringify(newMistakes));
      }

      // Daily history chart
      const todayStr = new Date().toDateString();
      const historyData = JSON.parse(localStorage.getItem(`turk_vocab_${currentUser?.uid || 'guest'}_history`) || '{}');
      historyData[todayStr] = (historyData[todayStr] || 0) + 1;
      setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_history`, JSON.stringify(historyData));
      
      setSessionScore(prev => prev + 1);
    } else {
      // If they got it wrong, add to mistakes list
      if (!mistakes.includes(currentWordIndex)) {
        const newMistakes = [...mistakes, currentWordIndex];
        setMistakes(newMistakes);
        setLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_mistakes`, JSON.stringify(newMistakes));
      }
    }
    
    setIsFlipped(false);
    
    const newSessionCount = sessionCount + 1;
    setSessionCount(newSessionCount);
    
    if (newSessionCount >= SESSION_SIZE || currentIndex >= words.length - 1) {
      // Session Complete!
      setIsSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const startNextSession = () => {
    setIsSessionComplete(false);
    setSessionScore(0);
    setSessionCount(0);
    
    if (currentIndex >= words.length - 1) {
      // Restart the list
      const shuffled = [...words].sort(() => 0.5 - Math.random());
      setWords(shuffled);
      setCurrentIndex(0);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleUnitReset = () => {
    if (selectedUnit === 'All') return;
    
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }

    if (selectedUnit === '⭐ Sevimlilar') {
      removeLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_favorites`);
    } else if (selectedUnit === '❌ Xatolar') {
      removeLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_mistakes`);
    } else {
      masterData.forEach((w, index) => {
        if (w["Bo'lim (Unit)"] === selectedUnit) {
          removeLocalAndCloud(`turk_vocab_${currentUser?.uid || 'guest'}_word_${index}`);
        }
      });
    }

    setConfirmReset(false);
    window.location.reload();
  };

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (loadingData && !currentUser.isGuest) {
    return (
      <div className="login-screen-container">
         <h3 style={{color: 'white', marginTop: '20px'}}>Ma'lumotlar serverdan olinmoqda...</h3>
      </div>
    );
  }

  if (words.length === 0) {
    return <div className="app-container">Yuklanmoqda... yoxud ushbu mavzuda so'z topilmadi.</div>;
  }

  const currentWord = words[currentIndex];

  return (
    <div className="app-container">
      <ReloadPrompt />
      {showStats && (
        <StatsModal 
          onClose={() => setShowStats(false)} 
          totalLearned={learnedCount} 
          streak={streak} 
        />
      )}
      
      <header>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
          <h1 style={{ margin: 0 }}>Turk Tili Lug'ati</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img 
              src={currentUser.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
              alt="User" 
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
            />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{currentUser.displayName}</span>
            <button 
              onClick={logout}
              style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '0.5rem' }}
            >
              Chiqish
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <p className="subtitle" style={{ margin: 0 }}>
            Har kuni ozgina, lekin muntazam! 
            <span style={{ color: 'var(--warning)', fontWeight: 'bold', marginLeft: '0.5rem' }}>
              🔥 {streak} kun
            </span>
          </p>
          <button 
            onClick={() => setShowStats(true)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '0.3rem 0.8rem', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            📊 Statistika
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.2rem' }}
            title={isDarkMode ? 'Kun rejimiga o`tish' : 'Tun rejimiga o`tish'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Mavzu:</span>
            <select 
              value={selectedUnit} 
              onChange={(e) => setSelectedUnit(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
            >
              <option value="All">Barcha mavzular ({unitCounts['All'] || 0})</option>
              {units.filter(u => u !== 'All').map(u => (
                <option key={u} value={u}>{u} ({unitCounts[u] || 0})</option>
              ))}
            </select>
            {selectedUnit !== 'All' && (
              <button
                onClick={handleUnitReset}
                title="Mavzuni qaytadan boshlash (Tozalash)"
                style={{
                  background: confirmReset ? 'var(--danger)' : 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid var(--danger)', 
                  color: confirmReset ? 'white' : 'var(--danger)',
                  borderRadius: '8px', padding: '0.4rem 0.6rem', display: 'flex', 
                  justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '1rem',
                  transition: 'all 0.3s'
                }}
              >
                {confirmReset ? 'Ishonchingiz komilmi?' : '🔄 Tozalash'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Ovoz:</span>
            <select 
              value={selectedVoice} 
              onChange={(e) => setSelectedVoice(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}
            >
              <option value="Emel">Emel (Ayol)</option>
              <option value="Ahmet">Ahmet (Erkak)</option>
            </select>
          </div>

        </div>

        <div className="direction-toggle" style={{ margin: '1rem auto', width: 'fit-content' }}>
          <button 
            className={`direction-btn ${learningDirection === 'tr-uz' ? 'active' : ''}`}
            onClick={() => setLearningDirection('tr-uz')}
          >
            🇹🇷 ➡️ 🇺🇿
          </button>
          <button 
            className={`direction-btn ${learningDirection === 'uz-tr' ? 'active' : ''}`}
            onClick={() => setLearningDirection('uz-tr')}
          >
            🇺🇿 ➡️ 🇹🇷
          </button>
        </div>

        <div className="mode-tabs">
          <button className={`mode-tab ${learningMode === 'flashcard' ? 'active' : ''}`} onClick={() => setLearningMode('flashcard')}>🎴 Kartochka</button>
          <button className={`mode-tab ${learningMode === 'swipe' ? 'active' : ''}`} onClick={() => setLearningMode('swipe')}>👉 Surish</button>
          <button className={`mode-tab ${learningMode === 'quiz' ? 'active' : ''}`} onClick={() => setLearningMode('quiz')}>📝 Test</button>
          <button className={`mode-tab ${learningMode === 'typing' ? 'active' : ''}`} onClick={() => setLearningMode('typing')}>⌨️ Yozish</button>
          <button className={`mode-tab ${learningMode === 'scramble' ? 'active' : ''}`} onClick={() => setLearningMode('scramble')}>🧩 Aralash</button>
          <button className={`mode-tab ${learningMode === 'hangman' ? 'active' : ''}`} onClick={() => setLearningMode('hangman')}>🧗‍♂️ Dorboz</button>
          <button className={`mode-tab ${learningMode === 'match' ? 'active' : ''}`} onClick={() => setLearningMode('match')}>🔗 Moslashtirish</button>
          <button className={`mode-tab ${learningMode === 'crossword' ? 'active' : ''}`} onClick={() => setLearningMode('crossword')}>🧩 Krossvord</button>
          <button className={`mode-tab ${learningMode === 'list' ? 'active' : ''}`} onClick={() => setLearningMode('list')}>📃 Ro'yxat</button>
        </div>
      </header>

      <main>
        {learningMode === 'crossword' ? (
          <CrosswordMode 
            masterData={masterData}
            selectedUnit={selectedUnit}
            learningDirection={learningDirection}
          />
        ) : learningMode === 'list' ? (
          <WordList 
            masterData={masterData}  
            selectedVoice={selectedVoice} 
            units={units}
            unitCounts={unitCounts}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        ) : isSessionComplete ? (
          <ResultsScreen 
            score={sessionScore} 
            total={sessionCount} 
            onContinue={startNextSession} 
          />
        ) : (
          <>
            <ProgressBar 
              current={sessionCount + 1}  
              total={SESSION_SIZE} 
              learned={learnedCount} 
            />
            
            {learningMode === 'flashcard' && (
              <>
                <Flashcard 
                  wordData={currentWord} 
                  isFlipped={isFlipped}
                  setIsFlipped={setIsFlipped}
                  selectedVoice={selectedVoice}
                  learningDirection={learningDirection}
                  isFavorite={favorites.includes(currentWord.originalIndex)}
                  toggleFavorite={() => toggleFavorite(currentWord.originalIndex)}
                />
                <Controls onNext={handleNext} disabled={!isFlipped} />
                {!isFlipped && <p style={{marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem'}}>Javobni ko'rish uchun kartochka ustiga bosing</p>}
              </>
            )}

            {learningMode === 'quiz' && (
              <QuizMode 
                wordData={currentWord} 
                allWords={words} 
                onNext={handleNext}
                selectedVoice={selectedVoice}
                learningDirection={learningDirection}
              />
            )}

            {learningMode === 'typing' && (
              <TypingMode 
                wordData={currentWord} 
                onNext={handleNext}
                selectedVoice={selectedVoice}
                learningDirection={learningDirection}
              />
            )}

            {learningMode === 'scramble' && (
              <ScrambleMode 
                wordData={currentWord} 
                onNext={handleNext}
                selectedVoice={selectedVoice}
                learningDirection={learningDirection}
              />
            )}

            {learningMode === 'hangman' && (
              <HangmanMode 
                wordData={currentWord} 
                onNext={handleNext}
                selectedVoice={selectedVoice}
                learningDirection={learningDirection}
              />
            )}

            {learningMode === 'swipe' && (
              <SwipeMode 
                wordData={currentWord} 
                onNext={handleNext}
                selectedVoice={selectedVoice}
                learningDirection={learningDirection}
              />
            )}

            {learningMode === 'match' && (
              <MatchMode 
                allWords={words} 
                onNext={handleNext}
                refreshTrigger={currentIndex}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
