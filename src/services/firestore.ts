// ============================================================
// LEFTOVER - Firestore Service
// All CRUD operations + queries for Firebase
// ============================================================
//
// SETUP: Install Firebase in your Expo project:
//   npx expo install firebase
//
// Then create src/config/firebase.ts with your config.
// See firebaseConfig.ts in this folder for the template.
// ============================================================

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';

import { db } from '../config/firebase';

import {
    Constant,
    CreateConstant,
    CreateExpense,
    CreateIncome,
    CreateSavings,
    Expense,
    HistoricalMonth,
    Income,
    Savings,
    UpdateConstant,
    UpdateIncome,
    UpdateSavings,
    User
} from '../types';

import {
    calculateCategoryBreakdown,
    calculateMonthlyAvailable,
    calculateMonthlyConstant,
    calculateMonthlyIncome,
    calculateMonthTotal,
    calculateNextPayday,
    calculateTotalMonthlyConstants,
    calculateTotalMonthlyIncome,
    calculateWeeklyBudget,
    formatMonthKey,
    getToday,
} from '../engine/calculations';

// ─── HELPERS ─────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

// ─── USER OPERATIONS ─────────────────────────────────────────

/**
 * Create a new user document after Sign in with Apple/Google.
 * Called once during onboarding completion.
 */
export async function createUser(userId: string, data: Partial<User>): Promise<void> {
  const user: Omit<User, 'id'> = {
    email: data.email || '',
    name: data.name || '',
    language: data.language || 'en',
    darkMode: data.darkMode ?? true,
    currency: data.currency || 'USD',
    resetDay: data.resetDay || 1,
    resetFrequency: data.resetFrequency || 'monthly',
    notifications: data.notifications || {
      threeDaysBeforeReset: true,
      onResetDay: true,
      autoReset: false,
      paydayCountdown: true,
    },
    subscription: data.subscription || {
      status: 'trial',
      trialStartDate: now(),
      trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: null,
      revenueCatId: null,
    },
    createdAt: now(),
    updatedAt: now(),
  };

  await setDoc(doc(db, 'users', userId), user);
}

/**
 * Get user document by ID.
 */
export async function getUser(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
}

/**
 * Update user settings.
 */
export async function updateUser(userId: string, data: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    ...data,
    updatedAt: now(),
  });
}

// ─── INCOME OPERATIONS ──────────────────────────────────────

/**
 * Add a new income source.
 * Auto-calculates monthlyTotal and nextPayday.
 */
export async function addIncome(userId: string, data: CreateIncome): Promise<string> {
  const monthlyTotal = calculateMonthlyIncome(data.amount, data.type);

  const incomeData = {
    ...data,
    monthlyTotal,
    nextPayday: '', // will be calculated after creation
    createdAt: now(),
    updatedAt: now(),
  };

  const ref = await addDoc(collection(db, 'users', userId, 'income'), incomeData);

  // Calculate next payday now that we have an ID
  const fullIncome: Income = { id: ref.id, ...incomeData };
  try {
    const nextPayday = calculateNextPayday(fullIncome);
    await updateDoc(ref, { nextPayday: nextPayday.toISOString() });
  } catch {
    // If calculation fails (missing fields), leave empty
  }

  return ref.id;
}

/**
 * Get all income sources for a user.
 */
export async function getIncomes(userId: string): Promise<Income[]> {
  const snap = await getDocs(collection(db, 'users', userId, 'income'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Income);
}

/**
 * Update an income source. Recalculates monthlyTotal and nextPayday.
 */
export async function updateIncome(userId: string, data: UpdateIncome): Promise<void> {
  const ref = doc(db, 'users', userId, 'income', data.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Income not found');

  const current = { id: snap.id, ...snap.data() } as Income;
  const merged = { ...current, ...data };

  // Recalculate if amount or type changed
  const monthlyTotal = calculateMonthlyIncome(merged.amount, merged.type);
  let nextPayday = current.nextPayday;
  try {
    nextPayday = calculateNextPayday(merged as Income).toISOString();
  } catch {
    // Keep existing
  }

  await updateDoc(ref, {
    ...data,
    monthlyTotal,
    nextPayday,
    updatedAt: now(),
  });
}

/**
 * Delete an income source.
 */
export async function deleteIncome(userId: string, incomeId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'income', incomeId));
}

