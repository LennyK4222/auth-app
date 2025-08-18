'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if it's iOS Safari
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIos && !isInStandaloneMode) {
      // Show iOS-specific install instructions after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
      setPlatform('mobile');
      return;
    }

    // Detect platform
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setPlatform(isMobile ? 'mobile' : 'desktop');

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 5 seconds
      setTimeout(() => {
        const hasSeenPrompt = localStorage.getItem('pwa-prompt-seen');
        if (!hasSeenPrompt) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIos) {
        alert('Pentru a instala aplicația:\n1. Apasă pe butonul Share (↗)\n2. Scroll down și apasă "Add to Home Screen"\n3. Apasă "Add"');
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.setItem('pwa-prompt-seen', 'true');
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-seen', 'true');
    
    // Show again after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwa-prompt-seen');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  if (isInstalled || !showPrompt) return null;

  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl">
                {platform === 'mobile' ? (
                  <Smartphone className="w-6 h-6 text-white" />
                ) : (
                  <Monitor className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Instalează Auth App
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Accesează rapid de pe {platform === 'mobile' ? 'telefon' : 'desktop'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>✨</span>
              <span>Funcționează offline</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>🚀</span>
              <span>Lansare rapidă, fără browser</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>🔔</span>
              <span>Notificări pentru mesaje noi</span>
            </div>
          </div>

          {isIos ? (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                Pentru a instala pe iOS:
              </p>
              <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>1. Apasă pe Share (↗) în Safari</li>
                <li>2. Scroll și apasă &quot;Add to Home Screen&quot;</li>
                <li>3. Apasă &quot;Add&quot;</li>
              </ol>
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleInstall}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                Instalează Acum
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium rounded-xl transition-colors"
              >
                Mai Târziu
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
