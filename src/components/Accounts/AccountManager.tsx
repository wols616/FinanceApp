import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Plus, Edit2, Trash2, CreditCard, Wallet, PiggyBank, Banknote, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Account } from '../../types';

export const AccountManager: React.FC = () => {
  const { accounts, updateAccount, deleteAccount, transactions, categories } = useFinance();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as 'checking' | 'savings' | 'credit' | 'cash',
    balance: '',
    color: '#3B82F6'
  });

  const accountTypes = [
    { value: 'checking', label: 'Cuenta Corriente', icon: CreditCard },
    { value: 'savings', label: 'Ahorros', icon: PiggyBank },
    { value: 'credit', label: 'Tarjeta de Crédito', icon: CreditCard },
    { value: 'cash', label: 'Efectivo', icon: Banknote }
  ];

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAccountIcon = (type: string) => {
    const iconMap = {
      checking: CreditCard,
      savings: PiggyBank,
      credit: CreditCard,
      cash: Banknote
    };
    return iconMap[type as keyof typeof iconMap] || CreditCard;
  };

  const getAccountTransactions = (accountId: string) => {
    return transactions.filter(t => t.account_id === accountId).slice(0, 5);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.balance) return;

    const accountData: Account = {
      id: editingAccount?.id || 'new', // Use 'new' as placeholder for new accounts
      name: formData.name,
      type: formData.type,
      balance: parseFloat(formData.balance),
      color: formData.color
    };

    updateAccount(accountData);
    
    setFormData({ name: '', type: 'checking', balance: '', color: '#3B82F6' });
    setEditingAccount(null);
    setIsFormOpen(false);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      color: account.color
    });
    setIsFormOpen(true);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Sin categoría';
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Cuentas</h2>
          <p className="text-gray-600 mt-1">
            Balance total: <span className="font-semibold text-lg">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cuenta</span>
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const Icon = getAccountIcon(account.type);
          const accountTransactions = getAccountTransactions(account.id);
          const typeLabel = accountTypes.find(t => t.value === account.type)?.label || account.type;

          return (
            <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Account Header */}
              <div 
                className="p-6 text-white"
                style={{ backgroundColor: account.color }}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-8 h-8" />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-1 text-white/80 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAccount(account.id)}
                      className="p-1 text-white/80 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{account.name}</h3>
                  <p className="text-white/80 text-sm">{typeLabel}</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(account.balance)}</p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Transacciones Recientes</h4>
                {accountTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {accountTransactions.map(transaction => (
                      <div key={transaction.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded ${
                            transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500">{getCategoryName(transaction.category_id)}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay transacciones recientes</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cuentas registradas</h3>
          <p className="text-gray-500 mb-4">
            Agrega tu primera cuenta para comenzar a gestionar tus finanzas.
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Cuenta</span>
          </button>
        </div>
      )}

      {/* Account Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
              </h2>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingAccount(null);
                  setFormData({ name: '', type: 'checking', balance: '', color: '#3B82F6' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-500 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Cuenta
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej. Cuenta Principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cuenta
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Inicial
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                    step="0.01"
                    required
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex space-x-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingAccount(null);
                    setFormData({ name: '', type: 'checking', balance: '', color: '#3B82F6' });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingAccount ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};