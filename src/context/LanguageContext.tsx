import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Language = 'en' | 'es' | 'fr';

export interface Translations {
  // Common
  dashboard: string;
  settings: string;
  addExpense: string;
  save: string;
  cancel: string;
  close: string;
  loading: string;
  getStarted: string;
  next: string;
  edit: string;
  delete: string;
  add: string;
  done: string;
  skip: string;
  back: string;
  confirm: string;

  // Onboarding
  knowWhatsLeft: string;
  knowWhatsLeftDesc: string;
  addExpensesIn3Taps: string;
  addExpensesIn3TapsDesc: string;
  stayInControl: string;
  stayInControlDesc: string;
  tryForFree: string;
  noPaymentDueNow: string;
  threeDaysFree: string;
  thenPricePerWeek: string;
  termsOfUse: string;
  restorePurchase: string;
  privacyPolicy: string;

  // Dashboard
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  youHave: string;
  leftThisWeek: string;
  budget: string;
  perWeek: string;
  spent: string;
  thisWeeksSpending: string;
  noExpensesYet: string;
  addOneToGetStarted: string;
  overBudget: string;
  paydayIn: string;
  days: string;
  day: string;
  income: string;
  bills: string;
  free: string;
  insights: string;
  items: string;
  item: string;
  monthlyIncome: string;
  monthlyConstants: string;
  availableBudget: string;
  weeklyBudget: string;

  // Add Expense
  expenseAmount: string;
  description: string;
  category: string;
  enterAmount: string;
  enterDescription: string;
  selectCategory: string;
  weekRemaining: string;

  // Categories
  food: string;
  transport: string;
  entertainment: string;
  utilities: string;
  shopping: string;
  other: string;

  // Financial Setup (new tab)
  financialSetup: string;
  incomeSources: string;
  constantsNecessities: string;
  savingsGoal: string;
  budgetSummary: string;
  notSetUpYet: string;
  source: string;
  sources: string;
  perMonth: string;

  // Income Setup
  newIncomeSource: string;
  incomeName: string;
  amountPerPeriod: string;
  frequency: string;
  weekly: string;
  biWeekly: string;
  semiMonthly: string;
  monthly: string;
  payday: string;
  dayOfMonth: string;
  payDates: string;
  lockIncome: string;
  addIncome: string;

  // Constants Setup
  newRecurringExpense: string;
  constantName: string;
  amount: string;
  dueDate: string;
  dayOfWeek: string;
  addConstant: string;
  totalMonthlyConstants: string;
  yourRecurringExpenses: string;

  // Constant Categories
  rent: string;
  mortgage: string;
  groceries: string;
  insurance: string;
  subscriptions: string;
  phone: string;
  internet: string;
  childcare: string;
  debt: string;

  // Savings
  currentSavings: string;
  ofGoal: string;
  complete: string;
  savingsLocked: string;
  savingsUnlocked: string;
  addToSavings: string;
  withdrawFromSavings: string;
  withdraw: string;
  targetType: string;
  fixedAmount: string;
  percentOfIncome: string;
  monthlyTarget: string;
  percentageOfIncome: string;
  setGoal: string;
  updateGoal: string;
  manageSavings: string;

  // Settings
  language: string;
  english: string;
  spanish: string;
  french: string;
  darkMode: string;
  lightMode: string;
  appVersion: string;
  about: string;
  logout: string;
  logoutConfirm: string;
  appearance: string;

  // Paywall
  leftoverPremium: string;
  unlockUnlimitedFeatures: string;
  unlimitedExpenses: string;
  advancedAnalytics: string;
  multiCurrencySupport: string;
  customCategories: string;
  exportYourData: string;
  daysFree: string;
  thenPerWeek: string;
  noCommitment: string;
  maybeLater: string;

  // Tutorial
  tutorialWelcome: string;
  tutorialBudgetCard: string;
  tutorialStats: string;
  tutorialAddExpense: string;
  tutorialFinancialSetup: string;
  tutorialSkip: string;
  tutorialNext: string;
  tutorialDone: string;
  tutorialGotIt: string;
}

