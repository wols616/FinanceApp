import React from 'react';
import { Budget, Category } from '../../types';
import { useFinance } from '../../context/FinanceContext';

interface BudgetProgressProps {
  budgets: Budget[];
  categories: Category[];
  onCreateBudget?: () => void;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({ budgets, categories, onCreateBudget }) => {
  const { getCategoryExpenses } = useFinance();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Progreso de Presupuestos</h3>
        <button 
          onClick={onCreateBudget}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Gestionar
        </button>
      </div>

      <div className="space-y-4">
        {budgets.map((budget) => {
          const category = categories.find(cat => cat.id === budget.category_id);
          const spent = getCategoryExpenses(budget.category_id);
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
          const isOverBudget = spent > budget.amount;

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category?.color || '#6B7280' }}
                  ></div>
                  <span className="font-medium text-gray-900">{category?.name}</span>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(spent)}
                  </span>
                  <span className="text-gray-500 text-sm"> / {formatCurrency(budget.amount)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                  {percentage.toFixed(1)}% utilizado
                </span>
                {isOverBudget && (
                  <span className="text-red-600 font-medium">
                    Excedido por {formatCurrency(spent - budget.amount)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No hay presupuestos configurados</p>
            <button 
              onClick={onCreateBudget}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Crear primer presupuesto
            </button>
          </div>
        )}
      </div>
    </div>
  );
};