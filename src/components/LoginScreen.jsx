import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LoginScreen.css';

const LoginScreen = () => {
  const { loginWithGoogle, loginAsGuest } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
    } catch (err) {
      setError('Google bilan kirish amalga oshmadi. Mehmon sifatida kirish mumkin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen-container">
      <div className="login-card">
        <h1>🇹🇷 Turkcha Lug'at</h1>
        <p>Ilovadan foydalanish uchun tizimga kiring</p>
        
        {error && <div className="login-error">{error}</div>}
        
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
          {loading ? 'Kutilmoqda...' : 'Google bilan kirish'}
        </button>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>yoki</span>
        </div>

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

