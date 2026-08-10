import { useState, useEffect } from 'react';
import { getAudioPath } from '../utils/audioUtils';

export default function HangmanMode({ wordData, onNext, selectedVoice, learningDirection }) {
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isWon, setIsWon] = useState(false);
  
  const maxMistakes = 6; // 6 lives
  
  const turkishWord = wordData["Turkcha (Türkçe)"] || wordData["Turkish"] || "";
  const uzbekWord = wordData["O'zbekcha (O'zbekcha)"] || wordData["Uzbek"] || "";

  const isReverse = learningDirection === 'uz-tr';
  const questionWord = isReverse ? uzbekWord : turkishWord;
  const targetWord = isReverse ? turkishWord : uzbekWord;
  
  // Clean target word for guessing (no spaces/punctuation handled manually)
  const targetChars = targetWord.toUpperCase().split('');
  const uniqueTargetChars = [...new Set(targetChars.filter(c => c.match(/[a-zçğıöşüA-ZÇĞİÖŞÜO`oʻgʻ]/i)))];

  // Alphabet keyboards based on language
  const ALPHABET_TR = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split('');
  const ALPHABET_UZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZOʻGʻShCh".split(/(Oʻ|Gʻ|Sh|Ch|[A-Z])/).filter(Boolean);
  
  const alphabet = isReverse ? ALPHABET_TR : ALPHABET_UZ;

  useEffect(() => {
    setGuessedLetters([]);
    setMistakes(0);
    setIsSubmitted(false);
    setIsWon(false);
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

  const handleGuess = (letter) => {
    if (isSubmitted || guessedLetters.includes(letter)) return;
    
    const newGuessed = [...guessedLetters, letter];
    setGuessedLetters(newGuessed);
    
    // Check if correct
    // Note: for Oʻ and Gʻ, strict matching is needed. We assume targetChars match the alphabet array correctly.
    // A simple check is to see if targetChars contains a character that matches the letter, ignoring case loosely if needed.
    // For exact match:
    const isCorrect = targetChars.some(c => c === letter || c.startsWith(letter[0])); // StartsWith is a hack for multi-char uzbek letters if split didn't split them.
    // Actually, targetChars is split by ''. So "Oʻ" becomes "O" and "ʻ". This is a bit tricky for Uzbek alphabet.
    // To be safe, we just check if the targetWord string contains the letter.
    const actuallyCorrect = targetWord.toUpperCase().includes(letter);
    
    if (!actuallyCorrect) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= maxMistakes) {
        endGame(false);
      }
    } else {
      // Check win condition
      // A word is fully revealed if all its letters (that are in the alphabet) are guessed.
      const allRevealed = targetChars.every(c => {
        if (!c.match(/[a-zçğıöşüA-ZÇĞİÖŞÜO`oʻgʻ]/i)) return true; // spaces or hyphens are free
        // Find if this char is covered by any guess
        return newGuessed.some(g => targetWord.toUpperCase().includes(g) && (g === c || g.includes(c) || c.includes(g)));
      });
      // The above check can be brittle with multi-char, so an easier check:
      // Does the rendered string without spaces match the target string?
      const currentRender = targetChars.map(c => {
        if (!c.match(/[a-zçğıöşüA-ZÇĞİÖŞÜO`oʻgʻ]/i)) return c;
        const guessed = newGuessed.find(g => g === c || c.startsWith(g[0])); // simplified
        return guessed ? c : '_';
      }).join('');
      
      if (!currentRender.includes('_')) {
        endGame(true);
      }
    }
  };

  const endGame = (won) => {
    setIsWon(won);
    setIsSubmitted(true);
    if (won) playAudio();
    setTimeout(() => {
      onNext(won);
    }, won ? 1500 : 3000);
  };

  // Render logic for blanks
  const renderWord = () => {
    return (
      <div className="hangman-word">
        {targetChars.map((char, i) => {
          const isLetter = char.match(/[a-zçğıöşüA-ZÇĞİÖŞÜO`oʻgʻ]/i);
          if (!isLetter) {
            return <span key={i} className="hangman-space">{char}</span>;
          }
          
          // Check if this specific char is covered by guessedLetters
          // For multi-char like Oʻ, if user guessed Oʻ, it should match. But split('') splits Oʻ into O and ʻ.
          // We'll just do a basic char match. If it's a modifier like ʻ, we reveal it if the previous letter was revealed.
          const isRevealed = isSubmitted || guessedLetters.some(g => char === g || (g.length > 1 && g.includes(char)));
          
          return (
            <span key={i} className={`hangman-blank ${isRevealed ? 'revealed' : ''} ${!isWon && isSubmitted && !isRevealed ? 'missed' : ''}`}>
              {isRevealed ? char : ''}
            </span>
          );
        })}
      </div>
    );
  };

  const renderLives = () => {
    return (
      <div className="hangman-lives">
        {Array.from({ length: maxMistakes }).map((_, i) => (
          <span key={i} className={`heart ${i < mistakes ? 'lost' : ''}`}>
            {i < mistakes ? '🖤' : '❤️'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="typing-container glass-panel hangman-container">
      <div className="typing-question">
        <span className="quiz-label">{isReverse ? "Turkchasini toping:" : "O'zbekchasini toping:"}</span>
        <h2 className="word-translation" style={{ marginTop: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{questionWord}</h2>
        
        {isReverse && (
          <button className="hint-btn" onClick={playAudio} title="Eshitish (Hint)">
            🎧 Talaffuzni eshitish (Yordam)
          </button>
        )}
      </div>

      {renderLives()}
      
      {renderWord()}

      <div className="hangman-keyboard">
        {alphabet.map(letter => {
          const isGuessed = guessedLetters.includes(letter);
          const isCorrectGuess = isGuessed && targetWord.toUpperCase().includes(letter);
          const isWrongGuess = isGuessed && !isCorrectGuess;
          
          let btnClass = 'hangman-key';
          if (isCorrectGuess) btnClass += ' correct';
          if (isWrongGuess) btnClass += ' wrong';
          
          return (
            <button 
              key={letter}
              className={btnClass}
              onClick={() => handleGuess(letter)}
              disabled={isGuessed || isSubmitted}
            >
              {letter}
            </button>
          );
        })}
      </div>
      
      {isSubmitted && !isWon && (
        <div className="correction" style={{ marginTop: '1rem' }}>
          To'g'ri javob: <strong>{targetWord}</strong>
        </div>
      )}
    </div>
  );
}
