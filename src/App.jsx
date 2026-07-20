import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppShell from '@/components/layout/AppShell';
import ProgramHelper from './pages/ProgramHelper';
import HomeRoute from './pages/HomeRoute';
import Start from './pages/Start';
import AdminHub from './pages/AdminHub';
import More from './pages/More';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import WorkspaceSetup from './pages/WorkspaceSetup';
import HowItWorks from './pages/HowItWorks';
import Integrations from './pages/Integrations';
import Proof from './pages/Proof';
import Portfolio from './pages/Portfolio';
import PackageDetail from './pages/PackageDetail';
import Docs from './pages/Docs';
import OwnerAssistant from './pages/OwnerAssistant';
import Settings from './pages/Settings';
import FieldProofWeek1 from './pages/FieldProofWeek1';
import CommandCenter from './pages/CommandCenter';
import Cohort6Curriculum from './pages/Cohort6Curriculum';
import { Navigate } from 'react-router-dom';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/ProgramHelper" element={<ProgramHelper />} />
      <Route element={<AppShell />}>
        <Route path="/start" element={<Start />} />
        <Route path="/" element={<HomeRoute />} />
        <Route path="/Home" element={<Navigate to="/start" replace />} />
        <Route path="/admin" element={<AdminHub />} />
        <Route path="/more" element={<More />} />
        <Route path="/About" element={<About />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/WorkspaceSetup" element={<WorkspaceSetup />} />
        <Route path="/HowItWorks" element={<HowItWorks />} />
        <Route path="/Integrations" element={<Integrations />} />
        <Route path="/Settings" element={<Settings />} />
        <Route path="/Proof" element={<Proof />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/Portfolio" element={<Navigate to="/portfolio" replace />} />
        <Route path="/field-proof-week1" element={<FieldProofWeek1 />} />
        <Route path="/FieldProofWeek1" element={<Navigate to="/field-proof-week1" replace />} />
        <Route path="/Packages/:packageId" element={<PackageDetail />} />
        <Route path="/Docs" element={<Docs />} />
        <Route path="/Docs/:docId" element={<Docs />} />
        <Route path="/OwnerAssistant" element={<OwnerAssistant />} />
        <Route path="/CommandCenter" element={<CommandCenter />} />
        <Route path="/Curriculum/Cohort6" element={<Cohort6Curriculum />} />
        <Route path="/Curriculum/RCS/Cohort6" element={<Cohort6Curriculum />} />
        <Route path="/Curriculum/PV101/Cohort6" element={<Cohort6Curriculum />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
