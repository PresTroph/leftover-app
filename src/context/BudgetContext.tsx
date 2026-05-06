'use client';

import React, {
  createContext, ReactNode, useCallback, useContext, useEffect, useReducer, useRef,
} from 'react';

import {
  Borrowed, BudgetState, Constant, CreateBorrowed, CreateConstant, CreateExpense,
  CreateGift, CreateIncome, CreateSavings, Expense, Gift, Income, Savings,
  UpdateConstant, UpdateIncome, UpdateSavings, User
} from '../types';

import { buildBudgetState, formatMonthKey, getToday } from '../engine/calculations';

import {
  addBorrowed as fsAddBorrowed,
  addConstant as fsAddConstant,
  addExpense as fsAddExpense,
  addGift as fsAddGift,
  addIncome as fsAddIncome,
  addToSavings as fsAddToSavings,
  deleteBorrowed as fsDeleteBorrowed,
  deleteConstant as fsDeleteConstant,
  deleteExpense as fsDeleteExpense,
  deleteGift as fsDeleteGift,
  deleteIncome as fsDeleteIncome,
  deleteSavings as fsDeleteSavings,
  executeReset as fsExecuteReset,
  getBorrowed as fsGetBorrowed,
  getConstants as fsGetConstants,
  getExpensesByMonth as fsGetExpensesByMonth,
  getGiftsByMonth as fsGetGiftsByMonth,
  getIncomes as fsGetIncomes,
  getSavings as fsGetSavings,
  payBackBorrowed as fsPayBackBorrowed,
  setSavings as fsSetSavings,
  updateConstant as fsUpdateConstant,
  updateIncome as fsUpdateIncome,
  updateSavings as fsUpdateSavings,
  withdrawFromSavings as fsWithdrawFromSavings
} from '../services/firestore';

// ─── LEGACY ─────────────────────────────────────────────────

export interface Transaction {
  amount: number;
  description: string;
  category: string;
  date: string;
}

// ─── CONTEXT TYPE ───────────────────────────────────────────

export interface BudgetContextType {
  weeklyBudget: number;
  transactions: Transaction[];
  language: string;
  setBudget: (budget: number) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (index: number) => void;
  setLanguage: (lang: string) => void;

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
  deleteSavings: () => Promise<void>;
  savings: Savings | null;

  // Borrowed money
  addBorrowed: (data: CreateBorrowed) => Promise<void>;
  payBackBorrowed: (borrowedId: string, amount: number) => Promise<void>;
  deleteBorrowed: (borrowedId: string) => Promise<void>;
  borrowed: Borrowed[];

  // Gifts
  addGift: (data: CreateGift) => Promise<void>;
  deleteGift: (giftId: string) => Promise<void>;
  gifts: Gift[];

  refreshBudget: () => Promise<void>;
  executeReset: (action: 'carry-over' | 'savings' | 'weekly-boost') => Promise<void>;
  setUser: (user: User | null) => void;
}

// ─── STATE ──────────────────────────────────────────────────

interface State {
  weeklyBudget: number;
  transactions: Transaction[];
  language: string;
  budgetState: BudgetState | null;
  incomes: Income[];
  constants: Constant[];
  expenses: Expense[];
  savings: Savings | null;
  borrowed: Borrowed[];
  gifts: Gift[];
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: State = {
  weeklyBudget: 300,
  transactions: [],
  language: 'English',
  budgetState: null,
  incomes: [],
  constants: [],
  expenses: [],
  savings: null,
  borrowed: [],
  gifts: [],
  user: null,
  isLoading: false,
  error: null,
};

type Action =
  | { type: 'SET_BUDGET'; payload: number }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'LOAD_DATA'; payload: { incomes: Income[]; constants: Constant[]; expenses: Expense[]; savings: Savings | null; borrowed: Borrowed[]; gifts: Gift[] } }
  | { type: 'SET_INCOMES'; payload: Income[] }
  | { type: 'SET_CONSTANTS'; payload: Constant[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_SAVINGS'; payload: Savings | null }
  | { type: 'SET_BORROWED'; payload: Borrowed[] }
  | { type: 'SET_GIFTS'; payload: Gift[] }
  | { type: 'SET_BUDGET_STATE'; payload: BudgetState };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_BUDGET':
      return { ...state, weeklyBudget: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter((_: Transaction, i: number) => i !== action.payload) };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'LOAD_DATA':
      return {
        ...state,
        incomes: action.payload.incomes,
        constants: action.payload.constants,
        expenses: action.payload.expenses,
        savings: action.payload.savings,
        borrowed: action.payload.borrowed,
        gifts: action.payload.gifts,
        isLoading: false,
        error: null,
      };
    case 'SET_INCOMES':
      return { ...state, incomes: action.payload };
    case 'SET_CONSTANTS':
      return { ...state, constants: action.payload };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    case 'SET_SAVINGS':
      return { ...state, savings: action.payload };
    case 'SET_BORROWED':
      return { ...state, borrowed: action.payload };
    case 'SET_GIFTS':
      return { ...state, gifts: action.payload };
    case 'SET_BUDGET_STATE':
      return { ...state, budgetState: action.payload, weeklyBudget: action.payload.weeklyBudget };
    default:
      return state;
  }
}

