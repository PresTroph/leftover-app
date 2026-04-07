// ============================================================
// LEFTOVER - Enhanced Budget Context
// Integrates: Firestore + Calculation Engine + Haiku's reducer
// ============================================================

'use client';

import React, {
    createContext,
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
    ExpenseCategory,
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
    getCurrentWeekNumber,
    getToday
} from '../engine/calculations';

import * as FirestoreService from '../services/firestore';

// ─── LEGACY SUPPORT ─────────────────────────────────────────
// Keep the old Transaction type so existing screens don't break
// while we migrate them one by one.

export interface Transaction {
  amount: number;
  description: string;
  category: string;
  date: string;
}

// ─── CONTEXT TYPE ───────────────────────────────────────────

export interface BudgetContextType {
  // === LEGACY (existing screens still use these) ===
  weeklyBudget: number;
  transactions: Transaction[];
  language: string;
  setBudget: (budget: number) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (index: number) => void;
  setLanguage: (lang: string) => void;

  // === NEW: Full Budget State ===
  budgetState: BudgetState | null;
  isLoading: boolean;
  error: string | null;

  // === NEW: Income CRUD ===
  addIncome: (data: CreateIncome) => Promise<void>;
  updateIncome: (data: UpdateIncome) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;
  incomes: Income[];

  // === NEW: Constants CRUD ===
  addConstant: (data: CreateConstant) => Promise<void>;
  updateConstant: (data: UpdateConstant) => Promise<void>;
  deleteConstant: (constantId: string) => Promise<void>;
  constants: Constant[];

  // === NEW: Expense CRUD (Firestore-backed) ===
  addExpenseToFirestore: (data: CreateExpense) => Promise<void>;
  deleteExpenseFromFirestore: (expenseId: string) => Promise<void>;
  expenses: Expense[];

  // === NEW: Savings ===
  setSavings: (data: CreateSavings) => Promise<void>;
  updateSavings: (data: UpdateSavings) => Promise<void>;
  addToSavings: (amount: number) => Promise<void>;
  withdrawFromSavings: (amount: number) => Promise<void>;
  savings: Savings | null;

  // === NEW: Actions ===
  refreshBudget: () => Promise<void>;
  executeReset: (action: 'carry-over' | 'savings' | 'weekly-boost') => Promise<void>;
}

// ─── STATE ──────────────────────────────────────────────────

interface BudgetReducerState {
  // Legacy
  weeklyBudget: number;
  transactions: Transaction[];
  language: string;

