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
          <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" style={{marginRight: '12px'}}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Google orqali
        </button>

        <button 
          onClick={loginAsGuest}
          className="google-login-btn"
          style={{ 
            marginTop: '0.8rem', 
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            fontSize: '0.95rem',
            color: '#ffffff'
          }}
        >
          👤 Mehmon sifatida kirish
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;

