// ============================================================
// LEFTOVER - Calculation Engine (Enhanced)
// Automatic carry-over, translated recommendations
// ============================================================

import {
  Borrowed,
  BudgetState,
  CategoryBreakdown,
  Constant, ConstantFrequency,
  DayOfWeek,
  Expense,
  Gift,
  Income, IncomeFrequency,
  Savings,
  WeekInfo
} from '../types';

// ─── DATE HELPERS ────────────────────────────────────────────

const DAY_MAP: Record<DayOfWeek, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil(Math.abs(b.getTime() - a.getTime()) / msPerDay);
}

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

export function getNextMonthlyDate(dayOfMonth: number, from?: Date): Date {
  const today = from || getToday();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysThisMonth = getDaysInMonth(year, month);
  const clampedDay = Math.min(dayOfMonth, daysThisMonth);
  const thisMonthDate = new Date(year, month, clampedDay);

  if (thisMonthDate >= today) return thisMonthDate;

  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const actualNextMonth = nextMonth > 11 ? 0 : nextMonth;
  const daysNextMonth = getDaysInMonth(nextYear, actualNextMonth);
  return new Date(nextYear, actualNextMonth, Math.min(dayOfMonth, daysNextMonth));
}

// ─── WEEK DATE CALCULATIONS ─────────────────────────────────

export function getWeekStartDate(resetDay: number, weekNumber: number, date?: Date): Date {
  const today = date || getToday();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const clampedResetDay = Math.min(resetDay, daysInMonth);

  let resetDate: Date;
  if (today.getDate() >= clampedResetDay) {
    resetDate = new Date(year, month, clampedResetDay);
  } else {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    resetDate = new Date(prevYear, prevMonth, Math.min(resetDay, daysInPrevMonth));
  }

  const weekStart = new Date(resetDate);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
  return weekStart;
}

