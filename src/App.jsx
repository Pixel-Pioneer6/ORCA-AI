import React from 'react';
import { MarineProvider, useMarine } from './context/MarineContext';
import { LanguageProvider } from './context/LanguageContext';

// Common Components
import HeaderMobile from './components/common/HeaderMobile';
import HeaderDesktop from './components/common/HeaderDesktop';
import BottomNav from './components/common/BottomNav';
import SidebarRail from './components/common/SidebarRail';
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

function AppContent() {
  const { currentRole, setCurrentRole, currentRoute, setCurrentRoute } = useMarine();

  const isDesktopRole = ['ddmo', 'port', 'researcher', 'authority'].includes(currentRole);

  const renderActiveScreen = () => {
    switch (currentRoute) {
      case 'home':
        return <HomePage />;
      case 'safety':
        return <SafetyAssessmentPage />;
      case 'pfz':
        return <PfzAdvisorPage />;
      case 'map':
        return <GisMapPage />;
      case 'assistant':
        return <AssistantPage />;
      case 'profile':
        return <VesselProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'ddmo':
        return <DdmoDashboard />;
      case 'port':
        return <PortDashboard />;
      case 'researcher':
        return <ResearcherWorkspace />;
      case 'authority':
        return <AuthorityDashboard />;
      default:
        return <HomePage />;
    }
  };

  const screensList = [
    { id: 'home', role: 'fisher', label: '01 Home' },
    { id: 'safety', role: 'fisher', label: '02 Safety' },
    { id: 'pfz', role: 'fisher', label: '03 PFZ' },
    { id: 'map', role: 'fisher', label: '04 Map' },
    { id: 'assistant', role: 'fisher', label: '05 AI Voice' },
    { id: 'profile', role: 'fisher', label: '06 Vessel' },
    { id: 'settings', role: 'fisher', label: '07 Settings' },
    { id: 'ddmo', role: 'ddmo', label: '08 DDMO' },
    { id: 'port', role: 'port', label: '09 Port' },
    { id: 'researcher', role: 'researcher', label: '10 Research' },
    { id: 'authority', role: 'authority', label: '11 Command' },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased">
      {/* Universal Floating Screen Switcher HUD for Quick Demo Evaluation */}
      <div className="fixed top-2 right-2 z-50 hidden md:flex items-center gap-1 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 shadow-2xl text-[11px]">
        <span className="text-secondary-container font-bold uppercase font-mono px-2">
          Stitch Screens:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto max-w-xl">
          {screensList.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setCurrentRole(s.role);
                setCurrentRoute(s.id);
              }}
              className={`px-2 py-1 rounded font-bold transition-all whitespace-nowrap ${
                currentRoute === s.id
                  ? 'bg-secondary text-white shadow-xs'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isDesktopRole ? (
        /* Desktop Layout (Screens 08, 09, 10, 11) */
        <div className="flex flex-col min-h-screen">
          <HeaderDesktop />
          <div className="flex flex-grow pt-16">
            <SidebarRail />
            <main className="pl-64 flex-grow w-full px-gutter-desktop py-pad-md bg-surface min-h-[calc(100vh-64px)] overflow-x-hidden">
              {renderActiveScreen()}
            </main>
          </div>
        </div>
      ) : (
        /* Mobile Layout (Screens 01 through 07) */
        <div className="flex flex-col min-h-screen">
          <HeaderMobile />
          <main className="flex-grow w-full max-w-lg mx-auto px-gutter-mobile pt-32 pb-8">
            {renderActiveScreen()}
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
    <LanguageProvider>
      <MarineProvider>
        <AppContent />
      </MarineProvider>
    </LanguageProvider>
  );
}
