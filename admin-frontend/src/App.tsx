import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './contexts/AdminAuthContext';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import StocksPage from './pages/StocksPage';
import PoliciesPage from './pages/PoliciesPage';
import PortfoliosPage from './pages/PortfoliosPage';
import OrdersPage from './pages/OrdersPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="stocks" element={<StocksPage />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="portfolios" element={<PortfoliosPage />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>
    </Routes>
  );
}
