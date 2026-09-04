import React, { useEffect, useState } from 'react';

// FR-6.4 / NFR-5 — the app never forces re-auth or blocks reading while
// offline; this is just the visible acknowledgement that it noticed.
export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 inset-x-0 z-[65] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-full bg-outline text-white text-xs font-bold shadow-lg">
        <span className="material-symbols-outlined text-[16px]">cloud_off</span>
        <span>Offline &mdash; showing cached data. Read access continues; sign-in and alerts resume on reconnect.</span>
      </div>
    </div>
  );
}
