import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RecentTransactions } from '../components/Dashboard/RecentTransactions';
import { ExpenseChart } from '../components/Dashboard/ExpenseChart';
import { BudgetProgress } from '../components/Dashboard/BudgetProgress';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { 
    transactions, 
    categories, 
    budgets,
    getMonthlyIncome, 
    getMonthlyExpenses, 
    getCurrentBalance 
  } = useFinance();

  const monthlyIncome = getMonthlyIncome();
  const monthlyExpenses = getMonthlyExpenses();
  const currentBalance = getCurrentBalance();
  const netIncome = monthlyIncome - monthlyExpenses;

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const budgetUsagePercentage = totalBudget > 0 ? (monthlyExpenses / totalBudget) * 100 : 0;

  const handleCreateBudget = () => {
    if (onNavigate) {
      onNavigate('budgets');
    }
  };

  const handleAddIncome = () => {
    if (onNavigate) {
      onNavigate('income');
    }
  };

  const handleAddExpense = () => {
    if (onNavigate) {
      onNavigate('expenses');
    }
  };

  const handleViewReports = () => {
    if (onNavigate) {
      onNavigate('reports');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Saldo Actual"
          value={currentBalance}
          icon={DollarSign}
          color="text-blue-600"
          bgColor="bg-blue-100"
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatsCard
          title="Ingresos del Mes"
          value={monthlyIncome}
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-green-100"
          trend={{ value: 8.1, isPositive: true }}
        />
        <StatsCard
          title="Gastos del Mes"
          value={monthlyExpenses}
          icon={TrendingDown}
          color="text-red-600"
          bgColor="bg-red-100"
          trend={{ value: 2.3, isPositive: false }}
        />
        <StatsCard
          title="Presupuesto Utilizado"
          value={`${budgetUsagePercentage.toFixed(1)}%`}
          icon={PieChart}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Charts and Recent Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <div className="min-h-[300px]">
          <ExpenseChart transactions={transactions} categories={categories} />
        </div>
        <div className="min-h-[300px]">
          <RecentTransactions transactions={transactions} categories={categories} />
        </div>
      </div>

      {/* Budget Progress and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <BudgetProgress 
            budgets={budgets} 
            categories={categories} 
            onCreateBudget={handleCreateBudget}
          />
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Acciones Rápidas</h3>
          <div className="space-y-2 sm:space-y-3">
            <button 
              onClick={handleAddIncome}
              className="w-full text-left p-2 sm:p-3 hover:bg-green-50 rounded-md sm:rounded-lg transition-colors border border-green-200"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-md sm:rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-gray-900">Agregar Ingreso</p>
                  <p className="text-xs sm:text-sm text-gray-500">Registra un nuevo ingreso</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleAddExpense}
              className="w-full text-left p-2 sm:p-3 hover:bg-red-50 rounded-md sm:rounded-lg transition-colors border border-red-200"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-md sm:rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-gray-900">Agregar Gasto</p>
                  <p className="text-xs sm:text-sm text-gray-500">Registra un nuevo gasto</p>
                </div>
              </div>
            </button>
            
            <button 
              onClick={handleViewReports}
              className="w-full text-left p-2 sm:p-3 hover:bg-blue-50 rounded-md sm:rounded-lg transition-colors border border-blue-200"
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-md sm:rounded-lg flex items-center justify-center">
                  <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base text-gray-900">Ver Reportes</p>
                  <p className="text-xs sm:text-sm text-gray-500">Analiza tus finanzas</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};