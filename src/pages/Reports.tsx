import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ReportsChart } from '../components/Reports/ReportsChart';
import { BarChart3, PieChart, TrendingUp, Download, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export const Reports: React.FC = () => {
  const { transactions, categories } = useFinance();
  const [selectedChart, setSelectedChart] = useState<'monthly' | 'category' | 'trend'>('monthly');
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous' | 'year'>('current');

  const chartTypes = [
    { id: 'monthly', label: 'Comparación Mensual', icon: BarChart3 },
    { id: 'category', label: 'Por Categoría', icon: PieChart },
    { id: 'trend', label: 'Tendencias', icon: TrendingUp }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentPeriodData = () => {
    const currentDate = new Date();
    let start: Date, end: Date;

    switch (selectedPeriod) {
      case 'current':
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      case 'previous':
        const previousMonth = subMonths(currentDate, 1);
        start = startOfMonth(previousMonth);
        end = endOfMonth(previousMonth);
        break;
      case 'year':
        start = new Date(currentDate.getFullYear(), 0, 1);
        end = new Date(currentDate.getFullYear(), 11, 31);
        break;
      default:
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
    }

    const periodTransactions = transactions.filter(t =>
      isWithinInterval(new Date(t.date), { start, end })
    );

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, net: income - expenses, transactions: periodTransactions };
  };

  const getTopCategories = () => {
    const { transactions: periodTransactions } = getCurrentPeriodData();
    
    const categoryTotals = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const categoryId = transaction.category_id;
        acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => ({
        category: categories.find(cat => cat.id === categoryId)?.name || 'Sin categoría',
        amount,
        color: categories.find(cat => cat.id === categoryId)?.color || '#6B7280'
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const exportReport = () => {
    const data = getCurrentPeriodData();
    const reportData = {
      period: selectedPeriod,
      summary: {
        income: data.income,
        expenses: data.expenses,
        net: data.net
      },
      transactions: data.transactions,
      topCategories: getTopCategories(),
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-financiero-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
  };

  const periodData = getCurrentPeriodData();
  const topCategories = getTopCategories();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Estadísticas</h1>
          <p className="text-gray-600 mt-1">Analiza tus patrones financieros y tendencias</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="current">Mes Actual</option>
            <option value="previous">Mes Anterior</option>
            <option value="year">Año Actual</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(periodData.income)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gastos</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(periodData.expenses)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600 rotate-180" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Balance Neto</p>
              <p className={`text-2xl font-bold ${periodData.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(periodData.net)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${periodData.net >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Calendar className={`w-6 h-6 ${periodData.net >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          {chartTypes.map(chart => {
            const Icon = chart.icon;
            return (
              <button
                key={chart.id}
                onClick={() => setSelectedChart(chart.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedChart === chart.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{chart.label}</span>
              </button>
            );
          })}
        </div>

        <ReportsChart
          transactions={transactions}
          categories={categories}
          chartType={selectedChart}
        />
      </div>

      {/* Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorías con Más Gastos</h3>
          <div className="space-y-4">
            {topCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="font-medium text-gray-900">{category.category}</span>
                </div>
                <span className="font-semibold text-gray-900">{formatCurrency(category.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Período</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total de Transacciones</span>
              <span className="font-semibold text-gray-900">{periodData.transactions.length}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Promedio de Gastos</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(periodData.expenses / Math.max(periodData.transactions.filter(t => t.type === 'expense').length, 1))}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Tasa de Ahorro</span>
              <span className={`font-semibold ${periodData.income > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {periodData.income > 0 ? ((periodData.net / periodData.income) * 100).toFixed(1) : '0'}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Categorías Activas</span>
              <span className="font-semibold text-gray-900">{topCategories.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};