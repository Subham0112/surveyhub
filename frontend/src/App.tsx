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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
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
