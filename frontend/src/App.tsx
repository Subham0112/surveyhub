import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { RequireAdmin, RequireAuth } from './components/ProtectedRoute';
import { AdminSurveysPage } from './pages/AdminSurveysPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { SurveyBuilderPage } from './pages/SurveyBuilderPage';
import { SurveyPage } from './pages/SurveyPage';
import { useAuth } from './context/auth';

function SessionLoadingPage() {
  return (
    <div className="grid min-h-svh place-items-center bg-paper px-6">
      <div className="flex flex-col items-center gap-5">
        <span className="grid h-10 w-10 place-items-center border border-ink bg-ink font-mono text-[11px] tracking-[0.08em] text-paper">
          SH
        </span>
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-accent" />
          <span className="mono-label">Loading Survey Hub</span>
        </div>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const { loading } = useAuth();

  if (loading) return <SessionLoadingPage />;

  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route element={<AppShell />}>
        <Route
          index
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="history"
          element={
            <RequireAuth>
              <HistoryPage />
            </RequireAuth>
          }
        />
        <Route
          path="s/:id"
          element={
            <RequireAuth>
              <SurveyPage />
            </RequireAuth>
          }
        />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminSurveysPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/surveys/new"
          element={
            <RequireAdmin>
              <SurveyBuilderPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/surveys/:id/edit"
          element={
            <RequireAdmin>
              <SurveyBuilderPage />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/surveys/:id/analytics"
          element={
            <RequireAdmin>
              <AnalyticsPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      </Routes>
    </>
  );
}

export default App;
