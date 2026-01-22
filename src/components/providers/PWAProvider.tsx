'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // Only register service worker in production (PWA is disabled in development)
        if (process.env.NODE_ENV === 'development') {
            // Unregister any existing service workers in development
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => {
                        registration.unregister().then((success) => {
                            if (success) {
                                console.log('[PWA] Service worker unregistered (development mode)');
                            }
                        });
                    });
                });
            }
            return;
        }

        // Register service worker in production
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('[PWA] Service worker registered:', registration.scope);
                })
                .catch((error) => {
                    console.error('[PWA] Service worker registration failed:', error);
                });
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user has dismissed before
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('[PWA] User accepted install prompt');
        }

        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    return (
        <>
            {children}

            {/* Install Banner */}
            {showInstallBanner && (
                <div className="fixed bottom-0 left-0 right-0 bg-teal-600 text-white p-4 shadow-lg z-50 safe-area-bottom">
                    <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <p className="font-semibold">Install Hooligans</p>
                            <p className="text-sm opacity-90">Add to home screen for quick ordering</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDismiss}
                                className="px-3 py-2 text-sm opacity-75 hover:opacity-100"
                            >
                                Not now
                            </button>
                            <button
                                onClick={handleInstall}
                                className="px-4 py-2 bg-white text-teal-600 rounded-lg font-semibold text-sm"
                            >
                                Install
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
