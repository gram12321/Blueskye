// Finance service for Blueskye Air Management Game

import { getGameState, updateGameState } from '../gamemechanics/gameState';
import { displayManager } from '../gamemechanics/displayManager';

// Transaction interface for recording money movements
export interface Transaction {
  id: string;           // Unique identifier
  amount: number;       // Positive for income, negative for expense
  category: string;     // Like "Sales", "Purchases", "Building", etc.
  description: string;  // Detailed description
  timestamp: Date;      // When it happened
  gameWeek: number;     // Game week when transaction occurred
  gameSeason: 'Spring' | 'Summer' | 'Fall' | 'Winter';   // Game season when transaction occurred
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
    gameWeek: gameState.week,
    gameSeason: gameState.season,
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
    const action = amount > 0 ? 'Earned' : 'Spent';
    console.log(`${action} €${Math.abs(amount)} - ${description}`);
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
  weeks?: number; 
  season?: 'Spring' | 'Summer' | 'Fall' | 'Winter' | 'current' | 'all'; 
  year?: number | 'current' | 'all' 
}): {
  income: Record<string, number>;
  expenses: Record<string, number>;
  netCashFlow: number;
} => {
  const gameState = getGameState() as any;
  const transactions: Transaction[] = gameState.transactions || [];
  const { week: currentWeek, season: currentSeason, year: currentYear } = gameState;
  
  const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
  const STARTING_YEAR = 2024;
  const WEEKS_PER_SEASON = 13;
  const SEASONS_PER_YEAR = 4;
  
  const filteredTransactions = transactions.filter((t: Transaction) => {
    if (!t.gameWeek || !t.gameSeason || !t.gameYear) return false;

    // Filter by year
    if (filter.year && filter.year !== 'all') {
      const targetYear = filter.year === 'current' ? currentYear : filter.year;
      if (t.gameYear !== targetYear) return false;
    }

    // Filter by season (only if year matches or year filter is not strict)
    if (filter.season && filter.season !== 'all' && (!filter.year || filter.year === 'all' || t.gameYear === (filter.year === 'current' ? currentYear : filter.year))) {
        const targetSeason = filter.season === 'current' ? currentSeason : filter.season;
        if (t.gameSeason !== targetSeason) return false;
    }
    
    // Filter by number of weeks (relative to current date)
    if (filter.weeks && filter.weeks > 0) {
        // Calculate the absolute week number for the transaction and current state
        const currentAbsoluteWeek = (currentYear - STARTING_YEAR) * SEASONS_PER_YEAR * WEEKS_PER_SEASON 
                                  + SEASONS.indexOf(currentSeason) * WEEKS_PER_SEASON 
                                  + currentWeek;
        const transactionAbsoluteWeek = (t.gameYear - STARTING_YEAR) * SEASONS_PER_YEAR * WEEKS_PER_SEASON 
                                      + SEASONS.indexOf(t.gameSeason) * WEEKS_PER_SEASON 
                                      + t.gameWeek;
                                      
        if (currentAbsoluteWeek - transactionAbsoluteWeek > filter.weeks) return false;
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