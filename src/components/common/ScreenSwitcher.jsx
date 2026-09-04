import React, { useState, useRef, useEffect } from 'react';

// A professional, low-profile demo navigator — replaces the earlier
// "STITCH SCREENS: 01 Home 02 Safety ..." bar (a permanently-visible,
// numbered dev strip that undercut the app's official/government look).
// Same navigation capability, presented as a standard collapsed menu
// button that only expands on request, styled with the app's own design
// tokens instead of a flat black debug console.
const SCREENS = [
  {
    section: 'Fisher (Mobile)',
    items: [
      { path: '/', role: 'fisher', label: 'Home', icon: 'anchor' },
      { path: '/safety', role: 'fisher', label: 'Safety Assessment', icon: 'crisis_alert' },
      { path: '/pfz', role: 'fisher', label: 'PFZ Advisor', icon: 'set_meal' },
      { path: '/map', role: 'fisher', label: 'Tactical Map', icon: 'map' },
      { path: '/assistant', role: 'fisher', label: 'AI Voice Assistant', icon: 'mic' },
      { path: '/profile', role: 'fisher', label: 'Vessel Profile', icon: 'directions_boat' },
      { path: '/settings', role: 'fisher', label: 'Settings', icon: 'settings' },
    ],
  },
  {
    section: 'Officer Dashboards',
    items: [
      { path: '/dashboard/ddmo', role: 'ddmo', label: 'DDMO Command', icon: 'emergency' },
      { path: '/dashboard/port', role: 'port', label: 'Port Operations', icon: 'anchor' },
      { path: '/dashboard/researcher', role: 'researcher', label: 'Researcher Workspace', icon: 'science' },
      { path: '/dashboard/authority', role: 'authority', label: 'Authority Command', icon: 'shield' },
    ],
  },
];

export default function ScreenSwitcher({ setCurrentRole }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const navigate = (item) => {
    setCurrentRole(item.role);
    window.history.pushState({}, '', item.path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setIsOpen(false);
  };

  return (
    <div ref={panelRef} className="fixed bottom-4 right-4 z-[70] hidden md:block">
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-64 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="px-3.5 py-2.5 border-b border-surface-container bg-surface-container-low">
            <span className="font-headline-sm text-xs font-bold text-on-surface">Demo Navigator</span>
            <p className="text-[10px] text-on-surface-variant mt-0.5">Jump to any screen for evaluation</p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-1.5">
            {SCREENS.map((group) => (
              <div key={group.section} className="mb-1 last:mb-0">
                <div className="px-3.5 pt-1.5 pb-1 text-[9px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                  {group.section}
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open demo screen navigator"
        aria-expanded={isOpen}
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-2xl border transition-colors ${
          isOpen
            ? 'bg-secondary border-secondary text-white'
            : 'bg-surface-container-lowest border-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">{isOpen ? 'close' : 'menu'}</span>
      </button>
    </div>
  );
}
