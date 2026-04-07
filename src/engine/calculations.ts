// ============================================================
// LEFTOVER - Calculation Engine
// All financial math: payday, constants, budgets, weeks
// ============================================================

import {
    BudgetState,
    CategoryBreakdown,
    Constant,
    ConstantFrequency,
    DayOfWeek,
    Expense,
    Income,
    IncomeFrequency,
    Savings,
    WeeklyBreakdown
} from '../types';

// ─── DATE HELPERS ────────────────────────────────────────────

const DAY_MAP: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Get today's date at midnight (no time component).
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Format date as "YYYY-MM" for month keys.
 */
export function formatMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Get the number of days in a given month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Calculate days between two dates (absolute).
 */
export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil(Math.abs(b.getTime() - a.getTime()) / msPerDay);
}

/**
 * Get the next occurrence of a specific day of the week.
 * If today IS that day, returns today.
 */
export function getNextDayOfWeek(dayOfWeek: DayOfWeek, from?: Date): Date {
  const today = from || getToday();
  const targetDay = DAY_MAP[dayOfWeek];
  const currentDay = today.getDay();
  let daysAhead = targetDay - currentDay;
  if (daysAhead < 0) daysAhead += 7;
  const result = new Date(today);
  result.setDate(result.getDate() + daysAhead);
  return result;
}

/**
 * Get the next occurrence of a specific date in a month.
 * If that date has passed this month, returns next month's date.
 * Handles months with fewer days (e.g., day 31 in a 30-day month → 30th).
 */
export function getNextMonthlyDate(dayOfMonth: number, from?: Date): Date {
  const today = from || getToday();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Clamp to actual days in current month
  const daysThisMonth = getDaysInMonth(year, month);
  const clampedDay = Math.min(dayOfMonth, daysThisMonth);
  const thisMonthDate = new Date(year, month, clampedDay);

  if (thisMonthDate >= today) {
    return thisMonthDate;
  }

  // Already passed this month, go to next month
  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const actualNextMonth = nextMonth > 11 ? 0 : nextMonth;
  const daysNextMonth = getDaysInMonth(nextYear, actualNextMonth);
  const clampedNextDay = Math.min(dayOfMonth, daysNextMonth);

  return new Date(nextYear, actualNextMonth, clampedNextDay);
}

// ─── INCOME CALCULATIONS ────────────────────────────────────

/**
 * Calculate the monthly total for an income source based on its frequency.
 * - Weekly: amount × 4.33
 * - Bi-weekly: amount × 2.167
 * - Semi-monthly: amount × 2
 * - Monthly: amount × 1
 */
export function calculateMonthlyIncome(amount: number, type: IncomeFrequency): number {
  switch (type) {
    case 'weekly':
      return Math.round(amount * 4.33 * 100) / 100;
    case 'bi-weekly':
      return Math.round(amount * 2.167 * 100) / 100;
    case 'semi-monthly':
      return Math.round(amount * 2 * 100) / 100;
    case 'monthly':
      return amount;
  }
}

/**
 * Calculate the next payday for a given income source.
 */
export function calculateNextPayday(income: Income): Date {
  const today = getToday();

  switch (income.type) {
    case 'weekly': {
      if (!income.dayOfWeek) throw new Error('Weekly income requires dayOfWeek');
      return getNextDayOfWeek(income.dayOfWeek, today);
    }

    case 'bi-weekly': {
      if (!income.dayOfWeek) throw new Error('Bi-weekly income requires dayOfWeek');
      // Find next occurrence of the day, then check if it's an "on" week
      // We use the createdAt as the anchor point for bi-weekly cycle
      const anchor = new Date(income.createdAt);
      const nextDay = getNextDayOfWeek(income.dayOfWeek, today);
      const weeksDiff = Math.floor(daysBetween(anchor, nextDay) / 7);
      // If odd number of weeks from anchor, skip to next week
      if (weeksDiff % 2 !== 0) {
        nextDay.setDate(nextDay.getDate() + 7);
      }
      return nextDay;
    }

    case 'semi-monthly': {
      if (!income.semiMonthlyDates) throw new Error('Semi-monthly income requires dates');
      const [date1, date2] = income.semiMonthlyDates;
      const next1 = getNextMonthlyDate(date1, today);
      const next2 = getNextMonthlyDate(date2, today);
      return next1 <= next2 ? next1 : next2;
    }

    case 'monthly': {
      if (!income.monthlyDate) throw new Error('Monthly income requires monthlyDate');
      return getNextMonthlyDate(income.monthlyDate, today);
    }
  }
}

