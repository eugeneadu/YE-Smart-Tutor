import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'min(420px, calc(100vw - 2rem))',
        animation: 'pwa-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}
    >
      <style>{`
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(2rem); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{
        background: 'linear-gradient(135deg, rgba(76,29,149,0.95) 0%, rgba(109,40,217,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(139,92,246,0.4)',
        borderRadius: '1.5rem',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.2) inset',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        {/* Icon */}
        <img
          src="/pwa-192x192.png"
          alt="Smart Tutor"
          style={{ width: 52, height: 52, borderRadius: '0.875rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
        />

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#f5f3ff' }}>
            Install Smart Tutor
          </p>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#c4b5fd', lineHeight: 1.4 }}>
            Add to your home screen for the full app experience!
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
          <button
            onClick={handleInstall}
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              border: 'none',
              borderRadius: '0.625rem',
              padding: '0.45rem 1rem',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124,58,237,0.5)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '0.625rem',
              padding: '0.35rem 1rem',
              color: '#c4b5fd',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
