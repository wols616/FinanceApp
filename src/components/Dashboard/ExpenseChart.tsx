import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Transaction, Category } from '../../types';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ExpenseChartProps {
  transactions: Transaction[];
  categories: Category[];
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ transactions, categories }) => {
  const currentMonth = new Date();
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);

  // Get expenses for current month grouped by category
  const monthlyExpenses = transactions
    .filter(t => 
      t.type === 'expense' && 
      isWithinInterval(new Date(t.date), { start, end })
    )
    .reduce((acc, transaction) => {
      const categoryId = transaction.category_id;
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  
  const data = {
    labels: expenseCategories
      .filter(cat => monthlyExpenses[cat.id] > 0)
      .map(cat => cat.name),
    datasets: [
      {
        data: expenseCategories
          .filter(cat => monthlyExpenses[cat.id] > 0)
          .map(cat => monthlyExpenses[cat.id]),
        backgroundColor: expenseCategories
          .filter(cat => monthlyExpenses[cat.id] > 0)
          .map(cat => cat.color),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
            }).format(context.raw);
            return `${context.label}: ${value}`;
          },
        },
      },
    },
  };

  const totalExpenses = Object.values(monthlyExpenses).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gastos por Categoría</h3>
          <p className="text-sm text-gray-500">Este mes</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              minimumFractionDigits: 0,
            }).format(totalExpenses)}
          </p>
          <p className="text-sm text-gray-500">Total gastado</p>
        </div>
      </div>

      <div className="h-64">
        {totalExpenses > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No hay gastos registrados este mes</p>
          </div>
        )}
      </div>
    </div>
  );
};