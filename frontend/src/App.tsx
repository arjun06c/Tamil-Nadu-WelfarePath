import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Layout Shells
import { PublicLayout } from './components/layouts/PublicLayout';
import { CitizenLayout } from './components/layouts/CitizenLayout';
import { OfficerLayout } from './components/layouts/OfficerLayout';
import { AdminLayout } from './components/layouts/AdminLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SchemeDiscoveryPage } from './pages/SchemeDiscoveryPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { FaqPage } from './pages/public/FaqPage';
import { AboutPage } from './pages/public/AboutPage';

// Citizen Workspace Pages
import { CitizenDashboardPage } from './pages/citizen/CitizenDashboardPage';
import { MyEligibleSchemesPage } from './pages/citizen/MyEligibleSchemesPage';
import { ProfilePage } from './pages/ProfilePage';
import { EligibilityResultPage } from './pages/EligibilityResultPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyApplicationsPage } from './pages/citizen/MyApplicationsPage';
import { ApplicationTrackingPage } from './pages/ApplicationTrackingPage';
import { MyBenefitsPage } from './pages/citizen/MyBenefitsPage';
import { DocumentCenterPage } from './pages/citizen/DocumentCenterPage';
import { FullAssistantPage } from './pages/citizen/FullAssistantPage';
import { SavedSchemesPage } from './pages/citizen/SavedSchemesPage';
import { NotificationsPage } from './pages/citizen/NotificationsPage';
import { CitizenSettingsPage } from './pages/citizen/CitizenSettingsPage';
import { DigiLockerConnectPage } from './pages/citizen/DigiLockerConnectPage';
import { ApplicationDocumentsPage } from './pages/citizen/ApplicationDocumentsPage';
import { ApplyPage } from './pages/ApplyPage';

// Officer Workspace Pages
import { OfficerDashboardPage } from './pages/OfficerDashboardPage';
import { OfficerApplicationQueuePage } from './pages/officer/OfficerApplicationQueuePage';
import { OfficerVerificationWorkspacePage } from './pages/officer/OfficerVerificationWorkspacePage';
import { OfficerCorrectionsPage } from './pages/officer/OfficerCorrectionsPage';
import { OfficerReportsPage } from './pages/officer/OfficerReportsPage';
import { OfficerSettingsPage } from './pages/officer/OfficerSettingsPage';

// Admin Workspace Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminSchemeListPage } from './pages/admin/AdminSchemeListPage';
import { AdminSchemeEditorPage } from './pages/admin/AdminSchemeEditorPage';
import { AdminDomainManagerPage } from './pages/admin/AdminDomainManagerPage';
import { AdminRuleBuilderPage } from './pages/admin/AdminRuleBuilderPage';
import { AdminUserManagerPage } from './pages/admin/AdminUserManagerPage';
import { AdminDepartmentPage } from './pages/admin/AdminDepartmentPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminIntegrityPage } from './pages/admin/AdminIntegrityPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminDigiLockerMonitoringPage } from './pages/admin/AdminDigiLockerMonitoringPage';
import { AdminIntegrationHealthPage } from './pages/admin/AdminIntegrationHealthPage';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          
          {/* Public Website Shell */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/schemes" element={<SchemeDiscoveryPage />} />
            <Route path="/schemes/:id" element={<SchemeDetailPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/help" element={<FaqPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Citizen Workspace */}
          <Route
            path="/citizen"
            element={
              <ProtectedRoute allowedRoles={['Citizen']}>
                <CitizenLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/citizen/dashboard" replace />} />
            <Route path="dashboard" element={<CitizenDashboardPage />} />
            <Route path="eligible-schemes" element={<MyEligibleSchemesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="schemes" element={<SchemeDiscoveryPage />} />
            <Route path="schemes/:id" element={<SchemeDetailPage />} />
            <Route path="apply/:schemeId" element={<ApplyPage />} />
            <Route path="eligibility" element={<EligibilityResultPage />} />
            <Route path="portfolio" element={<Navigate to="/citizen/dashboard" replace />} />
            <Route path="applications" element={<MyApplicationsPage />} />
            <Route path="applications/:id" element={<ApplicationTrackingPage />} />
            <Route path="applications/:id/documents" element={<ApplicationDocumentsPage />} />
            <Route path="benefits" element={<MyBenefitsPage />} />
            <Route path="documents" element={<DocumentCenterPage />} />
            <Route path="assistant" element={<FullAssistantPage />} />
            <Route path="saved-schemes" element={<SavedSchemesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<CitizenSettingsPage />} />
            <Route path="settings/digilocker" element={<DigiLockerConnectPage />} />
          </Route>

          {/* Protected Officer Workspace */}
          <Route
            path="/officer"
            element={
              <ProtectedRoute allowedRoles={['Officer', 'Admin']}>
                <OfficerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/officer/dashboard" replace />} />
            <Route path="dashboard" element={<OfficerDashboardPage />} />
            <Route path="applications" element={<OfficerApplicationQueuePage />} />
            <Route path="applications/:id" element={<OfficerVerificationWorkspacePage />} />
            <Route path="verification" element={<Navigate to="/officer/applications?queue=pending" replace />} />
            <Route path="corrections" element={<OfficerCorrectionsPage />} />
            <Route path="reports" element={<OfficerReportsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<OfficerSettingsPage />} />
          </Route>

          {/* Protected Admin Control Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="schemes" element={<AdminSchemeListPage />} />
            <Route path="schemes/new" element={<AdminSchemeEditorPage />} />
            <Route path="schemes/:id/edit" element={<AdminSchemeEditorPage />} />
            <Route path="domains" element={<AdminDomainManagerPage />} />
            <Route path="rules" element={<AdminRuleBuilderPage />} />
            <Route path="applications" element={<OfficerApplicationQueuePage />} />
            <Route path="users" element={<AdminUserManagerPage />} />
            <Route path="departments" element={<AdminDepartmentPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="integrity" element={<AdminIntegrityPage />} />
            <Route path="integrations/digilocker" element={<AdminDigiLockerMonitoringPage />} />
            <Route path="integrations/health" element={<AdminIntegrationHealthPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
