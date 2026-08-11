import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginScreen.css';

const LoginScreen = () => {
  const { loginWithGoogle, loginAsGuest, registerWithEmail, loginWithEmail } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (err) {
      let errorMessage = "Xatolik yuz berdi.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "Email yoki parol noto'g'ri.";
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = "Bu email allaqachon ro'yxatdan o'tgan.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Parol juda oddiy (kamida 6 ta belgi bo'lishi kerak).";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Email formati noto'g'ri.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError("Google bilan kirish amalga oshmadi. Email yoki mehmon orqali kiring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen-container">
      <div className="login-card">
        <h1>🇹🇷 Turkcha Lug'at</h1>
        <p>{isLogin ? 'Ilovaga kirish' : 'Ro\'yxatdan o\'tish'}</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <input 
            type="email" 
            placeholder="Email manzilingiz" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input 
            type="password" 
            placeholder="Parol" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          <button 
            type="submit" 
            className="email-login-btn"
            disabled={loading}
          >
            {loading ? 'Kutilmoqda...' : (isLogin ? 'Kirish' : 'Ro\'yxatdan o\'tish')}
          </button>
        </form>

        <div className="toggle-auth">
          <button onClick={() => setIsLogin(!isLogin)} disabled={loading}>
            {isLogin ? 'Akkauntingiz yo\'qmi? Ro\'yxatdan o\'ting' : 'Akkauntingiz bormi? Tizimga kiring'}
          </button>
        </div>

        <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
          <span style={{ 
            color: 'var(--text-muted)', 
            fontSize: '0.85rem', 
            background: 'var(--bg-card)', 
            padding: '0 10px',
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}>yoki</span>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="google-login-btn"
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
            alt="Google" 
            className="google-icon"
          />
          Google orqali
        </button>

        <button 
          onClick={loginAsGuest}
          className="google-login-btn"
          style={{ 
            marginTop: '0.8rem', 
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '0.95rem'
          }}
        >
          👤 Mehmon sifatida kirish
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;

