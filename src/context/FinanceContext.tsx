import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, shouldUseMockData } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Transaction, Category, Budget, Account, FinancialGoal } from '../types';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  accounts: Account[];
  goals: FinancialGoal[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getMonthlyIncome: (date?: Date) => number;
  getMonthlyExpenses: (date?: Date) => number;
  getCurrentBalance: () => number;
  getCategoryExpenses: (categoryId: string, date?: Date) => number;
  searchTransactions: (query: string) => Transaction[];
  sendBudgetAlert: (categoryName: string, spent: number, budget: number) => Promise<void>;
  isLoading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

const defaultCategories: Category[] = [
  { id: '1', name: 'Salario', type: 'income', color: '#10B981', icon: 'Briefcase' },
  { id: '2', name: 'Inversiones', type: 'income', color: '#3B82F6', icon: 'TrendingUp' },
  { id: '3', name: 'Freelance', type: 'income', color: '#8B5CF6', icon: 'Monitor' },
  { id: '4', name: 'Alimentación', type: 'expense', color: '#F59E0B', icon: 'Utensils' },
  { id: '5', name: 'Transporte', type: 'expense', color: '#EF4444', icon: 'Car' },
  { id: '6', name: 'Vivienda', type: 'expense', color: '#6B7280', icon: 'Home' },
  { id: '7', name: 'Entretenimiento', type: 'expense', color: '#EC4899', icon: 'Film' },
  { id: '8', name: 'Salud', type: 'expense', color: '#14B8A6', icon: 'Heart' },
  { id: '9', name: 'Educación', type: 'expense', color: '#6366F1', icon: 'BookOpen' },
];

const defaultAccounts: Account[] = [
  { id: '1', name: 'Cuenta Corriente', type: 'checking', balance: 5000, color: '#3B82F6' },
  { id: '2', name: 'Ahorros', type: 'savings', balance: 15000, color: '#10B981' },
  { id: '3', name: 'Efectivo', type: 'cash', balance: 500, color: '#F59E0B' },
];

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(defaultAccounts);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      // Clear data when user logs out
      setTransactions([]);
      setCategories(defaultCategories);
      setBudgets([]);
      setAccounts(defaultAccounts);
      setGoals([]);
    }
  }, [user]);

  // Check for budget alerts when transactions or budgets change
  useEffect(() => {
    if (user && transactions.length > 0 && budgets.length > 0) {
      checkBudgetAlerts();
    }
  }, [transactions, budgets, user]);

  const loadData = async () => {
    if (shouldUseMockData()) {
      // Load from localStorage for demo mode
      const storedTransactions = localStorage.getItem('transactions');
      const storedBudgets = localStorage.getItem('budgets');
      const storedAccounts = localStorage.getItem('accounts');
      const storedCategories = localStorage.getItem('categories');
      const storedGoals = localStorage.getItem('goals');

      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        // Set default categories and save them
        setCategories(defaultCategories);
        localStorage.setItem('categories', JSON.stringify(defaultCategories));
      }

      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      } else {
        // Add some demo data
        const demoTransactions: Transaction[] = [
          {
            id: '1',
            type: 'income',
            amount: 3000,
            category_id: '1',
            description: 'Salario mensual',
            date: format(new Date(), 'yyyy-MM-dd'),
            account_id: '1'
          },
          {
            id: '2',
            type: 'expense',
            amount: 800,
            category_id: '6',
            description: 'Renta',
            date: format(new Date(), 'yyyy-MM-dd'),
            account_id: '1'
          },
          {
            id: '3',
            type: 'expense',
            amount: 150,
            category_id: '4',
            description: 'Supermercado',
            date: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'),
            account_id: '1'
          }
        ];
        setTransactions(demoTransactions);
        localStorage.setItem('transactions', JSON.stringify(demoTransactions));
      }

      if (storedBudgets) {
        setBudgets(JSON.parse(storedBudgets));
      } else {
        const demoBudgets: Budget[] = [
          { id: '1', category_id: '4', amount: 400, spent: 150, period: 'monthly' },
          { id: '2', category_id: '5', amount: 200, spent: 0, period: 'monthly' },
          { id: '3', category_id: '7', amount: 300, spent: 0, period: 'monthly' },
        ];
        setBudgets(demoBudgets);
        localStorage.setItem('budgets', JSON.stringify(demoBudgets));
      }

      if (storedAccounts) {
        setAccounts(JSON.parse(storedAccounts));
      } else {
        setAccounts(defaultAccounts);
        localStorage.setItem('accounts', JSON.stringify(defaultAccounts));
      }

      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      }
      return;
    }

    // Load from Supabase
    setIsLoading(true);
    try {
      const [categoriesRes, accountsRes, transactionsRes, budgetsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user!.id),
        supabase.from('accounts').select('*').eq('user_id', user!.id),
        supabase.from('transactions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user!.id)
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (accountsRes.data) setAccounts(accountsRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
      if (budgetsRes.data) setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBudgetAlerts = async () => {
    const notificationPrefs = JSON.parse(localStorage.getItem('notificationPreferences') || '{"budgetAlerts": true}');
    
    if (!notificationPrefs.budgetAlerts) return;

    for (const budget of budgets) {
      const spent = getCategoryExpenses(budget.category_id);
      const category = categories.find(cat => cat.id === budget.category_id);
      
      if (spent > budget.amount && category) {
        // Check if we've already sent an alert for this budget this month
        const alertKey = `budget_alert_${budget.id}_${format(new Date(), 'yyyy-MM')}`;
        const alreadySent = localStorage.getItem(alertKey);
        
        if (!alreadySent) {
          await sendBudgetAlert(category.name, spent, budget.amount);
          localStorage.setItem(alertKey, 'true');
        }
      }
    }
  };

  const sendBudgetAlert = async (categoryName: string, spent: number, budget: number) => {
    try {
      if (shouldUseMockData()) {
        console.log(`Budget alert: ${categoryName} exceeded by ${spent - budget}`);
        return;
      }

      const emailData = {
        to: user?.email || '',
        subject: `⚠️ Presupuesto Excedido - ${categoryName}`,
        html: `
          <h2>¡Alerta de Presupuesto!</h2>
          <p>Hola ${profile?.name},</p>
          <p>Has excedido el presupuesto para la categoría <strong>${categoryName}</strong>.</p>
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Presupuesto:</strong> $${budget.toFixed(2)}</p>
            <p><strong>Gastado:</strong> $${spent.toFixed(2)}</p>
            <p><strong>Excedido por:</strong> $${(spent - budget).toFixed(2)}</p>
          </div>
          <p>Te recomendamos revisar tus gastos y ajustar tu presupuesto si es necesario.</p>
          <p>Saludos,<br>El equipo de FinanceApp</p>
        `,
        type: 'budget_alert'
      };

      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });
    } catch (error) {
      console.error('Error sending budget alert:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (shouldUseMockData()) {
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
      };
      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([{ 
        ...transaction, 
        user_id: user!.id,
      }])
      .select()
      .single();

    if (!error && data) {
      setTransactions(prev => [data, ...prev]);
    }
  };

  const updateTransaction = async (id: string, updatedTransaction: Partial<Transaction>) => {
    if (shouldUseMockData()) {
      const updatedTransactions = transactions.map(transaction =>
        transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
      );
      setTransactions(updatedTransactions);
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .update(updatedTransaction)
      .eq('id', id)
      .eq('user_id', user!.id);

    if (!error) {
      setTransactions(prev =>
        prev.map(transaction =>
          transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
        )
      );
    }
  };

  const deleteTransaction = async (id: string) => {
    if (shouldUseMockData()) {
      const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
      setTransactions(updatedTransactions);
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);

    if (!error) {
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (shouldUseMockData()) {
      const newCategory: Category = {
        ...category,
        id: Date.now().toString(),
      };
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      return;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...category, user_id: user!.id }])
      .select()
      .single();

    if (!error && data) {
      setCategories(prev => [...prev, data]);
    }
  };

  const updateCategory = async (id: string, updatedCategory: Partial<Category>) => {
    if (shouldUseMockData()) {
      const updatedCategories = categories.map(category =>
        category.id === id ? { ...category, ...updatedCategory } : category
      );
      setCategories(updatedCategories);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      return;
    }

    const { error } = await supabase
      .from('categories')
      .update(updatedCategory)
      .eq('id', id)
      .eq('user_id', user!.id);

    if (!error) {
      setCategories(prev =>
        prev.map(category =>
          category.id === id ? { ...category, ...updatedCategory } : category
        )
      );
    }
  };

  const deleteCategory = async (id: string) => {
    if (shouldUseMockData()) {
      const updatedCategories = categories.filter(category => category.id !== id);
      setCategories(updatedCategories);
      localStorage.setItem('categories', JSON.stringify(updatedCategories));
      return;
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);

    if (!error) {
      setCategories(prev => prev.filter(category => category.id !== id));
    }
  };

  const updateBudget = async (budget: Budget) => {
    if (shouldUseMockData()) {
      const updatedBudgets = budgets.find(b => b.id === budget.id)
        ? budgets.map(b => b.id === budget.id ? budget : b)
        : [...budgets, { ...budget, id: Date.now().toString() }];
      setBudgets(updatedBudgets);
      localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      return;
    }

    // For Supabase, handle new vs existing budgets
    if (budget.id === 'new') {
      // Insert new budget
      const { data, error } = await supabase
        .from('budgets')
        .insert([{ 
          category_id: budget.category_id,
          amount: budget.amount,
          period: budget.period,
          user_id: user!.id
        }])
        .select()
        .single();

      if (!error && data) {
        setBudgets(prev => [...prev, data]);
      }
    } else {
      // Update existing budget
      const { data, error } = await supabase
        .from('budgets')
        .update({ 
          category_id: budget.category_id,
          amount: budget.amount,
          period: budget.period
        })
        .eq('id', budget.id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (!error && data) {
        setBudgets(prev => prev.map(b => b.id === budget.id ? data : b));
      }
    }
  };

  const deleteBudget = async (id: string) => {
    if (shouldUseMockData()) {
      const updatedBudgets = budgets.filter(budget => budget.id !== id);
      setBudgets(updatedBudgets);
      localStorage.setItem('budgets', JSON.stringify(updatedBudgets));
      return;
    }

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);

    if (!error) {
      setBudgets(prev => prev.filter(budget => budget.id !== id));
    }
  };

  const updateAccount = async (account: Account) => {
    if (shouldUseMockData()) {
      const updatedAccounts = accounts.find(a => a.id === account.id)
        ? accounts.map(a => a.id === account.id ? account : a)
        : [...accounts, { ...account, id: Date.now().toString() }];
      setAccounts(updatedAccounts);
      localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
      return;
    }

    // For Supabase, handle new vs existing accounts
    if (account.id === 'new') {
      // Insert new account
      const { data, error } = await supabase
        .from('accounts')
        .insert([{ 
          name: account.name,
          type: account.type,
          balance: account.balance,
          color: account.color,
          user_id: user!.id
        }])
        .select()
        .single();

      if (!error && data) {
        setAccounts(prev => [...prev, data]);
      }
    } else {
      // Update existing account
      const { data, error } = await supabase
        .from('accounts')
        .update({ 
          name: account.name,
          type: account.type,
          balance: account.balance,
          color: account.color
        })
        .eq('id', account.id)
        .eq('user_id', user!.id)
        .select()
        .single();

      if (!error && data) {
        setAccounts(prev => prev.map(a => a.id === account.id ? data : a));
      }
    }
  };

  const deleteAccount = async (id: string) => {
    if (shouldUseMockData()) {
      const updatedAccounts = accounts.filter(account => account.id !== id);
      setAccounts(updatedAccounts);
      localStorage.setItem('accounts', JSON.stringify(updatedAccounts));
      return;
    }

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);

    if (!error) {
      setAccounts(prev => prev.filter(account => account.id !== id));
    }
  };

  const getMonthlyIncome = (date: Date = new Date()) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    return transactions
      .filter(transaction => 
        transaction.type === 'income' &&
        isWithinInterval(new Date(transaction.date), { start, end })
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getMonthlyExpenses = (date: Date = new Date()) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    return transactions
      .filter(transaction => 
        transaction.type === 'expense' &&
        isWithinInterval(new Date(transaction.date), { start, end })
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getCurrentBalance = () => {
    return accounts.reduce((sum, account) => sum + account.balance, 0);
  };

  const getCategoryExpenses = (categoryId: string, date: Date = new Date()) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    return transactions
      .filter(transaction => 
        transaction.type === 'expense' &&
        transaction.category_id === categoryId &&
        isWithinInterval(new Date(transaction.date), { start, end })
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const searchTransactions = (query: string): Transaction[] => {
    if (!query.trim()) return transactions;
    
    const lowercaseQuery = query.toLowerCase();
    return transactions.filter(transaction => 
      transaction.description.toLowerCase().includes(lowercaseQuery) ||
      categories.find(cat => cat.id === transaction.category_id)?.name.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Save to localStorage when data changes (for demo mode)
  useEffect(() => {
    if (shouldUseMockData() && categories.length > 0) {
      localStorage.setItem('categories', JSON.stringify(categories));
    }
  }, [categories]);

  useEffect(() => {
    if (shouldUseMockData()) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (shouldUseMockData()) {
      localStorage.setItem('budgets', JSON.stringify(budgets));
    }
  }, [budgets]);

  useEffect(() => {
    if (shouldUseMockData()) {
      localStorage.setItem('accounts', JSON.stringify(accounts));
    }
  }, [accounts]);

  useEffect(() => {
    if (shouldUseMockData()) {
      localStorage.setItem('goals', JSON.stringify(goals));
    }
  }, [goals]);

  return (
    <FinanceContext.Provider value={{
      transactions,
      categories,
      budgets,
      accounts,
      goals,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      updateBudget,
      deleteBudget,
      updateAccount,
      deleteAccount,
      getMonthlyIncome,
      getMonthlyExpenses,
      getCurrentBalance,
      getCategoryExpenses,
      searchTransactions,
      sendBudgetAlert,
      isLoading,
    }}>
      {children}
    </FinanceContext.Provider>
  );
};