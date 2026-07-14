import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-3 w-[90%] max-w-sm border border-gray-800"
      >
        <div className="bg-red-500/20 p-2 rounded-full">
          <WifiOff size={18} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">You are offline</p>
          <p className="text-xs text-gray-400 truncate">Browsing in offline mode</p>
        </div>
        <button 
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <X size={18} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