/**
 * Calculate total monthly income from all active income sources.
 */
export function calculateTotalMonthlyIncome(incomes: Income[]): number {
  return incomes
    .filter((i) => i.active)
    .reduce((sum, i) => sum + calculateMonthlyIncome(i.amount, i.type), 0);
}

/**
 * Get the soonest next payday across all income sources.
 */
export function getNextPaydayAcrossAll(incomes: Income[]): { date: Date; daysUntil: number; incomeName: string } | null {
  const active = incomes.filter((i) => i.active);
  if (active.length === 0) return null;

  let soonest: { date: Date; daysUntil: number; incomeName: string } | null = null;

  for (const income of active) {
    try {
      const nextDate = calculateNextPayday(income);
      const days = daysBetween(getToday(), nextDate);
      if (!soonest || days < soonest.daysUntil) {
        soonest = { date: nextDate, daysUntil: days, incomeName: income.name };
      }
    } catch {
      // Skip income sources with missing config
      continue;
    }
  }

  return soonest;
}

// ─── CONSTANTS CALCULATIONS ─────────────────────────────────

/**
 * Calculate the monthly total for a recurring constant.
 * - Weekly: amount × 4.33
 * - Bi-weekly: amount × 2.167
 * - Monthly: amount × 1
 */
export function calculateMonthlyConstant(amount: number, frequency: ConstantFrequency): number {
  switch (frequency) {
    case 'weekly':
      return Math.round(amount * 4.33 * 100) / 100;
    case 'bi-weekly':
      return Math.round(amount * 2.167 * 100) / 100;
    case 'monthly':
      return amount;
  }
}

/**
 * Calculate total monthly constants from all active constants.
 */
export function calculateTotalMonthlyConstants(constants: Constant[]): number {
  return constants
    .filter((c) => c.active)
    .reduce((sum, c) => sum + calculateMonthlyConstant(c.amount, c.frequency), 0);
}

// ─── BUDGET CALCULATIONS ────────────────────────────────────

const WEEKS_PER_MONTH = 4.33;

/**
 * Calculate the monthly available budget (after constants).
 */
export function calculateMonthlyAvailable(totalIncome: number, totalConstants: number): number {
  return Math.round((totalIncome - totalConstants) * 100) / 100;
}

/**
 * Calculate the base weekly budget.
 */
export function calculateWeeklyBudget(monthlyAvailable: number): number {
  return Math.round((monthlyAvailable / WEEKS_PER_MONTH) * 100) / 100;
}

/**
 * Determine which week number we're in relative to the reset day.
 * Week 1 starts on the reset day, week 2 starts 7 days later, etc.
 */
export function getCurrentWeekNumber(resetDay: number, date?: Date): number {
  const today = date || getToday();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Find the reset date for the current budget month
  const daysInMonth = getDaysInMonth(year, month);
  const clampedResetDay = Math.min(resetDay, daysInMonth);

  let resetDate: Date;
  if (today.getDate() >= clampedResetDay) {
    // We're past the reset day this month — current cycle started this month
    resetDate = new Date(year, month, clampedResetDay);
  } else {
    // We haven't hit reset day yet — current cycle started last month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    const clampedPrev = Math.min(resetDay, daysInPrevMonth);
    resetDate = new Date(prevYear, prevMonth, clampedPrev);
  }

  const daysSinceReset = daysBetween(resetDate, today);
  return Math.floor(daysSinceReset / 7) + 1; // 1-indexed
}

/**
 * Calculate days until the next reset date.
 */
export function getDaysUntilReset(resetDay: number, date?: Date): number {
  const today = date || getToday();
  const nextReset = getNextMonthlyDate(resetDay, today);
  // If today IS the reset day, next reset is next month
  if (nextReset.getTime() === today.getTime()) {
    const nextMonth = today.getMonth() + 1;
    const nextYear = nextMonth > 11 ? today.getFullYear() + 1 : today.getFullYear();
    const actualMonth = nextMonth > 11 ? 0 : nextMonth;
    const daysInNext = getDaysInMonth(nextYear, actualMonth);
    const clamped = Math.min(resetDay, daysInNext);
    return daysBetween(today, new Date(nextYear, actualMonth, clamped));
  }
  return daysBetween(today, nextReset);
}

// ─── EXPENSE CALCULATIONS ───────────────────────────────────

/**
 * Calculate category breakdown from a list of expenses.
 */