// ─── CONTEXT ────────────────────────────────────────────────

export const BudgetContext = createContext<BudgetContextType | null>(null);

// ─── PROVIDER ───────────────────────────────────────────────

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = state.user;
  }, [state.user]);

  const getUserId = (): string | null => {
    return userRef.current?.id || null;
  };

  // ── Core data loader — now includes borrowed & gifts ──
  const loadAllData = useCallback(async (userId: string) => {
    console.log('[Budget] Loading all data for user:', userId);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const currentMonth = formatMonthKey(getToday());
      const [incomes, constants, expenses, savings, borrowed, gifts] = await Promise.all([
        fsGetIncomes(userId),
        fsGetConstants(userId),
        fsGetExpensesByMonth(userId, currentMonth),
        fsGetSavings(userId),
        fsGetBorrowed(userId),
        fsGetGiftsByMonth(userId, currentMonth),
      ]);

      console.log('[Budget] Loaded:', {
        incomes: incomes.length,
        constants: constants.length,
        expenses: expenses.length,
        hasSavings: !!savings,
        borrowed: borrowed.length,
        gifts: gifts.length,
      });

      dispatch({
        type: 'LOAD_DATA',
        payload: { incomes, constants, expenses, savings, borrowed, gifts },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      console.error('[Budget] Load error:', message);
      dispatch({ type: 'SET_ERROR', payload: message });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // ── Auto-load when user changes ──
  useEffect(() => {
    if (state.user?.id) {
      console.log('[Budget] User set, loading data:', state.user.id);
      loadAllData(state.user.id);
    }
  }, [state.user?.id, loadAllData]);

  // ── Recompute budget state when data changes — now includes borrowed & gifts ──
  useEffect(() => {
    if (state.user && (state.incomes.length > 0 || state.constants.length > 0 || state.expenses.length > 0 || state.savings || state.borrowed.length > 0 || state.gifts.length > 0)) {
      const budgetState = buildBudgetState(
        {
          name: state.user.name || 'User',
          language: state.user.language || 'en',
          resetDay: state.user.resetDay || 1,
        },
        state.incomes,
        state.constants,
        state.expenses,
        state.savings,
        state.borrowed,
        state.gifts
      );
      dispatch({ type: 'SET_BUDGET_STATE', payload: budgetState });
    }
  }, [state.user, state.incomes, state.constants, state.expenses, state.savings, state.borrowed, state.gifts]);

  // ── Refresh ──
  const refreshBudget = useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    await loadAllData(uid);
  }, [loadAllData]);

  // ── Legacy actions ──
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

  // ── Income CRUD ──
  const addIncome = useCallback(async (data: CreateIncome) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsAddIncome(uid, data);
      const incomes = await fsGetIncomes(uid);
      dispatch({ type: 'SET_INCOMES', payload: incomes });
    } catch (err: unknown) {
      console.error('[Budget] addIncome error:', err);
      throw err;
    }
  }, []);

  const updateIncome = useCallback(async (data: UpdateIncome) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsUpdateIncome(uid, data);
      const incomes = await fsGetIncomes(uid);
      dispatch({ type: 'SET_INCOMES', payload: incomes });
    } catch (err: unknown) {
      console.error('[Budget] updateIncome error:', err);
      throw err;
    }
  }, []);

  const deleteIncome = useCallback(async (incomeId: string) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsDeleteIncome(uid, incomeId);
      const incomes = await fsGetIncomes(uid);
      dispatch({ type: 'SET_INCOMES', payload: incomes });
    } catch (err: unknown) {
      console.error('[Budget] deleteIncome error:', err);
      throw err;
    }
  }, []);

  // ── Constants CRUD ──
  const addConstant = useCallback(async (data: CreateConstant) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsAddConstant(uid, data);
      const constants = await fsGetConstants(uid);
      dispatch({ type: 'SET_CONSTANTS', payload: constants });
    } catch (err: unknown) {
      console.error('[Budget] addConstant error:', err);
      throw err;
    }
  }, []);

  const updateConstant = useCallback(async (data: UpdateConstant) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsUpdateConstant(uid, data);
      const constants = await fsGetConstants(uid);
      dispatch({ type: 'SET_CONSTANTS', payload: constants });
    } catch (err: unknown) {
      console.error('[Budget] updateConstant error:', err);
      throw err;
    }
  }, []);

  const deleteConstant = useCallback(async (constantId: string) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsDeleteConstant(uid, constantId);
      const constants = await fsGetConstants(uid);
      dispatch({ type: 'SET_CONSTANTS', payload: constants });
    } catch (err: unknown) {
      console.error('[Budget] deleteConstant error:', err);
      throw err;
    }
  }, []);

  // ── Expenses CRUD ──
  const addExpenseToFirestore = useCallback(async (data: CreateExpense) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsAddExpense(uid, data);
      const currentMonth = formatMonthKey(getToday());
      const expenses = await fsGetExpensesByMonth(uid, currentMonth);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
    } catch (err: unknown) {
      console.error('[Budget] addExpense error:', err);
      throw err;
    }
  }, []);

  const deleteExpenseFromFirestore = useCallback(async (expenseId: string) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsDeleteExpense(uid, expenseId);
      const currentMonth = formatMonthKey(getToday());
      const expenses = await fsGetExpensesByMonth(uid, currentMonth);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
    } catch (err: unknown) {
      console.error('[Budget] deleteExpense error:', err);
      throw err;
    }
  }, []);

  // ── Savings ──
  const setSavingsGoal = useCallback(async (data: CreateSavings) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsSetSavings(uid, data);
      const savings = await fsGetSavings(uid);
      dispatch({ type: 'SET_SAVINGS', payload: savings });
    } catch (err: unknown) {
      console.error('[Budget] setSavings error:', err);
      throw err;
    }
  }, []);

  const updateSavingsGoal = useCallback(async (data: UpdateSavings) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsUpdateSavings(uid, data);
      const savings = await fsGetSavings(uid);
      dispatch({ type: 'SET_SAVINGS', payload: savings });
    } catch (err: unknown) {
      console.error('[Budget] updateSavings error:', err);
      throw err;
    }
  }, []);

  const addToSavingsAmount = useCallback(async (amount: number) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsAddToSavings(uid, amount);
      const savings = await fsGetSavings(uid);
      dispatch({ type: 'SET_SAVINGS', payload: savings });
    } catch (err: unknown) {
      console.error('[Budget] addToSavings error:', err);
      throw err;
    }
  }, []);

  const withdrawFromSavingsAmount = useCallback(async (amount: number) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsWithdrawFromSavings(uid, amount);
      const savings = await fsGetSavings(uid);
      dispatch({ type: 'SET_SAVINGS', payload: savings });
    } catch (err: unknown) {
      console.error('[Budget] withdrawFromSavings error:', err);
      throw err;
    }
  }, []);

  const deleteSavingsGoal = useCallback(async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsDeleteSavings(uid);
      dispatch({ type: 'SET_SAVINGS', payload: null });
    } catch (err: unknown) {
      console.error('[Budget] deleteSavings error:', err);
      throw err;
    }
  }, []);

  // ── Borrowed Money ──
  const addBorrowedMoney = useCallback(async (data: CreateBorrowed) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsAddBorrowed(uid, data);
      const borrowed = await fsGetBorrowed(uid);
      dispatch({ type: 'SET_BORROWED', payload: borrowed });
    } catch (err: unknown) {
      console.error('[Budget] addBorrowed error:', err);
      throw err;
    }
  }, []);

  const payBackBorrowedMoney = useCallback(async (borrowedId: string, amount: number) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsPayBackBorrowed(uid, borrowedId, amount);
      const borrowed = await fsGetBorrowed(uid);
      dispatch({ type: 'SET_BORROWED', payload: borrowed });
    } catch (err: unknown) {
      console.error('[Budget] payBackBorrowed error:', err);
      throw err;
    }
  }, []);

  const deleteBorrowedMoney = useCallback(async (borrowedId: string) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsDeleteBorrowed(uid, borrowedId);
      const borrowed = await fsGetBorrowed(uid);
      dispatch({ type: 'SET_BORROWED', payload: borrowed });
    } catch (err: unknown) {
      console.error('[Budget] deleteBorrowed error:', err);
      throw err;
    }
  }, []);

  // ── Gifts ──
  const addGiftMoney = useCallback(async (data: CreateGift) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsAddGift(uid, data);
      const currentMonth = formatMonthKey(getToday());
      const gifts = await fsGetGiftsByMonth(uid, currentMonth);
      dispatch({ type: 'SET_GIFTS', payload: gifts });
    } catch (err: unknown) {
      console.error('[Budget] addGift error:', err);
      throw err;
    }
  }, []);

  const deleteGiftMoney = useCallback(async (giftId: string) => {
    const uid = getUserId();
    if (!uid) return;
    try {
      await fsDeleteGift(uid, giftId);
      const currentMonth = formatMonthKey(getToday());
      const gifts = await fsGetGiftsByMonth(uid, currentMonth);
      dispatch({ type: 'SET_GIFTS', payload: gifts });
    } catch (err: unknown) {
      console.error('[Budget] deleteGift error:', err);
      throw err;
    }
  }, []);

  // ── Reset ──
  const executeResetAction = useCallback(async (action: 'carry-over' | 'savings' | 'weekly-boost') => {
    const uid = getUserId();
    if (!uid) return;
    await fsExecuteReset(uid, action);
    await loadAllData(uid);
  }, [loadAllData]);

  // ── Set user ──
  const setUser = useCallback((user: User | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  // ── Value ──
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
    deleteSavings: deleteSavingsGoal,

    borrowed: state.borrowed,
    addBorrowed: addBorrowedMoney,
    payBackBorrowed: payBackBorrowedMoney,
    deleteBorrowed: deleteBorrowedMoney,

    gifts: state.gifts,
    addGift: addGiftMoney,
    deleteGift: deleteGiftMoney,

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