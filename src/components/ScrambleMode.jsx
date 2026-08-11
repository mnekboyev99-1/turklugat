import { useState, useEffect } from 'react';
import { getAudioPath, playTurkishAudio } from '../utils/audioUtils';

export default function ScrambleMode({ wordData, onNext, selectedVoice, learningDirection }) {
  const [letters, setLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  const turkishWord = wordData["Turkcha (Türkçe)"] || wordData["Turkish"] || "";
  const uzbekWord = wordData["O'zbekcha (O'zbekcha)"] || wordData["Uzbek"] || "";

  const isReverse = learningDirection === 'uz-tr';
  const questionWord = isReverse ? uzbekWord : turkishWord;
  const targetWord = isReverse ? turkishWord : uzbekWord;
  
  useEffect(() => {
    // Reset state for new word
    setIsSubmitted(false);
    setIsCorrect(false);
    
    // Create an array of letters (objects with id for tracking duplicates)
    const chars = targetWord.split('').map((char, index) => ({
      id: `${char}-${index}`,
      char: char.toUpperCase(),
      originalIndex: index
    }));
    
    // Shuffle the letters
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    
    setLetters(chars);
    setSelectedLetters(Array(targetWord.length).fill(null));
  }, [wordData, targetWord]);

  const playAudio = () => {
    if (turkishWord && selectedVoice) {
      const localAudio = new Audio(getAudioPath(turkishWord, selectedVoice));
      localAudio.play().catch(() => {
        const text = encodeURIComponent(turkishWord);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=tr&q=${text}`;
        new Audio(url).play().catch(() => {});
      });
    }
  };

  const handleSelectLetter = (letterObj) => {
    if (isSubmitted) return;
    
    // Find first empty slot in selectedLetters
    const emptyIndex = selectedLetters.findIndex(l => l === null);
    if (emptyIndex === -1) return; // Full
    
    const newSelected = [...selectedLetters];
    newSelected[emptyIndex] = letterObj;
    setSelectedLetters(newSelected);
    
    // Remove from available letters
    setLetters(letters.filter(l => l.id !== letterObj.id));
    
    // Check if full
    if (emptyIndex === selectedLetters.length - 1) {
      checkAnswer(newSelected);
    }
  };

  const handleRemoveLetter = (index) => {
    if (isSubmitted) return;
    
    const letterObj = selectedLetters[index];
    if (!letterObj) return;
    
    const newSelected = [...selectedLetters];
    newSelected[index] = null;
    
    // Shift remaining letters left to avoid gaps
    const filtered = newSelected.filter(l => l !== null);
    while (filtered.length < selectedLetters.length) {
      filtered.push(null);
    }
    
    setSelectedLetters(filtered);
    
    // Add back to available pool
    setLetters([...letters, letterObj]);
  };

  const checkAnswer = (currentSelected) => {
    const userWord = currentSelected.map(l => l?.char).join('');
    const correct = userWord.toLowerCase() === targetWord.toLowerCase();
    
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (correct) {
      playAudio();
    }
    
    setTimeout(() => {
      onNext(correct);
    }, correct ? 1500 : 2500);
  };

  return (
    <div className="typing-container glass-panel scramble-container">
      <div className="typing-question">
        <span className="quiz-label">{isReverse ? "Turkchasini yig'ing:" : "O'zbekchasini yig'ing:"}</span>
        <h2 className="word-translation" style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>{questionWord}</h2>
        
        {isReverse && (
          <button className="hint-btn" onClick={playAudio} title="Eshitish (Hint)">
            🎧 Talaffuzni eshitish (Yordam)
          </button>
        )}
      </div>

      <div className={`scramble-slots ${isSubmitted ? (isCorrect ? 'correct-shake' : 'error-shake') : ''}`}>
        {selectedLetters.map((letterObj, i) => (
          <div 
            key={i} 
            className={`scramble-slot ${letterObj ? 'filled' : ''} ${isSubmitted ? (isCorrect ? 'correct' : 'incorrect') : ''}`}
            onClick={() => handleRemoveLetter(i)}
          >
            {letterObj ? letterObj.char : ''}
          </div>
        ))}
      </div>

      <div className="scramble-pool">
        {letters.map((letterObj) => (
          <button 
            key={letterObj.id}
            className="scramble-tile"
            onClick={() => handleSelectLetter(letterObj)}
          >
            {letterObj.char}
          </button>
        ))}
      </div>
      
      {isSubmitted && !isCorrect && (
        <div className="correction" style={{ marginTop: '2rem' }}>
          To'g'ri javob: <strong>{targetWord}</strong>
        </div>
      )}
    </div>
  );
}
