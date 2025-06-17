import React, { useState } from 'react';
import { Plus, Filter, Download, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import { TransactionForm } from '../components/Forms/TransactionForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TransactionsProps {
  type: 'income' | 'expense';
}

export const Transactions: React.FC<TransactionsProps> = ({ type }) => {
  const { transactions, categories, accounts, updateTransaction, deleteTransaction } = useFinance();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    category_id: '',
    description: '',
    date: '',
    account_id: '',
  });

  const filteredTransactions = transactions
    .filter(t => t.type === type)
    .filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categories.find(cat => cat.id === t.category_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(t => selectedCategory === '' || t.category_id === selectedCategory);

  const filteredCategories = categories.filter(cat => cat.type === type);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Sin categoría';
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.color || '#6B7280';
  };

  const getAccountName = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId)?.name || 'Sin cuenta';
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      amount: transaction.amount.toString(),
      category_id: transaction.category_id,
      description: transaction.description,
      date: transaction.date,
      account_id: transaction.account_id || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      await updateTransaction(editingTransaction.id, {
        amount: parseFloat(editFormData.amount),
        category_id: editFormData.category_id,
        description: editFormData.description,
        date: editFormData.date,
        account_id: editFormData.account_id,
      });
      
      setEditingTransaction(null);
      setEditFormData({
        amount: '',
        category_id: '',
        description: '',
        date: '',
        account_id: '',
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error al actualizar la transacción');
    }
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditFormData({
      amount: '',
      category_id: '',
      description: '',
      date: '',
      account_id: '',
    });
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      try {
        await deleteTransaction(transactionId);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error al eliminar la transacción');
      }
    }
  };

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {type === 'income' ? 'Ingresos' : 'Gastos'}
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Total: <span className={`font-semibold text-lg ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalAmount)}
            </span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm md:text-base">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className={`flex items-center gap-2 px-3 p-2 rounded-lg text-white font-medium transition-colors text-sm md:text-base ${
              type === 'income' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Agregar {type === 'income' ? 'Ingreso' : 'Gasto'}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas las categorías</option>
            {filteredCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <button className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Más filtros</span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            Transacciones ({filteredTransactions.length})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200 overflow-y-auto max-h-[calc(100vh-300px)]">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                {editingTransaction?.id === transaction.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                        <input
                          type="number"
                          value={editFormData.amount}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select
                          value={editFormData.category_id}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, category_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {filteredCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
                        <select
                          value={editFormData.account_id}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, account_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                          type="date"
                          value={editFormData.date}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <input
                        type="text"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${getCategoryColor(transaction.category_id)}20` }}
                      >
                        <div 
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                          style={{ backgroundColor: getCategoryColor(transaction.category_id) }}
                        ></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{transaction.description}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm text-gray-500">
                          <span>{getCategoryName(transaction.category_id)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{getAccountName(transaction.account_id || '')}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className={`text-base sm:text-lg font-bold ${
                          type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-6 md:p-8 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                {type === 'income' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay {type === 'income' ? 'ingresos' : 'gastos'} registrados
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-4">Comienza agregando tu primer {type === 'income' ? 'ingreso' : 'gasto'} para llevar el control de tus finanzas.</p>
              <button
                onClick={() => setIsFormOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  type === 'income' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Agregar {type === 'income' ? 'Ingreso' : 'Gasto'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        type={type}
      />
    </div>
  );
};