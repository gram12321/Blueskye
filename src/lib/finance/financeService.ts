// Finance service for Blueskye Air Management Game

import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';
import { calculateAbsoluteDays,  DAYS_PER_WEEK} from '../gamemechanics/utils';
import { notificationService } from '../notifications/notificationService';

// Transaction interface for recording money movements
export interface Transaction {
  id: string;           // Unique identifier
  amount: number;       // Positive for income, negative for expense
  category: string;     // Like "Sales", "Purchases", "Building", etc.
  description: string;  // Detailed description
  timestamp: Date;      // When it happened
  gameHour: number;     // Game hour when transaction occurred
  gameDay: number;      // Game day when transaction occurred
  gameWeek: number;     // Game week when transaction occurred
  gameMonth: number;    // Game month when transaction occurred
  gameYear: number;     // Game year when transaction occurred
  balance: number;      // Balance after transaction
}

export interface CompanyValue {
  companyValue: number;
  fleetValue: number;
  buildingValue: number;
  cashValue: number;
}

export interface FinancialTotals {
  money: number;
  inventoryValue: number;
  buildingValue: number;
  totalCurrentAssets: number;
  totalFixedAssets: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface AddMoneyOptions {
  silent?: boolean;
}

/**
 * Centralized function to handle all money transactions
 * Records the transaction and updates player money
 * 
 * @param amount Amount to add (positive) or subtract (negative)
 * @param category Transaction category for reporting
 * @param description Detailed description of the transaction
 * @param options Options for the transaction
 * @returns boolean Success or failure
 */
export const addMoney = displayManager.createActionHandler((
  amount: number,
  category: string,
  description: string,
  options: AddMoneyOptions = {}
): boolean => {
  const gameState = getGameState();
  if (!gameState.player) return false;
  
  // Check if we have enough money for expenses
  if (amount < 0 && gameState.player.money + amount < 0) {
    console.error(`Cannot complete transaction: insufficient funds (€${Math.abs(amount)} needed)`);
    return false;
  }
  
  // Update player money
  const newMoney = gameState.player.money + amount;
  
  // Create transaction record
  const transaction: Transaction = {
    id: crypto.randomUUID(),
    amount,
    category,
    description,
    timestamp: new Date(),
    gameHour: gameState.hour,
    gameDay: gameState.day,
    gameWeek: gameState.week,
    gameMonth: gameState.month,
    gameYear: gameState.year,
    balance: newMoney
  };
  
  // Get existing transactions or initialize empty array
  const currentState = getGameState();
  const existingTransactions = (currentState as any).transactions || [];
  
  // Update game state with new money and add transaction
  updateGameState({
    player: {
      ...gameState.player,
      money: newMoney
    },
    transactions: [...existingTransactions, transaction]
  } as any);
  
  // Log transaction if not silent
  if (!options.silent) {
    // Only notify for aircraft purchase/sale, not admin cheat
    if (category === 'Aircraft Purchase') {
      notificationService.info(`Purchased aircraft: ${description}`, { category: 'Finance' });
    } else if (category === 'Aircraft Sale') {
      notificationService.success(`Sold aircraft: ${description}`, { category: 'Finance' });
    } else if (category === 'Admin' || (description && description.toLowerCase().includes('cheat'))) {
      // Do not log or notify for admin cheat
    } else {
      // Optionally notify for other categories if needed
    }
  }
  
  return true;
});

/**
 * Get all transactions for a specific category
 */
export const getTransactionsByCategory = (category: string): Transaction[] => {
  const gameState = getGameState() as any;
  const transactions = gameState.transactions || [];
  return transactions.filter((t: Transaction) => t.category === category);
};

/**
 * Calculate income and expenses by category for a given period
 */
export const calculateCashFlow = (filter: { 
  hours?: number;
  days?: number; 
  weeks?: number;
  month?: number | 'current' | 'all'; 
  year?: number | 'current' | 'all' 
}): {
  income: Record<string, number>;
  expenses: Record<string, number>;
  netCashFlow: number;
} => {
  const gameState = getGameState() as any;
  const transactions: Transaction[] = gameState.transactions || [];
  const { hour: currentHour, day: currentDay, week: currentWeek, month: currentMonth, year: currentYear } = gameState;
  
  const filteredTransactions = transactions.filter((t: Transaction) => {
    if (!t.gameHour && t.gameHour !== 0) t.gameHour = 0; // Backward compatibility
    if (!t.gameDay || !t.gameWeek || !t.gameMonth || !t.gameYear) return false;

    // Filter by year
    if (filter.year && filter.year !== 'all') {
      const targetYear = filter.year === 'current' ? currentYear : filter.year;
      if (t.gameYear !== targetYear) return false;
    }

    // Filter by month (only if year matches or year filter is not strict)
    if (filter.month && filter.month !== 'all' && (!filter.year || filter.year === 'all' || t.gameYear === (filter.year === 'current' ? currentYear : filter.year))) {
        const targetMonth = filter.month === 'current' ? currentMonth : filter.month;
        if (t.gameMonth !== targetMonth) return false;
    }
    
    // Filter by number of hours (relative to current time)
    if (filter.hours && filter.hours > 0) {
        const currentAbsoluteHours = calculateAbsoluteHours(currentYear, currentMonth, currentWeek, currentDay, currentHour);
        const transactionAbsoluteHours = calculateAbsoluteHours(t.gameYear, t.gameMonth, t.gameWeek, t.gameDay, t.gameHour || 0);
                                      
        if (currentAbsoluteHours - transactionAbsoluteHours > filter.hours) return false;
    }
    
    // Filter by number of days (relative to current date)
    if (filter.days && filter.days > 0) {
        const currentAbsoluteDays = calculateAbsoluteDays(currentYear, currentMonth, currentWeek, currentDay);
        const transactionAbsoluteDays = calculateAbsoluteDays(t.gameYear, t.gameMonth, t.gameWeek, t.gameDay);
                                      
        if (currentAbsoluteDays - transactionAbsoluteDays > filter.days) return false;
    }
    
    // Filter by number of weeks (relative to current date)
    if (filter.weeks && filter.weeks > 0) {
        const currentAbsoluteDays = calculateAbsoluteDays(currentYear, currentMonth, currentWeek, currentDay);
        const transactionAbsoluteDays = calculateAbsoluteDays(t.gameYear, t.gameMonth, t.gameWeek, t.gameDay);
                                      
        if (currentAbsoluteDays - transactionAbsoluteDays > filter.weeks * DAYS_PER_WEEK) return false;
    }
    
    return true;
  });
  
  // Initialize result objects
  const income: Record<string, number> = {};
  const expenses: Record<string, number> = {};
  let netCashFlow = 0;
  
  // Process each transaction
  filteredTransactions.forEach((transaction: Transaction) => {
    if (transaction.amount > 0) {
      // Income
      income[transaction.category] = (income[transaction.category] || 0) + transaction.amount;
      netCashFlow += transaction.amount;
    } else if (transaction.amount < 0) {
      // Expense (store as positive for reporting)
      const positiveAmount = Math.abs(transaction.amount);
      expenses[transaction.category] = (expenses[transaction.category] || 0) + positiveAmount;
      netCashFlow += transaction.amount; // This will subtract since amount is negative
    }
  });
  
  return { income, expenses, netCashFlow };
};

// Helper function to calculate absolute hours since game start
function calculateAbsoluteHours(year: number, month: number, week: number, day: number, hour: number): number {
  const absoluteDays = calculateAbsoluteDays(year, month, week, day);
  return absoluteDays * 24 + hour;
}

/**
 * Calculate the total value of the current company
 * @returns CompanyValue object with breakdown of different asset types
 */
export function calculateCompanyValue(): CompanyValue {
  const gameState = getGameState();
  
  const cashValue = gameState.player?.money || 0;
  
  // Placeholder values for fleet and buildings
  // These will be implemented when we add fleet management
  const fleetValue = 0; // TODO: Calculate actual fleet value
  const buildingValue = 0; // TODO: Calculate actual building value
  
  const companyValue = cashValue + fleetValue + buildingValue;
  
  return {
    companyValue,
    fleetValue,
    buildingValue,
    cashValue
  };
}

/**
 * Calculate financial totals for balance sheet
 */
export const calculateFinancialTotals = (): FinancialTotals => {
  const gameState = getGameState();
  const money = gameState.player?.money || 0;
  
  // Placeholder values - will be implemented when inventory/buildings are added
  const inventoryValue = 0; // TODO: Calculate actual inventory value
  const buildingValue = 0; // TODO: Calculate actual building value
  
  const totalCurrentAssets = money + inventoryValue;
  const totalFixedAssets = buildingValue;
  const totalAssets = totalCurrentAssets + totalFixedAssets;
  const totalLiabilities = 0; // No liabilities in current implementation
  const totalEquity = totalAssets - totalLiabilities;
  
  return {
    money,
    inventoryValue,
    buildingValue,
    totalCurrentAssets,
    totalFixedAssets,
    totalAssets,
    totalLiabilities,
    totalEquity
  };
};

/**
 * Get financial summary for display
 */
export function getFinancialSummary() {
  const gameState = getGameState();
  const companyValue = calculateCompanyValue();
  
  return {
    money: gameState.player?.money || 0,
    ...companyValue
  };
} 