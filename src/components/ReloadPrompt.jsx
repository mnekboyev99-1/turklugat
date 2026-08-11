import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './ReloadPrompt.css'

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered')
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    }
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="ReloadPrompt-container">
      { (offlineReady || needRefresh)
        && <>
            <div className="ReloadPrompt-overlay"></div>
            <div className="ReloadPrompt-toast">
              <div className="ReloadPrompt-message">
                { offlineReady
                  ? <span>Dastur oflayn ishlashga tayyor! ✅</span>
                  : <span>🔄 Yangi versiya mavjud! <br/><span style={{fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-muted)'}}>Eng so'nggi o'zgarishlarni ko'rish uchun yangilang.</span></span>
                }
              </div>
              <div className="ReloadPrompt-buttons">
                { needRefresh && <button className="ReloadPrompt-toast-button" onClick={() => updateServiceWorker(true)}>Yangilash</button> }
                <button className="ReloadPrompt-toast-button close-btn" onClick={() => close()}>Yopish</button>
              </div>
            </div>
           </>
      }
    </div>
  )
}

export default ReloadPrompt
