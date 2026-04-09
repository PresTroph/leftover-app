'use client';

import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useReducer,
    useRef,
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
    withdrawFromSavings as fsWithdrawFromSavings,
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
  savings: Savings | null;

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
  | { type: 'LOAD_DATA'; payload: { incomes: Income[]; constants: Constant[]; expenses: Expense[]; savings: Savings | null } }
  | { type: 'SET_INCOMES'; payload: Income[] }
  | { type: 'SET_CONSTANTS'; payload: Constant[] }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'SET_SAVINGS'; payload: Savings | null }
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

  // Use refs to avoid stale closures in callbacks
  const userRef = useRef<User | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    userRef.current = state.user;
  }, [state.user]);

  // ── Helper: get userId safely ──
  const getUserId = (): string | null => {
    return userRef.current?.id || null;
  };

  // ── Core data loader ──
  const loadAllData = useCallback(async (userId: string) => {
    console.log('[Budget] Loading all data for user:', userId);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const currentMonth = formatMonthKey(getToday());
      const [incomes, constants, expenses, savings] = await Promise.all([
        fsGetIncomes(userId),
        fsGetConstants(userId),
        fsGetExpensesByMonth(userId, currentMonth),
        fsGetSavings(userId),
      ]);

      console.log('[Budget] Loaded:', {
        incomes: incomes.length,
        constants: constants.length,
        expenses: expenses.length,
        hasSavings: !!savings,
      });

      dispatch({
        type: 'LOAD_DATA',
        payload: { incomes, constants, expenses, savings },
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

  // ── Recompute budget state when data changes ──
  useEffect(() => {
    if (state.user && (state.incomes.length > 0 || state.constants.length > 0 || state.expenses.length > 0 || state.savings)) {
      const budgetState = buildBudgetState(
        {
          name: state.user.name || 'User',
          language: state.user.language || 'en',
          resetDay: state.user.resetDay || 1,
        },
        state.incomes,
        state.constants,
        state.expenses,
        state.savings
      );
      dispatch({ type: 'SET_BUDGET_STATE', payload: budgetState });
    }
  }, [state.user, state.incomes, state.constants, state.expenses, state.savings]);

  // ── Refresh (public, uses ref) ──
  const refreshBudget = useCallback(async () => {
    const uid = getUserId();
    if (!uid) {
      console.warn('[Budget] refreshBudget called with no user');
      return;
    }
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
      console.log('[Budget] Deleting income:', incomeId);
      await fsDeleteIncome(uid, incomeId);
      const incomes = await fsGetIncomes(uid);
      dispatch({ type: 'SET_INCOMES', payload: incomes });
      console.log('[Budget] Income deleted, remaining:', incomes.length);
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
      console.log('[Budget] Deleting constant:', constantId);
      await fsDeleteConstant(uid, constantId);
      const constants = await fsGetConstants(uid);
      dispatch({ type: 'SET_CONSTANTS', payload: constants });
      console.log('[Budget] Constant deleted, remaining:', constants.length);
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
      console.log('[Budget] Deleting expense:', expenseId);
      await fsDeleteExpense(uid, expenseId);
      const currentMonth = formatMonthKey(getToday());
      const expenses = await fsGetExpensesByMonth(uid, currentMonth);
      dispatch({ type: 'SET_EXPENSES', payload: expenses });
      console.log('[Budget] Expense deleted, remaining:', expenses.length);
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
