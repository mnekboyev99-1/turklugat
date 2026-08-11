import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import { AuthProvider } from './contexts/AuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <InstallPrompt />
      <App />
    </AuthProvider>
  </StrictMode>,
)
