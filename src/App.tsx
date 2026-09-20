import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HighphausInternalPortal from './app/page';
import LoginPage from './app/(auth)/login/page';
import RegisterPage from './app/(auth)/register/page';
import DashboardLayout from './app/dashboard/layout';
import DashboardOverviewPage from './app/dashboard/page';
import ApplicationsPage from './app/dashboard/applications/page';
import ReportsPage from './app/dashboard/reports/page';
import DevicesPage from './app/dashboard/devices/page';
import SettingsPage from './app/dashboard/settings/page';
import EmployeeDetailPage from './app/dashboard/employees/[id]/page';
import EmployeeWorkspacePage from './app/employee/page';
import EmployeeMonitoringTransparencyPage from './app/employee/monitoring/page';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HighphausInternalPortal />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Dashboard Routes with Nested Layout */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverviewPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
      </Route>

      {/* Employee Workspace Routes */}
      <Route path="/employee" element={<EmployeeWorkspacePage />} />
      <Route path="/employee/monitoring" element={<EmployeeMonitoringTransparencyPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
