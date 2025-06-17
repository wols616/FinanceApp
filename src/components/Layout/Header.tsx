import React, { useState } from 'react';
import { Search, LogOut, Menu } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HeaderProps {
  title: string;
  setSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, setSidebarOpen }) => {
  const { searchTransactions, categories } = useFinance();
  const { profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchTransactions(query);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Sin categoría';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 md:px-6 md:py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            className="mr-4 lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Bienvenido, {profile?.name || 'Usuario'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40 md:w-64"
            />
            
            {/* Search Results */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {searchResults.slice(0, 5).map(transaction => (
                  <div key={transaction.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {getCategoryName(transaction.category_id)} • {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <span className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                ))}
                {searchResults.length > 5 && (
                  <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                    Y {searchResults.length - 5} resultados más...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile search icon */}
          <button className="sm:hidden p-2 text-gray-500 hover:text-gray-700">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <NotificationCenter />

          {/* User Menu */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <img 
              src={profile?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1'} 
              alt={profile?.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <button
              onClick={signOut}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};