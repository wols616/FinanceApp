import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, DollarSign } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types';

export const FinancialCalendar: React.FC = () => {
  const { transactions, categories } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTransactionsForDate = (date: Date): Transaction[] => {
    return transactions.filter(transaction => 
      isSameDay(new Date(transaction.date), date)
    );
  };

  const getDayTotal = (date: Date): { income: number; expense: number } => {
    const dayTransactions = getTransactionsForDate(date);
    return {
      income: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Sin categoría';
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendario Financiero</h2>
          <p className="text-gray-600 mt-1">Visualiza tus transacciones por fecha</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={previousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dayTotals = getDayTotal(day);
              const hasTransactions = dayTotals.income > 0 || dayTotals.expense > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 min-h-[80px] border border-gray-100 hover:bg-gray-50 transition-colors relative ${
                    isSelected ? 'bg-blue-50 border-blue-200' : ''
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="text-left">
                    <span className={`text-sm font-medium ${
                      isSameMonth(day, currentDate) ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {hasTransactions && (
                      <div className="mt-1 space-y-1">
                        {dayTotals.income > 0 && (
                          <div className="text-xs text-green-600 font-medium">
                            +{formatCurrency(dayTotals.income)}
                          </div>
                        )}
                        {dayTotals.expense > 0 && (
                          <div className="text-xs text-red-600 font-medium">
                            -{formatCurrency(dayTotals.expense)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedDate ? format(selectedDate, 'dd MMM yyyy', { locale: es }) : 'Selecciona una fecha'}
            </h3>
            {selectedDate && (
              <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedDate ? (
            <div className="space-y-4">
              {(() => {
                const dayTransactions = getTransactionsForDate(selectedDate);
                const dayTotals = getDayTotal(selectedDate);

                if (dayTransactions.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No hay transacciones en esta fecha</p>
                      <button className="mt-2 text-blue-600 hover:text-blue-700 font-medium">
                        Agregar transacción
                      </button>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Day Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Ingresos</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(dayTotals.income)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Gastos</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(dayTotals.expense)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Balance</span>
                          <span className={`font-bold ${
                            dayTotals.income - dayTotals.expense >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(dayTotals.income - dayTotals.expense)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transactions List */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Transacciones</h4>
                      {dayTransactions.map(transaction => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{getCategoryName(transaction.category_id)}</p>
                          </div>
                          <span className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <p>Selecciona una fecha para ver los detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};