// ============================================================
// LEFTOVER - Complete Type System
// ============================================================

export type Language = 'en' | 'es' | 'fr';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD';
export type ResetFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';
export type WeekEndAction = 'carry-over' | 'savings' | 'reset';

export interface NotificationPreferences {
  threeDaysBeforeReset: boolean;
  onResetDay: boolean;
  autoReset: boolean;
  paydayCountdown: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  language: Language;
  darkMode: boolean;
  currency: Currency;
  resetDay: number;
  resetFrequency: ResetFrequency;
  notifications: NotificationPreferences;
  subscription: {
    status: SubscriptionStatus;
    trialStartDate: string;
    trialEndDate: string;
    currentPeriodEnd: string | null;
    revenueCatId: string | null;
  };
  weekCarryOver?: number;
  lastWeekProcessed?: number;
  weekEndPreference?: WeekEndAction;
  createdAt: string;
  updatedAt: string;
}

export type IncomeFrequency = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Income {
  id: string;
  userId: string;
  name: string;
  type: IncomeFrequency;
  amount: number;
  semiMonthlyDates: [number, number] | null;
  dayOfWeek: DayOfWeek | null;
  monthlyDate: number | null;
  isLocked: boolean;
  lockUntilDate: string | null;
  monthlyTotal: number;
  nextPayday: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ConstantFrequency = 'weekly' | 'bi-weekly' | 'monthly';
export type ConstantCategory =
  | 'rent' | 'mortgage' | 'groceries' | 'utilities' | 'transport'
  | 'insurance' | 'subscriptions' | 'phone' | 'internet'
  | 'childcare' | 'debt' | 'other';

export interface Constant {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: ConstantFrequency;
  dayOfWeek: DayOfWeek | null;
  dueDate: number | null;
  category: ConstantCategory;
  monthlyTotal: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 'Food' | 'Transport' | 'Entertainment' | 'Utilities' | 'Shopping' | 'Other';

export const EXPENSE_CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  Food: '🍔', Transport: '🚗', Entertainment: '🎬',
  Utilities: '💡', Shopping: '🛍️', Other: '📌',
};

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: string;
  weekNumber: number;
  month: string;
  createdAt: string;
}

export type SavingsTargetType = 'fixed' | 'percentage';

export interface Savings {
  id: string;
  userId: string;
  currentAmount: number;
  monthlyTarget: number;
  targetType: SavingsTargetType;
  targetPercentage: number | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBreakdown {
  [category: string]: number;
}

export interface WeeklyBreakdown {
  [weekKey: string]: {
    budget: number;
    spent: number;
    remaining: number;
    carryOver: number;
  };
}

export interface MonthComparison {
  previousMonth: string;
  totalSpendingChange: number;
  categoryChanges: { [category: string]: { amount: number; percentChange: number } };
}

export interface HistoricalMonth {
  id: string;
  userId: string;
  totalIncome: number;
  totalConstants: number;
  totalExpenses: number;
  totalSaved: number;
  monthlyBudget: number;
  weeklyBudgetBase: number;
  categorySpending: CategoryBreakdown;
  weeklyBreakdown: WeeklyBreakdown;
  comparison: MonthComparison | null;
  savingsGoalMet: boolean;
  unusedBudget: number;
  unusedBudgetAction: 'carry-over' | 'savings' | 'weekly-boost' | null;
  notes: string;
  archivedAt: string;
}

export interface WeekInfo {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  baseBudget: number;
  carryOver: number;
  adjustedBudget: number;
  spent: number;
  remaining: number;
  daysLeft: number;
}

export interface BudgetState {
  totalMonthlyIncome: number;
  nextPayday: Date | null;
  daysUntilPayday: number;
  totalMonthlyConstants: number;
  constantsList: Constant[];
  monthlyAvailable: number;
  weeklyBudget: number;
  currentWeekNumber: number;
  currentWeekSpent: number;
  currentWeekRemaining: number;
  currentWeekCarryOver: number;
  currentWeekAdjustedBudget: number;
  currentWeek: WeekInfo;
  previousWeeks: WeekInfo[];
  savingsTarget: number;
  savingsCurrent: number;
  savingsOnTrack: boolean;
  currentMonthExpenses: Expense[];
  currentMonthTotal: number;
  categoryBreakdown: CategoryBreakdown;
  greeting: string;
  recommendations: string[];
  currentMonth: string;
  resetDay: number;
  daysUntilReset: number;
}

export interface FirestoreTimestamp { seconds: number; nanoseconds: number; }

export type CreateIncome = Omit<Income, 'id' | 'createdAt' | 'updatedAt' | 'monthlyTotal' | 'nextPayday'>;
export type CreateConstant = Omit<Constant, 'id' | 'createdAt' | 'updatedAt' | 'monthlyTotal'>;
export type CreateExpense = Omit<Expense, 'id' | 'createdAt'>;
export type CreateSavings = Omit<Savings, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateIncome = Partial<Omit<Income, 'id' | 'userId'>> & { id: string };
export type UpdateConstant = Partial<Omit<Constant, 'id' | 'userId'>> & { id: string };
export type UpdateSavings = Partial<Omit<Savings, 'id' | 'userId'>> & { id: string };
