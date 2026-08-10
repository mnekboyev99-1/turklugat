import { useState, useRef, useEffect } from 'react';
import { getAudioPath } from '../utils/audioUtils';

export default function TypingMode({ wordData, onNext, selectedVoice, learningDirection }) {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef(null);
  
  const turkishWord = wordData["Turkcha (Türkçe)"] || wordData["Turkish"] || "N/A";
  const uzbekWord = wordData["O'zbekcha (O'zbekcha)"] || wordData["Uzbek"] || "N/A";

  const isReverse = learningDirection === 'uz-tr';
  const questionWord = isReverse ? uzbekWord : turkishWord;
  const targetWord = isReverse ? turkishWord : uzbekWord;
  const inputPlaceholder = isReverse ? "Turkchasini yozing..." : "O'zbekchasini yozing...";

  useEffect(() => {
    // Focus input on mount or word change
    setInputValue('');
    setIsSubmitted(false);
    setIsCorrect(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [wordData]);

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

  const checkAnswer = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Normalize string: lowercase, remove extra spaces, trim.
    const normalizedInput = inputValue.trim().toLocaleLowerCase(isReverse ? 'tr-TR' : 'uz-UZ');
    const normalizedTarget = targetWord.trim().toLocaleLowerCase(isReverse ? 'tr-TR' : 'uz-UZ');
    
    const correct = normalizedInput === normalizedTarget;
    setIsCorrect(correct);
    setIsSubmitted(true);
    
    if (correct) {
      playAudio();
    }
    
    setTimeout(() => {
      onNext(correct);
    }, 2000);
  };

  return (
    <div className="typing-container glass-panel">
      <div className="typing-question">
        <span className="quiz-label">{isReverse ? "Turkchasini yozing:" : "O'zbekchasini yozing:"}</span>
        <h2 className="word-translation" style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>{questionWord}</h2>
        
        {isReverse && (
          <button className="hint-btn" onClick={playAudio} title="Eshitish (Hint)">
            🎧 Talaffuzni eshitish (Yordam)
          </button>
        )}
      </div>
      
      <form onSubmit={checkAnswer} className="typing-form">
        <input 
          ref={inputRef}
          type="text" 
          className={`typing-input ${isSubmitted ? (isCorrect ? 'correct-input' : 'incorrect-input') : ''}`}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSubmitted}
          placeholder={inputPlaceholder}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-submit" disabled={isSubmitted || !inputValue.trim()}>
          Tekshirish
        </button>
      </form>
      
      {isSubmitted && !isCorrect && (
        <div className="correction">
          To'g'ri javob: <strong>{targetWord}</strong>
        </div>
      )}
    </div>
  );
}
