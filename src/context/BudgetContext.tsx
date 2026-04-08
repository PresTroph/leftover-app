'use client';

import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useReducer,
} from 'react';

import {
    BudgetState,
    Constant,
    CreateConstant,
    CreateExpense,
    CreateIncome,
    CreateSavings,
    Expense,
    Income,
    Savings,
    UpdateConstant,
    UpdateIncome,
    UpdateSavings,
    User
} from '../types';

import {
    buildBudgetState,
    formatMonthKey,
    getToday
} from '../engine/calculations';

import {
    addConstant as fsAddConstant,
    addExpense as fsAddExpense,
    addIncome as fsAddIncome,
    addToSavings as fsAddToSavings,
    deleteConstant as fsDeleteConstant,
    deleteExpense as fsDeleteExpense,
    deleteIncome as fsDeleteIncome,
    executeReset as fsExecuteReset,
    getConstants as fsGetConstants,
    getExpensesByMonth as fsGetExpensesByMonth,
    getIncomes as fsGetIncomes,
    getSavings as fsGetSavings,
    setSavings as fsSetSavings,
    updateConstant as fsUpdateConstant,
    updateIncome as fsUpdateIncome,
    updateSavings as fsUpdateSavings,
    withdrawFromSavings as fsWithdrawFromSavings
} from '../services/firestore';

// ─── LEGACY SUPPORT ─────────────────────────────────────────

export interface Transaction {
  amount: number;
  description: string;
  category: string;
  date: string;
}

// ─── CONTEXT TYPE ───────────────────────────────────────────

export interface BudgetContextType {
  // Legacy
  weeklyBudget: number;
  transactions: Transaction[];
  language: string;
  setBudget: (budget: number) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (index: number) => void;
  setLanguage: (lang: string) => void;

  // New
  budgetState: BudgetState | null;
  isLoading: boolean;
  error: string | null;

  addIncome: (data: CreateIncome) => Promise<void>;
  updateIncome: (data: UpdateIncome) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
  incomes: Income[];

  addConstant: (data: CreateConstant) => Promise<void>;
  updateConstant: (data: UpdateConstant) => Promise<void>;
  deleteConstant: (constantId: string) => Promise<void>;
  constants: Constant[];

  addExpenseToFirestore: (data: CreateExpense) => Promise<void>;
  deleteExpenseFromFirestore: (expenseId: string) => Promise<void>;
  expenses: Expense[];

  setSavings: (data: CreateSavings) => Promise<void>;
  updateSavings: (data: UpdateSavings) => Promise<void>;
  addToSavings: (amount: number) => Promise<void>;
  withdrawFromSavings: (amount: number) => Promise<void>;
  savings: Savings | null;

  refreshBudget: () => Promise<void>;
  executeReset: (action: 'carry-over' | 'savings' | 'weekly-boost') => Promise<void>;
  setUser: (user: User | null) => void;
}

// ─── STATE ──────────────────────────────────────────────────