// ─── CONSTANTS OPERATIONS ───────────────────────────────────

/**
 * Add a new recurring constant/necessity.
 * Auto-calculates monthlyTotal.
 */
export async function addConstant(userId: string, data: CreateConstant): Promise<string> {
  const monthlyTotal = calculateMonthlyConstant(data.amount, data.frequency);

  const ref = await addDoc(collection(db, 'users', userId, 'constants'), {
    ...data,
    monthlyTotal,
    createdAt: now(),
    updatedAt: now(),
  });

  return ref.id;
}

/**
 * Get all constants for a user.
 */
export async function getConstants(userId: string): Promise<Constant[]> {
  const snap = await getDocs(collection(db, 'users', userId, 'constants'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Constant);
}

/**
 * Update a constant. Recalculates monthlyTotal.
 */
export async function updateConstant(userId: string, data: UpdateConstant): Promise<void> {
  const ref = doc(db, 'users', userId, 'constants', data.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Constant not found');

  const current = { id: snap.id, ...snap.data() } as Constant;
  const merged = { ...current, ...data };
  const monthlyTotal = calculateMonthlyConstant(merged.amount, merged.frequency);

  await updateDoc(ref, {
    ...data,
    monthlyTotal,
    updatedAt: now(),
  });
}

/**
 * Delete a constant.
 */
export async function deleteConstant(userId: string, constantId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'constants', constantId));
}

// ─── EXPENSE OPERATIONS ─────────────────────────────────────

/**
 * Add a new expense. The 3-tap flow ends here.
 * Automatically tags with current week number and month.
 */
export async function addExpense(userId: string, data: CreateExpense): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'expenses'), {
    ...data,
    createdAt: now(),
  });
  return ref.id;
}

/**
 * Get expenses for the current month.
 */
export async function getExpensesByMonth(userId: string, month: string): Promise<Expense[]> {
  const q = query(
    collection(db, 'users', userId, 'expenses'),
    where('month', '==', month),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense);
}

/**
 * Get expenses for a specific week in the current month.
 */
export async function getExpensesByWeek(
  userId: string,
  month: string,
  weekNumber: number
): Promise<Expense[]> {
  const q = query(
    collection(db, 'users', userId, 'expenses'),
    where('month', '==', month),
    where('weekNumber', '==', weekNumber),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense);
}

/**
 * Get expenses filtered by category for the current month.
 */
export async function getExpensesByCategory(
  userId: string,
  month: string,
  category: string
): Promise<Expense[]> {
  const q = query(
    collection(db, 'users', userId, 'expenses'),
    where('month', '==', month),
    where('category', '==', category),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense);
}

/**
 * Delete an expense (swipe to delete).
 */
export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'expenses', expenseId));
}

// ─── SAVINGS OPERATIONS ─────────────────────────────────────

/**
 * Create or set up savings goal.
 * Only one savings doc per user (use 'main' as ID).
 */
export async function setSavings(userId: string, data: CreateSavings): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'savings', 'main'), {
    ...data,
    createdAt: now(),
    updatedAt: now(),
  });
}

/**
 * Get the user's savings.
 */
export async function getSavings(userId: string): Promise<Savings | null> {
  const snap = await getDoc(doc(db, 'users', userId, 'savings', 'main'));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Savings;
}

/**
 * Update savings (add to savings, withdraw, toggle lock, etc.)
 */
export async function updateSavings(userId: string, data: UpdateSavings): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'savings', 'main'), {
    ...data,
    updatedAt: now(),
  });
}

/**
 * Add to savings amount.
 */