export function getWeekEndDate(resetDay: number, weekNumber: number, date?: Date): Date {
  const start = getWeekStartDate(resetDay, weekNumber, date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

export function getDaysLeftInWeek(resetDay: number, date?: Date): number {
  const today = date || getToday();
  const weekNumber = getCurrentWeekNumber(resetDay, today);
  const endDate = getWeekEndDate(resetDay, weekNumber, today);
  return Math.max(0, daysBetween(today, endDate));
}

// ─── INCOME CALCULATIONS ────────────────────────────────────

export function calculateMonthlyIncome(amount: number, type: IncomeFrequency): number {
  switch (type) {
    case 'weekly': return Math.round(amount * 4.33 * 100) / 100;
    case 'bi-weekly': return Math.round(amount * 2.167 * 100) / 100;
    case 'semi-monthly': return Math.round(amount * 2 * 100) / 100;
    case 'monthly': return amount;
  }
}

export function calculateNextPayday(income: Income): Date {
  const today = getToday();
  switch (income.type) {
    case 'weekly': {
      if (!income.dayOfWeek) throw new Error('Weekly income requires dayOfWeek');
      return getNextDayOfWeek(income.dayOfWeek, today);
    }
    case 'bi-weekly': {
      if (!income.dayOfWeek) throw new Error('Bi-weekly income requires dayOfWeek');
      const anchor = new Date(income.createdAt);
      const nextDay = getNextDayOfWeek(income.dayOfWeek, today);
      const weeksDiff = Math.floor(daysBetween(anchor, nextDay) / 7);
      if (weeksDiff % 2 !== 0) nextDay.setDate(nextDay.getDate() + 7);
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

export function calculateTotalMonthlyIncome(incomes: Income[]): number {
  return incomes.filter((i) => i.active).reduce((sum, i) => sum + calculateMonthlyIncome(i.amount, i.type), 0);
}

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
    } catch { continue; }
  }
  return soonest;
}

// ─── CONSTANTS CALCULATIONS ─────────────────────────────────

export function calculateMonthlyConstant(amount: number, frequency: ConstantFrequency): number {
  switch (frequency) {
    case 'weekly': return Math.round(amount * 4.33 * 100) / 100;
    case 'bi-weekly': return Math.round(amount * 2.167 * 100) / 100;
    case 'monthly': return amount;
  }
}

export function calculateTotalMonthlyConstants(constants: Constant[]): number {
  return constants.filter((c) => c.active).reduce((sum, c) => sum + calculateMonthlyConstant(c.amount, c.frequency), 0);
}

// ─── BUDGET CALCULATIONS ────────────────────────────────────

const WEEKS_PER_MONTH = 4.33;

export function calculateMonthlyAvailable(totalIncome: number, totalConstants: number): number {
  return Math.round((totalIncome - totalConstants) * 100) / 100;
}

export function calculateWeeklyBudget(monthlyAvailable: number): number {
  return Math.round((monthlyAvailable / WEEKS_PER_MONTH) * 100) / 100;
}

export function getCurrentWeekNumber(resetDay: number, date?: Date): number {
  const today = date || getToday();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const clampedResetDay = Math.min(resetDay, daysInMonth);

  let resetDate: Date;
  if (today.getDate() >= clampedResetDay) {
    resetDate = new Date(year, month, clampedResetDay);
  } else {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    resetDate = new Date(prevYear, prevMonth, Math.min(resetDay, daysInPrevMonth));
  }

  const daysSinceReset = daysBetween(resetDate, today);
  return Math.floor(daysSinceReset / 7) + 1;
}

export function getDaysUntilReset(resetDay: number, date?: Date): number {
  const today = date || getToday();
  const nextReset = getNextMonthlyDate(resetDay, today);
  if (nextReset.getTime() === today.getTime()) {
    const nextMonth = today.getMonth() + 1;
    const nextYear = nextMonth > 11 ? today.getFullYear() + 1 : today.getFullYear();
    const actualMonth = nextMonth > 11 ? 0 : nextMonth;
    const daysInNext = getDaysInMonth(nextYear, actualMonth);
    return daysBetween(today, new Date(nextYear, actualMonth, Math.min(resetDay, daysInNext)));
  }
  return daysBetween(today, nextReset);
}

// ─── EXPENSE CALCULATIONS ───────────────────────────────────

export function calculateCategoryBreakdown(expenses: Expense[]): CategoryBreakdown {
  const breakdown: CategoryBreakdown = {};
  for (const expense of expenses) {
    breakdown[expense.category] = (breakdown[expense.category] || 0) + expense.amount;
  }
  for (const key of Object.keys(breakdown)) {
    breakdown[key] = Math.round(breakdown[key] * 100) / 100;
  }
  return breakdown;
}

export function calculateWeekSpending(expenses: Expense[], weekNumber: number): number {
  return expenses
    .filter((e) => e.weekNumber === weekNumber && e.transactionType !== 'gift' && e.transactionType !== 'borrow')
    .reduce((sum, e) => sum + e.amount, 0);
}

export function calculateMonthTotal(expenses: Expense[]): number {
  return Math.round(expenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
}

// ─── AUTOMATIC CARRY-OVER ───────────────────────────────────

/**
 * Calculate automatic carry-over for the current week.
 * - Walks through all previous weeks
 * - Each week: budget + carryIn - spent = carryOut
 * - carryOut becomes next week's carryIn
 * - Fully automatic: positive carries over, negative carries over
 */
export function calculateAutoCarryOver(
  weeklyBudget: number,
  expenses: Expense[],
  currentWeekNumber: number
): number {
  if (currentWeekNumber <= 1) return 0;

  let carryOver = 0;
  for (let w = 1; w < currentWeekNumber; w++) {
    const weekBudget = weeklyBudget + carryOver;
    const weekSpent = calculateWeekSpending(expenses, w);
    carryOver = Math.round((weekBudget - weekSpent) * 100) / 100;
  }

  return carryOver;
}

/**
 * Build WeekInfo for a specific week.
 */
export function buildWeekInfo(
  weekNumber: number,
  resetDay: number,
  weeklyBudget: number,
  carryOver: number,
  expenses: Expense[],
  date?: Date
): WeekInfo {
  const today = date || getToday();
  const startDate = getWeekStartDate(resetDay, weekNumber, today);
  const endDate = getWeekEndDate(resetDay, weekNumber, today);
  const spent = calculateWeekSpending(expenses, weekNumber);
  const adjustedBudget = Math.round((weeklyBudget + carryOver) * 100) / 100;
  const remaining = Math.round((adjustedBudget - spent) * 100) / 100;
  const daysLeft = endDate >= today ? daysBetween(today, endDate) : 0;

  return {
    weekNumber,
    startDate,
    endDate,
    baseBudget: weeklyBudget,
    carryOver: Math.round(carryOver * 100) / 100,
    adjustedBudget,
    spent: Math.round(spent * 100) / 100,
    remaining,
    daysLeft,
  };
}

/**
 * Build previous weeks for history view with automatic carry-over chain.
 */
export function buildPreviousWeeks(
  currentWeekNumber: number,
  resetDay: number,
  weeklyBudget: number,
  expenses: Expense[]
): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  let carryOver = 0;

  for (let w = 1; w < currentWeekNumber; w++) {
    const week = buildWeekInfo(w, resetDay, weeklyBudget, carryOver, expenses);
    weeks.push(week);
    // Automatic: remaining from this week carries to next
    carryOver = week.remaining;
  }

  return weeks;
}

// ─── SAVINGS CALCULATIONS ───────────────────────────────────

export function calculateSavingsTarget(savings: Savings, totalMonthlyIncome: number): number {
  if (savings.targetType === 'percentage' && savings.targetPercentage !== null) {
    return Math.round((totalMonthlyIncome * savings.targetPercentage) / 100 * 100) / 100;
  }
  return savings.monthlyTarget;
}

export function isSavingsOnTrack(
  currentAmount: number, monthlyTarget: number,
  dayOfMonth: number, daysInMonth: number
): boolean {
  const proratedTarget = (monthlyTarget / daysInMonth) * dayOfMonth;
  return currentAmount >= proratedTarget;
}

// ─── AI GREETING ─────────────────────────────────────────────

export function getTimeBasedGreeting(name: string, language: 'en' | 'es' | 'fr' = 'en'): string {
  const hour = new Date().getHours();
  const greetings = {
    en: { morning: `Good morning`, afternoon: `Good afternoon`, evening: `Good evening` },
    es: { morning: `Buenos días`, afternoon: `Buenas tardes`, evening: `Buenas noches` },
    fr: { morning: `Bonjour`, afternoon: `Bon après-midi`, evening: `Bonsoir` },
  };
  const lang = greetings[language];
  const base = hour < 12 ? lang.morning : hour < 17 ? lang.afternoon : lang.evening;
  return name ? `${base}, ${name}` : base;
}

// ─── AI RECOMMENDATIONS (TRANSLATED) ────────────────────────

export interface Recommendation {
  type: 'warning' | 'tip' | 'goal';
  messageKey: string;
  messageParams: Record<string, string>;
  fallbackMessage: string;
  priority: number;
}

export function generateRecommendations(
  weeklyBudget: number, currentWeekSpent: number, currentWeekNumber: number,
  monthlyAvailable: number, monthTotal: number, categoryBreakdown: CategoryBreakdown,
  savingsTarget: number, savingsCurrent: number, daysUntilReset: number,
  carryOver: number, adjustedBudget: number, daysLeftInWeek: number
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. Carry-over info
  if (carryOver < 0) {
    recommendations.push({
      type: 'warning',
      messageKey: 'recOverspendReducedBudget',
      messageParams: { amount: Math.abs(carryOver).toFixed(2) },
      fallbackMessage: `Last week's overspend reduced this week's budget by $${Math.abs(carryOver).toFixed(2)}.`,
      priority: 1,
    });
  } else if (carryOver > 0) {
    recommendations.push({
      type: 'tip',
      messageKey: 'recCarryOverNice',
      messageParams: { amount: carryOver.toFixed(2) },
      fallbackMessage: `$${carryOver.toFixed(2)} carried over from last week. Nice!`,
      priority: 5,
    });
  }

  // 2. Over-budget warning
  if (currentWeekSpent > adjustedBudget) {
    const over = Math.round((currentWeekSpent - adjustedBudget) * 100) / 100;
    recommendations.push({
      type: 'warning',
      messageKey: 'recOverBudgetWarning',
      messageParams: { amount: over.toFixed(2) },
      fallbackMessage: `You're $${over} over budget this week. This will reduce next week's budget.`,
      priority: 1,
    });
  }

  // 3. Monthly pace check
  const projectedMonthly = (monthTotal / Math.max(currentWeekNumber, 1)) * 4.33;
  if (projectedMonthly > monthlyAvailable && monthTotal > 0) {
    const overBy = Math.round((projectedMonthly - monthlyAvailable) * 100) / 100;
    recommendations.push({
      type: 'warning',
      messageKey: 'recMonthlyPaceWarning',
      messageParams: { amount: overBy.toFixed(2) },
      fallbackMessage: `At this pace, you'll overspend by ~$${overBy} this month.`,
      priority: 2,
    });
  }

  // 4. Savings goal
  if (savingsTarget > 0 && savingsCurrent < savingsTarget) {
    const remaining = Math.round((savingsTarget - savingsCurrent) * 100) / 100;
    const perDay = Math.round((remaining / Math.max(daysUntilReset, 1)) * 100) / 100;
    recommendations.push({
      type: 'goal',
      messageKey: 'recSavingsGoalDaily',
      messageParams: { amount: perDay.toFixed(2), target: savingsTarget.toFixed(0) },
      fallbackMessage: `Save $${perDay}/day to hit your $${savingsTarget} savings goal.`,
      priority: 3,
    });
  }

  // 5. Top spending category
  const categories = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a);
  if (categories.length > 0) {
    const [topCat, topAmount] = categories[0];
    const topPercent = Math.round((topAmount / Math.max(monthTotal, 1)) * 100);
    if (topPercent > 40) {
      recommendations.push({
        type: 'tip',
        messageKey: 'recTopCategory',
        messageParams: { category: topCat, percent: String(topPercent) },
        fallbackMessage: `${topCat} is ${topPercent}% of your spending. Look for ways to cut back.`,
        priority: 4,
      });
    }
  }

  // 6. Daily spending suggestion
  if (daysLeftInWeek > 0 && currentWeekSpent < adjustedBudget) {
    const dailyBudget = Math.round(((adjustedBudget - currentWeekSpent) / daysLeftInWeek) * 100) / 100;
    recommendations.push({
      type: 'tip',
      messageKey: 'recDailySuggestion',
      messageParams: { amount: dailyBudget.toFixed(2) },
      fallbackMessage: `You can spend ~$${dailyBudget}/day for the rest of this week.`,
      priority: 6,
    });
  }

  // 7. Under-budget encouragement
  if (currentWeekSpent < adjustedBudget * 0.5 && currentWeekNumber > 0) {
    const saved = Math.round((adjustedBudget - currentWeekSpent) * 100) / 100;
    recommendations.push({
      type: 'tip',
      messageKey: 'recGreatPace',
      messageParams: { amount: saved.toFixed(2) },
      fallbackMessage: `Great pace! You have $${saved} left this week.`,
      priority: 7,
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

// ─── FULL BUDGET STATE BUILDER ──────────────────────────────

// ============================================================
// CHANGES TO calculations.ts
// ============================================================
//
// 1. Add these imports at the top alongside existing imports:
//
//    import { Borrowed, Gift } from '../types';
//
//    (Add Borrowed and Gift to the existing import from '../types')
//
// 2. Replace the ENTIRE buildBudgetState function (starting from
//    "export function buildBudgetState" to the closing "}")
//    with the version below:
// ============================================================

export function buildBudgetState(
  user: { name: string; language: 'en' | 'es' | 'fr'; resetDay: number },
  incomes: Income[],
  constants: Constant[],
  expenses: Expense[],
  savings: Savings | null,
  borrowed: Borrowed[] = [],
  gifts: Gift[] = []
): BudgetState {
  const today = getToday();
  const currentMonth = formatMonthKey(today);

  const totalMonthlyIncome = calculateTotalMonthlyIncome(incomes);
  const nextPaydayInfo = getNextPaydayAcrossAll(incomes);
  const totalMonthlyConstants = calculateTotalMonthlyConstants(constants);
  const activeConstants = constants.filter((c) => c.active);

  const monthlyAvailableBeforeSavings = calculateMonthlyAvailable(totalMonthlyIncome, totalMonthlyConstants);

  const savingsTarget = savings ? calculateSavingsTarget(savings, totalMonthlyIncome) : 0;
  const savingsCurrent = savings?.currentAmount || 0;
  const monthlyAvailable = Math.round((monthlyAvailableBeforeSavings - savingsTarget) * 100) / 100;

  const weeklyBudget = calculateWeeklyBudget(Math.max(monthlyAvailable, 0));
  const currentWeekNumber = getCurrentWeekNumber(user.resetDay);

  // AUTOMATIC carry-over: walks through all previous weeks
  const carryOver = calculateAutoCarryOver(weeklyBudget, expenses, currentWeekNumber);

  // Gifts this week add to available
  const giftsThisWeek = gifts.filter((g) => g.weekNumber === currentWeekNumber);
  const totalGiftsThisWeek = giftsThisWeek.reduce((sum, g) => sum + g.amount, 0);

  // Borrowed money this week adds to available
  const activeBorrowed = borrowed.filter((b) => b.status === 'active' || b.status === 'partial');
  const borrowedThisWeek = borrowed.filter((b) => b.weekNumber === currentWeekNumber);
  const totalBorrowedThisWeek = borrowedThisWeek.reduce((sum, b) => sum + b.amount, 0);
  const totalBorrowed = activeBorrowed.reduce((sum, b) => sum + (b.amount - b.paidBack), 0);

  // Adjusted budget = base + carry-over + gifts this week + borrowed this week
  const adjustedBudget = Math.round((weeklyBudget + carryOver + totalGiftsThisWeek + totalBorrowedThisWeek) * 100) / 100;

  const currentWeekSpent = calculateWeekSpending(expenses, currentWeekNumber);
  const currentWeekRemaining = Math.round((adjustedBudget - currentWeekSpent) * 100) / 100;

  const daysLeftInWeek = getDaysLeftInWeek(user.resetDay);
  const currentWeek = buildWeekInfo(currentWeekNumber, user.resetDay, weeklyBudget, carryOver + totalGiftsThisWeek + totalBorrowedThisWeek, expenses);
  const previousWeeks = buildPreviousWeeks(currentWeekNumber, user.resetDay, weeklyBudget, expenses);

  const currentMonthTotal = calculateMonthTotal(expenses);
  const categoryBreakdown = calculateCategoryBreakdown(expenses);

  const savingsOnTrack = savings
    ? isSavingsOnTrack(savingsCurrent, savingsTarget, today.getDate(), getDaysInMonth(today.getFullYear(), today.getMonth()))
    : true;

  const daysUntilReset = getDaysUntilReset(user.resetDay);

  const greeting = getTimeBasedGreeting(user.name, user.language);
  const recs = generateRecommendations(
    weeklyBudget, currentWeekSpent, currentWeekNumber,
    monthlyAvailable, currentMonthTotal, categoryBreakdown,
    savingsTarget, savingsCurrent, daysUntilReset,
    carryOver, adjustedBudget, daysLeftInWeek
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
    currentWeekCarryOver: carryOver,
    currentWeekAdjustedBudget: adjustedBudget,
    currentWeek,
    previousWeeks,
    savingsTarget,
    savingsCurrent,
    savingsOnTrack,
    currentMonthExpenses: expenses,
    currentMonthTotal,
    categoryBreakdown,
    greeting,
    recommendations: recs,
    currentMonth,
    resetDay: user.resetDay,
    daysUntilReset,
    // New: borrowed & gifts
    totalBorrowed,
    totalGiftsThisWeek,
    borrowedRecords: activeBorrowed,
    giftsThisWeek,
  };
}