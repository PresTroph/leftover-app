'use client';

import React, { createContext, useCallback, useReducer } from 'react';

export interface Transaction {
  amount: number;
  description: string;
  category: string;
  date: string;
}

export interface BudgetContextType {
  weeklyBudget: number;
  transactions: Transaction[];
  language: string;
  setBudget: (budget: number) => void;
  addTransaction: (transaction: Transaction) => void;
  deleteTransaction: (index: number) => void;
  setLanguage: (lang: string) => void;
}

const initialState = {
  weeklyBudget: 300,
  transactions: [] as Transaction[],
  language: 'English',
};

type Action =
  | { type: 'SET_BUDGET'; payload: number }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: number }
  | { type: 'SET_LANGUAGE'; payload: string };

function budgetReducer(state: typeof initialState, action: Action) {
  switch (action.type) {
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
    default:
      return state;
  }
}

export const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);

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

  const value: BudgetContextType = {
    weeklyBudget: state.weeklyBudget,
    transactions: state.transactions,
    language: state.language,
    setBudget,
    addTransaction,
    deleteTransaction,
    setLanguage,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
}