  // New
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
  // Legacy actions (keep for backward compat)
  | { type: 'SET_BUDGET'; payload: number }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string }
  // New actions
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_INCOMES'; payload: Income[] }
  | { type: 'SET_CONSTANTS'; payload: Constant[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_SAVINGS'; payload: Savings | null }
  | { type: 'SET_BUDGET_STATE'; payload: BudgetState }
  | { type: 'HYDRATE_ALL'; payload: Partial<BudgetReducerState> };

function budgetReducer(state: BudgetReducerState, action: Action): BudgetReducerState {
  switch (action.type) {
    // Legacy
    case 'SET_BUDGET':
      return { ...state, weeklyBudget: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((_, i) => i !== action.payload),
      };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    // New
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
        // Sync legacy fields so old screens still work
        weeklyBudget: action.payload.weeklyBudget,
      };
    case 'HYDRATE_ALL':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ─── CONTEXT ────────────────────────────────────────────────

export const BudgetContext = createContext<BudgetContextType | null>(null);

// ─── PROVIDER ───────────────────────────────────────────────

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);

  // ── Recompute budget state whenever data changes ──
  const recomputeBudgetState = useCallback(() => {
    if (!state.user) return;

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
  }, [state.user, state.incomes, state.constants, state.expenses, state.savings]);

  // Recompute whenever underlying data changes
  useEffect(() => {
    if (state.user) {
      recomputeBudgetState();
    }
  }, [state.user, state.incomes, state.constants, state.expenses, state.savings]);

  // ── Load all data from Firestore ──
  const refreshBudget = useCallback(async () => {
    if (!state.user?.id) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const data = await FirestoreService.loadBudgetData(state.user.id);

      dispatch({ type: 'SET_INCOMES', payload: data.incomes });
      dispatch({ type: 'SET_CONSTANTS', payload: data.constants });
      dispatch({ type: 'SET_EXPENSES', payload: data.expenses });
      dispatch({ type: 'SET_SAVINGS', payload: data.savings });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.user?.id]);

  // ── LEGACY ACTIONS (backward compat) ──

  const setBudget = useCallback((budget: number) => {
    dispatch({ type: 'SET_BUDGET', payload: budget });
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });

    // Also save to Firestore if user is authenticated
    if (state.user?.id) {
      const currentMonth = formatMonthKey(getToday());
      const weekNumber = getCurrentWeekNumber(state.user.resetDay || 1);

      FirestoreService.addExpense(state.user.id, {
        userId: state.user.id,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category as ExpenseCategory,
        date: transaction.date,
        weekNumber,
        month: currentMonth,
      }).catch(console.error);
    }
  }, [state.user]);

  const deleteTransaction = useCallback((index: number) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: index });
  }, []);

  const setLanguage = useCallback((lang: string) => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  }, []);

  // ── NEW: Income CRUD ──

  const addIncome = useCallback(async (data: CreateIncome) => {
    if (!state.user?.id) return;
    await FirestoreService.addIncome(state.user.id, data);
    const incomes = await FirestoreService.getIncomes(state.user.id);
    dispatch({ type: 'SET_INCOMES', payload: incomes });
  }, [state.user?.id]);

  const updateIncome = useCallback(async (data: UpdateIncome) => {
    if (!state.user?.id) return;
    await FirestoreService.updateIncome(state.user.id, data);
    const incomes = await FirestoreService.getIncomes(state.user.id);
    dispatch({ type: 'SET_INCOMES', payload: incomes });
  }, [state.user?.id]);

  const deleteIncome = useCallback(async (incomeId: string) => {
    if (!state.user?.id) return;
    await FirestoreService.deleteIncome(state.user.id, incomeId);
    const incomes = await FirestoreService.getIncomes(state.user.id);
    dispatch({ type: 'SET_INCOMES', payload: incomes });
  }, [state.user?.id]);

  // ── NEW: Constants CRUD ──

  const addConstant = useCallback(async (data: CreateConstant) => {
    if (!state.user?.id) return;
    await FirestoreService.addConstant(state.user.id, data);
    const constants = await FirestoreService.getConstants(state.user.id);
    dispatch({ type: 'SET_CONSTANTS', payload: constants });
  }, [state.user?.id]);

  const updateConstant = useCallback(async (data: UpdateConstant) => {
    if (!state.user?.id) return;
    await FirestoreService.updateConstant(state.user.id, data);
    const constants = await FirestoreService.getConstants(state.user.id);
    dispatch({ type: 'SET_CONSTANTS', payload: constants });
  }, [state.user?.id]);

  const deleteConstant = useCallback(async (constantId: string) => {
    if (!state.user?.id) return;
    await FirestoreService.deleteConstant(state.user.id, constantId);
    const constants = await FirestoreService.getConstants(state.user.id);
    dispatch({ type: 'SET_CONSTANTS', payload: constants });
  }, [state.user?.id]);

  // ── NEW: Expenses CRUD (Firestore-backed) ──

  const addExpenseToFirestore = useCallback(async (data: CreateExpense) => {
    if (!state.user?.id) return;
    await FirestoreService.addExpense(state.user.id, data);
    const currentMonth = formatMonthKey(getToday());
    const expenses = await FirestoreService.getExpensesByMonth(state.user.id, currentMonth);
    dispatch({ type: 'SET_EXPENSES', payload: expenses });
  }, [state.user?.id]);

  const deleteExpenseFromFirestore = useCallback(async (expenseId: string) => {
    if (!state.user?.id) return;
    await FirestoreService.deleteExpense(state.user.id, expenseId);
    const currentMonth = formatMonthKey(getToday());
    const expenses = await FirestoreService.getExpensesByMonth(state.user.id, currentMonth);
    dispatch({ type: 'SET_EXPENSES', payload: expenses });
  }, [state.user?.id]);

  // ── NEW: Savings ──

  const setSavingsGoal = useCallback(async (data: CreateSavings) => {
    if (!state.user?.id) return;
    await FirestoreService.setSavings(state.user.id, data);
    const savings = await FirestoreService.getSavings(state.user.id);
    dispatch({ type: 'SET_SAVINGS', payload: savings });
  }, [state.user?.id]);

  const updateSavingsGoal = useCallback(async (data: UpdateSavings) => {
    if (!state.user?.id) return;
    await FirestoreService.updateSavings(state.user.id, data);
    const savings = await FirestoreService.getSavings(state.user.id);
    dispatch({ type: 'SET_SAVINGS', payload: savings });
  }, [state.user?.id]);

  const addToSavingsAmount = useCallback(async (amount: number) => {
    if (!state.user?.id) return;
    await FirestoreService.addToSavings(state.user.id, amount);
    const savings = await FirestoreService.getSavings(state.user.id);
    dispatch({ type: 'SET_SAVINGS', payload: savings });
  }, [state.user?.id]);

  const withdrawFromSavingsAmount = useCallback(async (amount: number) => {
    if (!state.user?.id) return;
    await FirestoreService.withdrawFromSavings(state.user.id, amount);
    const savings = await FirestoreService.getSavings(state.user.id);
    dispatch({ type: 'SET_SAVINGS', payload: savings });
  }, [state.user?.id]);

  // ── NEW: Reset ──

  const executeResetAction = useCallback(async (action: 'carry-over' | 'savings' | 'weekly-boost') => {
    if (!state.user?.id) return;
    await FirestoreService.executeReset(state.user.id, action);
    await refreshBudget();
  }, [state.user?.id, refreshBudget]);

  // ── SET USER (called from AuthContext after login) ──
  // Export this so AuthContext can hydrate the budget
  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  // Auto-refresh when user is set
  useEffect(() => {
    if (state.user?.id) {
      refreshBudget();
    }
  }, [state.user?.id]);

  // ── VALUE ──

  const value: BudgetContextType = {
    // Legacy
    weeklyBudget: state.budgetState?.weeklyBudget || state.weeklyBudget,
    transactions: state.transactions,
    language: state.language,
    setBudget,
    addTransaction,
    deleteTransaction,
    setLanguage,

    // New
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
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}

// ── HOOK (convenience) ──

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
