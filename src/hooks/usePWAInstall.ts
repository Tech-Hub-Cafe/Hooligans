'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  isMobile: boolean;
  installPWA: () => Promise<void>;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if app is already installed (standalone mode)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isStandaloneIOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isStandaloneIOS);
    };

    checkInstalled();

    // Detect mobile device
    const checkMobile = () => {
      const mobileMediaQuery = window.matchMedia('(max-width: 768px)');
      const isMobileDevice = mobileMediaQuery.matches || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();

    // Listen for resize to update mobile detection
    const mobileMediaQuery = window.matchMedia('(max-width: 768px)');
    const handleMobileChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };

    mobileMediaQuery.addEventListener('change', handleMobileChange);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      mobileMediaQuery.removeEventListener('change', handleMobileChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        setIsInstalled(true);
      } else {
        console.log('[PWA] User dismissed install prompt');
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('[PWA] Error during install:', error);
    }
  };

  return {
    isInstallable: isInstallable && isMobile && !isInstalled,
    isInstalled,
    isMobile,
    installPWA,
  };
}
