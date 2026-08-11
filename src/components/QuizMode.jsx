import { useState, useEffect } from 'react';
import { getAudioPath, playTurkishAudio } from '../utils/audioUtils';

export default function QuizMode({ wordData, allWords, onNext, selectedVoice, learningDirection }) {
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  
  const turkishWord = wordData["Turkcha (Türkçe)"] || wordData["Turkish"] || "N/A";
  const uzbekWord = wordData["O'zbekcha (O'zbekcha)"] || wordData["Uzbek"] || "N/A";
  
  const isReverse = learningDirection === 'uz-tr';
  const questionWord = isReverse ? uzbekWord : turkishWord;
  const answerWord = isReverse ? turkishWord : uzbekWord;
  
  useEffect(() => {
    // Generate 3 random wrong options
    const generateOptions = () => {
      const wrongOptions = [];
      while (wrongOptions.length < 3) {
        const randomIndex = Math.floor(Math.random() * allWords.length);
        const randomWord = allWords[randomIndex];
        const randomTurk = randomWord["Turkcha (Türkçe)"] || randomWord["Turkish"];
        const randomUzb = randomWord["O'zbekcha (O'zbekcha)"] || randomWord["Uzbek"];
        
        const optionCandidate = isReverse ? randomTurk : randomUzb;
        
        if (optionCandidate && optionCandidate !== answerWord && !wrongOptions.includes(optionCandidate)) {
          wrongOptions.push(optionCandidate);
        }
      }
      
      // Combine with right answer and shuffle
      const allOptions = [...wrongOptions, answerWord].sort(() => 0.5 - Math.random());
      setOptions(allOptions);
      setSelectedOption(null);
    };
    
    generateOptions();
  }, [wordData, allWords, turkishWord, answerWord, isReverse]);

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

  const handleSelect = (option) => {
    if (selectedOption) return; // Already answered
    
    setSelectedOption(option);
    const isCorrect = option === answerWord;
    
    if (isCorrect) {
      playAudio();
    }
    
    // Automatically proceed after 1.5 seconds
    setTimeout(() => {
      onNext(isCorrect);
    }, 1500);
  };

  if (!wordData) return null;

  return (
    <div className="quiz-container glass-panel">
      <div className="quiz-question">
        <span className="quiz-label">{isReverse ? "Turkchasini toping:" : "O'zbekchasini toping:"}</span>
        <h2 className="word-translation" style={{ marginTop: '0.5rem', color: 'var(--text-main)' }}>{questionWord}</h2>
      </div>
      
      <div className="quiz-options">
        {options.map((option, index) => {
          let optionClass = "quiz-btn";
          if (selectedOption) {
            if (option === answerWord) {
              optionClass += " correct";
            } else if (option === selectedOption) {
              optionClass += " incorrect";
            }
          }
          
          return (
            <button 
              key={index} 
              className={optionClass}
              onClick={() => handleSelect(option)}
              disabled={selectedOption !== null}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
