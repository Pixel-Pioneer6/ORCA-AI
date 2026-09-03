import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MarineProvider, useMarine } from './context/MarineContext';
import { LanguageProvider } from './context/LanguageContext';

// Common Components
import GovMasthead from './components/common/GovMasthead';
import HeaderMobile from './components/common/HeaderMobile';
import HeaderDesktop from './components/common/HeaderDesktop';
import BottomNav from './components/common/BottomNav';
import SidebarRail from './components/common/SidebarRail';
import GovFooter from './components/common/GovFooter';
import VoiceMicModal from './components/common/VoiceMicModal';

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

const SCREENS_LIST = [
  { path: '/', role: 'fisher', label: '01 Home' },
  { path: '/safety', role: 'fisher', label: '02 Safety' },
  { path: '/pfz', role: 'fisher', label: '03 PFZ' },
  { path: '/map', role: 'fisher', label: '04 Map' },
  { path: '/assistant', role: 'fisher', label: '05 AI Voice' },
  { path: '/profile', role: 'fisher', label: '06 Vessel' },
  { path: '/settings', role: 'fisher', label: '07 Settings' },
  { path: '/dashboard/ddmo', role: 'ddmo', label: '08 DDMO' },
  { path: '/dashboard/port', role: 'port', label: '09 Port' },
  { path: '/dashboard/researcher', role: 'researcher', label: '10 Research' },
  { path: '/dashboard/authority', role: 'authority', label: '11 Command' },
];

function AppContent() {
  const { currentRole, setCurrentRole } = useMarine();
  const isDesktopRole = ['ddmo', 'port', 'researcher', 'authority'].includes(currentRole);

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased">
      {/* Universal Floating Screen Switcher HUD for Quick Demo Evaluation */}
      <div className="fixed top-2 right-2 z-50 hidden md:flex items-center gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-2xl text-[11px]">
        <span className="text-secondary-container font-bold uppercase font-mono px-2">
          Stitch Screens:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto max-w-xl">
          {SCREENS_LIST.map((s) => (
            <a
              key={s.path}
              href={`#${s.path}`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentRole(s.role);
                window.history.pushState({}, '', s.path);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="px-2 py-1 rounded font-bold transition-all whitespace-nowrap text-white/70 hover:text-white hover:bg-white/10"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

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
              <GovFooter />
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
          </main>
          <BottomNav />
        </div>
      )}

      {/* Global Voice Assistant Modal */}
      <VoiceMicModal />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <MarineProvider>
          <AppContent />
        </MarineProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
