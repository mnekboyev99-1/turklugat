import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import SuffixHighlighter from '../utils/SuffixHighlighter';
import { getAudioPath, playTurkishAudio } from '../utils/audioUtils';

export default function SwipeMode({ wordData, onNext, selectedVoice, learningDirection }) {
  const controls = useAnimation();
  const [showTranslation, setShowTranslation] = useState(false);

  const turkishWord = wordData["Turkcha (Türkçe)"] || wordData["Turkish"] || "N/A";
  const uzbekWord = wordData["O'zbekcha (O'zbekcha)"] || wordData["Uzbek"] || "N/A";
  let type = wordData["Turi (Type)"] || "General";
  if (type === "Karma (Mixed)") type = "";

  const isReverse = learningDirection === 'uz-tr';
  const mainWord = isReverse ? uzbekWord : turkishWord;
  const revealedWord = isReverse ? turkishWord : uzbekWord;

  const playAudio = (e) => {
    e.stopPropagation();
    if (turkishWord && selectedVoice) {
      const localAudio = new Audio(getAudioPath(turkishWord, selectedVoice));
      localAudio.play().catch(() => {
        const text = encodeURIComponent(turkishWord);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=tr&q=${text}`;
        new Audio(url).play().catch(() => {});
      });
    }
  };

  const handleDragEnd = (event, info) => {
    const swipeThreshold = 100; // pixels
    if (info.offset.x > swipeThreshold) {
      // Swiped Right (Know)
      controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } }).then(() => {
        setShowTranslation(false);
        controls.set({ x: 0, opacity: 1 });
        onNext(true); // User knew the word
      });
    } else if (info.offset.x < -swipeThreshold) {
      // Swiped Left (Don't Know)
      controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } }).then(() => {
        setShowTranslation(false);
        controls.set({ x: 0, opacity: 1 });
        onNext(false); // User didn't know the word
      });
    } else {
      // Snap back
      controls.start({ x: 0, transition: { type: 'spring' } });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '350px', marginBottom: '1rem', color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--danger)' }}>← Bilmayman</span>
        <span style={{ color: 'var(--success)' }}>Bilaman →</span>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={controls}
        onClick={() => {
          setShowTranslation(!showTranslation);
          // Auto play audio when revealing translation in reverse mode
          if (isReverse && !showTranslation) {
            playAudio({ stopPropagation: () => {} });
          }
        }}
        style={{
          width: '100%',
          maxWidth: '350px',
          height: '400px',
          background: 'var(--card-gradient)',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          cursor: 'grab',
          position: 'relative',
          boxShadow: 'var(--glass-shadow)',
          touchAction: 'none'
        }}
        whileTap={{ cursor: 'grabbing' }}
      >
        {!isReverse && (
          <div className="word-type" style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
            {type}
          </div>
        )}
        
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            {isReverse ? mainWord : <SuffixHighlighter word={mainWord} />}
          </h2>
          
          <div style={{ opacity: showTranslation ? 1 : 0, transition: 'opacity 0.3s', fontSize: '1.8rem', color: 'var(--accent-secondary)' }}>
            {revealedWord}
          </div>
        </div>

        {(!isReverse || showTranslation) && (
          <button 
            onClick={playAudio}
            style={{ position: 'absolute', bottom: '1.5rem', background: 'var(--btn-transparent)', color: 'var(--text-main)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            🔊
          </button>
        )}
      </motion.div>
      
      {!showTranslation && <p style={{marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem'}}>Tarjimasini ko'rish uchun kartochkani bosing</p>}
    </div>
  );
}
