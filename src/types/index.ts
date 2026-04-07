// ============================================================
// LEFTOVER - Complete Type System
// All Firestore data models + app-level types
// ============================================================

// ─── USER ────────────────────────────────────────────────────

export type Language = 'en' | 'es' | 'fr';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';
export type ResetFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export interface NotificationPreferences {
  threeDaysBeforeReset: boolean;
  onResetDay: boolean;
  autoReset: boolean; // if false, user confirms reset manually
  paydayCountdown: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  language: Language;
  darkMode: boolean;
  currency: Currency;
  resetDay: number; // 1-31
  resetFrequency: ResetFrequency;
  notifications: NotificationPreferences;
  subscription: {
    status: SubscriptionStatus;
    trialStartDate: string; // ISO date
    trialEndDate: string; // ISO date
    currentPeriodEnd: string | null; // ISO date
    revenueCatId: string | null; // RevenueCat customer ID
  };
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

// ─── INCOME ──────────────────────────────────────────────────

export type IncomeFrequency = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Income {
  id: string;
  userId: string;
  name: string; // e.g., "Main Job", "Freelance"
  type: IncomeFrequency;
  amount: number; // per-period amount (NOT monthly total)
  // Semi-monthly specific: two dates per month (e.g., [7, 22])
  semiMonthlyDates: [number, number] | null;
  // Weekly/bi-weekly specific: which day of the week
  dayOfWeek: DayOfWeek | null;
  // Monthly specific: which day of the month (e.g., 1 or 15)
  monthlyDate: number | null;
  // Lock income for X months (no changes allowed)
  isLocked: boolean;
  lockUntilDate: string | null; // ISO date
  // Calculated fields (stored for quick reads)
  monthlyTotal: number; // auto-calculated based on type + amount
  nextPayday: string; // ISO date, auto-calculated
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── CONSTANTS (Recurring Necessities) ───────────────────────

export type ConstantFrequency = 'weekly' | 'bi-weekly' | 'monthly';
export type ConstantCategory =
  | 'rent'
  | 'mortgage'
  | 'groceries'
  | 'utilities'
  | 'transport'
  | 'insurance'
  | 'subscriptions'
  | 'phone'
  | 'internet'
  | 'childcare'
  | 'debt'
  | 'other';

export interface Constant {
  id: string;
  userId: string;
  name: string; // e.g., "Rent", "MetroCard", "Groceries"
  amount: number; // per-period amount
  frequency: ConstantFrequency;
  // Weekly/bi-weekly: which day it hits
  dayOfWeek: DayOfWeek | null;
  // Monthly: which day of month (e.g., 1 for rent)
  dueDate: number | null;
  category: ConstantCategory;
  monthlyTotal: number; // auto-calculated
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── EXPENSES (Individual Transactions) ──────────────────────

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Entertainment'
  | 'Utilities'
  | 'Shopping'
  | 'Other';

export const EXPENSE_CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  Food: '🍔',
  Transport: '🚗',
  Entertainment: '🎬',
  Utilities: '💡',
  Shopping: '🛍️',
  Other: '📌',
};

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string; // ISO date
  weekNumber: number; // 1-5 within the budget month
  month: string; // "YYYY-MM" for easy querying
  createdAt: string;
}

// ─── SAVINGS ─────────────────────────────────────────────────

export type SavingsTargetType = 'fixed' | 'percentage';

export interface Savings {
  id: string;
  userId: string;
  currentAmount: number;
  monthlyTarget: number;
  targetType: SavingsTargetType; // $ amount or % of income
  targetPercentage: number | null; // if targetType is 'percentage'
  isLocked: boolean; // mental lock, not bank-enforced
  createdAt: string;
  updatedAt: string;
}

// ─── HISTORICAL MONTH (Pre-calculated Analytics) ─────────────

export interface CategoryBreakdown {
  [category: string]: number; // e.g., { food: 300, transport: 250 }
}

export interface WeeklyBreakdown {
  [weekKey: string]: {
    budget: number;
    spent: number;
    remaining: number;
  };
}

export interface MonthComparison {
  previousMonth: string; // "YYYY-MM"
  totalSpendingChange: number; // percentage change
  categoryChanges: {
    [category: string]: {
      amount: number;
      percentChange: number;
    };
  };
}

export interface HistoricalMonth {
  id: string; // "YYYY-MM"
  userId: string;
  totalIncome: number;
  totalConstants: number;
  totalExpenses: number;
  totalSaved: number;
  monthlyBudget: number; // income - constants
  weeklyBudgetBase: number; // monthlyBudget / 4.33
  categorySpending: CategoryBreakdown;
  weeklyBreakdown: WeeklyBreakdown;
  comparison: MonthComparison | null; // null for first month
  savingsGoalMet: boolean;
  unusedBudget: number;
  unusedBudgetAction: 'carry-over' | 'savings' | 'weekly-boost' | null;
  notes: string;
  archivedAt: string; // ISO date
}

// ─── BUDGET STATE (Computed, In-Memory) ──────────────────────
// This is NOT stored in Firestore — it's calculated from the
// above collections and held in React Context for the UI.

export interface BudgetState {
  // Income
  totalMonthlyIncome: number;
  nextPayday: Date | null;
  daysUntilPayday: number;

  // Constants
  totalMonthlyConstants: number;
  constantsList: Constant[];

  // Budget
  monthlyAvailable: number; // income - constants
  weeklyBudget: number; // monthlyAvailable / 4.33
  currentWeekNumber: number;
  currentWeekSpent: number;
  currentWeekRemaining: number;

  // Savings
  savingsTarget: number;
  savingsCurrent: number;
  savingsOnTrack: boolean;

  // Expenses
  currentMonthExpenses: Expense[];
  currentMonthTotal: number;
  categoryBreakdown: CategoryBreakdown;

  // AI/Recommendations
  greeting: string;
  recommendations: string[];

  // Meta
  currentMonth: string; // "YYYY-MM"
  resetDay: number;
  daysUntilReset: number;
}

// ─── HELPER TYPES ────────────────────────────────────────────

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

// For creating new documents (omit id, auto-generate timestamps)
export type CreateIncome = Omit<Income, 'id' | 'createdAt' | 'updatedAt' | 'monthlyTotal' | 'nextPayday'>;
export type CreateConstant = Omit<Constant, 'id' | 'createdAt' | 'updatedAt' | 'monthlyTotal'>;
export type CreateExpense = Omit<Expense, 'id' | 'createdAt'>;
export type CreateSavings = Omit<Savings, 'id' | 'createdAt' | 'updatedAt'>;

// For updating documents (all fields optional except id)
export type UpdateIncome = Partial<Omit<Income, 'id' | 'userId'>> & { id: string };
export type UpdateConstant = Partial<Omit<Constant, 'id' | 'userId'>> & { id: string };
export type UpdateSavings = Partial<Omit<Savings, 'id' | 'userId'>> & { id: string };
