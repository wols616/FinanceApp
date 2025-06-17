import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Transaction, Category } from '../../types';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ReportsChartProps {
  transactions: Transaction[];
  categories: Category[];
  chartType: 'monthly' | 'category' | 'trend';
}

export const ReportsChart: React.FC<ReportsChartProps> = ({ transactions, categories, chartType }) => {
  const [period, setPeriod] = useState<'6months' | '12months'>('6months');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthlyData = () => {
    const months = period === '6months' ? 6 : 12;
    const endDate = new Date();
    const startDate = subMonths(endDate, months - 1);
    
    const monthsArray = eachMonthOfInterval({ start: startDate, end: endDate });
    
    const monthlyIncome = monthsArray.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      return transactions
        .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start, end }))
        .reduce((sum, t) => sum + t.amount, 0);
    });

    const monthlyExpenses = monthsArray.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      return transactions
        .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return {
      labels: monthsArray.map(month => format(month, 'MMM yyyy', { locale: es })),
      datasets: [
        {
          label: 'Ingresos',
          data: monthlyIncome,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
        },
        {
          label: 'Gastos',
          data: monthlyExpenses,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
        },
      ],
    };
  };

  const getCategoryData = () => {
    const currentMonth = new Date();
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const expensesByCategory = transactions
      .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
      .reduce((acc, transaction) => {
        const categoryId = transaction.category_id;
        acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    const expenseCategories = categories.filter(cat => cat.type === 'expense' && expensesByCategory[cat.id] > 0);

    return {
      labels: expenseCategories.map(cat => cat.name),
      datasets: [
        {
          data: expenseCategories.map(cat => expensesByCategory[cat.id]),
          backgroundColor: expenseCategories.map(cat => cat.color),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  };

  const getTrendData = () => {
    const months = period === '6months' ? 6 : 12;
    const endDate = new Date();
    const startDate = subMonths(endDate, months - 1);
    
    const monthsArray = eachMonthOfInterval({ start: startDate, end: endDate });
    
    const netIncome = monthsArray.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const income = transactions
        .filter(t => t.type === 'income' && isWithinInterval(new Date(t.date), { start, end }))
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = transactions
        .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end }))
        .reduce((sum, t) => sum + t.amount, 0);
      return income - expenses;
    });

    return {
      labels: monthsArray.map(month => format(month, 'MMM yyyy', { locale: es })),
      datasets: [
        {
          label: 'Flujo Neto',
          data: netIncome,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 16,
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (chartType === 'category') {
              return `${context.label}: ${formatCurrency(context.raw)}`;
            }
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          },
        },
        bodyFont: {
          size: window.innerWidth < 768 ? 10 : 12,
        },
        titleFont: {
          size: window.innerWidth < 768 ? 12 : 14,
        },
      },
    },
    scales: chartType !== 'category' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          },
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
      x: {
        ticks: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
          },
        },
      },
    } : undefined,
  };

  const renderChart = () => {
    switch (chartType) {
      case 'monthly':
        return <Bar data={getMonthlyData()} options={chartOptions} />;
      case 'category':
        return <Doughnut data={getCategoryData()} options={chartOptions} />;
      case 'trend':
        return <Line data={getTrendData()} options={chartOptions} />;
      default:
        return <Bar data={getMonthlyData()} options={chartOptions} />;
    }
  };

  return (
    <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">
          {chartType === 'monthly' && 'Comparación Mensual'}
          {chartType === 'category' && 'Gastos por Categoría'}
          {chartType === 'trend' && 'Tendencia de Flujo Neto'}
        </h3>
        {chartType !== 'category' && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as '6months' | '12months')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
          >
            <option value="6months">Últimos 6 meses</option>
            <option value="12months">Últimos 12 meses</option>
          </select>
        )}
      </div>
      <div className="h-64 sm:h-80 md:h-96">
        {renderChart()}
      </div>
    </div>
  );
};