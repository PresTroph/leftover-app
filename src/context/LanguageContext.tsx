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

  // Onboarding
  knowWhatsLeft: string;
  knowWhatsLeftDesc: string;
  addExpensesIn3Taps: string;
  addExpensesIn3TapsDesc: string;
  stayInControl: string;
  stayInControlDesc: string;

  // Dashboard
  youHave: string;
  leftThisWeek: string;
  budget: string;
  perWeek: string;
  spent: string;
  thisWeeksSpending: string;
  noExpensesYet: string;
  addOneToGetStarted: string;

  // Add Expense
  expenseAmount: string;
  description: string;
  category: string;
  enterAmount: string;
  enterDescription: string;
  selectCategory: string;

  // Settings
  weeklyBudget: string;
  language: string;
  english: string;
  spanish: string;
  french: string;
  darkMode: string;
  lightMode: string;
  appVersion: string;
  about: string;

  // Categories
  food: string;
  transport: string;
  entertainment: string;
  utilities: string;
  shopping: string;
  other: string;

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
  tryForFree: string;
  maybeLater: string;
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

    knowWhatsLeft: 'Know What\'s Left',
    knowWhatsLeftDesc: 'See exactly how much money you have left this week at a glance. No complicated charts or confusing numbers.',
    addExpensesIn3Taps: 'Add Expenses in 3 Taps',
    addExpensesIn3TapsDesc: 'Quick emoji categories make tracking your spending effortless. Coffee, transport, entertainment—all tracked in seconds.',
    stayInControl: 'Stay in Control',
    stayInControlDesc: 'Your budget bar changes color as you spend. Green to yellow to red—you\'ll always know where you stand.',

    youHave: 'YOU HAVE',
    leftThisWeek: 'left this week',
    budget: 'Budget',
    perWeek: '/ week',
    spent: 'spent',
    thisWeeksSpending: "This Week's Spending",
    noExpensesYet: 'No expenses yet.',
    addOneToGetStarted: 'Add one to get started!',

    expenseAmount: 'Expense Amount',
    description: 'Description',
    category: 'Category',
    enterAmount: 'Enter amount',
    enterDescription: 'Enter description',
    selectCategory: 'Select category',

    weeklyBudget: 'Weekly Budget',
    language: 'Language',
    english: 'English',
    spanish: 'Spanish',
    french: 'French',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    appVersion: 'App Version',
    about: 'About',

    food: 'Food',
    transport: 'Transport',
    entertainment: 'Entertainment',
    utilities: 'Utilities',
    shopping: 'Shopping',
    other: 'Other',

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
    tryForFree: 'Try for Free',
    maybeLater: 'Maybe Later',
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

    knowWhatsLeft: 'Sabe Lo Que Queda',
    knowWhatsLeftDesc: 'Ve exactamente cuánto dinero te queda esta semana de un vistazo. Sin gráficos complicados ni números confusos.',
    addExpensesIn3Taps: 'Agrega Gastos en 3 Toques',
    addExpensesIn3TapsDesc: 'Las categorías rápidas de emoji hacen que rastrear tus gastos sea effortless. Café, transporte, entretenimiento—todo rastreado en segundos.',
    stayInControl: 'Mantén el Control',
    stayInControlDesc: 'Tu barra de presupuesto cambia de color a medida que gastas. Verde a amarillo a rojo—siempre sabrás dónde estás parado.',

    youHave: 'TIENES',
    leftThisWeek: 'restante esta semana',
    budget: 'Presupuesto',
    perWeek: '/ semana',
    spent: 'gastado',
    thisWeeksSpending: 'Gastos de Esta Semana',
    noExpensesYet: 'Aún no hay gastos.',
    addOneToGetStarted: '¡Agrega uno para comenzar!',

    expenseAmount: 'Monto del Gasto',
    description: 'Descripción',
    category: 'Categoría',
    enterAmount: 'Ingresa el monto',
    enterDescription: 'Ingresa la descripción',
    selectCategory: 'Selecciona categoría',

    weeklyBudget: 'Presupuesto Semanal',
    language: 'Idioma',
    english: 'Inglés',
    spanish: 'Español',
    french: 'Francés',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    appVersion: 'Versión de la App',
    about: 'Acerca de',

    food: 'Comida',
    transport: 'Transporte',
    entertainment: 'Entretenimiento',
    utilities: 'Servicios',
    shopping: 'Compras',
    other: 'Otro',

    leftoverPremium: 'Leftover Premium',
    unlockUnlimitedFeatures: 'Desbloquea funciones ilimitadas',
    unlimitedExpenses: 'Gastos ilimitados',
    advancedAnalytics: 'Análisis avanzados e información',
    multiCurrencySupport: 'Soporte multi-moneda',
    customCategories: 'Categorías personalizadas',
    exportYourData: 'Exporta tus datos',
    daysFree: '3 días gratis',
    thenPerWeek: 'Luego $2.99/semana',
    noCommitment: 'Sin compromiso. Cancela en cualquier momento.',
    tryForFree: 'Prueba Gratis',
    maybeLater: 'Quizás Después',
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

    knowWhatsLeft: 'Sachez Ce Qui Reste',
    knowWhatsLeftDesc: 'Voyez exactement combien d\'argent il vous reste cette semaine en un coup d\'œil. Pas de graphiques compliqués ni de chiffres confus.',
    addExpensesIn3Taps: 'Ajoutez des Dépenses en 3 Appuis',
    addExpensesIn3TapsDesc: 'Les catégories rapides d\'emoji rendent le suivi de vos dépenses effortless. Café, transport, divertissement—tout suivi en secondes.',
    stayInControl: 'Restez en Contrôle',
    stayInControlDesc: 'Votre barre budgétaire change de couleur à mesure que vous dépensez. Vert au jaune au rouge—vous saurez toujours où vous en êtes.',

    youHave: 'VOUS AVEZ',
    leftThisWeek: 'restant cette semaine',
    budget: 'Budget',
    perWeek: '/ semaine',
    spent: 'dépensé',
    thisWeeksSpending: 'Dépenses de Cette Semaine',
    noExpensesYet: 'Aucune dépense encore.',
    addOneToGetStarted: 'Ajoutez-en une pour commencer !',

    expenseAmount: 'Montant de la Dépense',
    description: 'Description',
    category: 'Catégorie',
    enterAmount: 'Entrez le montant',
    enterDescription: 'Entrez la description',
    selectCategory: 'Sélectionnez la catégorie',

    weeklyBudget: 'Budget Hebdomadaire',
    language: 'Langue',
    english: 'Anglais',
    spanish: 'Espagnol',
    french: 'Français',
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    appVersion: 'Version de l\'App',
    about: 'À Propos',

    food: 'Nourriture',
    transport: 'Transport',
    entertainment: 'Divertissement',
    utilities: 'Services',
    shopping: 'Achats',
    other: 'Autre',

    leftoverPremium: 'Leftover Premium',
    unlockUnlimitedFeatures: 'Débloquez des fonctionnalités illimitées',
    unlimitedExpenses: 'Dépenses illimitées',
    advancedAnalytics: 'Analyses avancées et insights',
    multiCurrencySupport: 'Support multi-devises',
    customCategories: 'Catégories personnalisées',
    exportYourData: 'Exportez vos données',
    daysFree: '3 jours gratuits',
    thenPerWeek: 'Puis 2,99 €/semaine',
    noCommitment: 'Sans engagement. Annulez à tout moment.',
    tryForFree: 'Essayer Gratuitement',
    maybeLater: 'Peut-être Plus Tard',
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