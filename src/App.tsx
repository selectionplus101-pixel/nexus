import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layouts
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Dashboard Pages
import { EntrepreneurDashboard } from './pages/dashboard/EntrepreneurDashboard';
import { InvestorDashboard } from './pages/dashboard/InvestorDashboard';

// Profile Pages
import { EntrepreneurProfile } from './pages/profile/EntrepreneurProfile';
import { InvestorProfile } from './pages/profile/InvestorProfile';

// Feature Pages
import { InvestorsPage } from './pages/investors/InvestorsPage';
import { EntrepreneursPage } from './pages/entrepreneurs/EntrepreneursPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { MeetingsPage } from './pages/meetings/MeetingsPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { HelpPage } from './pages/help/HelpPage';
import { DealsPage } from './pages/deals/DealsPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';

// Chat Pages
import { ChatPage } from './pages/chat/ChatPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="entrepreneur" element={<EntrepreneurDashboard />} />
            <Route path="investor" element={<InvestorDashboard />} />
          </Route>

          {/* Profile Routes */}
          <Route path="/profile" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="entrepreneur/:id" element={<EntrepreneurProfile />} />
            <Route path="investor/:id" element={<InvestorProfile />} />
          </Route>

          {/* Feature Routes */}
          <Route path="/investors" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<InvestorsPage />} />
          </Route>

          <Route path="/entrepreneurs" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<EntrepreneursPage />} />
          </Route>

          <Route path="/messages" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<MessagesPage />} />
          </Route>

          <Route path="/meetings" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<MeetingsPage />} />
          </Route>

          <Route path="/notifications" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<NotificationsPage />} />
          </Route>

          <Route path="/documents" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DocumentsPage />} />
          </Route>

          <Route path="/settings" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<SettingsPage />} />
          </Route>

          <Route path="/help" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<HelpPage />} />
          </Route>

          <Route path="/deals" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DealsPage />} />
          </Route>

          <Route path="/payments" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<PaymentsPage />} />
          </Route>

          {/* Chat Routes */}
          <Route path="/chat" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<ChatPage />} />
            <Route path=":userId" element={<ChatPage />} />
          </Route>
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all other routes and redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;