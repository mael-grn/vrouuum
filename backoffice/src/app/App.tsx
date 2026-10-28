import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Calendar,
  Wrench,
  Flag,
  Menu,
  X,
} from 'lucide-react';
import appIcon from '@/assets/icon.png';
import { CompetitionsView } from '@/features/competitions/components/CompetitionsView';
import { CalendarView } from '@/features/calendar/components/CalendarView';
import { PaddockView } from '@/features/paddock/components/PaddockView';
import { RacingView } from '@/features/racing/components/RacingView';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { apiClient } from '@/lib/api-client';
import { TopBarProvider, useTopBar } from '@/components/layout/TopBarContext';
import { PageTransition } from '@/components/layout/PageTransition';

type Tab = 'paddock' | 'competitions' | 'calendar' | 'racing';

interface HealthResponse {
  status: string;
  timestamp: string;
}

const BrandVehiclesRedirect: React.FC = () => {
  const { brandSlug } = useParams<{ brandSlug: string }>();
  return <Navigate to={`/paddock/marques/${brandSlug}/vehicules`} replace />;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setBreadcrumbEl, setActionsEl } = useTopBar();

  // Deduce active tab from current route path
  const activeTab: Tab = (() => {
    if (location.pathname.startsWith('/competitions')) return 'competitions';
    if (location.pathname.startsWith('/calendrier')) return 'calendar';
    if (location.pathname.startsWith('/course')) return 'racing';
    return 'paddock';
  })();

  // Sub-navigation config matching URL routes
  const subNavConfig: Record<Tab, { id: string; label: string; path: string }[]> = {
    paddock: [
      { id: 'brands', label: 'Marques', path: '/paddock/marques' },
      { id: 'teams', label: 'Écuries', path: '/paddock/ecuries' },
      { id: 'pilots', label: 'Pilotes', path: '/paddock/pilotes' },
    ],
    competitions: [],
    calendar: [
      { id: 'events', label: 'Événements', path: '/calendrier/evenements' },
      { id: 'circuits', label: 'Circuits', path: '/calendrier/circuits' },
    ],
    racing: [
      { id: 'entries', label: 'Engagés', path: '/course/engages' },
      { id: 'results', label: 'Classement', path: '/course/classement' },
    ],
  };

  // API Health status ping
  const { isSuccess: isApiOnline } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: () => apiClient.get<HealthResponse>('/health'),
    refetchInterval: 15000,
  });

  const navItems: { id: Tab; label: string; icon: React.ReactNode; path: string }[] = [
    { id: 'paddock', label: 'Paddock', icon: <Wrench className="w-5 h-5" />, path: '/paddock/marques' },
    { id: 'competitions', label: 'Compétitions', icon: <Trophy className="w-5 h-5" />, path: '/competitions' },
    { id: 'calendar', label: 'Calendrier', icon: <Calendar className="w-5 h-5" />, path: '/calendrier/evenements' },
    { id: 'racing', label: 'Course & Résultats', icon: <Flag className="w-5 h-5" />, path: '/course/engages' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen bg-white text-zinc-950 flex flex-col lg:flex-row relative selection:bg-racing-500 selection:text-white overflow-hidden">
      {/* Mobile Top Bar (Only visible on screens < lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-black border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src={appIcon} alt="Vrouuum Logo" className="w-9 h-9 object-contain shrink-0" />
          <h1 className="font-display font-black text-xl italic tracking-tighter text-white leading-none">
            VROUUUM
          </h1>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white"
          aria-label="Menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Lateral Navigation Sidebar (Material 3 Expressive Floating Card - AMOLED Black) */}
      <aside
        className={`fixed z-50 w-72 sm:w-80 bg-black rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.22)] p-5 sm:p-6 flex flex-col shrink-0 transition-all duration-300 ease-in-out relative overflow-y-auto
          top-3 left-3 bottom-3 h-[calc(100vh-1.5rem)]
          lg:static lg:my-4 lg:ml-4 lg:h-[calc(100vh-2rem)] lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5 px-2 pt-1 pb-1">
            <img src={appIcon} alt="Vrouuum Logo" className="w-10 h-10 object-contain shrink-0 select-none" />
            <span className="font-display font-black text-2xl tracking-tight italic text-white uppercase select-none">
              Vrouuum
            </span>
          </div>

          {/* Lateral Nav Navigation */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const subItems = subNavConfig[item.id];

              return (
                <motion.div
                  key={item.id}
                  layout="position"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  className="flex flex-col"
                >
                  <motion.button
                    layout
                    whileHover={{
                      scale: isActive ? 1 : 1.012,
                    }}
                    whileTap={{
                      scale: 0.95,
                    }}
                    transition={{ type: 'spring', stiffness: 480, damping: 28 }}
                    onClick={() => handleNavClick(item.path)}
                    className={`group relative flex items-center px-4 py-3.5 rounded-[24px] transition-colors text-left select-none cursor-pointer overflow-hidden ${
                      isActive
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    {/* Active highlight container (Pure Vibrant Pill, NO SHADOW) */}
                    {isActive && (
                      <motion.div
                        layoutId="activeSidebarTab"
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className="absolute inset-0 bg-gradient-to-r from-racing-600 via-racing-500 to-racing-scarlet rounded-[24px]"
                      />
                    )}

                    <div className="relative z-10 flex items-center gap-3.5">
                      <motion.span
                        animate={{
                          scale: isActive ? 1.08 : 1,
                          color: isActive ? '#ffffff' : '#9ca3af',
                        }}
                        transition={{ duration: 0.25 }}
                        className="shrink-0"
                      >
                        {item.icon}
                      </motion.span>

                      <div className="relative select-none h-6 flex items-center">
                        {/* Inactive state: normal-case font-sans */}
                        <motion.span
                          initial={false}
                          animate={{
                            opacity: isActive ? 0 : 1,
                            y: isActive ? -3 : 0,
                            filter: isActive ? 'blur(2px)' : 'blur(0px)',
                          }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className={`font-sans font-semibold text-sm text-zinc-400 group-hover:text-white tracking-normal whitespace-nowrap transition-colors ${
                            isActive ? 'pointer-events-none absolute left-0' : 'relative'
                          }`}
                        >
                          {item.label}
                        </motion.span>

                        {/* Active state: font-display italic font-black uppercase matching the brand title */}
                        <motion.span
                          initial={false}
                          animate={{
                            opacity: isActive ? 1 : 0,
                            y: isActive ? 0 : 3,
                            filter: isActive ? 'blur(0px)' : 'blur(2px)',
                          }}
                          transition={{ duration: 0.28, ease: 'easeOut' }}
                          className={`font-display font-black italic uppercase text-xs sm:text-[13px] tracking-tight text-white whitespace-nowrap ${
                            !isActive ? 'pointer-events-none absolute left-0' : 'relative'
                          }`}
                        >
                          {item.label}
                        </motion.span>
                      </div>
                    </div>
                  </motion.button>

                  {/* Sub-tabs displayed directly under the title of the selected button with smooth continuous accordion */}
                  <AnimatePresence initial={false}>
                    {isActive && subItems.length > 0 && (
                      <motion.div
                        key={`subnav-${item.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: 1,
                          height: 'auto',
                          transition: {
                            height: { duration: 0.28, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.2, delay: 0.04 },
                          },
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          transition: {
                            height: { duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] },
                            opacity: { duration: 0.12 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pl-12 pt-1 pb-2 flex flex-col gap-1.5">
                          {subItems.map((sub) => {
                            const isSubActive =
                              location.pathname === sub.path ||
                              location.pathname.startsWith(sub.path + '/');

                            return (
                              <motion.button
                                key={sub.id}
                                whileHover={{ x: 3 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNavClick(sub.path);
                                }}
                                className={`py-0.5 px-2 rounded-lg text-left text-xs sm:text-sm font-sans italic tracking-tight cursor-pointer select-none transition-colors ${
                                  isSubActive
                                    ? 'text-racing-400 font-extrabold translate-x-1.5'
                                    : 'text-zinc-400 hover:text-white font-medium'
                                }`}
                              >
                                <span>{sub.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/75 z-40 lg:hidden"
        />
      )}

      {/* Right Workspace Column (Fixed Top Bar + Scrollable View) */}
      <div className="flex-1 min-w-0 h-full flex flex-col pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-6 lg:pt-4 lg:pb-4 lg:pr-6 lg:pl-4 overflow-hidden">
        {/* Persistent Fixed Top Bar - Exactly aligned with lateral menu at top: 16px */}
        <header
          className="shrink-0 z-30 mb-4 px-6 py-3.5 bg-black rounded-[24px] shadow-[0_10px_35px_-5px_rgba(0,0,0,0.18)] border-none flex items-center justify-between gap-4 select-none"
        >
          {/* Breadcrumb container on the left */}
          <div
            ref={setBreadcrumbEl}
            className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-sans tracking-wide min-h-[32px]"
          />

          {/* Action buttons on the far right */}
          <div
            ref={setActionsEl}
            className="flex items-center gap-2.5 shrink-0"
          />
        </header>

        {/* Scrollable Main Content Area (Vertical only, strictly no horizontal bleed) */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pr-1">
          <ErrorBoundary>
            <PageTransition pageKey={location.pathname}>
              <Routes location={location}>
                {/* Redirect root to /paddock/marques */}
                <Route path="/" element={<Navigate to="/paddock/marques" replace />} />

                {/* Paddock Routes */}
                <Route path="/paddock" element={<Navigate to="/paddock/marques" replace />} />
                <Route path="/paddock/marques" element={<PaddockView activeTab="brands" />} />
                <Route path="/paddock/marques/:brandSlug" element={<BrandVehiclesRedirect />} />
                <Route
                  path="/paddock/marques/:brandSlug/vehicules"
                  element={<PaddockView activeTab="brands" />}
                />
                <Route path="/paddock/ecuries" element={<PaddockView activeTab="teams" />} />
                <Route path="/paddock/teams" element={<Navigate to="/paddock/ecuries" replace />} />
                <Route path="/paddock/pilotes" element={<PaddockView activeTab="pilots" />} />
                <Route path="/paddock/pilots" element={<Navigate to="/paddock/pilotes" replace />} />

                {/* Competitions Routes */}
                <Route path="/competitions" element={<CompetitionsView />} />
                <Route path="/competitions/:championshipSlug" element={<CompetitionsView />} />

                {/* Calendar Routes */}
                <Route path="/calendrier" element={<Navigate to="/calendrier/evenements" replace />} />
                <Route path="/calendrier/evenements" element={<CalendarView activeTab="events" />} />
                <Route path="/calendrier/evenements/:eventId" element={<CalendarView activeTab="events" />} />
                <Route path="/calendrier/circuits" element={<CalendarView activeTab="circuits" />} />

                {/* Racing Routes */}
                <Route path="/course" element={<Navigate to="/course/engages" replace />} />
                <Route path="/course/engages" element={<RacingView activeTab="entries" />} />
                <Route path="/course/classement" element={<RacingView activeTab="results" />} />
                <Route path="/course/resultats" element={<Navigate to="/course/classement" replace />} />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/paddock/marques" replace />} />
              </Routes>
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>

      {/* Fixed bottom-right API Status Indicator */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/95 backdrop-blur-md border border-zinc-800 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.25)] pointer-events-none select-none">
        <span
          className={`w-2 h-2 rounded-full ${
            isApiOnline ? 'bg-[#00e676] animate-pulse' : 'bg-[#ff2433]'
          }`}
        />
        <span className="text-[11px] font-sans font-medium text-zinc-300 tracking-wider uppercase">
          {isApiOnline ? 'API connectée' : 'API hors ligne'}
        </span>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <TopBarProvider>
        <AppContent />
      </TopBarProvider>
    </BrowserRouter>
  );
};
