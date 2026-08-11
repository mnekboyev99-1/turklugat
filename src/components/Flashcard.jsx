import { useState, useEffect } from 'react';
import { getAudioPath, playTurkishAudio } from '../utils/audioUtils';

export default function Flashcard({ wordData, isFlipped, setIsFlipped, selectedVoice, learningDirection, isFavorite, toggleFavorite }) {
  if (!wordData) return null;

  const turkishWord = wordData["Turkcha (Türkçe)"] || wordData["Turkish"] || "N/A";
  const uzbekWord = wordData["O'zbekcha (O'zbekcha)"] || wordData["Uzbek"] || "N/A";
  let wordType = wordData["Turi (Type)"] || wordData["Type"] || "";
  if (wordType === "Karma (Mixed)") wordType = "";

  const isReverse = learningDirection === 'uz-tr';
  const frontWord = isReverse ? uzbekWord : turkishWord;
  const backWord = isReverse ? turkishWord : uzbekWord;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const playAudio = (e) => {
    e.stopPropagation();
    
    // Play Turkish audio by word slug
    if (turkishWord && selectedVoice) {
      playTurkishAudio(turkishWord, selectedVoice);
    } else {
      playFallbackAudio();
    }
  };

  const playFallbackAudio = () => {
    const text = encodeURIComponent(turkishWord);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=tr&q=${text}`;
    
    const audio = new Audio(url);
    audio.play().catch(error => {
      console.error("Audio pleyerda xatolik:", error);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(turkishWord);
        utterance.lang = 'tr-TR';
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (toggleFavorite) toggleFavorite();
  };

  return (
    <div className="flashcard-container">
      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
        {/* Front of the card */}
        <div className="glass-panel flashcard-face flashcard-front">
          <button 
            className="favorite-btn" 
            onClick={handleFavoriteClick} 
            title="Tanlanganlarga qo'shish"
            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: isFavorite ? '#ffd700' : 'var(--text-muted)' }}
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
          
          {wordType && !isReverse && <span className="word-type">{wordType}</span>}
          
          <h2 className="word-main">{frontWord}</h2>
          <p className="subtitle">Tarjimasini ko'rish uchun bosing</p>
          {!isReverse && (
            <button className="audio-btn" onClick={playAudio} title="Tinglash">
              🔊
            </button>
          )}
        </div>

        {/* Back of the card */}
        <div className="glass-panel flashcard-face flashcard-back">
          <button 
            className="favorite-btn" 
            onClick={handleFavoriteClick} 
            title="Tanlanganlarga qo'shish"
            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: isFavorite ? '#ffd700' : 'var(--text-muted)' }}
          >
            {isFavorite ? '⭐' : '☆'}
          </button>

          {wordType && isReverse && <span className="word-type">{wordType}</span>}
          <h2 className="word-main">{frontWord}</h2>
          <h3 className="word-translation">{backWord}</h3>
          
          <button className="audio-btn" onClick={playAudio} title="Tinglash">
            🔊
          </button>
        </div>
      </div>
    </div>
  );
}
