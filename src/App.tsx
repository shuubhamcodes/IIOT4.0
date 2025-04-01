import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Config from './pages/config';
import Alerts from './pages/alerts';
import Maintenance from './pages/maintenance';
import Analytics from './pages/analytics';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="config" element={<Config />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="plants" element={<div>Plants page coming soon</div>} />
          <Route path="users" element={<div>Users page coming soon</div>} />
          <Route path="settings" element={<div>Settings page coming soon</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;