export async function addToSavings(userId: string, amount: number): Promise<void> {
  const current = await getSavings(userId);
  if (!current) throw new Error('No savings goal set up');
  await updateSavings(userId, {
    id: 'main',
    currentAmount: Math.round((current.currentAmount + amount) * 100) / 100,
  });
}

/**
 * Withdraw from savings back to budget.
 */
export async function withdrawFromSavings(userId: string, amount: number): Promise<void> {
  const current = await getSavings(userId);
  if (!current) throw new Error('No savings goal set up');
  if (current.isLocked) throw new Error('Savings are locked. Unlock first.');
  const newAmount = Math.max(0, Math.round((current.currentAmount - amount) * 100) / 100);
  await updateSavings(userId, { id: 'main', currentAmount: newAmount });
}

/**
 * Delete savings goal entirely.
 */
export async function deleteSavings(userId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'savings', 'main'));
}

/**
 * Update the week carry-over amount on the user doc.
 * Called when a week ends and user makes their choice (carry-over, savings, reset).
 */
export async function updateWeekCarryOver(
  userId: string,
  carryOver: number,
  lastWeekProcessed: number,
  preference?: 'carry-over' | 'savings' | 'reset'
): Promise<void> {
  const updateData: Record<string, unknown> = {
    weekCarryOver: carryOver,
    lastWeekProcessed,
    updatedAt: new Date().toISOString(),
  };
  if (preference) {
    updateData.weekEndPreference = preference;
  }
  await updateDoc(doc(db, 'users', userId), updateData);
}

// ─── HISTORY / ARCHIVE OPERATIONS ───────────────────────────

/**
 * Archive the current month's data to history.
 * Called on reset day. Writes pre-calculated totals for cheap reads.
 */
export async function archiveMonth(
  userId: string,
  month: string,
  incomes: Income[],
  constants: Constant[],
  expenses: Expense[],
  savings: Savings | null,
  unusedBudgetAction: 'carry-over' | 'savings' | 'weekly-boost' | null
): Promise<void> {
  const totalIncome = calculateTotalMonthlyIncome(incomes);
  const totalConstants = calculateTotalMonthlyConstants(constants);
  const totalExpenses = calculateMonthTotal(expenses);
  const monthlyAvailable = calculateMonthlyAvailable(totalIncome, totalConstants);
  const weeklyBudget = calculateWeeklyBudget(monthlyAvailable);

  // Get previous month for comparison
  const prevMonth = getPreviousMonthKey(month);
  const prevHistory = await getHistoricalMonth(userId, prevMonth);

  let comparison = null;
  if (prevHistory) {
    const totalChange = prevHistory.totalExpenses > 0
      ? Math.round(((totalExpenses - prevHistory.totalExpenses) / prevHistory.totalExpenses) * 100 * 100) / 100
      : 0;

    const currentBreakdown = calculateCategoryBreakdown(expenses);
    const categoryChanges: Record<string, { amount: number; percentChange: number }> = {};

    for (const [cat, amount] of Object.entries(currentBreakdown)) {
      const prevAmount = prevHistory.categorySpending[cat] || 0;
      categoryChanges[cat] = {
        amount: Math.round((amount - prevAmount) * 100) / 100,
        percentChange: prevAmount > 0
          ? Math.round(((amount - prevAmount) / prevAmount) * 100 * 100) / 100
          : 0,
      };
    }

    comparison = {
      previousMonth: prevMonth,
      totalSpendingChange: totalChange,
      categoryChanges,
    };
  }

  const historyDoc: Omit<HistoricalMonth, 'id'> = {
    userId,
    totalIncome,
    totalConstants,
    totalExpenses,
    totalSaved: savings?.currentAmount || 0,
    monthlyBudget: monthlyAvailable,
    weeklyBudgetBase: weeklyBudget,
    categorySpending: calculateCategoryBreakdown(expenses),
    weeklyBreakdown: (() => {
      const breakdown: Record<string, { budget: number; spent: number; remaining: number; carryOver: number }> = {};
      for (let week = 1; week <= 5; week++) {
        const spent = expenses
          .filter((expense) => expense.weekNumber === week)
          .reduce((sum, expense) => sum + expense.amount, 0);
        breakdown[`week${week}`] = {
          budget: weeklyBudget,
          spent: Math.round(spent * 100) / 100,
          remaining: Math.round((weeklyBudget - spent) * 100) / 100,
          carryOver: 0,
        };
      }
      return breakdown;
    })(),
    comparison,
    savingsGoalMet: savings ? savings.currentAmount >= savings.monthlyTarget : false,
    unusedBudget: Math.round((monthlyAvailable - totalExpenses) * 100) / 100,
    unusedBudgetAction,
    notes: '',
    archivedAt: now(),
  };

  await setDoc(doc(db, 'users', userId, 'history', month), historyDoc);
}