export function calculateCategoryBreakdown(expenses: Expense[]): CategoryBreakdown {
  const breakdown: CategoryBreakdown = {};
  for (const expense of expenses) {
    const cat = expense.category;
    breakdown[cat] = (breakdown[cat] || 0) + expense.amount;
  }
  // Round all values
  for (const key of Object.keys(breakdown)) {
    breakdown[key] = Math.round(breakdown[key] * 100) / 100;
  }
  return breakdown;
}

/**
 * Calculate total spending for a given week number.
 */
export function calculateWeekSpending(expenses: Expense[], weekNumber: number): number {
  return expenses
    .filter((e) => e.weekNumber === weekNumber)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate total spending for the current month.
 */
export function calculateMonthTotal(expenses: Expense[]): number {
  return Math.round(expenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
}

/**
 * Build the weekly breakdown for a full month.
 */
export function buildWeeklyBreakdown(
  expenses: Expense[],
  weeklyBudget: number,
  maxWeeks: number = 5
): WeeklyBreakdown {
  const breakdown: WeeklyBreakdown = {};
  for (let w = 1; w <= maxWeeks; w++) {
    const spent = calculateWeekSpending(expenses, w);
    breakdown[`week${w}`] = {
      budget: weeklyBudget,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round((weeklyBudget - spent) * 100) / 100,
    };
  }
  return breakdown;
}

// ─── SAVINGS CALCULATIONS ───────────────────────────────────

/**
 * Calculate the monthly savings target.
 * If percentage-based, calculate from total income.
 */
export function calculateSavingsTarget(savings: Savings, totalMonthlyIncome: number): number {
  if (savings.targetType === 'percentage' && savings.targetPercentage !== null) {
    return Math.round((totalMonthlyIncome * savings.targetPercentage) / 100 * 100) / 100;
  }
  return savings.monthlyTarget;
}

/**
 * Check if savings are on track for the month.
 * Compares current savings to prorated target based on day of month.
 */
export function isSavingsOnTrack(
  currentAmount: number,
  monthlyTarget: number,
  dayOfMonth: number,
  daysInMonth: number
): boolean {
  const proratedTarget = (monthlyTarget / daysInMonth) * dayOfMonth;
  return currentAmount >= proratedTarget;
}

// ─── AI GREETING ─────────────────────────────────────────────

/**
 * Generate a time-based greeting.
 */
export function getTimeBasedGreeting(name: string, language: 'en' | 'es' | 'fr' = 'en'): string {
  const hour = new Date().getHours();

  const greetings = {
    en: {
      morning: `Good morning, ${name}`,
      afternoon: `Good afternoon, ${name}`,
      evening: `Good evening, ${name}`,
    },
    es: {
      morning: `Buenos días, ${name}`,
      afternoon: `Buenas tardes, ${name}`,
      evening: `Buenas noches, ${name}`,
    },
    fr: {
      morning: `Bonjour, ${name}`,
      afternoon: `Bon après-midi, ${name}`,
      evening: `Bonsoir, ${name}`,
    },
  };

  const lang = greetings[language];

  if (hour < 12) return lang.morning;
  if (hour < 17) return lang.afternoon;
  return lang.evening;
}

// ─── AI RECOMMENDATIONS ─────────────────────────────────────

export interface Recommendation {
  type: 'warning' | 'tip' | 'goal';
  message: string;
  priority: number; // 1 = highest
}

/**
 * Generate smart recommendations based on current budget state.
 * This is the v1 engine — current month only, no multi-month comparison.
 */
export function generateRecommendations(
  weeklyBudget: number,
  currentWeekSpent: number,
  currentWeekNumber: number,
  monthlyAvailable: number,
  monthTotal: number,
  categoryBreakdown: CategoryBreakdown,
  savingsTarget: number,
  savingsCurrent: number,
  daysUntilReset: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. Over-budget warning for current week
  if (currentWeekSpent > weeklyBudget) {
    const over = Math.round((currentWeekSpent - weeklyBudget) * 100) / 100;
    recommendations.push({
      type: 'warning',
      message: `You're $${over} over your weekly budget. Try to cut back the rest of this week.`,
      priority: 1,
    });
  }

  // 2. Pace check — on track to overspend for the month?
  const projectedMonthly = (monthTotal / Math.max(currentWeekNumber, 1)) * WEEKS_PER_MONTH;
  if (projectedMonthly > monthlyAvailable) {
    const overBy = Math.round((projectedMonthly - monthlyAvailable) * 100) / 100;
    recommendations.push({
      type: 'warning',
      message: `At this pace, you'll overspend by ~$${overBy} this month.`,
      priority: 2,
    });
  }

  // 3. Savings goal check
  if (savingsTarget > 0 && savingsCurrent < savingsTarget) {
    const remaining = Math.round((savingsTarget - savingsCurrent) * 100) / 100;
    const perDay = Math.round((remaining / Math.max(daysUntilReset, 1)) * 100) / 100;
    recommendations.push({
      type: 'goal',
      message: `Save $${perDay}/day to hit your $${savingsTarget} savings goal.`,
      priority: 3,
    });
  }

  // 4. Top spending category tip
  const categories = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a);
  if (categories.length > 0) {
    const [topCat, topAmount] = categories[0];
    const topPercent = Math.round((topAmount / Math.max(monthTotal, 1)) * 100);
    if (topPercent > 40) {
      recommendations.push({
        type: 'tip',
        message: `${topCat.charAt(0).toUpperCase() + topCat.slice(1)} is ${topPercent}% of your spending. Look for ways to cut back.`,
        priority: 4,
      });
    }
  }

  // 5. Under-budget encouragement
  if (currentWeekSpent < weeklyBudget * 0.5 && currentWeekNumber > 0) {
    const saved = Math.round((weeklyBudget - currentWeekSpent) * 100) / 100;
    recommendations.push({
      type: 'tip',
      message: `Great pace! You have $${saved} left this week.`,
      priority: 5,
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

// ─── FULL BUDGET STATE BUILDER ──────────────────────────────

/**
 * Build the complete BudgetState from raw Firestore data.
 * This is called whenever the context needs to recompute.
 */
export function buildBudgetState(
  user: { name: string; language: 'en' | 'es' | 'fr'; resetDay: number },
  incomes: Income[],
  constants: Constant[],
  expenses: Expense[], // already filtered to current month
  savings: Savings | null
): BudgetState {
  const today = getToday();
  const currentMonth = formatMonthKey(today);

  // Income
  const totalMonthlyIncome = calculateTotalMonthlyIncome(incomes);
  const nextPaydayInfo = getNextPaydayAcrossAll(incomes);

  // Constants
  const totalMonthlyConstants = calculateTotalMonthlyConstants(constants);
  const activeConstants = constants.filter((c) => c.active);

  // Budget
  const monthlyAvailable = calculateMonthlyAvailable(totalMonthlyIncome, totalMonthlyConstants);
  const weeklyBudget = calculateWeeklyBudget(monthlyAvailable);
  const currentWeekNumber = getCurrentWeekNumber(user.resetDay);
  const currentWeekSpent = calculateWeekSpending(expenses, currentWeekNumber);
  const currentWeekRemaining = Math.round((weeklyBudget - currentWeekSpent) * 100) / 100;

  // Expenses
  const currentMonthTotal = calculateMonthTotal(expenses);
  const categoryBreakdown = calculateCategoryBreakdown(expenses);

  // Savings
  const savingsTarget = savings ? calculateSavingsTarget(savings, totalMonthlyIncome) : 0;
  const savingsCurrent = savings?.currentAmount || 0;
  const savingsOnTrack = savings
    ? isSavingsOnTrack(
        savingsCurrent,
        savingsTarget,
        today.getDate(),
        getDaysInMonth(today.getFullYear(), today.getMonth())
      )
    : true;

  // Reset
  const daysUntilReset = getDaysUntilReset(user.resetDay);

  // AI
  const greeting = getTimeBasedGreeting(user.name, user.language);
  const recs = generateRecommendations(
    weeklyBudget,
    currentWeekSpent,
    currentWeekNumber,
    monthlyAvailable,
    currentMonthTotal,
    categoryBreakdown,
    savingsTarget,
    savingsCurrent,
    daysUntilReset
  );

  return {
    totalMonthlyIncome,
    nextPayday: nextPaydayInfo?.date || null,
    daysUntilPayday: nextPaydayInfo?.daysUntil || 0,
    totalMonthlyConstants,
    constantsList: activeConstants,
    monthlyAvailable,
    weeklyBudget,
    currentWeekNumber,
    currentWeekSpent,
    currentWeekRemaining,
    savingsTarget,
    savingsCurrent,
    savingsOnTrack,
    currentMonthExpenses: expenses,
    currentMonthTotal,
    categoryBreakdown,
    greeting,
    recommendations: recs.map((r) => r.message),
    currentMonth,
    resetDay: user.resetDay,
    daysUntilReset,
  };
}
