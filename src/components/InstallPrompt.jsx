import React, { useState, useEffect } from 'react';
import { downloadAudioFiles } from '../utils/audioDownloaderLogic';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Agar foydalanuvchi "Brauzerda davom etish" ni tanlagan bo'lsa yoki app o'rnatilgan bo'lsa
    const isDismissed = localStorage.getItem('turk_vocab_install_dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isDismissed || isStandalone) {
      return;
    }

    // iOS tekshiruvi
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setIsIOS(true);
      setShowPrompt(true); // iOS da beforeinstallprompt ishlamaydi, shuning uchun darhol ko'rsatamiz
    }

    // Android / Desktop Chrome uchun
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Brauzer avtomatik o'zini o'rnatish oynasini to'xtatish
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('turk_vocab_install_dismissed', 'true');
    setShowPrompt(false);
  };

  const handleInstallAndDownload = async () => {
    if (!isIOS && deferredPrompt) {
      // 1. PWA o'rnatishni so'rash
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('Foydalanuvchi ilovani o\'rnatishga rozi bo\'ldi');
      } else {
        console.log('Foydalanuvchi ilovani o\'rnatishni rad etdi');
        // Rad etsa ham audio yuklashni davom ettiramizmi? Yaxshisi ha.
      }
      setDeferredPrompt(null);
    }

    // 2. Audio yuklashni boshlash
    setIsDownloading(true);
    setProgress(0);

    const success = await downloadAudioFiles((prog) => {
      setProgress(prog);
    });

    if (success) {
      setTimeout(() => setShowPrompt(false), 2000);
    } else {
      alert("Ovozlarni yuklashda xatolik yuz berdi. Internetni tekshiring.");
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.95)', // Katta e'tibor qaratish uchun to'q fon
      backdropFilter: 'blur(10px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999, // Eng tepada turishi uchun
      padding: '20px'
    }}>
      <div className="glass-panel" style={{ 
        width: '100%', maxWidth: '450px', padding: '2.5rem', 
        textAlign: 'center', borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        {!isDownloading && progress === 0 ? (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
            <h2 style={{ marginBottom: '1rem', color: 'white', fontSize: '1.8rem' }}>Ilovani o'rnatamizmi?</h2>
            
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6', fontSize: '1.1rem' }}>
              Turkcha Lug'at ilovasini telefoningiz ekraniga joylashtiring va barcha <strong>ovozlarni (62 MB) oflayn ishlatish uchun yuklab oling.</strong>
            </p>

            {isIOS && (
              <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid var(--warning)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                <p style={{ color: 'var(--warning)', margin: 0, fontSize: '0.9rem' }}>
                  <strong>iPhone foydalanuvchilari uchun:</strong><br/>
                  Ilovani o'rnatish uchun avval pastdagi <strong>📤 (Ulashish / Share)</strong> tugmasini bosing, so'ngra ro'yxatdan <strong>"Add to Home Screen"</strong> (Ekranga qo'shish) ni tanlang. Keyin qaytib kirib ovozlarni yuklab oling.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={handleInstallAndDownload}
                className="btn btn-know"
                style={{ padding: '1rem', fontSize: '1.1rem', width: '100%', borderRadius: '12px' }}
              >
                {isIOS ? '📥 Oflayn Ovozlarni Yuklash' : '⬇️ O\'rnatish va Ovozlarni Yuklash'}
              </button>
              
              <button 
                onClick={handleDismiss}
                style={{ 
                  background: 'transparent', border: 'none', 
                  color: 'var(--text-muted)', padding: '1rem', 
                  fontSize: '1rem', cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Brauzerda davom etish
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {progress === 100 ? '🎉' : '⏳'}
            </div>
            <h2 style={{ marginBottom: '1.5rem', color: progress === 100 ? 'var(--success)' : 'white' }}>
              {progress === 100 ? "Tayyor!" : "Ovozlar yuklanmoqda..."}
            </h2>
            
            <div style={{ width: '100%', height: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ 
                height: '100%', 
                background: progress === 100 ? 'var(--success)' : 'var(--accent-primary)', 
                width: `${progress}%`,
                transition: 'width 0.3s ease',
                borderRadius: '8px'
              }}></div>
            </div>
            
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', margin: '1rem 0' }}>
              {progress}%
            </p>
            
            {progress < 100 && (
              <p style={{ fontSize: '0.9rem', color: 'var(--warning)', margin: 0 }}>
                Iltimos, bu oyna yopilguniga qadar ekranni o'chirmang!
              </p>
            )}
          </>
        )}
        
      </div>
    </div>
  );
}