/**
 * Get a historical month's data.
 */
export async function getHistoricalMonth(
  userId: string,
  month: string
): Promise<HistoricalMonth | null> {
  const snap = await getDoc(doc(db, 'users', userId, 'history', month));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as HistoricalMonth;
}

/**
 * Get all historical months (for analytics timeline).
 * Limited to last 12 months.
 */
export async function getHistoricalMonths(
  userId: string,
  monthLimit: number = 12
): Promise<HistoricalMonth[]> {
  const q = query(
    collection(db, 'users', userId, 'history'),
    orderBy('archivedAt', 'desc'),
    limit(monthLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HistoricalMonth);
}

// ─── RESET ENGINE ───────────────────────────────────────────

/**
 * Execute the monthly reset.
 * 1. Archive current month
 * 2. Handle unused budget based on user preference
 * 3. Reset savings tracking for new month (keep accumulated amount)
 *
 * Call this either automatically (if autoReset) or after user confirms.
 */
export async function executeReset(
  userId: string,
  unusedBudgetAction: 'carry-over' | 'savings' | 'weekly-boost'
): Promise<void> {
  // Gather current month data
  const currentMonth = formatMonthKey(getToday());
  const [incomes, constants, expenses, savings] = await Promise.all([
    getIncomes(userId),
    getConstants(userId),
    getExpensesByMonth(userId, currentMonth),
    getSavings(userId),
  ]);

  const totalIncome = calculateTotalMonthlyIncome(incomes);
  const totalConstants = calculateTotalMonthlyConstants(constants);
  const monthlyAvailable = calculateMonthlyAvailable(totalIncome, totalConstants);
  const totalExpenses = calculateMonthTotal(expenses);
  const unused = Math.max(0, monthlyAvailable - totalExpenses);

  // 1. Archive
  await archiveMonth(userId, currentMonth, incomes, constants, expenses, savings, unusedBudgetAction);

  // 2. Handle unused budget
  if (unused > 0 && savings) {
    switch (unusedBudgetAction) {
      case 'savings':
        await addToSavings(userId, unused);
        break;
      case 'carry-over':
        // Carry-over is handled in the next month's budget calculation
        // Store as a note in the user doc
        await updateUser(userId, {
          // @ts-ignore - extending user with carryOver field
          carryOverAmount: unused,
        });
        break;
      case 'weekly-boost':
        // Same as carry-over but spread across weeks
        await updateUser(userId, {
          // @ts-ignore
          weeklyBoostAmount: Math.round((unused / 4.33) * 100) / 100,
        });
        break;
    }
  }
}

// ─── UTILITY ────────────────────────────────────────────────

/**
 * Get the previous month key from a "YYYY-MM" string.
 */
function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

/**
 * Load all data needed to build the full BudgetState.
 * Single function to call from the BudgetContext provider.
 */
export async function loadBudgetData(userId: string) {
  const currentMonth = formatMonthKey(getToday());

  const [user, incomes, constants, expenses, savings] = await Promise.all([
    getUser(userId),
    getIncomes(userId),
    getConstants(userId),
    getExpensesByMonth(userId, currentMonth),
    getSavings(userId),
  ]);

  return { user, incomes, constants, expenses, savings, currentMonth };
}
