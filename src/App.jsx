import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MarineProvider, useMarine } from './context/MarineContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';

// Common Components
import GovMasthead from './components/common/GovMasthead';
import HeaderMobile from './components/common/HeaderMobile';
import HeaderDesktop from './components/common/HeaderDesktop';
import BottomNav from './components/common/BottomNav';
import SidebarRail from './components/common/SidebarRail';
import GovFooter from './components/common/GovFooter';
import VoiceMicModal from './components/common/VoiceMicModal';
import AuthModal from './components/common/AuthModal';
import OfflineBanner from './components/common/OfflineBanner';
import GeofenceAlertBanner from './components/common/GeofenceAlertBanner';
import ScreenSwitcher from './components/common/ScreenSwitcher';

// 11 Screen Pages
import HomePage from './pages/01_Home';
import SafetyAssessmentPage from './pages/02_SafetyAssessment';
import PfzAdvisorPage from './pages/03_PfzAdvisor';
import GisMapPage from './pages/04_GisMapPage';
import AssistantPage from './pages/05_AssistantPage';
import VesselProfilePage from './pages/06_VesselProfile';
import SettingsPage from './pages/07_SettingsPage';
import DdmoDashboard from './pages/08_DdmoDashboard';
import PortDashboard from './pages/09_PortDashboard';
import ResearcherWorkspace from './pages/10_ResearcherWorkspace';
import AuthorityDashboard from './pages/11_AuthorityDashboard';

function AppContent() {
  const { currentRole, setCurrentRole, viewModeOverride, setViewModeOverride } = useMarine();
  const roleIsDesktop = ['ddmo', 'port', 'researcher', 'authority'].includes(currentRole);
  // Dual screen mode: 'auto' keeps the existing role-driven choice; a forced
  // override lets either shell be previewed regardless of role/window size.
  const isDesktopRole = viewModeOverride === 'desktop' ? true : viewModeOverride === 'mobile' ? false : roleIsDesktop;

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased">
      {/* Dual Screen Mode toggle — always visible (unlike the desktop-only
          Stitch Screens HUD below) so it works from a phone too.
          bottom-20 on narrow viewports clears BottomNav's edge-to-edge
          80px bar (same convention OfflineBanner already uses); md:bottom-4
          on wider viewports, where BottomNav's content is centered in a
          max-w-lg column and never reaches the edges anyway. */}
      <div className="fixed bottom-20 md:bottom-4 left-4 z-[70] flex items-center gap-0.5 bg-black/80 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-2xl">
        <button
          onClick={() => setViewModeOverride(viewModeOverride === 'desktop' ? 'auto' : 'desktop')}
          title="Force desktop layout"
          aria-pressed={viewModeOverride === 'desktop'}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            viewModeOverride === 'desktop' ? 'bg-secondary text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
        </button>
        <button
          onClick={() => setViewModeOverride(viewModeOverride === 'mobile' ? 'auto' : 'mobile')}
          title="Force mobile layout"
          aria-pressed={viewModeOverride === 'mobile'}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            viewModeOverride === 'mobile' ? 'bg-secondary text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">smartphone</span>
        </button>
        {viewModeOverride !== 'auto' && (
          <span className="text-[9px] font-mono font-bold text-secondary-container uppercase pr-2 pl-1">
            {viewModeOverride}
          </span>
        )}
      </div>

      {/* Demo screen navigator — a collapsed menu button (not a permanently
          visible numbered strip) so it reads as a normal app affordance
          rather than an exposed dev tool. Anchored bottom-right, clear of
          the fixed GovMasthead/HeaderDesktop bars. */}
      <ScreenSwitcher setCurrentRole={setCurrentRole} />

      {isDesktopRole ? (
        /* Desktop Layout (Screens 08, 09, 10, 11) */
        <div className="flex flex-col min-h-screen">
          <GovMasthead variant="desktop" />
          <HeaderDesktop />
          <div className="flex flex-grow pt-24">
            <SidebarRail />
            <main id="main-content" className="pl-64 flex-grow w-full px-gutter-desktop py-pad-md bg-surface min-h-[calc(100vh-96px)] overflow-x-hidden">
              <Routes>
                <Route path="/dashboard/ddmo" element={<DdmoDashboard />} />
                <Route path="/dashboard/port" element={<PortDashboard />} />
                <Route path="/dashboard/researcher" element={<ResearcherWorkspace />} />
                <Route path="/dashboard/authority" element={<AuthorityDashboard />} />
                <Route path="*" element={<DdmoDashboard />} />
              </Routes>
              <GovFooter variant="desktop" />
            </main>
          </div>
        </div>
      ) : (
        /* Mobile Layout (Screens 01 through 07) */
        <div className="flex flex-col min-h-screen">
          <GovMasthead variant="mobile" />
          <HeaderMobile />
          <main id="main-content" className="flex-grow w-full max-w-lg mx-auto px-gutter-mobile pt-36 pb-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/safety" element={<SafetyAssessmentPage />} />
              <Route path="/pfz" element={<PfzAdvisorPage />} />
              <Route path="/map" element={<GisMapPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/profile" element={<VesselProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
            <GovFooter variant="mobile" />
          </main>
          <BottomNav />
        </div>
      )}

      {/* Global Voice Assistant Modal */}
      <VoiceMicModal />
      <AuthModal />
      <OfflineBanner />
      <GeofenceAlertBanner />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <MarineProvider>
            <AppContent />
          </MarineProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