interface BudgetReducerState {
  weeklyBudget: number;
  transactions: Transaction[];
  language: string;
  budgetState: BudgetState | null;
  incomes: Income[];
  constants: Constant[];
  expenses: Expense[];
  savings: Savings | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BudgetReducerState = {
  weeklyBudget: 300,
  transactions: [],
  language: 'English',
  budgetState: null,
  incomes: [],
  constants: [],
  expenses: [],
  savings: null,
  user: null,
  isLoading: false,
  error: null,
};

// ─── ACTIONS ────────────────────────────────────────────────

type Action =
  | { type: 'SET_BUDGET'; payload: number }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_INCOMES'; payload: Income[] }
  | { type: 'SET_CONSTANTS'; payload: Constant[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_SAVINGS'; payload: Savings | null }
  | { type: 'SET_BUDGET_STATE'; payload: BudgetState };

function budgetReducer(state: BudgetReducerState, action: Action): BudgetReducerState {
  switch (action.type) {
    case 'SET_BUDGET':
      return { ...state, weeklyBudget: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((_: Transaction, i: number) => i !== action.payload),
      };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_INCOMES':
      return { ...state, incomes: action.payload };
    case 'SET_CONSTANTS':
      return { ...state, constants: action.payload };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    case 'SET_SAVINGS':
      return { ...state, savings: action.payload };
    case 'SET_BUDGET_STATE':
      return {
        ...state,
        budgetState: action.payload,
        weeklyBudget: action.payload.weeklyBudget,
      };
    default:
      return state;
  }
}

// ─── CONTEXT ────────────────────────────────────────────────

export const BudgetContext = createContext<BudgetContextType | null>(null);

// ─── PROVIDER ───────────────────────────────────────────────

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);

  // Recompute budget state whenever data changes
  useEffect(() => {
    if (state.user) {
      const budgetState = buildBudgetState(
        {
          name: state.user.name,
          language: state.user.language,
          resetDay: state.user.resetDay,
        },
        state.incomes,
        state.constants,
        state.expenses,
        state.savings
      );
      dispatch({ type: 'SET_BUDGET_STATE', payload: budgetState });
    }
  }, [state.user, state.incomes, state.constants, state.expenses, state.savings]);

  // Auto-refresh when user is set
  useEffect(() => {
    if (state.user?.id) {
      refreshBudget();
    }
  }, [state.user?.id]);

  // Load all data from Firestore
  const refreshBudget = useCallback(async () => {
    if (!state.user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const currentMonth = formatMonthKey(getToday());
      const [incomes, constants, expenses, savings] = await Promise.all([
        fsGetIncomes(state.user.id),
        fsGetConstants(state.user.id),
        fsGetExpensesByMonth(state.user.id, currentMonth),
        fsGetSavings(state.user.id),
      ]);

      dispatch({ type: 'SET_INCOMES', payload: incomes });
      dispatch({ type: 'SET_CONSTANTS', payload: constants });
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
      dispatch({ type: 'SET_SAVINGS', payload: savings });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user?.id]);

  // Legacy actions
  const setBudget = useCallback((budget: number) => {
    dispatch({ type: 'SET_BUDGET', payload: budget });
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  }, []);

  const deleteTransaction = useCallback((index: number) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: index });
  }, []);

  const setLanguage = useCallback((lang: string) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  }, []);

  // Income CRUD
  const addIncome = useCallback(async (data: CreateIncome) => {
    if (!state.user?.id) return;
    await fsAddIncome(state.user.id, data);
    const incomes = await fsGetIncomes(state.user.id);
    dispatch({ type: 'SET_INCOMES', payload: incomes });
  }, [state.user?.id]);

  const updateIncome = useCallback(async (data: UpdateIncome) => {
    if (!state.user?.id) return;
    await fsUpdateIncome(state.user.id, data);
    const incomes = await fsGetIncomes(state.user.id);
    dispatch({ type: 'SET_INCOMES', payload: incomes });
  }, [state.user?.id]);

  const deleteIncome = useCallback(async (incomeId: string) => {
    if (!state.user?.id) return;
    await fsDeleteIncome(state.user.id, incomeId);
    const incomes = await fsGetIncomes(state.user.id);
    dispatch({ type: 'SET_INCOMES', payload: incomes });
  }, [state.user?.id]);

  // Constants CRUD
  const addConstant = useCallback(async (data: CreateConstant) => {
    if (!state.user?.id) return;
    await fsAddConstant(state.user.id, data);
    const constants = await fsGetConstants(state.user.id);
    dispatch({ type: 'SET_CONSTANTS', payload: constants });
  }, [state.user?.id]);

  const updateConstant = useCallback(async (data: UpdateConstant) => {
    if (!state.user?.id) return;
    await fsUpdateConstant(state.user.id, data);
    const constants = await fsGetConstants(state.user.id);
    dispatch({ type: 'SET_CONSTANTS', payload: constants });
  }, [state.user?.id]);

  const deleteConstant = useCallback(async (constantId: string) => {
    if (!state.user?.id) return;
    await fsDeleteConstant(state.user.id, constantId);
    const constants = await fsGetConstants(state.user.id);
    dispatch({ type: 'SET_CONSTANTS', payload: constants });
  }, [state.user?.id]);

  // Expense CRUD
  const addExpenseToFirestore = useCallback(async (data: CreateExpense) => {
    if (!state.user?.id) return;
    await fsAddExpense(state.user.id, data);
    const currentMonth = formatMonthKey(getToday());
    const expenses = await fsGetExpensesByMonth(state.user.id, currentMonth);
    dispatch({ type: 'SET_EXPENSES', payload: expenses });
  }, [state.user?.id]);

  const deleteExpenseFromFirestore = useCallback(async (expenseId: string) => {
    if (!state.user?.id) return;
    await fsDeleteExpense(state.user.id, expenseId);
    const currentMonth = formatMonthKey(getToday());
    const expenses = await fsGetExpensesByMonth(state.user.id, currentMonth);
    dispatch({ type: 'SET_EXPENSES', payload: expenses });
  }, [state.user?.id]);

  // Savings
  const setSavingsGoal = useCallback(async (data: CreateSavings) => {
    if (!state.user?.id) return;
    await fsSetSavings(state.user.id, data);
    const savings = await fsGetSavings(state.user.id);
    dispatch({ type: 'SET_SAVINGS', payload: savings });
  }, [state.user?.id]);

  const updateSavingsGoal = useCallback(async (data: UpdateSavings) => {
    if (!state.user?.id) return;
    await fsUpdateSavings(state.user.id, data);
    const savings = await fsGetSavings(state.user.id);
    dispatch({ type: 'SET_SAVINGS', payload: savings });
  }, [state.user?.id]);

  const addToSavingsAmount = useCallback(async (amount: number) => {
    if (!state.user?.id) return;
    await fsAddToSavings(state.user.id, amount);
    const savings = await fsGetSavings(state.user.id);
    dispatch({ type: 'SET_SAVINGS', payload: savings });
  }, [state.user?.id]);

  const withdrawFromSavingsAmount = useCallback(async (amount: number) => {
    if (!state.user?.id) return;
    await fsWithdrawFromSavings(state.user.id, amount);
    const savings = await fsGetSavings(state.user.id);
    dispatch({ type: 'SET_SAVINGS', payload: savings });
  }, [state.user?.id]);

  // Reset
  const executeResetAction = useCallback(async (action: 'carry-over' | 'savings' | 'weekly-boost') => {
    if (!state.user?.id) return;
    await fsExecuteReset(state.user.id, action);
    await refreshBudget();
  }, [state.user?.id, refreshBudget]);

  // Set user (called from AuthContext listener)
  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const value: BudgetContextType = {
    weeklyBudget: state.budgetState?.weeklyBudget || state.weeklyBudget,
    transactions: state.transactions,
    language: state.language,
    setBudget,
    addTransaction,
    deleteTransaction,
    setLanguage,

    budgetState: state.budgetState,
    isLoading: state.isLoading,
    error: state.error,

    incomes: state.incomes,
    addIncome,
    updateIncome,
    deleteIncome,

    constants: state.constants,
    addConstant,
    updateConstant,
    deleteConstant,

    expenses: state.expenses,
    addExpenseToFirestore,
    deleteExpenseFromFirestore,

    savings: state.savings,
    setSavings: setSavingsGoal,
    updateSavings: updateSavingsGoal,
    addToSavings: addToSavingsAmount,
    withdrawFromSavings: withdrawFromSavingsAmount,

    refreshBudget,
    executeReset: executeResetAction,
    setUser,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget(): BudgetContextType {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