const translations: Record<Language, Translations> = {
  en: {
    dashboard: 'Dashboard',
    settings: 'Settings',
    addExpense: 'Add Expense',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    loading: 'Loading...',
    getStarted: 'Get Started',
    next: 'Next',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    done: 'Done',
    skip: 'Skip',
    back: 'Back',
    confirm: 'Confirm',

    knowWhatsLeft: 'Know What\'s Left',
    knowWhatsLeftDesc: 'See exactly how much money you have left this week at a glance. No complicated charts.',
    addExpensesIn3Taps: 'Add Expenses in 3 Taps',
    addExpensesIn3TapsDesc: 'Quick emoji categories make tracking effortless. Coffee, transport, entertainment — tracked in seconds.',
    stayInControl: 'Stay in Control',
    stayInControlDesc: 'Your budget bar changes color as you spend. Green to yellow to red — you\'ll always know where you stand.',
    tryForFree: 'Try for free 🙌',
    noPaymentDueNow: '✓ No payment due now',
    threeDaysFree: '3 days free',
    thenPricePerWeek: 'then $2.99 per week',
    termsOfUse: 'Terms of Use',
    restorePurchase: 'Restore Purchase',
    privacyPolicy: 'Privacy Policy',

    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    youHave: 'YOU HAVE',
    leftThisWeek: 'left this week',
    budget: 'Budget',
    perWeek: '/ week',
    spent: 'spent',
    thisWeeksSpending: 'This Week\'s Spending',
    noExpensesYet: 'No expenses yet',
    addOneToGetStarted: 'Add your first expense to start tracking',
    overBudget: 'OVER BUDGET',
    paydayIn: 'Payday in',
    days: 'days',
    day: 'day',
    income: 'Income',
    bills: 'Bills',
    free: 'Free',
    insights: 'Insights',
    items: 'items',
    item: 'item',
    monthlyIncome: 'Monthly Income',
    monthlyConstants: 'Monthly Constants',
    availableBudget: 'Available Budget',
    weeklyBudget: 'Weekly Budget',

    expenseAmount: 'Expense Amount',
    description: 'Description',
    category: 'Category',
    enterAmount: 'Enter amount',
    enterDescription: 'Enter description',
    selectCategory: 'Select category',
    weekRemaining: 'remaining this week',

    food: 'Food',
    transport: 'Transport',
    entertainment: 'Entertainment',
    utilities: 'Utilities',
    shopping: 'Shopping',
    other: 'Other',

    financialSetup: 'Budget',
    incomeSources: 'Income Sources',
    constantsNecessities: 'Constants & Necessities',
    savingsGoal: 'Savings Goal',
    budgetSummary: 'Budget Summary',
    notSetUpYet: 'Not set up yet',
    source: 'source',
    sources: 'sources',
    perMonth: '/mo',

    newIncomeSource: 'New Income Source',
    incomeName: 'Name',
    amountPerPeriod: 'Amount (per period)',
    frequency: 'Frequency',
    weekly: 'Weekly',
    biWeekly: 'Bi-Weekly',
    semiMonthly: 'Semi-Monthly',
    monthly: 'Monthly',
    payday: 'Payday',
    dayOfMonth: 'Day of Month',
    payDates: 'Pay Dates',
    lockIncome: 'Lock income (prevent changes)',
    addIncome: 'Add Income',

    newRecurringExpense: 'New Recurring Expense',
    constantName: 'Name',
    amount: 'Amount',
    dueDate: 'Due Date (Day of Month)',
    dayOfWeek: 'Day of Week',
    addConstant: 'Add Constant',
    totalMonthlyConstants: 'Total Monthly Constants',
    yourRecurringExpenses: 'Your Recurring Expenses',

    rent: 'Rent',
    mortgage: 'Mortgage',
    groceries: 'Groceries',
    insurance: 'Insurance',
    subscriptions: 'Subscriptions',
    phone: 'Phone',
    internet: 'Internet',
    childcare: 'Childcare',
    debt: 'Debt',

    currentSavings: 'Current Savings',
    ofGoal: 'of',
    complete: 'complete',
    savingsLocked: 'Savings locked (tap to unlock)',
    savingsUnlocked: 'Savings unlocked (tap to lock)',
    addToSavings: 'Add to Savings',
    withdrawFromSavings: 'Withdraw from Savings',
    withdraw: 'Withdraw',
    targetType: 'Target Type',
    fixedAmount: '$ Fixed Amount',
    percentOfIncome: '% of Income',
    monthlyTarget: 'Monthly Target',
    percentageOfIncome: 'Percentage of Income',
    setGoal: 'Set Goal',
    updateGoal: 'Update Goal',
    manageSavings: 'Manage Savings',

    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
    french: 'French',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    appVersion: 'App Version',
    about: 'About',
    logout: 'Logout',
    logoutConfirm: 'Are you sure you want to sign out?',
    appearance: 'Appearance',

    leftoverPremium: 'Leftover Premium',
    unlockUnlimitedFeatures: 'Unlock unlimited features',
    unlimitedExpenses: 'Unlimited expenses',
    advancedAnalytics: 'Advanced analytics & insights',
    multiCurrencySupport: 'Multi-currency support',
    customCategories: 'Custom categories',
    exportYourData: 'Export your data',
    daysFree: '3 days free',
    thenPerWeek: 'Then $2.99/week',
    noCommitment: 'No commitment. Cancel anytime.',
    maybeLater: 'Maybe Later',

    tutorialWelcome: 'Welcome to Leftover! Let\'s show you around.',
    tutorialBudgetCard: 'This is your weekly budget. It shows how much you have left to spend.',
    tutorialStats: 'These cards show your monthly income, bills, and what\'s left.',
    tutorialAddExpense: 'Tap here to quickly add expenses in 3 taps.',
    tutorialFinancialSetup: 'Set up your income, bills, and savings goals here.',
    tutorialSkip: 'Skip Tour',
    tutorialNext: 'Next',
    tutorialDone: 'Got it!',
    tutorialGotIt: 'Let\'s go!',
  },
  es: {
    dashboard: 'Panel',
    settings: 'Configuración',
    addExpense: 'Agregar Gasto',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    loading: 'Cargando...',
    getStarted: 'Comenzar',
    next: 'Siguiente',
    edit: 'Editar',
    delete: 'Eliminar',
    add: 'Agregar',
    done: 'Listo',
    skip: 'Saltar',
    back: 'Atrás',
    confirm: 'Confirmar',

    knowWhatsLeft: 'Sabe Lo Que Queda',
    knowWhatsLeftDesc: 'Ve exactamente cuánto dinero te queda esta semana de un vistazo. Sin gráficos complicados.',
    addExpensesIn3Taps: 'Agrega Gastos en 3 Toques',
    addExpensesIn3TapsDesc: 'Las categorías de emoji hacen que el seguimiento sea fácil. Café, transporte — todo en segundos.',
    stayInControl: 'Mantén el Control',
    stayInControlDesc: 'Tu barra de presupuesto cambia de color. Verde a amarillo a rojo — siempre sabrás dónde estás.',
    tryForFree: 'Prueba gratis 🙌',
    noPaymentDueNow: '✓ Sin pago por ahora',
    threeDaysFree: '3 días gratis',
    thenPricePerWeek: 'luego $2.99 por semana',
    termsOfUse: 'Términos de Uso',
    restorePurchase: 'Restaurar Compra',
    privacyPolicy: 'Política de Privacidad',

    goodMorning: 'Buenos días',
    goodAfternoon: 'Buenas tardes',
    goodEvening: 'Buenas noches',
    youHave: 'TIENES',
    leftThisWeek: 'restante esta semana',
    budget: 'Presupuesto',
    perWeek: '/ semana',
    spent: 'gastado',
    thisWeeksSpending: 'Gastos de Esta Semana',
    noExpensesYet: 'Aún no hay gastos',
    addOneToGetStarted: 'Agrega tu primer gasto para empezar',
    overBudget: 'SOBRE PRESUPUESTO',
    paydayIn: 'Día de pago en',
    days: 'días',
    day: 'día',
    income: 'Ingresos',
    bills: 'Gastos Fijos',
    free: 'Libre',
    insights: 'Consejos',
    items: 'elementos',
    item: 'elemento',
    monthlyIncome: 'Ingresos Mensuales',
    monthlyConstants: 'Gastos Fijos Mensuales',
    availableBudget: 'Presupuesto Disponible',
    weeklyBudget: 'Presupuesto Semanal',

    expenseAmount: 'Monto del Gasto',
    description: 'Descripción',
    category: 'Categoría',
    enterAmount: 'Ingresa el monto',
    enterDescription: 'Ingresa la descripción',
    selectCategory: 'Selecciona categoría',
    weekRemaining: 'restante esta semana',

    food: 'Comida',
    transport: 'Transporte',
    entertainment: 'Entretenimiento',
    utilities: 'Servicios',
    shopping: 'Compras',
    other: 'Otro',

    financialSetup: 'Presupuesto',
    incomeSources: 'Fuentes de Ingreso',
    constantsNecessities: 'Gastos Fijos',
    savingsGoal: 'Meta de Ahorro',
    budgetSummary: 'Resumen de Presupuesto',
    notSetUpYet: 'No configurado aún',
    source: 'fuente',
    sources: 'fuentes',
    perMonth: '/mes',

    newIncomeSource: 'Nueva Fuente de Ingreso',
    incomeName: 'Nombre',
    amountPerPeriod: 'Monto (por período)',
    frequency: 'Frecuencia',
    weekly: 'Semanal',
    biWeekly: 'Quincenal',
    semiMonthly: 'Bisemanal',
    monthly: 'Mensual',
    payday: 'Día de Pago',
    dayOfMonth: 'Día del Mes',
    payDates: 'Fechas de Pago',
    lockIncome: 'Bloquear ingreso (prevenir cambios)',
    addIncome: 'Agregar Ingreso',

    newRecurringExpense: 'Nuevo Gasto Recurrente',
    constantName: 'Nombre',
    amount: 'Monto',
    dueDate: 'Fecha de Vencimiento',
    dayOfWeek: 'Día de la Semana',
    addConstant: 'Agregar Gasto Fijo',
    totalMonthlyConstants: 'Total Gastos Fijos Mensuales',
    yourRecurringExpenses: 'Tus Gastos Recurrentes',

    rent: 'Alquiler',
    mortgage: 'Hipoteca',
    groceries: 'Comestibles',
    insurance: 'Seguro',
    subscriptions: 'Suscripciones',
    phone: 'Teléfono',
    internet: 'Internet',
    childcare: 'Cuidado Infantil',
    debt: 'Deuda',

    currentSavings: 'Ahorros Actuales',
    ofGoal: 'de',
    complete: 'completo',
    savingsLocked: 'Ahorros bloqueados (toca para desbloquear)',
    savingsUnlocked: 'Ahorros desbloqueados (toca para bloquear)',
    addToSavings: 'Agregar a Ahorros',
    withdrawFromSavings: 'Retirar de Ahorros',
    withdraw: 'Retirar',
    targetType: 'Tipo de Meta',
    fixedAmount: '$ Monto Fijo',
    percentOfIncome: '% del Ingreso',
    monthlyTarget: 'Meta Mensual',
    percentageOfIncome: 'Porcentaje del Ingreso',
    setGoal: 'Establecer Meta',
    updateGoal: 'Actualizar Meta',
    manageSavings: 'Gestionar Ahorros',

    language: 'Idioma',
    english: 'Inglés',
    spanish: 'Español',
    french: 'Francés',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    appVersion: 'Versión de la App',
    about: 'Acerca de',
    logout: 'Cerrar Sesión',
    logoutConfirm: '¿Estás seguro de que quieres cerrar sesión?',
    appearance: 'Apariencia',

    leftoverPremium: 'Leftover Premium',
    unlockUnlimitedFeatures: 'Desbloquea funciones ilimitadas',
    unlimitedExpenses: 'Gastos ilimitados',
    advancedAnalytics: 'Análisis avanzados',
    multiCurrencySupport: 'Soporte multi-moneda',
    customCategories: 'Categorías personalizadas',
    exportYourData: 'Exporta tus datos',
    daysFree: '3 días gratis',
    thenPerWeek: 'Luego $2.99/semana',
    noCommitment: 'Sin compromiso. Cancela cuando quieras.',
    maybeLater: 'Quizás Después',

    tutorialWelcome: '¡Bienvenido a Leftover! Te mostramos cómo funciona.',
    tutorialBudgetCard: 'Este es tu presupuesto semanal. Muestra cuánto te queda por gastar.',
    tutorialStats: 'Estas tarjetas muestran tus ingresos, gastos fijos y lo que queda.',
    tutorialAddExpense: 'Toca aquí para agregar gastos rápidamente en 3 toques.',
    tutorialFinancialSetup: 'Configura tus ingresos, gastos fijos y metas de ahorro aquí.',
    tutorialSkip: 'Saltar Tour',
    tutorialNext: 'Siguiente',
    tutorialDone: '¡Entendido!',
    tutorialGotIt: '¡Vamos!',
  },
  fr: {
    dashboard: 'Tableau de Bord',
    settings: 'Paramètres',
    addExpense: 'Ajouter une Dépense',
    save: 'Sauvegarder',
    cancel: 'Annuler',
    close: 'Fermer',
    loading: 'Chargement...',
    getStarted: 'Commencer',
    next: 'Suivant',
    edit: 'Modifier',
    delete: 'Supprimer',
    add: 'Ajouter',
    done: 'Terminé',
    skip: 'Passer',
    back: 'Retour',
    confirm: 'Confirmer',

    knowWhatsLeft: 'Sachez Ce Qui Reste',
    knowWhatsLeftDesc: 'Voyez exactement combien il vous reste cette semaine en un coup d\'œil. Pas de graphiques compliqués.',
    addExpensesIn3Taps: 'Ajoutez en 3 Appuis',
    addExpensesIn3TapsDesc: 'Les catégories emoji rendent le suivi facile. Café, transport — tout suivi en secondes.',
    stayInControl: 'Restez en Contrôle',
    stayInControlDesc: 'Votre barre budgétaire change de couleur. Vert au jaune au rouge — vous saurez toujours où vous en êtes.',
    tryForFree: 'Essayer gratuitement 🙌',
    noPaymentDueNow: '✓ Aucun paiement maintenant',
    threeDaysFree: '3 jours gratuits',
    thenPricePerWeek: 'puis 2,99 € par semaine',
    termsOfUse: 'Conditions d\'utilisation',
    restorePurchase: 'Restaurer l\'achat',
    privacyPolicy: 'Politique de Confidentialité',

    goodMorning: 'Bonjour',
    goodAfternoon: 'Bon après-midi',
    goodEvening: 'Bonsoir',
    youHave: 'VOUS AVEZ',
    leftThisWeek: 'restant cette semaine',
    budget: 'Budget',
    perWeek: '/ semaine',
    spent: 'dépensé',
    thisWeeksSpending: 'Dépenses de Cette Semaine',
    noExpensesYet: 'Aucune dépense encore',
    addOneToGetStarted: 'Ajoutez votre première dépense pour commencer',
    overBudget: 'DÉPASSEMENT',
    paydayIn: 'Paie dans',
    days: 'jours',
    day: 'jour',
    income: 'Revenus',
    bills: 'Charges',
    free: 'Libre',
    insights: 'Conseils',
    items: 'éléments',
    item: 'élément',
    monthlyIncome: 'Revenus Mensuels',
    monthlyConstants: 'Charges Mensuelles',
    availableBudget: 'Budget Disponible',
    weeklyBudget: 'Budget Hebdomadaire',

    expenseAmount: 'Montant de la Dépense',
    description: 'Description',
    category: 'Catégorie',
    enterAmount: 'Entrez le montant',
    enterDescription: 'Entrez la description',
    selectCategory: 'Sélectionnez la catégorie',
    weekRemaining: 'restant cette semaine',

    food: 'Nourriture',
    transport: 'Transport',
    entertainment: 'Divertissement',
    utilities: 'Services',
    shopping: 'Achats',
    other: 'Autre',

    financialSetup: 'Budget',
    incomeSources: 'Sources de Revenus',
    constantsNecessities: 'Charges Fixes',
    savingsGoal: 'Objectif d\'Épargne',
    budgetSummary: 'Résumé du Budget',
    notSetUpYet: 'Pas encore configuré',
    source: 'source',
    sources: 'sources',
    perMonth: '/mois',

    newIncomeSource: 'Nouvelle Source de Revenus',
    incomeName: 'Nom',
    amountPerPeriod: 'Montant (par période)',
    frequency: 'Fréquence',
    weekly: 'Hebdomadaire',
    biWeekly: 'Bihebdomadaire',
    semiMonthly: 'Bimensuel',
    monthly: 'Mensuel',
    payday: 'Jour de Paie',
    dayOfMonth: 'Jour du Mois',
    payDates: 'Dates de Paie',
    lockIncome: 'Verrouiller le revenu',
    addIncome: 'Ajouter un Revenu',

    newRecurringExpense: 'Nouvelle Charge Récurrente',
    constantName: 'Nom',
    amount: 'Montant',
    dueDate: 'Date d\'Échéance',
    dayOfWeek: 'Jour de la Semaine',
    addConstant: 'Ajouter une Charge',
    totalMonthlyConstants: 'Total Charges Mensuelles',
    yourRecurringExpenses: 'Vos Charges Récurrentes',

    rent: 'Loyer',
    mortgage: 'Hypothèque',
    groceries: 'Courses',
    insurance: 'Assurance',
    subscriptions: 'Abonnements',
    phone: 'Téléphone',
    internet: 'Internet',
    childcare: 'Garde d\'Enfants',
    debt: 'Dette',

    currentSavings: 'Épargne Actuelle',
    ofGoal: 'de',
    complete: 'complété',
    savingsLocked: 'Épargne verrouillée (appuyez pour déverrouiller)',
    savingsUnlocked: 'Épargne déverrouillée (appuyez pour verrouiller)',
    addToSavings: 'Ajouter à l\'Épargne',
    withdrawFromSavings: 'Retirer de l\'Épargne',
    withdraw: 'Retirer',
    targetType: 'Type d\'Objectif',
    fixedAmount: '$ Montant Fixe',
    percentOfIncome: '% du Revenu',
    monthlyTarget: 'Objectif Mensuel',
    percentageOfIncome: 'Pourcentage du Revenu',
    setGoal: 'Définir l\'Objectif',
    updateGoal: 'Mettre à Jour',
    manageSavings: 'Gérer l\'Épargne',

    language: 'Langue',
    english: 'Anglais',
    spanish: 'Espagnol',
    french: 'Français',
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    appVersion: 'Version de l\'App',
    about: 'À Propos',
    logout: 'Déconnexion',
    logoutConfirm: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    appearance: 'Apparence',

    leftoverPremium: 'Leftover Premium',
    unlockUnlimitedFeatures: 'Débloquez des fonctionnalités illimitées',
    unlimitedExpenses: 'Dépenses illimitées',
    advancedAnalytics: 'Analyses avancées',
    multiCurrencySupport: 'Support multi-devises',
    customCategories: 'Catégories personnalisées',
    exportYourData: 'Exportez vos données',
    daysFree: '3 jours gratuits',
    thenPerWeek: 'Puis 2,99 €/semaine',
    noCommitment: 'Sans engagement. Annulez à tout moment.',
    maybeLater: 'Peut-être Plus Tard',

    tutorialWelcome: 'Bienvenue sur Leftover ! Faisons un tour.',
    tutorialBudgetCard: 'Voici votre budget hebdomadaire. Il montre combien il vous reste.',
    tutorialStats: 'Ces cartes montrent vos revenus, charges et ce qui reste.',
    tutorialAddExpense: 'Appuyez ici pour ajouter des dépenses en 3 appuis.',
    tutorialFinancialSetup: 'Configurez vos revenus, charges et objectifs d\'épargne ici.',
    tutorialSkip: 'Passer le Tour',
    tutorialNext: 'Suivant',
    tutorialDone: 'Compris !',
    tutorialGotIt: 'Allons-y !',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
