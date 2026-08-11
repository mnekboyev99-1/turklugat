import { useState, useEffect } from 'react';
import { getAudioPath } from '../utils/audioUtils';
import wordsData from '../data/words.json';

const VOICES = ['Emel', 'Ahmet'];
const CACHE_NAME = 'turk-audio-cache';
const CHUNK_SIZE = 50; // Bir martada yuklanadigan ovozlar soni

export default function AudioDownloader() {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if already downloaded
    const status = localStorage.getItem('turk_vocab_audio_downloaded');
    if (status === 'true') {
      setIsDownloaded(true);
    }
  }, []);

  const handleStartDownload = async () => {
    setIsDownloading(true);
    setProgress(0);

    try {
      const urlsToCache = [];
      
      // Barcha URL larni yig'ish
      wordsData.forEach(w => {
        const tr = w["Turkcha (Türkçe)"] || w["Turkish"];
        if (tr) {
          VOICES.forEach(voice => {
            urlsToCache.push(getAudioPath(tr, voice));
          });
        }
      });

      // Duplikatlarni olib tashlash
      const uniqueUrls = [...new Set(urlsToCache)];
      const total = uniqueUrls.length;
      let downloaded = 0;

      const cache = await caches.open(CACHE_NAME);

      // Bo'lib-bo'lib yuklash (Chunking)
      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = uniqueUrls.slice(i, i + CHUNK_SIZE);
        
        await Promise.all(chunk.map(async (url) => {
          try {
            // Avval keshda bormi tekshiramiz
            const match = await cache.match(url);
            if (!match) {
              await cache.add(url);
            }
          } catch (err) {
            console.error(`Failed to cache ${url}`, err);
          }
        }));

        downloaded += chunk.length;
        if (downloaded > total) downloaded = total;
        setProgress(Math.round((downloaded / total) * 100));
      }

      // Yakunlash
      localStorage.setItem('turk_vocab_audio_downloaded', 'true');
      setIsDownloaded(true);
      setTimeout(() => setShowPrompt(false), 2000);
      
    } catch (error) {
      console.error("Yuklashda xatolik yuz berdi:", error);
      alert("Yuklashda xatolik yuz berdi. Iltimos internetingizni tekshirib qayta urinib ko'ring.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => !isDownloaded && setShowPrompt(true)}
        className="btn"
        style={{
          background: isDownloaded ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-card)',
          border: `1px solid ${isDownloaded ? 'var(--success)' : 'var(--glass-border)'}`,
          color: isDownloaded ? 'var(--success)' : 'var(--text-main)',
          borderRadius: '20px',
          padding: '0.3rem 0.8rem',
          cursor: isDownloaded ? 'default' : 'pointer',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}
        title={isDownloaded ? "Barcha ovozlar oflayn mavjud" : "Oflayn ishlash uchun yuklash"}
      >
        {isDownloaded ? '✅ Oflayn Tayyor' : '📥 Oflayn Ovozlar'}
      </button>

      {showPrompt && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            
            {!isDownloading && progress === 0 ? (
              <>
                <h3 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>Oflayn Ovozlarni Yuklash</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Ilova internetsiz to'liq ishlashi uchun barcha so'zlarning ovozlarini (taxminan <strong>62 MB</strong>) telefoningiz xotirasiga yuklab olishingiz kerak. <br/><br/>
                  Hozir yuklab olishni boshlaymizmi?
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setShowPrompt(false)}
                    className="btn"
                    style={{ background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }}
                  >
                    Yo'q, keyinroq
                  </button>
                  <button 
                    onClick={handleStartDownload}
                    className="btn btn-know"
                  >
                    Ha, yuklash
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ marginBottom: '1.5rem', color: isDownloaded ? 'var(--success)' : 'var(--accent-primary)' }}>
                  {isDownloaded ? "Muvaffaqiyatli yuklandi! 🎉" : "Yuklanmoqda... Iltimos, kutib turing"}
                </h3>
                
                <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ 
                    height: '100%', 
                    background: isDownloaded ? 'var(--success)' : 'var(--accent-primary)', 
                    width: `${progress}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                  {progress}%
                </p>
                
                {!isDownloaded && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '1rem' }}>
                    Iltimos, bu oyna yopilguniga qadar ilovadan chiqmang va ekranni o'chirmang!
                  </p>
                )}
              </>
            )}
            
          </div>
        </div>
      )}
    </>
  );
}
