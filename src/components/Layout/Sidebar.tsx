import React from 'react';
import {
  Home,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target,
  Calendar,
  CreditCard,
  Tag,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'income', label: 'Ingresos', icon: TrendingUp },
  { id: 'expenses', label: 'Gastos', icon: TrendingDown },
  { id: 'reports', label: 'Reportes', icon: PieChart },
  { id: 'budgets', label: 'Presupuestos', icon: Target },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'accounts', label: 'Cuentas', icon: CreditCard },
  { id: 'categories', label: 'Categorías', icon: Tag },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  sidebarOpen,
  setSidebarOpen
}) => {
  const { profile } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white shadow-lg flex flex-col z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:shadow-none
        `}
      >
        {/* Logo and close button */}
        <div className="p-4 lg:p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FinanceApp</h1>
              <p className="text-sm text-gray-500">Tu gestor financiero</p>
            </div>
          </div>
          <button 
            className="lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* User profile */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img 
              src={profile?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1'} 
              alt={profile?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
              <p className="text-xs text-gray-500">Moneda: {profile?.currency || 'MXN'}</p>
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <nav className="flex-1 px-2 py-4 lg:px-4 lg:py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors
                  ${activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 lg:border-r-2 lg:border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};