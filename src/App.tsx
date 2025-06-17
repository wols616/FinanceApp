import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Reports } from './pages/Reports';
import { BudgetManager } from './components/Budget/BudgetManager';
import { FinancialCalendar } from './components/Calendar/FinancialCalendar';
import { AccountManager } from './components/Accounts/AccountManager';
import { CategoryManager } from './components/Categories/CategoryManager';
import { UserSettings } from './components/Settings/UserSettings';

const getPageTitle = (activeTab: string) => {
  switch (activeTab) {
    case 'dashboard':
      return 'Dashboard';
    case 'income':
      return 'Ingresos';
    case 'expenses':
      return 'Gastos';
    case 'reports':
      return 'Reportes';
    case 'budgets':
      return 'Presupuestos';
    case 'calendar':
      return 'Calendario';
    case 'accounts':
      return 'Cuentas';
    case 'categories':
      return 'Categorías';
    case 'settings':
      return 'Configuración';
    default:
      return 'Dashboard';
  }
};

const renderPage = (activeTab: string, onNavigate: (tab: string) => void) => {
  switch (activeTab) {
    case 'dashboard':
      return <Dashboard onNavigate={onNavigate} />;
    case 'income':
      return <Transactions type="income" />;
    case 'expenses':
      return <Transactions type="expense" />;
    case 'reports':
      return <Reports />;
    case 'budgets':
      return <BudgetManager />;
    case 'calendar':
      return <FinancialCalendar />;
    case 'accounts':
      return <AccountManager />;
    case 'categories':
      return <CategoryManager />;
    case 'settings':
      return <UserSettings />;
    default:
      return <Dashboard onNavigate={onNavigate} />;
  }
};

function App() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isLoading ? (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando...</p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginForm />} />
            <Route
              path="/dashboard"
              element={
                user ? (
                  <div className="flex flex-col lg:flex-row min-h-screen">
                    <Sidebar 
                      activeTab={activeTab} 
                      setActiveTab={setActiveTab} 
                      sidebarOpen={sidebarOpen}
                      setSidebarOpen={setSidebarOpen}
                    />
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Header 
                        title={getPageTitle(activeTab)} 
                        setSidebarOpen={setSidebarOpen}
                      />
                      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
                        {renderPage(activeTab, setActiveTab)}
                      </main>
                    </div>
                  </div>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;